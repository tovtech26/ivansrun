create table if not exists public.hero_sections (
  id uuid primary key default gen_random_uuid(),
  eyebrow text not null default 'Irunsvan Africa',
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
  reseller_banner text not null default 'Irunsvan Africa reseller accounts can view live stock and submit order requests.',
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists hero_sections_one_active_idx
on public.hero_sections (active)
where active;

create unique index if not exists site_themes_one_active_idx
on public.site_themes (active)
where active;

create unique index if not exists site_content_one_active_idx
on public.site_content (active)
where active;

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
  'Irunsvan Africa',
  'Performance footwear for Africa.',
  'Browse the public range, then unlock live wholesale inventory through an approved Irunsvan Africa reseller account.',
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
select 'Irunsvan Africa reseller accounts can view live stock and submit order requests.', true
where not exists (select 1 from public.site_content);
