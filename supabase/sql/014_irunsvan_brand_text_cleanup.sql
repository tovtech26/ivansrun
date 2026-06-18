update public.products
set
  description = replace(description, concat('Ivan', 'srun Africa'), 'Irunsvan Africa'),
  short_description = replace(short_description, concat('Ivan', 'srun Africa'), 'Irunsvan Africa')
where description like '%' || concat('Ivan', 'srun Africa') || '%'
  or short_description like '%' || concat('Ivan', 'srun Africa') || '%';

update public.hero_sections
set
  eyebrow = replace(eyebrow, concat('Ivan', 'srun Africa'), 'Irunsvan Africa'),
  copy = replace(copy, concat('Ivan', 'srun Africa'), 'Irunsvan Africa')
where eyebrow like '%' || concat('Ivan', 'srun Africa') || '%'
  or copy like '%' || concat('Ivan', 'srun Africa') || '%';

update public.site_content
set reseller_banner = replace(reseller_banner, concat('Ivan', 'srun Africa'), 'Irunsvan Africa')
where reseller_banner like '%' || concat('Ivan', 'srun Africa') || '%';
