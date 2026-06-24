create extension if not exists pgcrypto;

create schema if not exists private;

do $$
begin
  create type public.user_role as enum ('admin', 'reseller', 'pending_reseller');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.application_status as enum ('pending', 'approved', 'rejected');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.order_request_status as enum (
    'submitted',
    'awaiting_payment',
    'paid',
    'submitted_to_supplier',
    'processing',
    'shipped',
    'fulfilled',
    'rejected',
    'cancelled'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.import_job_type as enum ('catalog_csv', 'inventory_xlsx', 'images');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.import_job_status as enum ('pending', 'processing', 'completed', 'failed');
exception
  when duplicate_object then null;
end $$;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  company_name text,
  phone text,
  role public.user_role not null default 'pending_reseller',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'::public.user_role
  );
$$;

create or replace function private.is_approved_reseller()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'reseller'::public.user_role
  );
$$;

revoke execute on function private.is_admin() from public, anon, authenticated;
revoke execute on function private.is_approved_reseller() from public, anon, authenticated;

create table if not exists public.reseller_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  company_name text not null,
  phone text,
  country text,
  message text,
  status public.application_status not null default 'pending',
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  slug text not null unique,
  description text,
  short_description text,
  category text,
  base_price numeric(12, 2),
  base_currency text not null default 'USD',
  image_names text[] not null default '{}',
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_base_currency_length check (char_length(base_currency) = 3),
  constraint products_base_price_nonnegative check (base_price is null or base_price >= 0)
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  name text not null,
  colour text,
  size text,
  base_price numeric(12, 2),
  base_currency text not null default 'USD',
  image_name text,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_variants_base_currency_length check (char_length(base_currency) = 3),
  constraint product_variants_base_price_nonnegative check (base_price is null or base_price >= 0)
);

create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  sku text not null unique,
  style_code text,
  stock_quantity integer not null default 0,
  source text,
  updated_at timestamptz not null default now(),
  constraint inventory_stock_quantity_nonnegative check (stock_quantity >= 0)
);

create table if not exists public.order_requests (
  id uuid primary key default gen_random_uuid(),
  reseller_id uuid not null references auth.users(id) on delete cascade,
  status public.order_request_status not null default 'submitted',
  notes text,
  admin_notes text,
  approved_at timestamptz,
  paid_at timestamptz,
  supplier_submitted_at timestamptz,
  processing_at timestamptz,
  shipped_at timestamptz,
  fulfilled_at timestamptz,
  expected_fulfillment_date date,
  invoice_number text,
  payment_reference text,
  payment_note text,
  supplier_exported_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_request_items (
  id uuid primary key default gen_random_uuid(),
  order_request_id uuid not null references public.order_requests(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  sku text not null,
  product_name text not null,
  colour text,
  size text,
  quantity integer not null,
  base_price numeric(12, 2),
  base_currency text not null default 'USD',
  created_at timestamptz not null default now(),
  constraint order_request_items_quantity_positive check (quantity > 0),
  constraint order_request_items_base_currency_length check (char_length(base_currency) = 3),
  constraint order_request_items_base_price_nonnegative check (base_price is null or base_price >= 0)
);

create table if not exists public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  import_type public.import_job_type not null,
  filename text not null,
  status public.import_job_status not null default 'pending',
  rows_total integer,
  rows_processed integer,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint import_jobs_rows_total_nonnegative check (rows_total is null or rows_total >= 0),
  constraint import_jobs_rows_processed_nonnegative check (rows_processed is null or rows_processed >= 0)
);

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists reseller_applications_user_id_idx on public.reseller_applications (user_id);
create index if not exists reseller_applications_status_idx on public.reseller_applications (status);
create index if not exists product_variants_product_id_idx on public.product_variants (product_id);
create index if not exists product_variants_colour_size_idx on public.product_variants (colour, size);
create index if not exists inventory_variant_id_idx on public.inventory (variant_id);
create index if not exists order_requests_reseller_id_idx on public.order_requests (reseller_id);
create index if not exists order_requests_status_idx on public.order_requests (status);
create index if not exists order_request_items_order_request_id_idx on public.order_request_items (order_request_id);
create index if not exists order_request_items_variant_id_idx on public.order_request_items (variant_id);
create index if not exists import_jobs_created_by_idx on public.import_jobs (created_by);
create index if not exists import_jobs_status_idx on public.import_jobs (status);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row execute function private.set_updated_at();

drop trigger if exists set_product_variants_updated_at on public.product_variants;
create trigger set_product_variants_updated_at
before update on public.product_variants
for each row execute function private.set_updated_at();

drop trigger if exists set_order_requests_updated_at on public.order_requests;
create trigger set_order_requests_updated_at
before update on public.order_requests
for each row execute function private.set_updated_at();

alter table public.profiles enable row level security;
alter table public.reseller_applications enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.inventory enable row level security;
alter table public.order_requests enable row level security;
alter table public.order_request_items enable row level security;
alter table public.import_jobs enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (id = (select auth.uid()) and role = 'pending_reseller'::public.user_role);

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all"
on public.profiles
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

drop policy if exists "reseller_applications_insert_own" on public.reseller_applications;
create policy "reseller_applications_insert_own"
on public.reseller_applications
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and status = 'pending'::public.application_status
);

drop policy if exists "reseller_applications_select_own_or_admin" on public.reseller_applications;
create policy "reseller_applications_select_own_or_admin"
on public.reseller_applications
for select
to authenticated
using (user_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists "reseller_applications_admin_update" on public.reseller_applications;
create policy "reseller_applications_admin_update"
on public.reseller_applications
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

drop policy if exists "products_public_read_published" on public.products;
create policy "products_public_read_published"
on public.products
for select
to anon, authenticated
using (published = true);

drop policy if exists "products_admin_all" on public.products;
create policy "products_admin_all"
on public.products
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

drop policy if exists "product_variants_public_read_published" on public.product_variants;
create policy "product_variants_public_read_published"
on public.product_variants
for select
to anon, authenticated
using (
  published = true
  and exists (
    select 1 from public.products
    where products.id = product_variants.product_id
      and products.published = true
  )
);

drop policy if exists "product_variants_admin_all" on public.product_variants;
create policy "product_variants_admin_all"
on public.product_variants
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

drop policy if exists "inventory_reseller_or_admin_read" on public.inventory;
create policy "inventory_reseller_or_admin_read"
on public.inventory
for select
to authenticated
using ((select private.is_approved_reseller()) or (select private.is_admin()));

drop policy if exists "inventory_admin_all" on public.inventory;
create policy "inventory_admin_all"
on public.inventory
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

drop policy if exists "order_requests_reseller_insert" on public.order_requests;
create policy "order_requests_reseller_insert"
on public.order_requests
for insert
to authenticated
with check (
  reseller_id = (select auth.uid())
  and status = 'submitted'::public.order_request_status
  and ((select private.is_approved_reseller()) or (select private.is_admin()))
);

drop policy if exists "order_requests_select_own_or_admin" on public.order_requests;
create policy "order_requests_select_own_or_admin"
on public.order_requests
for select
to authenticated
using (reseller_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists "order_requests_admin_update" on public.order_requests;
create policy "order_requests_admin_update"
on public.order_requests
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

drop policy if exists "order_request_items_reseller_insert" on public.order_request_items;
create policy "order_request_items_reseller_insert"
on public.order_request_items
for insert
to authenticated
with check (
  ((select private.is_approved_reseller()) or (select private.is_admin()))
  and exists (
    select 1
    from public.order_requests
    where order_requests.id = order_request_items.order_request_id
      and order_requests.reseller_id = (select auth.uid())
      and order_requests.status = 'submitted'::public.order_request_status
  )
);

drop policy if exists "order_request_items_select_own_or_admin" on public.order_request_items;
create policy "order_request_items_select_own_or_admin"
on public.order_request_items
for select
to authenticated
using (
  (select private.is_admin())
  or exists (
    select 1
    from public.order_requests
    where order_requests.id = order_request_items.order_request_id
      and order_requests.reseller_id = (select auth.uid())
  )
);

drop policy if exists "order_request_items_admin_all" on public.order_request_items;
create policy "order_request_items_admin_all"
on public.order_request_items
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

drop policy if exists "import_jobs_admin_all" on public.import_jobs;
create policy "import_jobs_admin_all"
on public.import_jobs
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));
