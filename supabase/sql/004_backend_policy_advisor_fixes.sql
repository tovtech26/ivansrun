create index if not exists reseller_applications_reviewed_by_idx
on public.reseller_applications (reviewed_by);

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_update"
on public.profiles
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "profiles_admin_delete"
on public.profiles
for delete
to authenticated
using ((select private.is_admin()));

drop policy if exists "products_public_read_published" on public.products;
drop policy if exists "products_admin_all" on public.products;
create policy "products_read_published_or_admin"
on public.products
for select
to anon, authenticated
using (published = true or (select private.is_admin()));

create policy "products_admin_insert"
on public.products
for insert
to authenticated
with check ((select private.is_admin()));

create policy "products_admin_update"
on public.products
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "products_admin_delete"
on public.products
for delete
to authenticated
using ((select private.is_admin()));

drop policy if exists "product_variants_public_read_published" on public.product_variants;
drop policy if exists "product_variants_admin_all" on public.product_variants;
create policy "product_variants_read_published_or_admin"
on public.product_variants
for select
to anon, authenticated
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

create policy "product_variants_admin_insert"
on public.product_variants
for insert
to authenticated
with check ((select private.is_admin()));

create policy "product_variants_admin_update"
on public.product_variants
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "product_variants_admin_delete"
on public.product_variants
for delete
to authenticated
using ((select private.is_admin()));

drop policy if exists "inventory_admin_all" on public.inventory;
create policy "inventory_admin_insert"
on public.inventory
for insert
to authenticated
with check ((select private.is_admin()));

create policy "inventory_admin_update"
on public.inventory
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "inventory_admin_delete"
on public.inventory
for delete
to authenticated
using ((select private.is_admin()));

drop policy if exists "order_request_items_reseller_insert" on public.order_request_items;
drop policy if exists "order_request_items_admin_all" on public.order_request_items;
create policy "order_request_items_reseller_insert"
on public.order_request_items
for insert
to authenticated
with check (
  (select private.is_approved_reseller())
  and exists (
    select 1
    from public.order_requests
    where order_requests.id = order_request_items.order_request_id
      and order_requests.reseller_id = (select auth.uid())
      and order_requests.status = 'submitted'::public.order_request_status
  )
);

create policy "order_request_items_admin_insert"
on public.order_request_items
for insert
to authenticated
with check ((select private.is_admin()));

create policy "order_request_items_admin_update"
on public.order_request_items
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "order_request_items_admin_delete"
on public.order_request_items
for delete
to authenticated
using ((select private.is_admin()));

