import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2024-06-20',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

type CartItem = {
  id: string;
  product: string;
  productCode?: string;
  market?: string;
  locale?: string;
  currency?: string;
  stripeProductId?: string;
  stripePriceId?: string;
  unitPrice?: number;
  quantity?: number;
  totalPrice?: number;
  package?: string;
  packageKey?: string;
  design?: string;
  language?: string;
  color?: string;
  reviewLink?: string;
  reviewLinks?: string[];
  logo?: Record<string, unknown> | null;
  imageUrl?: string;
  productUrl?: string;
  addedAt?: string;
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (request.method !== 'POST') {
    return json({ error: 'Método no permitido' }, 405);
  }

  try {
    const payload = await request.json();
    const sessionId = String(payload.session_id || '');
    const checkoutRef = String(payload.checkout_ref || '');
    const cart = Array.isArray(payload.cart) ? payload.cart as CartItem[] : [];
    const market = 'mx';
    const locale = String(payload.locale || 'es-MX');
    const currency = String(payload.currency || 'MXN').toUpperCase();

    if (!sessionId || !checkoutRef || !cart.length) {
      return json({ error: 'Falta sesión, referencia o carrito' }, 400);
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'customer'],
    });

    if (session.client_reference_id !== checkoutRef) {
      return json({ error: 'La referencia de compra no coincide con la sesión de Stripe' }, 409);
    }
    if (session.payment_status !== 'paid') {
      return json({ error: 'La sesión de Stripe no está pagada' }, 402);
    }

    const { data: existing } = await supabase
      .from('orders')
      .select('id')
      .eq('stripe_checkout_session_id', session.id)
      .maybeSingle();

    if (existing?.id) {
      return json({ ok: true, order_id: existing.id, duplicate: true });
    }

    const subtotal = cart.reduce((sum, item) => sum + Number(item.totalPrice || Number(item.unitPrice || 0) * Number(item.quantity || 1)), 0);
    const total = Number(session.amount_total || 0) / 100;
    const customer = session.customer_details;

    const { data: orderRows, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_name: customer?.name || 'Cliente Taploe',
        customer_email: customer?.email || null,
        customer_phone: customer?.phone || null,
        status: 'paid',
        payment_status: 'paid',
        currency,
        subtotal_amount: subtotal,
        total_amount: total || subtotal,
        notes: 'Orden pagada creada después de Stripe Checkout',
        ecommerce_source: 'web_cart',
        market,
        locale,
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null,
        checkout_client_reference_id: checkoutRef,
        metadata: {
          market,
          locale,
          currency,
          item_count: cart.length,
          piece_count: cart.reduce((sum, item) => sum + Number(item.quantity || 1), 0),
          source_url: payload.source_url || '',
          stripe_customer: session.customer,
          customer_details: customer,
          shipping_details: session.shipping_details,
        },
      })
      .select('id')
      .single();

    if (orderError) throw orderError;

    const codes = [...new Set(cart.map((item) => item.productCode).filter(Boolean))];
    const productMap: Record<string, string> = {};
    if (codes.length) {
      const { data: products } = await supabase
        .from('ecommerce_products')
        .select('id,code')
        .eq('market', market)
        .in('code', codes);
      (products || []).forEach((product) => { productMap[product.code] = product.id; });
    }

    const itemRows = cart.map((item) => ({
      order_id: orderRows.id,
      ecommerce_product_id: item.productCode ? productMap[item.productCode] || null : null,
      description: item.product,
      quantity: Number(item.quantity || 1),
      unit_price: Number(item.unitPrice || 0),
      total_price: Number(item.totalPrice || Number(item.unitPrice || 0) * Number(item.quantity || 1)),
      stripe_product_id: item.stripeProductId || null,
      stripe_price_id: item.stripePriceId || null,
      cart_item_id: item.id,
      configuration: {
        product_code: item.productCode || null,
        market: item.market || market,
        locale: item.locale || locale,
        currency: item.currency || currency,
        package: item.package || null,
        package_key: item.packageKey || null,
        language: item.language || null,
        color: item.color || null,
        design: item.design || null,
        review_links: item.reviewLinks || [],
        review_link_raw: item.reviewLink || '',
        logo: item.logo || null,
        image_url: item.imageUrl || '',
        product_url: item.productUrl || '',
      },
      metadata: {
        cart_item_id: item.id,
        product_code: item.productCode || null,
        ecommerce_product_id: item.productCode ? productMap[item.productCode] || null : null,
        market: item.market || market,
        locale: item.locale || locale,
        currency: item.currency || currency,
        stripe_product_id: item.stripeProductId || null,
        stripe_price_id: item.stripePriceId || null,
        package: item.package || null,
        language: item.language || null,
        color: item.color || null,
        design: item.design || null,
        review_links: item.reviewLinks || [],
        review_link_raw: item.reviewLink || '',
        logo: item.logo || null,
        image_url: item.imageUrl || '',
        product_url: item.productUrl || '',
        added_at: item.addedAt || null,
      },
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(itemRows);
    if (itemsError) throw itemsError;

    await supabase.from('order_checkout_events').insert({
      order_id: orderRows.id,
      stripe_checkout_session_id: session.id,
      event_type: 'checkout.session.verified_after_success_redirect',
      payment_status: session.payment_status,
      amount_total: total,
      currency,
      payload: session,
    });

    return json({ ok: true, order_id: orderRows.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    return json({ error: message }, 500);
  }
});
