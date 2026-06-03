grant execute on function private.is_admin() to authenticated;
grant execute on function private.is_approved_reseller() to authenticated;

drop policy if exists "products_read_published_or_admin" on public.products;
create policy "products_anon_read_published"
on public.products
for select
to anon
using (published = true);

create policy "products_authenticated_read_published_or_admin"
on public.products
for select
to authenticated
using (published = true or (select private.is_admin()));

drop policy if exists "product_variants_read_published_or_admin" on public.product_variants;
create policy "product_variants_anon_read_published"
on public.product_variants
for select
to anon
using (
  published = true
  and exists (
    select 1 from public.products
    where products.id = product_variants.product_id
      and products.published = true
  )
);

create policy "product_variants_authenticated_read_published_or_admin"
on public.product_variants
for select
to authenticated
using (
  (select private.is_admin())
  or (
    published = true
    and exists (
      select 1 from public.products
      where products.id = product_variants.product_id
        and products.published = true
    )
  )
);

