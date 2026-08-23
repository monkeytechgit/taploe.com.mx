-- Taploe ecommerce cart + Stripe checkout support
-- Ejecutar en Supabase SQL Editor.
-- Los productos físicos se guardan en tablas ecommerce separadas de las tablas de la plataforma.

create extension if not exists pgcrypto;

create table if not exists public.ecommerce_products (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  market text not null check (market in ('mx', 'us')),
  locale text not null,
  name text not null,
  description text,
  product_kind text not null,
  material text,
  is_physical boolean not null default true,
  is_active boolean not null default true,
  stripe_product_id text not null,
  default_stripe_price_id text,
  image_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (market, code)
);

create table if not exists public.ecommerce_product_prices (
  id uuid primary key default gen_random_uuid(),
  ecommerce_product_id uuid not null references public.ecommerce_products(id) on delete cascade,
  market text not null check (market in ('mx', 'us')),
  package_key text not null,
  package_label text not null,
  stripe_price_id text not null,
  currency text not null,
  unit_amount numeric not null,
  total_amount numeric not null,
  quantity integer not null default 1,
  is_default boolean not null default false,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (market, stripe_price_id),
  unique (ecommerce_product_id, package_key)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text,
  customer_email text,
  customer_phone text,
  status text not null default 'draft',
  payment_status text not null default 'pending',
  currency text not null default 'MXN',
  subtotal_amount numeric not null default 0,
  total_amount numeric not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  description text,
  quantity integer not null default 1,
  unit_price numeric not null default 0,
  total_price numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders
  add column if not exists customer_name text,
  add column if not exists customer_email text,
  add column if not exists customer_phone text,
  add column if not exists status text not null default 'draft',
  add column if not exists payment_status text not null default 'pending',
  add column if not exists currency text not null default 'MXN',
  add column if not exists subtotal_amount numeric not null default 0,
  add column if not exists total_amount numeric not null default 0,
  add column if not exists notes text,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists checkout_client_reference_id text,
  add column if not exists ecommerce_source text not null default 'web_cart',
  add column if not exists market text,
  add column if not exists locale text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.order_items
  add column if not exists order_id uuid references public.orders(id) on delete cascade,
  add column if not exists description text,
  add column if not exists quantity integer not null default 1,
  add column if not exists unit_price numeric not null default 0,
  add column if not exists total_price numeric not null default 0,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists ecommerce_product_id uuid references public.ecommerce_products(id) on delete set null,
  add column if not exists stripe_product_id text,
  add column if not exists stripe_price_id text,
  add column if not exists cart_item_id text,
  add column if not exists configuration jsonb not null default '{}'::jsonb,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create table if not exists public.order_checkout_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  stripe_checkout_session_id text,
  event_type text not null,
  payment_status text,
  amount_total numeric,
  currency text default 'MXN',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_ecommerce_products_market_code on public.ecommerce_products(market, code);
create index if not exists idx_ecommerce_products_stripe_product_id on public.ecommerce_products(stripe_product_id);
create index if not exists idx_ecommerce_product_prices_product_id on public.ecommerce_product_prices(ecommerce_product_id);
create index if not exists idx_ecommerce_product_prices_stripe_price_id on public.ecommerce_product_prices(stripe_price_id);
create index if not exists idx_orders_stripe_checkout_session_id on public.orders(stripe_checkout_session_id);
create index if not exists idx_orders_market on public.orders(market);
create index if not exists idx_order_items_ecommerce_product_id on public.order_items(ecommerce_product_id);
create index if not exists idx_order_items_cart_item_id on public.order_items(cart_item_id);
create index if not exists idx_order_items_stripe_price_id on public.order_items(stripe_price_id);
create index if not exists idx_order_checkout_events_order_id on public.order_checkout_events(order_id);
create unique index if not exists ux_orders_stripe_checkout_session_id
  on public.orders(stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;
create unique index if not exists ux_orders_checkout_client_reference_id
  on public.orders(checkout_client_reference_id)
  where checkout_client_reference_id is not null;

insert into public.ecommerce_products
  (code, market, locale, name, description, product_kind, material, stripe_product_id, default_stripe_price_id, image_url, metadata)
values
  ('nfc', 'mx', 'es-MX', 'Tarjeta de presentación NFC', 'Tarjeta de presentación NFC personalizada con perfil digital incluido.', 'nfc_card', 'PVC', 'prod_V7vPPmcxDtdwpm', 'price_1U7fYjE9Iq6fzuQI8c9m6T75', '/assets/images/producto-tarjeta-nfc.webp', '{"ecommerce": true}'::jsonb),
  ('nfc_metalica', 'mx', 'es-MX', 'Tarjeta de presentación NFC metálica', 'Tarjeta de presentación NFC metálica premium con perfil digital incluido.', 'nfc_card', 'Metal', 'prod_V7vOh1Cf5NKlkk', 'price_1U7fXIE9Iq6fzuQIWgd9UP52', '/assets/images/producto-tarjeta-nfc-metalica.webp', '{"ecommerce": true}'::jsonb),
  ('google_reviews', 'mx', 'es-MX', 'Tarjeta NFC para reseñas de Google', 'Tarjeta NFC y QR para recibir reseñas de Google.', 'review_card', 'PVC', 'prod_V7vTSs02zTQ82G', 'price_1U7fc7E9Iq6fzuQIvpAYImou', '/assets/images/producto-resenas-google.webp', '{"ecommerce": true}'::jsonb),
  ('instagram', 'mx', 'es-MX', 'Tarjeta NFC para Instagram', 'Tarjeta NFC y QR para compartir un perfil de Instagram.', 'qr_card', 'PVC', 'prod_V7vkmovwDPpaDh', 'price_1U7fssE9Iq6fzuQI044xCmvJ', '/assets/images/producto-instagram.webp', '{"ecommerce": true}'::jsonb),
  ('facebook', 'mx', 'es-MX', 'Tarjeta NFC para Facebook', 'Tarjeta NFC y QR para compartir una página de Facebook.', 'qr_card', 'PVC', 'prod_V7vVAC0r5qnuiR', 'price_1U7fenE9Iq6fzuQILQFwMifL', '/assets/images/producto-facebook.webp', '{"ecommerce": true}'::jsonb),
  ('tripadvisor', 'mx', 'es-MX', 'Tarjeta NFC para TripAdvisor', 'Tarjeta NFC y QR para recibir reseñas en TripAdvisor.', 'review_card', 'PVC', 'prod_V7vnuSaXRvYV7c', 'price_1U7fvhE9Iq6fzuQIxrtLZ39Q', '/assets/images/producto-tripadvisor.webp', '{"ecommerce": true}'::jsonb)
on conflict (market, code) do update set
  locale = excluded.locale,
  name = excluded.name,
  description = excluded.description,
  product_kind = excluded.product_kind,
  material = excluded.material,
  is_physical = excluded.is_physical,
  is_active = excluded.is_active,
  stripe_product_id = excluded.stripe_product_id,
  default_stripe_price_id = excluded.default_stripe_price_id,
  image_url = excluded.image_url,
  metadata = public.ecommerce_products.metadata || excluded.metadata,
  updated_at = now();

insert into public.ecommerce_product_prices
  (ecommerce_product_id, market, package_key, package_label, stripe_price_id, currency, unit_amount, total_amount, quantity, is_default, metadata)
select p.id, v.market, v.package_key, v.package_label, v.stripe_price_id, v.currency, v.unit_amount, v.total_amount, v.quantity, v.is_default, v.metadata
from (
  values
    ('mx', 'nfc', 'unit', 'Tarjeta de presentación NFC', 'price_1U7fYjE9Iq6fzuQI8c9m6T75', 'MXN', 800::numeric, 800::numeric, 1, true, '{}'::jsonb),
    ('mx', 'nfc_metalica', 'unit', 'Tarjeta de presentación NFC metálica', 'price_1U7fXIE9Iq6fzuQIWgd9UP52', 'MXN', 1150::numeric, 1150::numeric, 1, true, '{}'::jsonb),
    ('mx', 'google_reviews', 'sencilla', 'Sencilla', 'price_1U7fc7E9Iq6fzuQIvpAYImou', 'MXN', 600::numeric, 600::numeric, 1, true, '{}'::jsonb),
    ('mx', 'google_reviews', 'doble', 'Doble', 'price_1U7fc7E9Iq6fzuQI7xiu5UdH', 'MXN', 450::numeric, 900::numeric, 2, false, '{"discount": "-25%"}'::jsonb),
    ('mx', 'google_reviews', 'paquete', 'Paquete', 'price_1U7fc7E9Iq6fzuQIPTVWWjsk', 'MXN', 280::numeric, 1400::numeric, 5, false, '{"discount": "-53%"}'::jsonb),
    ('mx', 'google_reviews', 'mega-pack', 'Mega paquete', 'price_1U7fc7E9Iq6fzuQIlatja3Ta', 'MXN', 230::numeric, 2300::numeric, 10, false, '{"discount": "-62%", "badge": "Mejor valor"}'::jsonb),
    ('mx', 'instagram', 'sencilla', 'Sencilla', 'price_1U7fssE9Iq6fzuQI044xCmvJ', 'MXN', 600::numeric, 600::numeric, 1, true, '{}'::jsonb),
    ('mx', 'instagram', 'doble', 'Doble', 'price_1U7ftxE9Iq6fzuQI1PNkZbq3', 'MXN', 450::numeric, 900::numeric, 2, false, '{"discount": "-25%"}'::jsonb),
    ('mx', 'instagram', 'paquete', 'Paquete', 'price_1U7ftxE9Iq6fzuQIRipyfrYr', 'MXN', 280::numeric, 1400::numeric, 5, false, '{"discount": "-53%"}'::jsonb),
    ('mx', 'instagram', 'mega-pack', 'Mega paquete', 'price_1U7ftxE9Iq6fzuQI0ut7zIBH', 'MXN', 230::numeric, 2300::numeric, 10, false, '{"discount": "-62%", "badge": "Mejor valor"}'::jsonb),
    ('mx', 'facebook', 'sencilla', 'Sencilla', 'price_1U7fenE9Iq6fzuQILQFwMifL', 'MXN', 600::numeric, 600::numeric, 1, true, '{}'::jsonb),
    ('mx', 'facebook', 'doble', 'Doble', 'price_1U7ffeE9Iq6fzuQIr0zh6LZ6', 'MXN', 450::numeric, 900::numeric, 2, false, '{"discount": "-25%"}'::jsonb),
    ('mx', 'facebook', 'paquete', 'Paquete', 'price_1U7ffeE9Iq6fzuQI3FNKgorA', 'MXN', 280::numeric, 1400::numeric, 5, false, '{"discount": "-53%"}'::jsonb),
    ('mx', 'facebook', 'mega-pack', 'Mega paquete', 'price_1U7ffeE9Iq6fzuQIIawQg4f6', 'MXN', 230::numeric, 2300::numeric, 10, false, '{"discount": "-62%", "badge": "Mejor valor"}'::jsonb),
    ('mx', 'tripadvisor', 'sencilla', 'Sencilla', 'price_1U7fvhE9Iq6fzuQIxrtLZ39Q', 'MXN', 600::numeric, 600::numeric, 1, true, '{}'::jsonb),
    ('mx', 'tripadvisor', 'doble', 'Doble', 'price_1U7fwiE9Iq6fzuQIltCEiydc', 'MXN', 450::numeric, 900::numeric, 2, false, '{"discount": "-25%"}'::jsonb),
    ('mx', 'tripadvisor', 'paquete', 'Paquete', 'price_1U7fwiE9Iq6fzuQIO04kwHqp', 'MXN', 280::numeric, 1400::numeric, 5, false, '{"discount": "-53%"}'::jsonb),
    ('mx', 'tripadvisor', 'mega-pack', 'Mega paquete', 'price_1U7fwiE9Iq6fzuQIy9a2uaPc', 'MXN', 230::numeric, 2300::numeric, 10, false, '{"discount": "-62%", "badge": "Mejor valor"}'::jsonb)
) as v(market, code, package_key, package_label, stripe_price_id, currency, unit_amount, total_amount, quantity, is_default, metadata)
join public.ecommerce_products p
  on p.market = v.market and p.code = v.code
on conflict (ecommerce_product_id, package_key) do update set
  market = excluded.market,
  package_label = excluded.package_label,
  stripe_price_id = excluded.stripe_price_id,
  currency = excluded.currency,
  unit_amount = excluded.unit_amount,
  total_amount = excluded.total_amount,
  quantity = excluded.quantity,
  is_default = excluded.is_default,
  is_active = excluded.is_active,
  metadata = public.ecommerce_product_prices.metadata || excluded.metadata,
  updated_at = now();

update public.ecommerce_products
set is_active = false, updated_at = now()
where market <> 'mx';

update public.ecommerce_product_prices
set is_active = false, updated_at = now()
where market <> 'mx';

insert into storage.buckets (id, name, public)
values ('order-assets', 'order-assets', true)
on conflict (id) do update set public = true;

alter table public.ecommerce_products enable row level security;
alter table public.ecommerce_product_prices enable row level security;
alter table public.order_checkout_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'ecommerce_products' and policyname = 'Anyone can read active ecommerce products'
  ) then
    create policy "Anyone can read active ecommerce products"
      on public.ecommerce_products
      for select
      to anon
      using (is_active = true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'ecommerce_product_prices' and policyname = 'Anyone can read active ecommerce prices'
  ) then
    create policy "Anyone can read active ecommerce prices"
      on public.ecommerce_product_prices
      for select
      to anon
      using (is_active = true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'order_checkout_events' and policyname = 'Service role can manage checkout events'
  ) then
    create policy "Service role can manage checkout events"
      on public.order_checkout_events
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end $$;

-- Las órdenes y sus items se crean después del pago desde la Edge Function
-- complete-checkout-order usando service_role. No permitas inserts anónimos
-- directos a orders/order_items desde el carrito.
do $$
begin
  drop policy if exists "Web cart can create draft ecommerce orders" on public.orders;
  drop policy if exists "Web cart can create ecommerce order items" on public.order_items;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Web cart can upload order assets'
  ) then
    create policy "Web cart can upload order assets"
      on storage.objects
      for insert
      to anon
      with check (bucket_id = 'order-assets');
  end if;
end $$;

-- Webhooks recomendados en Stripe:
-- 1. checkout.session.completed -> apunta a la Edge Function existente stripe-webhook
--    (o a supabase/functions/stripe-checkout-webhook si usas el nombre de este repo).
--    El carrito web crea sesiones con create-web-cart-checkout-session y la inserción
--    completa de orders/order_items ocurre en complete-checkout-order después del
--    redirect exitoso, verificando la sesión con STRIPE_SECRET_KEY.
-- 2. checkout.session.async_payment_succeeded -> opcional si habilitas métodos de pago
--    asíncronos.
-- 3. checkout.session.async_payment_failed -> opcional para registrar intentos fallidos
--    si habilitas métodos de pago asíncronos.
-- No necesitas webhooks separados por producto; todos los productos y packs pasan por
-- los price_id de Stripe en una sola sesión de Checkout.
