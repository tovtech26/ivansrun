update public.products
set
  description = replace(description, 'Ivansrun Africa', 'Irunsvan Africa'),
  short_description = replace(short_description, 'Ivansrun Africa', 'Irunsvan Africa')
where description like '%Ivansrun Africa%'
  or short_description like '%Ivansrun Africa%';

update public.hero_sections
set
  eyebrow = replace(eyebrow, 'Ivansrun Africa', 'Irunsvan Africa'),
  copy = replace(copy, 'Ivansrun Africa', 'Irunsvan Africa')
where eyebrow like '%Ivansrun Africa%'
  or copy like '%Ivansrun Africa%';

update public.site_content
set reseller_banner = replace(reseller_banner, 'Ivansrun Africa', 'Irunsvan Africa')
where reseller_banner like '%Ivansrun Africa%';
