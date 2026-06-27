create or replace function private.public_product_flyer_images_max_20()
returns trigger
language plpgsql
security invoker
set search_path = ''
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

create index if not exists public_product_flyer_images_created_by_idx
on public.public_product_flyer_images (created_by)
where created_by is not null;

create index if not exists public_product_flyer_images_updated_by_idx
on public.public_product_flyer_images (updated_by)
where updated_by is not null;

drop policy if exists "Public can read published product flyer images" on public.public_product_flyer_images;
drop policy if exists "Admins can manage product flyer images" on public.public_product_flyer_images;

create policy "Public can read published product flyer images"
on public.public_product_flyer_images
for select
to anon
using (
  exists (
    select 1
    from public.public_product_flyers flyers
    where flyers.id = public_product_flyer_images.flyer_id
      and flyers.published = true
  )
);

create policy "Authenticated can read product flyer images"
on public.public_product_flyer_images
for select
to authenticated
using (
  private.is_admin()
  or exists (
    select 1
    from public.public_product_flyers flyers
    where flyers.id = public_product_flyer_images.flyer_id
      and flyers.published = true
  )
);

create policy "Admins can manage product flyer images"
on public.public_product_flyer_images
for insert
to authenticated
with check (private.is_admin());

create policy "Admins can update product flyer images"
on public.public_product_flyer_images
for update
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "Admins can delete product flyer images"
on public.public_product_flyer_images
for delete
to authenticated
using (private.is_admin());

notify pgrst, 'reload schema';
