-- Atomic reseller review, order submission, and supply approval workflows.
-- The Supabase CLI is not installed in this workspace, so this follows the
-- repository's existing numbered SQL convention.

create or replace function private.review_reseller_application(
  p_application_id uuid,
  p_status public.application_status
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_application public.reseller_applications%rowtype;
begin
  if v_user_id is null or not exists (
    select 1 from public.profiles
    where id = v_user_id and role = 'admin'::public.user_role
  ) then
    raise exception 'Admin access is required to review reseller applications.';
  end if;

  if p_status::text not in ('approved', 'rejected') then
    raise exception 'Application status must be approved or rejected.';
  end if;

  update public.reseller_applications
  set status = p_status,
      reviewed_by = v_user_id,
      reviewed_at = now()
  where id = p_application_id
  returning * into v_application;

  if not found then
    raise exception 'Reseller application was not found.';
  end if;

  update public.profiles
  set role = case
        when p_status::text = 'approved' then 'reseller'::public.user_role
        else 'pending_reseller'::public.user_role
      end,
      updated_at = now()
  where id = v_application.user_id;

  if not found then
    raise exception 'The reseller profile linked to this application was not found.';
  end if;

  return to_jsonb(v_application);
end;
$$;

create or replace function private.submit_order_request(
  p_items jsonb,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_order public.order_requests%rowtype;
  v_requested_count integer;
  v_distinct_count integer;
  v_matched_count integer;
  v_invalid_count integer;
  v_items jsonb;
begin
  if v_user_id is null or not exists (
    select 1 from public.profiles
    where id = v_user_id and role in ('reseller'::public.user_role, 'admin'::public.user_role)
  ) then
    raise exception 'An approved reseller account is required to submit an order.';
  end if;

  if coalesce(jsonb_typeof(p_items), 'null') <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'At least one order item is required.';
  end if;

  if jsonb_array_length(p_items) > 200 then
    raise exception 'An order cannot contain more than 200 item rows.';
  end if;

  select count(*), count(distinct requested.variant_id), count(*) filter (where requested.quantity <= 0)
  into v_requested_count, v_distinct_count, v_invalid_count
  from jsonb_to_recordset(p_items) as requested(variant_id uuid, quantity integer);

  if v_requested_count <> v_distinct_count then
    raise exception 'Duplicate product variants are not allowed in one order.';
  end if;

  if v_invalid_count > 0 then
    raise exception 'Every order item requires a positive quantity.';
  end if;

  select count(*)
  into v_matched_count
  from jsonb_to_recordset(p_items) as requested(variant_id uuid, quantity integer)
  join public.product_variants variants on variants.id = requested.variant_id
  join public.products products on products.id = variants.product_id
  join public.inventory inventory on inventory.variant_id = variants.id
  where variants.published = true
    and products.published = true
    and coalesce(variants.base_price, products.base_price) > 0
    and requested.quantity <= inventory.stock_quantity;

  if v_matched_count <> v_requested_count then
    raise exception 'One or more order items are unavailable, unpriced, unpublished, or exceed current stock.';
  end if;

  insert into public.order_requests (reseller_id, status, notes)
  values (v_user_id, 'submitted'::public.order_request_status, nullif(btrim(coalesce(p_notes, '')), ''))
  returning * into v_order;

  insert into public.order_request_items (
    order_request_id,
    variant_id,
    sku,
    product_name,
    colour,
    size,
    quantity,
    base_price,
    base_currency
  )
  select
    v_order.id,
    variants.id,
    variants.sku,
    products.name,
    variants.colour,
    variants.size,
    requested.quantity,
    coalesce(variants.base_price, products.base_price),
    coalesce(nullif(variants.base_currency, ''), products.base_currency, 'USD')
  from jsonb_to_recordset(p_items) as requested(variant_id uuid, quantity integer)
  join public.product_variants variants on variants.id = requested.variant_id
  join public.products products on products.id = variants.product_id;

  select coalesce(jsonb_agg(to_jsonb(items) order by items.created_at, items.id), '[]'::jsonb)
  into v_items
  from public.order_request_items items
  where items.order_request_id = v_order.id;

  return jsonb_build_object('order', to_jsonb(v_order), 'items', v_items);
end;
$$;

create or replace function private.approve_order_request(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_order public.order_requests%rowtype;
  v_item record;
  v_inventory public.inventory%rowtype;
begin
  if v_user_id is null or not exists (
    select 1 from public.profiles
    where id = v_user_id and role = 'admin'::public.user_role
  ) then
    raise exception 'Admin access is required to approve an order.';
  end if;

  -- Serialize all stock-changing workflows (approvals, imports, and corrections).
  lock table public.inventory in share row exclusive mode;

  select * into v_order
  from public.order_requests
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order request was not found.';
  end if;

  if v_order.status::text in ('awaiting_payment', 'approved') then
    return to_jsonb(v_order);
  end if;

  if v_order.status::text <> 'submitted' then
    raise exception 'Only submitted orders can be approved for supply.';
  end if;

  if not exists (select 1 from public.order_request_items where order_request_id = p_order_id) then
    raise exception 'This order has no items to approve.';
  end if;

  for v_item in
    select variant_id, sum(quantity)::integer as requested_quantity
    from public.order_request_items
    where order_request_id = p_order_id
    group by variant_id
    order by variant_id
  loop
    select * into v_inventory
    from public.inventory
    where variant_id = v_item.variant_id
    for update;

    if not found then
      raise exception 'Inventory is missing for one or more order items.';
    end if;

    if v_inventory.stock_quantity < v_item.requested_quantity then
      raise exception 'This order cannot be approved because stock is no longer enough.';
    end if;

    update public.inventory
    set stock_quantity = stock_quantity - v_item.requested_quantity,
        source = 'order_reserved',
        updated_at = now()
    where id = v_inventory.id;
  end loop;

  update public.order_requests
  set status = 'awaiting_payment'::public.order_request_status,
      approved_at = coalesce(approved_at, now()),
      admin_notes = concat_ws(E'\n', nullif(admin_notes, ''), concat('Approved for supply by admin on ', now()::text))
  where id = p_order_id
  returning * into v_order;

  return to_jsonb(v_order);
end;
$$;

create or replace function public.review_reseller_application(
  p_application_id uuid,
  p_status public.application_status
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.review_reseller_application(p_application_id, p_status);
$$;

create or replace function public.submit_order_request(
  p_items jsonb,
  p_notes text default null
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.submit_order_request(p_items, p_notes);
$$;

create or replace function public.approve_order_request(p_order_id uuid)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.approve_order_request(p_order_id);
$$;

revoke all on function private.review_reseller_application(uuid, public.application_status) from public, anon, authenticated, service_role;
revoke all on function private.submit_order_request(jsonb, text) from public, anon, authenticated, service_role;
revoke all on function private.approve_order_request(uuid) from public, anon, authenticated, service_role;
grant usage on schema private to authenticated;
grant execute on function private.review_reseller_application(uuid, public.application_status) to authenticated;
grant execute on function private.submit_order_request(jsonb, text) to authenticated;
grant execute on function private.approve_order_request(uuid) to authenticated;

revoke all on function public.review_reseller_application(uuid, public.application_status) from public, anon, authenticated, service_role;
revoke all on function public.submit_order_request(jsonb, text) from public, anon, authenticated, service_role;
revoke all on function public.approve_order_request(uuid) from public, anon, authenticated, service_role;
grant execute on function public.review_reseller_application(uuid, public.application_status) to authenticated;
grant execute on function public.submit_order_request(jsonb, text) to authenticated;
grant execute on function public.approve_order_request(uuid) to authenticated;

notify pgrst, 'reload schema';
