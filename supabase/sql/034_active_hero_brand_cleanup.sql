-- Correct the legacy brand typo now that the active hero drives the public homepage.
update public.hero_sections
set eyebrow = replace(eyebrow, 'Irunsvan africa', 'Irunsvan Africa'),
    copy = replace(copy, 'Ivansrun Africa', 'Irunsvan Africa'),
    updated_at = now()
where eyebrow like '%Irunsvan africa%'
   or copy like '%Ivansrun Africa%';

notify pgrst, 'reload schema';
