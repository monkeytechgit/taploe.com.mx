-- Sincroniza productos y precios MX con los Stripe IDs activos de Taploe.
-- Ejecutar en Supabase SQL Editor.

insert into public.ecommerce_products
  (code, market, locale, name, description, product_kind, material, is_physical, is_active, stripe_product_id, default_stripe_price_id, image_url, metadata)
values
  ('nfc', 'mx', 'es-MX', 'Tarjeta de presentación NFC', 'Tarjeta de presentación NFC personalizada con perfil digital incluido.', 'nfc_card', 'PVC', true, true, 'prod_V7vPPmcxDtdwpm', 'price_1U7fYjE9Iq6fzuQI8c9m6T75', '/assets/images/producto-tarjeta-nfc.webp', '{"ecommerce": true}'::jsonb),
  ('nfc_metalica', 'mx', 'es-MX', 'Tarjeta de presentación NFC metálica', 'Tarjeta de presentación NFC metálica premium con perfil digital incluido.', 'nfc_card', 'Metal', true, true, 'prod_V7vOh1Cf5NKlkk', 'price_1U7fXIE9Iq6fzuQIWgd9UP52', '/assets/images/producto-tarjeta-nfc-metalica.webp', '{"ecommerce": true}'::jsonb),
  ('google_reviews', 'mx', 'es-MX', 'Tarjeta NFC para reseñas de Google', 'Tarjeta NFC y QR para recibir reseñas de Google.', 'review_card', 'PVC', true, true, 'prod_V7vTSs02zTQ82G', 'price_1U7fc7E9Iq6fzuQIvpAYImou', '/assets/images/producto-resenas-google.webp', '{"ecommerce": true}'::jsonb),
  ('facebook', 'mx', 'es-MX', 'Tarjeta NFC para Facebook', 'Tarjeta NFC y QR para compartir una página de Facebook.', 'qr_card', 'PVC', true, true, 'prod_V7vVAC0r5qnuiR', 'price_1U7fenE9Iq6fzuQILQFwMifL', '/assets/images/producto-facebook.webp', '{"ecommerce": true}'::jsonb),
  ('instagram', 'mx', 'es-MX', 'Tarjeta NFC para Instagram', 'Tarjeta NFC y QR para compartir un perfil de Instagram.', 'qr_card', 'PVC', true, true, 'prod_V7vkmovwDPpaDh', 'price_1U7fssE9Iq6fzuQI044xCmvJ', '/assets/images/producto-instagram.webp', '{"ecommerce": true}'::jsonb),
  ('tripadvisor', 'mx', 'es-MX', 'Tarjeta NFC para TripAdvisor', 'Tarjeta NFC y QR para recibir reseñas en TripAdvisor.', 'review_card', 'PVC', true, true, 'prod_V7vnuSaXRvYV7c', 'price_1U7fvhE9Iq6fzuQIxrtLZ39Q', '/assets/images/producto-tripadvisor.webp', '{"ecommerce": true}'::jsonb)
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
  (ecommerce_product_id, market, package_key, package_label, stripe_price_id, currency, unit_amount, total_amount, quantity, is_default, is_active, metadata)
select p.id, v.market, v.package_key, v.package_label, v.stripe_price_id, v.currency, v.unit_amount, v.total_amount, v.quantity, v.is_default, true, v.metadata
from (
  values
    ('mx', 'nfc', 'unit', 'Tarjeta de presentación NFC', 'price_1U7fYjE9Iq6fzuQI8c9m6T75', 'MXN', 800::numeric, 800::numeric, 1, true, '{}'::jsonb),
    ('mx', 'nfc_metalica', 'unit', 'Tarjeta de presentación NFC metálica', 'price_1U7fXIE9Iq6fzuQIWgd9UP52', 'MXN', 1150::numeric, 1150::numeric, 1, true, '{}'::jsonb),
    ('mx', 'google_reviews', 'sencilla', 'Sencilla', 'price_1U7fc7E9Iq6fzuQIvpAYImou', 'MXN', 600::numeric, 600::numeric, 1, true, '{}'::jsonb),
    ('mx', 'google_reviews', 'doble', 'Doble', 'price_1U7fc7E9Iq6fzuQI7xiu5UdH', 'MXN', 450::numeric, 900::numeric, 2, false, '{"discount": "-25%"}'::jsonb),
    ('mx', 'google_reviews', 'paquete', 'Paquete', 'price_1U7fc7E9Iq6fzuQIPTVWWjsk', 'MXN', 280::numeric, 1400::numeric, 5, false, '{"discount": "-53%"}'::jsonb),
    ('mx', 'google_reviews', 'mega-pack', 'Mega paquete', 'price_1U7fc7E9Iq6fzuQIlatja3Ta', 'MXN', 230::numeric, 2300::numeric, 10, false, '{"discount": "-62%", "badge": "Mejor valor"}'::jsonb),
    ('mx', 'facebook', 'sencilla', 'Sencilla', 'price_1U7fenE9Iq6fzuQILQFwMifL', 'MXN', 600::numeric, 600::numeric, 1, true, '{}'::jsonb),
    ('mx', 'facebook', 'doble', 'Doble', 'price_1U7ffeE9Iq6fzuQIr0zh6LZ6', 'MXN', 450::numeric, 900::numeric, 2, false, '{"discount": "-25%"}'::jsonb),
    ('mx', 'facebook', 'paquete', 'Paquete', 'price_1U7ffeE9Iq6fzuQI3FNKgorA', 'MXN', 280::numeric, 1400::numeric, 5, false, '{"discount": "-53%"}'::jsonb),
    ('mx', 'facebook', 'mega-pack', 'Mega paquete', 'price_1U7ffeE9Iq6fzuQIIawQg4f6', 'MXN', 230::numeric, 2300::numeric, 10, false, '{"discount": "-62%", "badge": "Mejor valor"}'::jsonb),
    ('mx', 'instagram', 'sencilla', 'Sencilla', 'price_1U7fssE9Iq6fzuQI044xCmvJ', 'MXN', 600::numeric, 600::numeric, 1, true, '{}'::jsonb),
    ('mx', 'instagram', 'doble', 'Doble', 'price_1U7ftxE9Iq6fzuQI1PNkZbq3', 'MXN', 450::numeric, 900::numeric, 2, false, '{"discount": "-25%"}'::jsonb),
    ('mx', 'instagram', 'paquete', 'Paquete', 'price_1U7ftxE9Iq6fzuQIRipyfrYr', 'MXN', 280::numeric, 1400::numeric, 5, false, '{"discount": "-53%"}'::jsonb),
    ('mx', 'instagram', 'mega-pack', 'Mega paquete', 'price_1U7ftxE9Iq6fzuQI0ut7zIBH', 'MXN', 230::numeric, 2300::numeric, 10, false, '{"discount": "-62%", "badge": "Mejor valor"}'::jsonb),
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
