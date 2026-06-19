alter table public.site_content
  add column if not exists about_heading text not null default 'About Irunsvan Africa',
  add column if not exists about_body text not null default 'Irunsvan Africa supplies performance footwear through approved reseller channels across Africa.';

create table if not exists public.homepage_flyers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_path text not null,
  sort_order integer not null default 0,
  published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  cover_image_path text,
  summary text,
  body text not null default '',
  published boolean not null default false,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists homepage_flyers_public_idx
on public.homepage_flyers (published, sort_order, created_at desc);

create index if not exists blog_posts_public_idx
on public.blog_posts (published, published_at desc, created_at desc);

drop trigger if exists set_homepage_flyers_updated_at on public.homepage_flyers;
create trigger set_homepage_flyers_updated_at
before update on public.homepage_flyers
for each row execute function private.set_updated_at();

drop trigger if exists set_blog_posts_updated_at on public.blog_posts;
create trigger set_blog_posts_updated_at
before update on public.blog_posts
for each row execute function private.set_updated_at();

alter table public.homepage_flyers enable row level security;
alter table public.blog_posts enable row level security;

grant select on table public.homepage_flyers to anon, authenticated;
grant select on table public.blog_posts to anon, authenticated;
grant insert, update, delete on table public.homepage_flyers to authenticated;
grant insert, update, delete on table public.blog_posts to authenticated;

drop policy if exists "Public can read published homepage flyers" on public.homepage_flyers;
create policy "Public can read published homepage flyers"
on public.homepage_flyers
for select
to anon, authenticated
using (published = true);

drop policy if exists "Admins can manage homepage flyers" on public.homepage_flyers;
create policy "Admins can manage homepage flyers"
on public.homepage_flyers
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

drop policy if exists "Public can read published blog posts" on public.blog_posts;
create policy "Public can read published blog posts"
on public.blog_posts
for select
to anon, authenticated
using (published = true);

drop policy if exists "Admins can manage blog posts" on public.blog_posts;
create policy "Admins can manage blog posts"
on public.blog_posts
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "content_images_admin_insert" on storage.objects;
create policy "content_images_admin_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and name like 'content/%'
  and private.is_admin()
);

drop policy if exists "content_images_admin_update" on storage.objects;
create policy "content_images_admin_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'product-images'
  and name like 'content/%'
  and private.is_admin()
)
with check (
  bucket_id = 'product-images'
  and name like 'content/%'
  and private.is_admin()
);

drop policy if exists "content_images_admin_delete" on storage.objects;
create policy "content_images_admin_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images'
  and name like 'content/%'
  and private.is_admin()
);
