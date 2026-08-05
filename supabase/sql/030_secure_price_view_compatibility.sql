-- Preserve compatibility with deployed frontend bundles that still read the old
-- price view endpoints. The views execute as the caller and delegate to the
-- role-checked invoker RPCs, so they do not reintroduce SECURITY DEFINER views.

create or replace view public.authorized_product_prices
with (security_invoker = true)
as select * from public.get_authorized_product_prices();

create or replace view public.authorized_variant_prices
with (security_invoker = true)
as select * from public.get_authorized_variant_prices();

revoke all on public.authorized_product_prices from public, anon, authenticated;
revoke all on public.authorized_variant_prices from public, anon, authenticated;
grant select on public.authorized_product_prices to authenticated;
grant select on public.authorized_variant_prices to authenticated;

notify pgrst, 'reload schema';
