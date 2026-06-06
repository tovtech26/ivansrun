do $$
begin
  alter type public.import_job_type add value if not exists 'media_pack_zip';
exception
  when duplicate_object then null;
end $$;

create or replace view public.reseller_products
with (security_invoker = true)
as
select
  id,
  sku,
  model_code,
  product_type,
  name,
  slug,
  description,
  short_description,
  category,
  base_price,
  base_currency,
  image_names,
  published
from public.products
where
  (select private.is_admin())
  or (published = true and (select private.is_approved_reseller()));

create or replace view public.reseller_product_variants
with (security_invoker = true)
as
select
  product_variants.id,
  product_variants.product_id,
  product_variants.sku,
  product_variants.name,
  product_variants.colour,
  product_variants.original_colour,
  product_variants.color_code,
  product_variants.size,
  product_variants.base_price,
  product_variants.base_currency,
  product_variants.image_name,
  product_variants.published
from public.product_variants
join public.products on products.id = product_variants.product_id
where
  (select private.is_admin())
  or (
    products.published = true
    and product_variants.published = true
    and (select private.is_approved_reseller())
  );

revoke all on public.reseller_products from public, anon, authenticated;
revoke all on public.reseller_product_variants from public, anon, authenticated;
grant select on public.reseller_products to authenticated;
grant select on public.reseller_product_variants to authenticated;

grant usage on schema public to anon, authenticated;

revoke all on public.products from anon, authenticated;
revoke all on public.product_variants from anon, authenticated;

grant select (
  id,
  sku,
  model_code,
  product_type,
  name,
  slug,
  description,
  short_description,
  category,
  image_names,
  published,
  created_at,
  updated_at
) on public.products to anon, authenticated;

grant select (
  id,
  product_id,
  sku,
  name,
  colour,
  original_colour,
  color_code,
  size,
  image_name,
  published,
  created_at,
  updated_at
) on public.product_variants to anon, authenticated;

grant insert, update, delete on public.products to authenticated;
grant insert, update, delete on public.product_variants to authenticated;

grant select, insert, update, delete on public.inventory to authenticated;
grant select, insert, update, delete on public.order_requests to authenticated;
grant select, insert, update, delete on public.order_request_items to authenticated;
grant select, insert, update, delete on public.reseller_applications to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.import_jobs to authenticated;

drop policy if exists "product_images_admin_insert" on storage.objects;
drop policy if exists "product_images_admin_update" on storage.objects;
drop policy if exists "product_images_admin_delete" on storage.objects;

create policy "product_images_admin_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and (select private.is_admin())
);

create policy "product_images_admin_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'product-images'
  and (select private.is_admin())
)
with check (
  bucket_id = 'product-images'
  and (select private.is_admin())
);

create policy "product_images_admin_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images'
  and (select private.is_admin())
);
