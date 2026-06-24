create table if not exists public.public_product_flyers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  product_class text not null,
  short_description text,
  story text,
  main_image_path text,
  secondary_image_path text,
  display_order integer not null default 0,
  published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists public_product_flyers_public_idx
on public.public_product_flyers (published, display_order, created_at desc);

create index if not exists public_product_flyers_admin_idx
on public.public_product_flyers (display_order, created_at desc);

drop trigger if exists set_public_product_flyers_updated_at on public.public_product_flyers;
create trigger set_public_product_flyers_updated_at
before update on public.public_product_flyers
for each row execute function private.set_updated_at();

alter table public.public_product_flyers enable row level security;

grant select on table public.public_product_flyers to anon, authenticated;
grant insert, update, delete on table public.public_product_flyers to authenticated;

drop policy if exists "Public can read published product flyers" on public.public_product_flyers;
create policy "Public can read published product flyers"
on public.public_product_flyers
for select
to anon, authenticated
using (published = true);

drop policy if exists "Admins can manage product flyers" on public.public_product_flyers;
create policy "Admins can manage product flyers"
on public.public_product_flyers
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());
