-- Generated from public/product-images/SKUs. The SKU image folders are the product source of truth.
with source_images(model_code, image_names) as (
  values
  ('005', array['/public/product-images/SKUs/005/005-1.jpg','/public/product-images/SKUs/005/005-2.jpg','/public/product-images/SKUs/005/005-3.jpg','/public/product-images/SKUs/005/005-4.jpg','/public/product-images/SKUs/005/005-5.jpg','/public/product-images/SKUs/005/005-6.jpg','/public/product-images/SKUs/005/005-7.jpg']::text[]),
  ('026', array['/public/product-images/SKUs/026/026-1.jpg','/public/product-images/SKUs/026/026-2.jpg','/public/product-images/SKUs/026/026-3.jpg','/public/product-images/SKUs/026/026-4.jpg','/public/product-images/SKUs/026/026-5.jpg']::text[]),
  ('028', array['/public/product-images/SKUs/028/028-1.jpg','/public/product-images/SKUs/028/028-2.jpg','/public/product-images/SKUs/028/028-3.jpg','/public/product-images/SKUs/028/028-4.jpg','/public/product-images/SKUs/028/028-5.jpg','/public/product-images/SKUs/028/028-6.jpg','/public/product-images/SKUs/028/028-7.jpg']::text[]),
  ('038', array['/public/product-images/SKUs/038/038-1.jpg','/public/product-images/SKUs/038/038-2.jpg','/public/product-images/SKUs/038/038-3.jpg','/public/product-images/SKUs/038/038-4.jpg','/public/product-images/SKUs/038/038-5.jpg','/public/product-images/SKUs/038/038-6.jpg','/public/product-images/SKUs/038/038-7.jpg','/public/product-images/SKUs/038/038-8.jpg','/public/product-images/SKUs/038/038-9.jpg','/public/product-images/SKUs/038/038-10.jpg','/public/product-images/SKUs/038/038-11.jpg','/public/product-images/SKUs/038/038-12.jpg','/public/product-images/SKUs/038/038-13.jpg','/public/product-images/SKUs/038/038-14.jpg','/public/product-images/SKUs/038/038-15.jpg','/public/product-images/SKUs/038/038-16.jpg']::text[]),
  ('046', array['/public/product-images/SKUs/046/046-01.jpg','/public/product-images/SKUs/046/046-1.jpg','/public/product-images/SKUs/046/046-02.jpg','/public/product-images/SKUs/046/046-2.jpg','/public/product-images/SKUs/046/046-03.jpg','/public/product-images/SKUs/046/046-3.jpg']::text[]),
  ('066', array['/public/product-images/SKUs/066/066-1.jpg','/public/product-images/SKUs/066/066-2.jpg','/public/product-images/SKUs/066/066-3.jpg','/public/product-images/SKUs/066/066-4.jpg','/public/product-images/SKUs/066/066-5.jpg','/public/product-images/SKUs/066/066-6.jpg','/public/product-images/SKUs/066/066-7.jpg']::text[]),
  ('072', array['/public/product-images/SKUs/072/072-1.jpg','/public/product-images/SKUs/072/072-2.jpg','/public/product-images/SKUs/072/072-3.jpg','/public/product-images/SKUs/072/072-4.jpg']::text[]),
  ('087', array['/public/product-images/SKUs/087/1.jpg','/public/product-images/SKUs/087/2.jpg']::text[]),
  ('090', array['/public/product-images/SKUs/090/090-1.jpg','/public/product-images/SKUs/090/090-2.jpg','/public/product-images/SKUs/090/090-3.jpg']::text[]),
  ('098', array['/public/product-images/SKUs/098/098-1.jpg','/public/product-images/SKUs/098/098-2.jpg','/public/product-images/SKUs/098/098-3.jpg','/public/product-images/SKUs/098/098-4.jpg','/public/product-images/SKUs/098/098-5.jpg']::text[]),
  ('106', array['/public/product-images/SKUs/106/106-1.jpg','/public/product-images/SKUs/106/106-2.jpg','/public/product-images/SKUs/106/106-3.jpg','/public/product-images/SKUs/106/106-4.jpg','/public/product-images/SKUs/106/106-5.jpg','/public/product-images/SKUs/106/106-6.jpg','/public/product-images/SKUs/106/106-7.jpg','/public/product-images/SKUs/106/106-8.jpg']::text[]),
  ('121', array['/public/product-images/SKUs/121/121-1.jpg','/public/product-images/SKUs/121/121-2.jpg','/public/product-images/SKUs/121/121-3.jpg','/public/product-images/SKUs/121/121-4.jpg']::text[]),
  ('125', array['/public/product-images/SKUs/125/125-1.jpg','/public/product-images/SKUs/125/125-2.jpg','/public/product-images/SKUs/125/125-3.jpg','/public/product-images/SKUs/125/125-4.jpg','/public/product-images/SKUs/125/125-5.jpg','/public/product-images/SKUs/125/125-6.jpg']::text[]),
  ('126', array['/public/product-images/SKUs/126/126-1.jpg','/public/product-images/SKUs/126/126-2.jpg','/public/product-images/SKUs/126/126-3.jpg','/public/product-images/SKUs/126/126-4.jpg','/public/product-images/SKUs/126/126-5.jpg']::text[]),
  ('128', array['/public/product-images/SKUs/128/01.jpg','/public/product-images/SKUs/128/02.jpg','/public/product-images/SKUs/128/03.jpg','/public/product-images/SKUs/128/04.jpg']::text[]),
  ('130', array['/public/product-images/SKUs/130/130-1.jpg','/public/product-images/SKUs/130/130-2.jpg','/public/product-images/SKUs/130/130-3.jpg','/public/product-images/SKUs/130/130-4.jpg','/public/product-images/SKUs/130/130-5.jpg']::text[]),
  ('131', array['/public/product-images/SKUs/131/131-1.jpg','/public/product-images/SKUs/131/131-2.jpg','/public/product-images/SKUs/131/131-3.jpg','/public/product-images/SKUs/131/131-4.jpg','/public/product-images/SKUs/131/131-5.jpg','/public/product-images/SKUs/131/131-6.jpg','/public/product-images/SKUs/131/131-7.jpg','/public/product-images/SKUs/131/131-8.jpg','/public/product-images/SKUs/131/131-9.jpg']::text[]),
  ('135', array['/public/product-images/SKUs/135/01.jpg','/public/product-images/SKUs/135/02.jpg','/public/product-images/SKUs/135/03.jpg']::text[]),
  ('165', array['/public/product-images/SKUs/165/01.jpg','/public/product-images/SKUs/165/02.jpg','/public/product-images/SKUs/165/03.jpg','/public/product-images/SKUs/165/04.jpg']::text[]),
  ('166', array['/public/product-images/SKUs/166/166-1.jpg','/public/product-images/SKUs/166/166-2.jpg','/public/product-images/SKUs/166/166-3.jpg','/public/product-images/SKUs/166/166-4.jpg','/public/product-images/SKUs/166/166-5.jpg','/public/product-images/SKUs/166/166-6.jpg','/public/product-images/SKUs/166/166-7.jpg']::text[]),
  ('2503', array['/public/product-images/SKUs/2503/2503-1.jpg','/public/product-images/SKUs/2503/2503-2.jpg','/public/product-images/SKUs/2503/2503-3.jpg','/public/product-images/SKUs/2503/2503-4.jpg','/public/product-images/SKUs/2503/2503-5.jpg','/public/product-images/SKUs/2503/2503-6.jpg','/public/product-images/SKUs/2503/2503-7.jpg','/public/product-images/SKUs/2503/2503-8.jpg']::text[])
)
insert into public.products (
  sku, model_code, product_type, name, slug, description, short_description, category, base_price, base_currency, image_names, published
)
select
  'IRUNSVAN-' || model_code,
  model_code,
  'shoe',
  'IRUNSVAN ' || model_code || ' Running Shoe',
  'irunsvan-' || lower(model_code) || '-running-shoe-irunsvan-' || lower(model_code),
  'Performance footwear from the Ivansrun Africa SKU image source.',
  'Performance footwear from the Ivansrun Africa SKU image source.',
  'Running Shoes',
  null,
  'USD',
  image_names,
  true
from source_images
where model_code not in (select model_code from public.products where model_code is not null)
on conflict (sku) do update set
  model_code = excluded.model_code,
  product_type = excluded.product_type,
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  short_description = excluded.short_description,
  category = excluded.category,
  image_names = excluded.image_names,
  published = true,
  updated_at = now();

with source_images(model_code, image_names) as (
  values
  ('005', array['/public/product-images/SKUs/005/005-1.jpg','/public/product-images/SKUs/005/005-2.jpg','/public/product-images/SKUs/005/005-3.jpg','/public/product-images/SKUs/005/005-4.jpg','/public/product-images/SKUs/005/005-5.jpg','/public/product-images/SKUs/005/005-6.jpg','/public/product-images/SKUs/005/005-7.jpg']::text[]),
  ('026', array['/public/product-images/SKUs/026/026-1.jpg','/public/product-images/SKUs/026/026-2.jpg','/public/product-images/SKUs/026/026-3.jpg','/public/product-images/SKUs/026/026-4.jpg','/public/product-images/SKUs/026/026-5.jpg']::text[]),
  ('028', array['/public/product-images/SKUs/028/028-1.jpg','/public/product-images/SKUs/028/028-2.jpg','/public/product-images/SKUs/028/028-3.jpg','/public/product-images/SKUs/028/028-4.jpg','/public/product-images/SKUs/028/028-5.jpg','/public/product-images/SKUs/028/028-6.jpg','/public/product-images/SKUs/028/028-7.jpg']::text[]),
  ('038', array['/public/product-images/SKUs/038/038-1.jpg','/public/product-images/SKUs/038/038-2.jpg','/public/product-images/SKUs/038/038-3.jpg','/public/product-images/SKUs/038/038-4.jpg','/public/product-images/SKUs/038/038-5.jpg','/public/product-images/SKUs/038/038-6.jpg','/public/product-images/SKUs/038/038-7.jpg','/public/product-images/SKUs/038/038-8.jpg','/public/product-images/SKUs/038/038-9.jpg','/public/product-images/SKUs/038/038-10.jpg','/public/product-images/SKUs/038/038-11.jpg','/public/product-images/SKUs/038/038-12.jpg','/public/product-images/SKUs/038/038-13.jpg','/public/product-images/SKUs/038/038-14.jpg','/public/product-images/SKUs/038/038-15.jpg','/public/product-images/SKUs/038/038-16.jpg']::text[]),
  ('046', array['/public/product-images/SKUs/046/046-01.jpg','/public/product-images/SKUs/046/046-1.jpg','/public/product-images/SKUs/046/046-02.jpg','/public/product-images/SKUs/046/046-2.jpg','/public/product-images/SKUs/046/046-03.jpg','/public/product-images/SKUs/046/046-3.jpg']::text[]),
  ('066', array['/public/product-images/SKUs/066/066-1.jpg','/public/product-images/SKUs/066/066-2.jpg','/public/product-images/SKUs/066/066-3.jpg','/public/product-images/SKUs/066/066-4.jpg','/public/product-images/SKUs/066/066-5.jpg','/public/product-images/SKUs/066/066-6.jpg','/public/product-images/SKUs/066/066-7.jpg']::text[]),
  ('072', array['/public/product-images/SKUs/072/072-1.jpg','/public/product-images/SKUs/072/072-2.jpg','/public/product-images/SKUs/072/072-3.jpg','/public/product-images/SKUs/072/072-4.jpg']::text[]),
  ('087', array['/public/product-images/SKUs/087/1.jpg','/public/product-images/SKUs/087/2.jpg']::text[]),
  ('090', array['/public/product-images/SKUs/090/090-1.jpg','/public/product-images/SKUs/090/090-2.jpg','/public/product-images/SKUs/090/090-3.jpg']::text[]),
  ('098', array['/public/product-images/SKUs/098/098-1.jpg','/public/product-images/SKUs/098/098-2.jpg','/public/product-images/SKUs/098/098-3.jpg','/public/product-images/SKUs/098/098-4.jpg','/public/product-images/SKUs/098/098-5.jpg']::text[]),
  ('106', array['/public/product-images/SKUs/106/106-1.jpg','/public/product-images/SKUs/106/106-2.jpg','/public/product-images/SKUs/106/106-3.jpg','/public/product-images/SKUs/106/106-4.jpg','/public/product-images/SKUs/106/106-5.jpg','/public/product-images/SKUs/106/106-6.jpg','/public/product-images/SKUs/106/106-7.jpg','/public/product-images/SKUs/106/106-8.jpg']::text[]),
  ('121', array['/public/product-images/SKUs/121/121-1.jpg','/public/product-images/SKUs/121/121-2.jpg','/public/product-images/SKUs/121/121-3.jpg','/public/product-images/SKUs/121/121-4.jpg']::text[]),
  ('125', array['/public/product-images/SKUs/125/125-1.jpg','/public/product-images/SKUs/125/125-2.jpg','/public/product-images/SKUs/125/125-3.jpg','/public/product-images/SKUs/125/125-4.jpg','/public/product-images/SKUs/125/125-5.jpg','/public/product-images/SKUs/125/125-6.jpg']::text[]),
  ('126', array['/public/product-images/SKUs/126/126-1.jpg','/public/product-images/SKUs/126/126-2.jpg','/public/product-images/SKUs/126/126-3.jpg','/public/product-images/SKUs/126/126-4.jpg','/public/product-images/SKUs/126/126-5.jpg']::text[]),
  ('128', array['/public/product-images/SKUs/128/01.jpg','/public/product-images/SKUs/128/02.jpg','/public/product-images/SKUs/128/03.jpg','/public/product-images/SKUs/128/04.jpg']::text[]),
  ('130', array['/public/product-images/SKUs/130/130-1.jpg','/public/product-images/SKUs/130/130-2.jpg','/public/product-images/SKUs/130/130-3.jpg','/public/product-images/SKUs/130/130-4.jpg','/public/product-images/SKUs/130/130-5.jpg']::text[]),
  ('131', array['/public/product-images/SKUs/131/131-1.jpg','/public/product-images/SKUs/131/131-2.jpg','/public/product-images/SKUs/131/131-3.jpg','/public/product-images/SKUs/131/131-4.jpg','/public/product-images/SKUs/131/131-5.jpg','/public/product-images/SKUs/131/131-6.jpg','/public/product-images/SKUs/131/131-7.jpg','/public/product-images/SKUs/131/131-8.jpg','/public/product-images/SKUs/131/131-9.jpg']::text[]),
  ('135', array['/public/product-images/SKUs/135/01.jpg','/public/product-images/SKUs/135/02.jpg','/public/product-images/SKUs/135/03.jpg']::text[]),
  ('165', array['/public/product-images/SKUs/165/01.jpg','/public/product-images/SKUs/165/02.jpg','/public/product-images/SKUs/165/03.jpg','/public/product-images/SKUs/165/04.jpg']::text[]),
  ('166', array['/public/product-images/SKUs/166/166-1.jpg','/public/product-images/SKUs/166/166-2.jpg','/public/product-images/SKUs/166/166-3.jpg','/public/product-images/SKUs/166/166-4.jpg','/public/product-images/SKUs/166/166-5.jpg','/public/product-images/SKUs/166/166-6.jpg','/public/product-images/SKUs/166/166-7.jpg']::text[]),
  ('2503', array['/public/product-images/SKUs/2503/2503-1.jpg','/public/product-images/SKUs/2503/2503-2.jpg','/public/product-images/SKUs/2503/2503-3.jpg','/public/product-images/SKUs/2503/2503-4.jpg','/public/product-images/SKUs/2503/2503-5.jpg','/public/product-images/SKUs/2503/2503-6.jpg','/public/product-images/SKUs/2503/2503-7.jpg','/public/product-images/SKUs/2503/2503-8.jpg']::text[])
),
product_updates as (
  update public.products p
  set image_names = coalesce(si.image_names, p.image_names),
      published = si.model_code is not null,
      updated_at = now()
  from (select p2.id, p2.model_code from public.products p2) existing
  left join source_images si on si.model_code = existing.model_code
  where p.id = existing.id
  returning p.id, p.model_code, p.published
), mapping_rank as (
  select pcm.id, pcm.product_id, p.model_code, si.image_names, pcm.color_code,
    row_number() over (partition by pcm.product_id order by pcm.original_colour, coalesce(pcm.color_code, '')) as fallback_index
  from public.product_colour_mappings pcm
  join public.products p on p.id = pcm.product_id
  left join source_images si on si.model_code = p.model_code
), mapping_updates as (
  update public.product_colour_mappings pcm
  set published = mr.image_names is not null,
      image_name = case
        when mr.image_names is null then pcm.image_name
        when nullif(regexp_replace(coalesce(mr.color_code, ''), '\D', '', 'g'), '') is not null
          and mr.image_names[nullif(regexp_replace(coalesce(mr.color_code, ''), '\D', '', 'g'), '')::int] is not null
          then mr.image_names[nullif(regexp_replace(coalesce(mr.color_code, ''), '\D', '', 'g'), '')::int]
        else mr.image_names[((mr.fallback_index - 1) % array_length(mr.image_names, 1)) + 1]
      end,
      updated_at = now()
  from mapping_rank mr
  where pcm.id = mr.id
  returning pcm.id, pcm.product_id, pcm.original_colour, pcm.color_code, pcm.image_name, pcm.published
), variant_mapping as (
  select v.id, p.model_code, coalesce(pcm.image_name, si.image_names[1], v.image_name) as image_name
  from public.product_variants v
  join public.products p on p.id = v.product_id
  left join source_images si on si.model_code = p.model_code
  left join public.product_colour_mappings pcm
    on pcm.product_id = p.id
    and pcm.original_colour = coalesce(v.original_colour, v.colour)
    and coalesce(pcm.color_code, '') = coalesce(v.color_code, '')
), variant_updates as (
  update public.product_variants v
  set published = vm.model_code in ('005', '026', '028', '038', '046', '066', '072', '087', '090', '098', '106', '121', '125', '126', '128', '130', '131', '135', '165', '166', '2503'),
      image_name = vm.image_name,
      updated_at = now()
  from variant_mapping vm
  where v.id = vm.id
  returning v.id, v.product_id, v.sku, v.image_name, v.published
)
select
  (select count(*) from source_images) as source_models,
  (select count(*) from public.products where published = true) as published_products,
  (select count(*) from public.products where published = false) as unpublished_products,
  (select count(*) from public.product_variants where published = true) as published_variants,
  (select count(*) from public.product_variants where published = false) as unpublished_variants,
  (select count(*) from mapping_updates where published = true) as published_colour_mappings;
