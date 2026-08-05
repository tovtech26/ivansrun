-- Full manufacturer stock reset for existing website SKUs, plus audited manual corrections.

create table if not exists public.inventory_adjustments (
  id uuid primary key default gen_random_uuid(),
  inventory_id uuid not null references public.inventory(id) on delete cascade,
  import_job_id uuid references public.import_jobs(id) on delete set null,
  sku text not null,
  previous_quantity integer not null,
  new_quantity integer not null,
  source text not null,
  reason text,
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now(),
  constraint inventory_adjustments_previous_nonnegative check (previous_quantity >= 0),
  constraint inventory_adjustments_new_nonnegative check (new_quantity >= 0)
);

create index if not exists inventory_adjustments_inventory_id_idx on public.inventory_adjustments (inventory_id, changed_at desc);
create index if not exists inventory_adjustments_import_job_id_idx on public.inventory_adjustments (import_job_id);

alter table public.inventory_adjustments enable row level security;
revoke all on table public.inventory_adjustments from public, anon, authenticated;
grant select on table public.inventory_adjustments to authenticated;

drop policy if exists "Admins can read inventory adjustments" on public.inventory_adjustments;
create policy "Admins can read inventory adjustments"
on public.inventory_adjustments for select to authenticated
using ((select private.is_admin()));

create or replace function private.reset_inventory_from_import(
  p_rows jsonb,
  p_filename text,
  p_rows_total integer,
  p_issue_count integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_job public.import_jobs%rowtype;
  v_input_count integer;
  v_distinct_count integer;
  v_invalid_count integer;
  v_matched_count integer;
  v_total_stock bigint;
begin
  if v_user_id is null or not exists (
    select 1 from public.profiles where id = v_user_id and role = 'admin'::public.user_role
  ) then
    raise exception 'Admin access is required to import inventory.';
  end if;

  if coalesce(jsonb_typeof(p_rows), 'null') <> 'array' or jsonb_array_length(p_rows) = 0 then
    raise exception 'The inventory import contains no valid rows.';
  end if;

  select count(*), count(distinct nullif(btrim(imported.sku), '')),
    count(*) filter (where nullif(btrim(imported.sku), '') is null or imported.stock_quantity is null or imported.stock_quantity < 0)
  into v_input_count, v_distinct_count, v_invalid_count
  from jsonb_to_recordset(p_rows) as imported(sku text, style_code text, stock_quantity integer);

  if v_invalid_count > 0 then
    raise exception 'The inventory import contains invalid SKU or stock values.';
  end if;
  if v_input_count <> v_distinct_count then
    raise exception 'The inventory import contains duplicate manufacturer SKUs.';
  end if;

  -- Serialize all stock-changing workflows before checking and replacing stock.
  lock table public.inventory in share row exclusive mode;

  select count(*) into v_matched_count
  from public.inventory inventory
  join jsonb_to_recordset(p_rows) as imported(sku text, style_code text, stock_quantity integer)
    on imported.sku = inventory.sku;
  if v_matched_count = 0 then
    raise exception 'No manufacturer SKUs matched products currently sold on the website. Stock was not reset.';
  end if;

  insert into public.import_jobs (created_by, import_type, filename, status, rows_total, rows_processed)
  values (
    v_user_id, 'inventory_xlsx'::public.import_job_type,
    coalesce(nullif(btrim(p_filename), ''), 'inventory-import'),
    'processing'::public.import_job_status,
    greatest(coalesce(p_rows_total, v_input_count), 0), 0
  ) returning * into v_job;

  insert into public.inventory_adjustments (
    inventory_id, import_job_id, sku, previous_quantity, new_quantity, source, reason, changed_by
  )
  select inventory.id, v_job.id, inventory.sku, inventory.stock_quantity, 0,
    'manufacturer_import_reset', 'Reset before applying the latest manufacturer inventory file.', v_user_id
  from public.inventory inventory where inventory.stock_quantity <> 0;

  update public.inventory
  set stock_quantity = 0, source = 'master_inventory:absent', updated_at = now();

  insert into public.inventory_adjustments (
    inventory_id, import_job_id, sku, previous_quantity, new_quantity, source, reason, changed_by
  )
  select inventory.id, v_job.id, inventory.sku, inventory.stock_quantity, imported.stock_quantity,
    'manufacturer_import_match', 'Applied exact manufacturer SKU stock from the latest inventory file.', v_user_id
  from public.inventory inventory
  join jsonb_to_recordset(p_rows) as imported(sku text, style_code text, stock_quantity integer)
    on imported.sku = inventory.sku
  where inventory.stock_quantity <> imported.stock_quantity;

  update public.inventory inventory
  set stock_quantity = imported.stock_quantity,
      style_code = coalesce(nullif(btrim(imported.style_code), ''), inventory.style_code),
      source = concat('master_inventory:', imported.sku),
      updated_at = now()
  from jsonb_to_recordset(p_rows) as imported(sku text, style_code text, stock_quantity integer)
  where imported.sku = inventory.sku;
  get diagnostics v_matched_count = row_count;

  select coalesce(sum(stock_quantity), 0) into v_total_stock from public.inventory;

  update public.import_jobs
  set status = 'completed'::public.import_job_status,
      rows_processed = v_matched_count,
      error_message = case when greatest(coalesce(p_issue_count, 0), 0) > 0
        then concat(greatest(coalesce(p_issue_count, 0), 0), ' file rows require review or were ignored.') else null end,
      completed_at = now()
  where id = v_job.id returning * into v_job;

  return jsonb_build_object(
    'job', to_jsonb(v_job), 'matchedRows', v_matched_count,
    'ignoredRows', greatest(coalesce(p_rows_total, v_input_count) - v_matched_count, 0),
    'totalStock', v_total_stock
  );
end;
$$;

create or replace function private.adjust_inventory_stock(
  p_inventory_id uuid,
  p_stock_quantity integer,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_inventory public.inventory%rowtype;
begin
  if v_user_id is null or not exists (
    select 1 from public.profiles where id = v_user_id and role = 'admin'::public.user_role
  ) then
    raise exception 'Admin access is required to adjust inventory.';
  end if;
  if p_stock_quantity is null or p_stock_quantity < 0 then
    raise exception 'Stock quantity must be zero or greater.';
  end if;

  lock table public.inventory in share row exclusive mode;

  select * into v_inventory from public.inventory where id = p_inventory_id for update;
  if not found then raise exception 'Inventory row was not found.'; end if;

  if v_inventory.stock_quantity <> p_stock_quantity then
    insert into public.inventory_adjustments (
      inventory_id, sku, previous_quantity, new_quantity, source, reason, changed_by
    ) values (
      v_inventory.id, v_inventory.sku, v_inventory.stock_quantity, p_stock_quantity,
      'manual_adjustment', nullif(btrim(coalesce(p_reason, '')), ''), v_user_id
    );
    update public.inventory
    set stock_quantity = p_stock_quantity, source = 'manual_adjustment', updated_at = now()
    where id = v_inventory.id returning * into v_inventory;
  end if;
  return to_jsonb(v_inventory);
end;
$$;

create or replace function public.reset_inventory_from_import(
  p_rows jsonb, p_filename text, p_rows_total integer, p_issue_count integer default 0
)
returns jsonb language sql security invoker set search_path = ''
as $$ select private.reset_inventory_from_import(p_rows, p_filename, p_rows_total, p_issue_count); $$;

create or replace function public.adjust_inventory_stock(
  p_inventory_id uuid, p_stock_quantity integer, p_reason text default null
)
returns jsonb language sql security invoker set search_path = ''
as $$ select private.adjust_inventory_stock(p_inventory_id, p_stock_quantity, p_reason); $$;

revoke all on function private.reset_inventory_from_import(jsonb, text, integer, integer) from public, anon, authenticated, service_role;
revoke all on function private.adjust_inventory_stock(uuid, integer, text) from public, anon, authenticated, service_role;
grant usage on schema private to authenticated;
grant execute on function private.reset_inventory_from_import(jsonb, text, integer, integer) to authenticated;
grant execute on function private.adjust_inventory_stock(uuid, integer, text) to authenticated;

revoke all on function public.reset_inventory_from_import(jsonb, text, integer, integer) from public, anon, authenticated, service_role;
revoke all on function public.adjust_inventory_stock(uuid, integer, text) from public, anon, authenticated, service_role;
grant execute on function public.reset_inventory_from_import(jsonb, text, integer, integer) to authenticated;
grant execute on function public.adjust_inventory_stock(uuid, integer, text) to authenticated;

notify pgrst, 'reload schema';
