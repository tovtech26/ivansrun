-- Editable public Brand Ambassadors content for the campaign homepage.

create table if not exists public.brand_ambassadors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  role_title text not null,
  country text,
  city text,
  short_bio text not null,
  full_bio text,
  image_path text not null,
  cta_label text,
  link_url text,
  instagram_url text,
  display_order integer not null default 0,
  featured boolean not null default false,
  published boolean not null default false,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brand_ambassadors_name_length check (char_length(name) between 1 and 160),
  constraint brand_ambassadors_role_title_length check (char_length(role_title) between 1 and 160),
  constraint brand_ambassadors_short_bio_length check (char_length(short_bio) between 1 and 600),
  constraint brand_ambassadors_display_order_valid check (display_order >= 0),
  constraint brand_ambassadors_image_path_valid check (image_path like 'content/%')
);

create index if not exists brand_ambassadors_public_idx
on public.brand_ambassadors (published, featured desc, display_order, created_at desc);

create index if not exists brand_ambassadors_created_by_idx
on public.brand_ambassadors (created_by);

drop trigger if exists set_brand_ambassadors_updated_at on public.brand_ambassadors;
create trigger set_brand_ambassadors_updated_at
before update on public.brand_ambassadors
for each row execute function private.set_updated_at();

alter table public.brand_ambassadors enable row level security;

grant select on table public.brand_ambassadors to anon, authenticated;
grant insert, update, delete on table public.brand_ambassadors to authenticated;

drop policy if exists "Anonymous can read published brand ambassadors" on public.brand_ambassadors;
create policy "Anonymous can read published brand ambassadors"
on public.brand_ambassadors
for select
to anon
using (published = true);

drop policy if exists "Authenticated can read brand ambassadors" on public.brand_ambassadors;
create policy "Authenticated can read brand ambassadors"
on public.brand_ambassadors
for select
to authenticated
using (published = true or (select private.is_admin()));

drop policy if exists "Admins can insert brand ambassadors" on public.brand_ambassadors;
create policy "Admins can insert brand ambassadors"
on public.brand_ambassadors
for insert
to authenticated
with check ((select private.is_admin()));

drop policy if exists "Admins can update brand ambassadors" on public.brand_ambassadors;
create policy "Admins can update brand ambassadors"
on public.brand_ambassadors
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

drop policy if exists "Admins can delete brand ambassadors" on public.brand_ambassadors;
create policy "Admins can delete brand ambassadors"
on public.brand_ambassadors
for delete
to authenticated
using ((select private.is_admin()));

notify pgrst, 'reload schema';
