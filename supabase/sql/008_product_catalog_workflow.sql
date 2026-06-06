alter table public.products
  add column if not exists model_code text,
  add column if not exists product_type text not null default 'shoe';

alter table public.product_variants
  add column if not exists original_colour text,
  add column if not exists color_code text;

create index if not exists products_model_code_idx
on public.products (model_code);

create index if not exists products_product_type_idx
on public.products (product_type);

create index if not exists product_variants_original_colour_size_idx
on public.product_variants (original_colour, size);

create index if not exists product_variants_color_code_idx
on public.product_variants (color_code);

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "product_images_admin_insert" on storage.objects;
create policy "product_images_admin_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and (select private.is_admin())
);
