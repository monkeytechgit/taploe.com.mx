import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2024-06-20',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
);

Deno.serve(async (request) => {
  const signature = request.headers.get('stripe-signature');
  const webhookSecret =
    Deno.env.get('STRIPE_WEB_CART_WEBHOOK_SECRET') ||
    Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const body = await request.text();

  if (!signature || !webhookSecret) {
    return new Response('Missing Stripe signature or webhook secret', { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid webhook signature';
    return new Response(`Webhook signature error: ${message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const checkoutRef = session.client_reference_id;
    const orderFilter = checkoutRef
      ? `stripe_checkout_session_id.eq.${session.id},checkout_client_reference_id.eq.${checkoutRef}`
      : `stripe_checkout_session_id.eq.${session.id}`;
    const { data: order } = await supabase
      .from('orders')
      .select('id')
      .or(orderFilter)
      .maybeSingle();

    if (order?.id) {
      await supabase
        .from('orders')
        .update({
          status: 'paid',
          payment_status: 'paid',
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
          checkout_client_reference_id: checkoutRef,
          total_amount: (session.amount_total || 0) / 100,
          currency: (session.currency || 'mxn').toUpperCase(),
          updated_at: new Date().toISOString(),
          metadata: {
            stripe_customer: session.customer,
            customer_details: session.customer_details,
            shipping_details: session.shipping_details,
          },
        })
        .eq('id', order.id);
    }

    await supabase.from('order_checkout_events').insert({
      order_id: order?.id || null,
      stripe_checkout_session_id: session.id,
      event_type: event.type,
      payment_status: session.payment_status,
      amount_total: (session.amount_total || 0) / 100,
      currency: (session.currency || 'mxn').toUpperCase(),
      payload: session,
    });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
