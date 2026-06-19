-- Keep SKU-level variant images aligned to the curated colour image source.
-- The reseller product cards render variant images, so stale importer filenames
-- such as 128-1.jpg can break when the actual product images use 01.jpg paths.
with variant_mapping as (
  select
    v.id,
    pcm.image_name
  from public.product_variants v
  join public.products p on p.id = v.product_id
  join public.product_colour_mappings pcm
    on pcm.product_id = p.id
   and pcm.original_colour = coalesce(v.original_colour, v.colour)
   and coalesce(pcm.color_code, '') = coalesce(v.color_code, '')
  where pcm.image_name is not null
    and coalesce(v.image_name, '') <> pcm.image_name
)
update public.product_variants v
set image_name = vm.image_name,
    updated_at = now()
from variant_mapping vm
where v.id = vm.id;
