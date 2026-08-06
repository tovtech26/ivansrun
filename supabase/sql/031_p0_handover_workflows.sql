-- P0 handover: controlled product pricing and editable homepage seed.
-- This migration is additive and does not delete or overwrite production content.

create or replace function private.update_product_price(
  p_product_id uuid,
  p_base_price numeric,
  p_base_currency text default 'USD'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product public.products%rowtype;
begin
  if (select auth.uid()) is null or not (select private.is_admin()) then
    raise exception 'Admin access is required to update product prices.';
  end if;
  if p_product_id is null then raise exception 'A product is required.'; end if;
  if p_base_price is null or p_base_price <= 0 then raise exception 'Price must be greater than zero.'; end if;
  if nullif(btrim(coalesce(p_base_currency, '')), '') is null then raise exception 'Currency is required.'; end if;

  update public.products
  set base_price = p_base_price,
      base_currency = upper(btrim(p_base_currency)),
      updated_at = now()
  where id = p_product_id
  returning * into v_product;

  if v_product.id is null then raise exception 'Product not found.'; end if;
  return to_jsonb(v_product);
end;
$$;

create or replace function public.update_product_price(
  p_product_id uuid,
  p_base_price numeric,
  p_base_currency text default 'USD'
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.update_product_price(p_product_id, p_base_price, p_base_currency);
$$;

revoke all on function private.update_product_price(uuid,numeric,text) from public, anon, authenticated, service_role;
grant execute on function private.update_product_price(uuid,numeric,text) to authenticated;
revoke all on function public.update_product_price(uuid,numeric,text) from public, anon, authenticated, service_role;
grant execute on function public.update_product_price(uuid,numeric,text) to authenticated;

insert into public.homepage_flyers (title, image_path, sort_order, published)
select 'Irunsvan Africa', '/Flyer Templates/Flyer Template.jpg', 0, true
where not exists (select 1 from public.homepage_flyers);

notify pgrst, 'reload schema';
