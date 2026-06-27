create table if not exists public.public_product_flyer_images (
  id uuid primary key default gen_random_uuid(),
  flyer_id uuid not null references public.public_product_flyers(id) on delete cascade,
  image_path text not null,
  image_name text not null default 'Product image',
  sku_reference text,
  color_name text,
  caption text,
  display_order integer not null default 0,
  is_cover boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists public_product_flyer_images_order_idx
on public.public_product_flyer_images (flyer_id, is_cover desc, display_order, created_at);

create unique index if not exists public_product_flyer_images_one_cover_idx
on public.public_product_flyer_images (flyer_id)
where is_cover = true;

drop trigger if exists set_public_product_flyer_images_updated_at on public.public_product_flyer_images;
create trigger set_public_product_flyer_images_updated_at
before update on public.public_product_flyer_images
for each row execute function private.set_updated_at();

create or replace function private.public_product_flyer_images_max_20()
returns trigger
language plpgsql
security invoker
as $$
begin
  if (
    select count(*)
    from public.public_product_flyer_images
    where flyer_id = new.flyer_id
      and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) >= 20 then
    raise exception 'A public product flyer can have at most 20 images.';
  end if;

  return new;
end;
$$;

drop trigger if exists public_product_flyer_images_max_20 on public.public_product_flyer_images;
create trigger public_product_flyer_images_max_20
before insert or update on public.public_product_flyer_images
for each row execute function private.public_product_flyer_images_max_20();

alter table public.public_product_flyer_images enable row level security;

grant select on table public.public_product_flyer_images to anon, authenticated;
grant insert, update, delete on table public.public_product_flyer_images to authenticated;

drop policy if exists "Public can read published product flyer images" on public.public_product_flyer_images;
create policy "Public can read published product flyer images"
on public.public_product_flyer_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.public_product_flyers flyers
    where flyers.id = public_product_flyer_images.flyer_id
      and flyers.published = true
  )
);

drop policy if exists "Admins can manage product flyer images" on public.public_product_flyer_images;
create policy "Admins can manage product flyer images"
on public.public_product_flyer_images
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

insert into public.public_product_flyer_images (
  flyer_id,
  image_path,
  image_name,
  display_order,
  is_cover
)
select
  flyers.id,
  images.image_path,
  images.image_name,
  images.display_order,
  images.is_cover
from public.public_product_flyers flyers
cross join lateral (
  values
    (flyers.main_image_path, 'Main image', 0, true),
    (flyers.secondary_image_path, 'Secondary image', 1, false)
) as images(image_path, image_name, display_order, is_cover)
where images.image_path is not null
  and btrim(images.image_path) <> ''
  and not exists (
    select 1
    from public.public_product_flyer_images existing
    where existing.flyer_id = flyers.id
      and existing.image_path = images.image_path
  );

notify pgrst, 'reload schema';
