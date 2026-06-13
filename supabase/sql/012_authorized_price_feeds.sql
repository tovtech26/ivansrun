create or replace view public.authorized_product_prices
as
select
  id,
  base_price,
  base_currency
from public.products
where
  (select private.is_admin())
  or (published = true and (select private.is_approved_reseller()));

create or replace view public.authorized_variant_prices
as
select
  product_variants.id,
  product_variants.base_price,
  product_variants.base_currency
from public.product_variants
join public.products on products.id = product_variants.product_id
where
  (select private.is_admin())
  or (
    products.published = true
    and product_variants.published = true
    and (select private.is_approved_reseller())
  );

revoke all on public.authorized_product_prices from public, anon, authenticated;
revoke all on public.authorized_variant_prices from public, anon, authenticated;
grant select on public.authorized_product_prices to authenticated;
grant select on public.authorized_variant_prices to authenticated;
