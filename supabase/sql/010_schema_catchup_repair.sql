create table if not exists public.hero_sections (
  id uuid primary key default gen_random_uuid(),
  eyebrow text not null default 'Ivansrun Africa',
  title text not null,
  copy text not null,
  background_image text not null default '/Flyer Templates/Flyer Template.jpg',
  primary_cta text not null default 'View Catalog',
  primary_route text not null default 'catalog',
  secondary_cta text not null default 'Reseller Access',
  secondary_route text not null default 'apply',
  electricity boolean not null default true,
  active boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_themes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  primary_color text not null default '#0070ea',
  primary_dark_color text not null default '#0059bb',
  background_color text not null default '#f6f6f4',
  surface_color text not null default '#ece9e3',
  accent_color text not null default '#7ddfff',
  text_color text not null default '#171717',
  deep_color text not null default '#001a41',
  active boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_themes_primary_color_hex check (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint site_themes_primary_dark_color_hex check (primary_dark_color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint site_themes_background_color_hex check (background_color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint site_themes_surface_color_hex check (surface_color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint site_themes_accent_color_hex check (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint site_themes_text_color_hex check (text_color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint site_themes_deep_color_hex check (deep_color ~ '^#[0-9A-Fa-f]{6}$')
);

create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  reseller_banner text not null default 'Ivansrun Africa reseller accounts can view live stock and submit order requests.',
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products
  add column if not exists model_code text,
  add column if not exists product_type text not null default 'shoe';

alter table public.product_variants
  add column if not exists original_colour text,
  add column if not exists color_code text;

do $$
begin
  alter type public.import_job_type add value if not exists 'catalog_seed_inventory';
  alter type public.import_job_type add value if not exists 'media_pack_zip';
exception
  when duplicate_object then null;
end $$;

create unique index if not exists hero_sections_one_active_idx
on public.hero_sections (active)
where active;

create unique index if not exists site_themes_one_active_idx
on public.site_themes (active)
where active;

create unique index if not exists site_content_one_active_idx
on public.site_content (active)
where active;

create index if not exists products_model_code_idx
on public.products (model_code);

create index if not exists products_product_type_idx
on public.products (product_type);

create index if not exists product_variants_original_colour_size_idx
on public.product_variants (original_colour, size);

create index if not exists product_variants_color_code_idx
on public.product_variants (color_code);

drop trigger if exists set_hero_sections_updated_at on public.hero_sections;
create trigger set_hero_sections_updated_at
before update on public.hero_sections
for each row execute function private.set_updated_at();

drop trigger if exists set_site_themes_updated_at on public.site_themes;
create trigger set_site_themes_updated_at
before update on public.site_themes
for each row execute function private.set_updated_at();

drop trigger if exists set_site_content_updated_at on public.site_content;
create trigger set_site_content_updated_at
before update on public.site_content
for each row execute function private.set_updated_at();

alter table public.hero_sections enable row level security;
alter table public.site_themes enable row level security;
alter table public.site_content enable row level security;

grant usage on schema public to anon, authenticated;

grant select on table public.hero_sections to anon, authenticated;
grant select on table public.site_themes to anon, authenticated;
grant select on table public.site_content to anon, authenticated;
grant insert, update, delete on table public.hero_sections to authenticated;
grant insert, update, delete on table public.site_themes to authenticated;
grant insert, update, delete on table public.site_content to authenticated;

drop policy if exists "Public can read active hero sections" on public.hero_sections;
create policy "Public can read active hero sections"
on public.hero_sections
for select
to anon, authenticated
using (active = true);

drop policy if exists "Admins can manage hero sections" on public.hero_sections;
create policy "Admins can manage hero sections"
on public.hero_sections
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

drop policy if exists "Public can read active site themes" on public.site_themes;
create policy "Public can read active site themes"
on public.site_themes
for select
to anon, authenticated
using (
  active = true
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at >= now())
);

drop policy if exists "Admins can manage site themes" on public.site_themes;
create policy "Admins can manage site themes"
on public.site_themes
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

drop policy if exists "Public can read active site content" on public.site_content;
create policy "Public can read active site content"
on public.site_content
for select
to anon, authenticated
using (active = true);

drop policy if exists "Admins can manage site content" on public.site_content;
create policy "Admins can manage site content"
on public.site_content
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

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

update public.products
set model_code = regexp_replace(sku, '^IRUNSVAN-', '')
where (model_code is null or btrim(model_code) = '')
  and sku ~ '^IRUNSVAN-[0-9A-Za-z_-]+$';

update public.product_variants
set original_colour = colour
where (original_colour is null or btrim(original_colour) = '')
  and colour is not null
  and btrim(colour) <> '';

insert into public.product_colour_mappings (
  product_id,
  model_code,
  original_colour,
  colour,
  color_code,
  image_name,
  published
)
select distinct
  p.id,
  p.model_code,
  v.original_colour,
  v.colour,
  coalesce(v.color_code, ''),
  first_value(v.image_name) over (
    partition by p.id, v.original_colour, coalesce(v.color_code, '')
    order by v.image_name nulls last
  ),
  true
from public.products p
join public.product_variants v on v.product_id = p.id
where p.model_code is not null
  and btrim(p.model_code) <> ''
  and v.original_colour is not null
  and btrim(v.original_colour) <> ''
on conflict (product_id, original_colour, color_code) do update set
  model_code = excluded.model_code,
  colour = excluded.colour,
  image_name = coalesce(public.product_colour_mappings.image_name, excluded.image_name),
  published = excluded.published,
  updated_at = now();

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = excluded.public;

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

insert into public.hero_sections (
  eyebrow,
  title,
  copy,
  background_image,
  primary_cta,
  primary_route,
  secondary_cta,
  secondary_route,
  electricity,
  active
)
select
  'Ivansrun Africa',
  'Performance footwear for Africa.',
  'Browse the public range, then unlock live wholesale inventory through an approved Ivansrun Africa reseller account.',
  '/Flyer Templates/Flyer Template.jpg',
  'View Catalog',
  'catalog',
  'Reseller Access',
  'apply',
  true,
  true
where not exists (select 1 from public.hero_sections);

insert into public.site_themes (
  name,
  primary_color,
  primary_dark_color,
  background_color,
  surface_color,
  accent_color,
  text_color,
  deep_color,
  active
)
select
  'Default Blue',
  '#0070ea',
  '#0059bb',
  '#f6f6f4',
  '#ece9e3',
  '#7ddfff',
  '#171717',
  '#001a41',
  true
where not exists (select 1 from public.site_themes);

insert into public.site_content (reseller_banner, active)
select 'Ivansrun Africa reseller accounts can view live stock and submit order requests.', true
where not exists (select 1 from public.site_content);
