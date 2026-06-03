drop policy if exists "order_request_items_reseller_insert" on public.order_request_items;
drop policy if exists "order_request_items_admin_insert" on public.order_request_items;

create policy "order_request_items_insert_reseller_or_admin"
on public.order_request_items
for insert
to authenticated
with check (
  (select private.is_admin())
  or (
    (select private.is_approved_reseller())
    and exists (
      select 1
      from public.order_requests
      where order_requests.id = order_request_items.order_request_id
        and order_requests.reseller_id = (select auth.uid())
        and order_requests.status = 'submitted'::public.order_request_status
    )
  )
);

