create table if not exists public.product_colour_mappings (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  model_code text not null,
  original_colour text not null,
  colour text not null,
  color_code text,
  image_name text,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, original_colour, color_code)
);

create index if not exists product_colour_mappings_product_id_idx
on public.product_colour_mappings (product_id);

create index if not exists product_colour_mappings_model_code_idx
on public.product_colour_mappings (model_code);

alter table public.product_colour_mappings enable row level security;

grant select on public.product_colour_mappings to anon, authenticated;
grant insert, update, delete on public.product_colour_mappings to authenticated;

drop policy if exists "Public can read published colour mappings" on public.product_colour_mappings;
create policy "Public can read published colour mappings"
on public.product_colour_mappings
for select
to anon, authenticated
using (published = true);

drop policy if exists "Admins can manage colour mappings" on public.product_colour_mappings;
create policy "Admins can manage colour mappings"
on public.product_colour_mappings
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());
