import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2024-06-20',
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type CartItem = {
  id?: string;
  product?: string;
  productCode?: string;
  stripePriceId?: string;
  quantity?: number;
  packageKey?: string;
  checkoutQuantity?: number;
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

const publicCheckoutError = 'No pudimos preparar el pago seguro en este momento. Intenta de nuevo o contáctanos para ayudarte.';
const publicUnavailableError = 'Este producto no está disponible temporalmente. Intenta de nuevo más tarde o contáctanos para ayudarte.';
const allowedStripePriceIds = new Set([
  'price_1U7fXIE9Iq6fzuQIWgd9UP52',
  'price_1U7fYjE9Iq6fzuQI8c9m6T75',
  'price_1U7fc7E9Iq6fzuQIvpAYImou',
  'price_1U7fc7E9Iq6fzuQI7xiu5UdH',
  'price_1U7fc7E9Iq6fzuQIPTVWWjsk',
  'price_1U7fc7E9Iq6fzuQIlatja3Ta',
  'price_1U7fenE9Iq6fzuQILQFwMifL',
  'price_1U7ffeE9Iq6fzuQIr0zh6LZ6',
  'price_1U7ffeE9Iq6fzuQI3FNKgorA',
  'price_1U7ffeE9Iq6fzuQIIawQg4f6',
  'price_1U7fssE9Iq6fzuQI044xCmvJ',
  'price_1U7ftxE9Iq6fzuQI1PNkZbq3',
  'price_1U7ftxE9Iq6fzuQIRipyfrYr',
  'price_1U7ftxE9Iq6fzuQI0ut7zIBH',
  'price_1U7fvhE9Iq6fzuQIxrtLZ39Q',
  'price_1U7fwiE9Iq6fzuQIltCEiydc',
  'price_1U7fwiE9Iq6fzuQIO04kwHqp',
  'price_1U7fwiE9Iq6fzuQIy9a2uaPc',
]);

const cleanUrl = (value: string) => {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname.replace(/\/[^/]*$/, '')}`;
  } catch {
    return '';
  }
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
    const market = 'mx';
    const locale = String(payload.locale || 'es-MX');
    const checkoutRef = String(payload.checkout_ref || '');
    const cart = Array.isArray(payload.cart) ? payload.cart as CartItem[] : [];
    const pageBase = cleanUrl(String(payload.page_url || '')) || 'https://www.taploe.com.mx';

    if (!checkoutRef || !cart.length) {
      return json({ error: 'Tu carrito no está listo para pago. Revisa tus productos e intenta de nuevo.' }, 400);
    }

    const requestedPrices = [...new Set(cart.map((item) => item.stripePriceId).filter(Boolean))] as string[];
    if (!requestedPrices.length) {
      return json({ error: publicUnavailableError }, 400);
    }

    const invalidPrice = requestedPrices.find((priceId) => !allowedStripePriceIds.has(priceId));
    if (invalidPrice) {
      console.warn('taploe_checkout_invalid_price', { invalidPrice, requestedPrices });
      return json({ error: publicUnavailableError }, 400);
    }

    const lineItems = cart.map((item) => ({
      price: item.stripePriceId,
      quantity: Math.max(1, Math.min(99, Number(item.packageKey ? item.checkoutQuantity || 1 : item.quantity || 1))),
    }));

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      client_reference_id: checkoutRef,
      billing_address_collection: 'required',
      shipping_address_collection: { allowed_countries: ['MX'] },
      success_url: `${pageBase}/compra-exitosa.html?session_id={CHECKOUT_SESSION_ID}&ref=${encodeURIComponent(checkoutRef)}`,
      cancel_url: `${pageBase}/compra-cancelada.html`,
      metadata: {
        source: 'taploe_web_cart',
        checkout_ref: checkoutRef,
        market,
        locale,
        item_count: String(cart.length),
        product_codes: cart.map((item) => item.productCode).filter(Boolean).join(',').slice(0, 500),
      },
    });

    return json({ id: session.id, url: session.url });
  } catch (error) {
    console.error('taploe_checkout_create_error', error);
    return json({ error: publicCheckoutError }, 500);
  }
});
