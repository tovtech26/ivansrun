-- Keep public content readable while avoiding overlapping permissive SELECT policies.
-- Admin writes remain role-checked and are split by command so they do not also
-- create a second authenticated SELECT path.

drop policy if exists "Public can read active hero sections" on public.hero_sections;
drop policy if exists "Admins can manage hero sections" on public.hero_sections;
create policy "Anonymous can read active hero sections" on public.hero_sections for select to anon using (active = true);
create policy "Authenticated can read hero sections" on public.hero_sections for select to authenticated using (active = true or (select private.is_admin()));
create policy "Admins can insert hero sections" on public.hero_sections for insert to authenticated with check ((select private.is_admin()));
create policy "Admins can update hero sections" on public.hero_sections for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins can delete hero sections" on public.hero_sections for delete to authenticated using ((select private.is_admin()));

drop policy if exists "Public can read active site themes" on public.site_themes;
drop policy if exists "Admins can manage site themes" on public.site_themes;
create policy "Anonymous can read active site themes" on public.site_themes for select to anon
using (active = true and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now()));
create policy "Authenticated can read site themes" on public.site_themes for select to authenticated
using ((active = true and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now())) or (select private.is_admin()));
create policy "Admins can insert site themes" on public.site_themes for insert to authenticated with check ((select private.is_admin()));
create policy "Admins can update site themes" on public.site_themes for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins can delete site themes" on public.site_themes for delete to authenticated using ((select private.is_admin()));

drop policy if exists "Public can read active site content" on public.site_content;
drop policy if exists "Admins can manage site content" on public.site_content;
create policy "Anonymous can read active site content" on public.site_content for select to anon using (active = true);
create policy "Authenticated can read site content" on public.site_content for select to authenticated using (active = true or (select private.is_admin()));
create policy "Admins can insert site content" on public.site_content for insert to authenticated with check ((select private.is_admin()));
create policy "Admins can update site content" on public.site_content for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins can delete site content" on public.site_content for delete to authenticated using ((select private.is_admin()));

drop policy if exists "Public can read published colour mappings" on public.product_colour_mappings;
drop policy if exists "Admins can manage colour mappings" on public.product_colour_mappings;
create policy "Anonymous can read published colour mappings" on public.product_colour_mappings for select to anon using (published = true);
create policy "Authenticated can read colour mappings" on public.product_colour_mappings for select to authenticated using (published = true or (select private.is_admin()));
create policy "Admins can insert colour mappings" on public.product_colour_mappings for insert to authenticated with check ((select private.is_admin()));
create policy "Admins can update colour mappings" on public.product_colour_mappings for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins can delete colour mappings" on public.product_colour_mappings for delete to authenticated using ((select private.is_admin()));

drop policy if exists "Public can read published homepage flyers" on public.homepage_flyers;
drop policy if exists "Admins can manage homepage flyers" on public.homepage_flyers;
create policy "Anonymous can read published homepage flyers" on public.homepage_flyers for select to anon using (published = true);
create policy "Authenticated can read homepage flyers" on public.homepage_flyers for select to authenticated using (published = true or (select private.is_admin()));
create policy "Admins can insert homepage flyers" on public.homepage_flyers for insert to authenticated with check ((select private.is_admin()));
create policy "Admins can update homepage flyers" on public.homepage_flyers for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins can delete homepage flyers" on public.homepage_flyers for delete to authenticated using ((select private.is_admin()));

drop policy if exists "Public can read published blog posts" on public.blog_posts;
drop policy if exists "Admins can manage blog posts" on public.blog_posts;
create policy "Anonymous can read published blog posts" on public.blog_posts for select to anon using (published = true);
create policy "Authenticated can read blog posts" on public.blog_posts for select to authenticated using (published = true or (select private.is_admin()));
create policy "Admins can insert blog posts" on public.blog_posts for insert to authenticated with check ((select private.is_admin()));
create policy "Admins can update blog posts" on public.blog_posts for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins can delete blog posts" on public.blog_posts for delete to authenticated using ((select private.is_admin()));

drop policy if exists "Public can read published product flyers" on public.public_product_flyers;
drop policy if exists "Admins can manage product flyers" on public.public_product_flyers;
create policy "Anonymous can read published product flyers" on public.public_product_flyers for select to anon using (published = true);
create policy "Authenticated can read product flyers" on public.public_product_flyers for select to authenticated using (published = true or (select private.is_admin()));
create policy "Admins can insert product flyers" on public.public_product_flyers for insert to authenticated with check ((select private.is_admin()));
create policy "Admins can update product flyers" on public.public_product_flyers for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins can delete product flyers" on public.public_product_flyers for delete to authenticated using ((select private.is_admin()));

notify pgrst, 'reload schema';
