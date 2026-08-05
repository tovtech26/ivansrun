-- Transactional admin writes, protected price feeds, safer RPC wrappers, and client diagnostics.

create or replace function private.publish_site_controls(
  p_hero jsonb,
  p_theme jsonb,
  p_content jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_hero public.hero_sections%rowtype;
  v_theme public.site_themes%rowtype;
  v_content public.site_content%rowtype;
begin
  if v_user_id is null or not exists (
    select 1 from public.profiles where id = v_user_id and role = 'admin'::public.user_role
  ) then raise exception 'Admin access is required to publish site controls.'; end if;

  update public.hero_sections set active = false where active = true;
  update public.site_themes set active = false where active = true;
  update public.site_content set active = false where active = true;

  insert into public.hero_sections (
    eyebrow, title, copy, background_image, primary_cta, primary_route,
    secondary_cta, secondary_route, electricity, active, created_by
  ) values (
    coalesce(nullif(btrim(p_hero->>'eyebrow'), ''), 'Irunsvan Africa'),
    btrim(p_hero->>'title'), btrim(p_hero->>'copy'),
    coalesce(nullif(btrim(p_hero->>'background_image'), ''), '/Flyer Templates/Flyer Template.jpg'),
    coalesce(nullif(btrim(p_hero->>'primary_cta'), ''), 'View Catalog'),
    coalesce(nullif(btrim(p_hero->>'primary_route'), ''), 'catalog'),
    coalesce(nullif(btrim(p_hero->>'secondary_cta'), ''), 'Reseller Access'),
    coalesce(nullif(btrim(p_hero->>'secondary_route'), ''), 'apply'),
    coalesce((p_hero->>'electricity')::boolean, true), true, v_user_id
  ) returning * into v_hero;

  insert into public.site_themes (
    name, primary_color, primary_dark_color, background_color, surface_color,
    accent_color, text_color, deep_color, active, created_by
  ) values (
    coalesce(nullif(btrim(p_theme->>'name'), ''), 'Irunsvan Africa'),
    coalesce(nullif(btrim(p_theme->>'primary_color'), ''), '#0070ea'),
    coalesce(nullif(btrim(p_theme->>'primary_dark_color'), ''), '#0059bb'),
    coalesce(nullif(btrim(p_theme->>'background_color'), ''), '#f6f6f4'),
    coalesce(nullif(btrim(p_theme->>'surface_color'), ''), '#ece9e3'),
    coalesce(nullif(btrim(p_theme->>'accent_color'), ''), '#7ddfff'),
    coalesce(nullif(btrim(p_theme->>'text_color'), ''), '#171717'),
    coalesce(nullif(btrim(p_theme->>'deep_color'), ''), '#001a41'),
    true, v_user_id
  ) returning * into v_theme;

  insert into public.site_content (about_heading, about_body, reseller_banner, active, created_by)
  values (
    coalesce(nullif(btrim(p_content->>'about_heading'), ''), 'About Irunsvan Africa'),
    coalesce(nullif(btrim(p_content->>'about_body'), ''), 'Irunsvan Africa supplies performance footwear through approved reseller channels across Africa.'),
    coalesce(nullif(btrim(p_content->>'reseller_banner'), ''), 'Approved reseller accounts can view live stock and submit order requests.'),
    true, v_user_id
  ) returning * into v_content;

  return jsonb_build_object('hero', to_jsonb(v_hero), 'theme', to_jsonb(v_theme), 'content', to_jsonb(v_content));
end;
$$;

create or replace function public.publish_site_controls(p_hero jsonb, p_theme jsonb, p_content jsonb)
returns jsonb language sql security invoker set search_path = ''
as $$ select private.publish_site_controls(p_hero, p_theme, p_content); $$;

create or replace function private.save_product_catalog(
  p_product jsonb,
  p_variants jsonb,
  p_mappings jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_product public.products%rowtype;
  v_variants jsonb;
  v_mappings jsonb;
begin
  if v_user_id is null or not exists (
    select 1 from public.profiles where id = v_user_id and role = 'admin'::public.user_role
  ) then raise exception 'Admin access is required to save products.'; end if;
  if nullif(btrim(p_product->>'sku'), '') is null or nullif(btrim(p_product->>'name'), '') is null then
    raise exception 'Product SKU and name are required.';
  end if;
  if coalesce(jsonb_typeof(p_variants), 'null') <> 'array' or jsonb_array_length(p_variants) = 0 then
    raise exception 'At least one generated product variant is required.';
  end if;

  insert into public.products (
    sku, model_code, product_type, name, slug, description, short_description,
    category, base_price, base_currency, image_names, published
  ) values (
    btrim(p_product->>'sku'), nullif(btrim(p_product->>'model_code'), ''),
    coalesce(nullif(btrim(p_product->>'product_type'), ''), 'shoe'), btrim(p_product->>'name'),
    btrim(p_product->>'slug'), nullif(btrim(p_product->>'description'), ''),
    nullif(btrim(p_product->>'short_description'), ''), nullif(btrim(p_product->>'category'), ''),
    nullif(p_product->>'base_price', '')::numeric, coalesce(nullif(btrim(p_product->>'base_currency'), ''), 'USD'),
    array(select jsonb_array_elements_text(coalesce(p_product->'image_names', '[]'::jsonb))),
    coalesce((p_product->>'published')::boolean, true)
  )
  on conflict (sku) do update set
    model_code = excluded.model_code, product_type = excluded.product_type, name = excluded.name,
    slug = excluded.slug, description = excluded.description, short_description = excluded.short_description,
    category = excluded.category, base_price = excluded.base_price, base_currency = excluded.base_currency,
    image_names = excluded.image_names, published = excluded.published, updated_at = now()
  returning * into v_product;

  insert into public.product_variants (
    product_id, sku, name, colour, original_colour, color_code, size,
    base_price, base_currency, image_name, published
  )
  select
    v_product.id, btrim(row.sku), btrim(row.name), nullif(btrim(row.colour), ''),
    nullif(btrim(row.original_colour), ''), nullif(btrim(row.color_code), ''),
    nullif(btrim(row.size), ''), row.base_price,
    coalesce(nullif(btrim(row.base_currency), ''), 'USD'), nullif(btrim(row.image_name), ''),
    coalesce(row.published, true)
  from jsonb_to_recordset(p_variants) as row(
    sku text, name text, colour text, original_colour text, color_code text, size text,
    base_price numeric, base_currency text, image_name text, published boolean
  )
  where nullif(btrim(row.sku), '') is not null
  on conflict (sku) do update set
    product_id = excluded.product_id, name = excluded.name, colour = excluded.colour,
    original_colour = excluded.original_colour, color_code = excluded.color_code, size = excluded.size,
    base_price = excluded.base_price, base_currency = excluded.base_currency,
    image_name = excluded.image_name, published = excluded.published, updated_at = now();

  if coalesce(jsonb_typeof(p_mappings), 'null') = 'array' then
    insert into public.product_colour_mappings (
      product_id, model_code, original_colour, colour, color_code, image_name, published
    )
    select
      v_product.id, coalesce(nullif(btrim(row.model_code), ''), v_product.model_code),
      btrim(row.original_colour), btrim(row.colour), nullif(btrim(row.color_code), ''),
      nullif(btrim(row.image_name), ''), coalesce(row.published, true)
    from jsonb_to_recordset(p_mappings) as row(
      model_code text, original_colour text, colour text, color_code text, image_name text, published boolean
    )
    where nullif(btrim(row.original_colour), '') is not null and nullif(btrim(row.colour), '') is not null
    on conflict (product_id, original_colour, color_code) do update set
      model_code = excluded.model_code, colour = excluded.colour, image_name = excluded.image_name,
      published = excluded.published, updated_at = now();
  end if;

  insert into public.inventory (variant_id, sku, style_code, stock_quantity, source)
  select variants.id, variants.sku, v_product.sku, 0, 'manual_product_setup'
  from public.product_variants variants where variants.product_id = v_product.id
  on conflict (sku) do nothing;

  select coalesce(jsonb_agg(to_jsonb(variants) order by variants.sku), '[]'::jsonb)
  into v_variants from public.product_variants variants where variants.product_id = v_product.id;
  select coalesce(jsonb_agg(to_jsonb(mappings) order by mappings.original_colour, mappings.color_code), '[]'::jsonb)
  into v_mappings from public.product_colour_mappings mappings where mappings.product_id = v_product.id;
  return jsonb_build_object('product', to_jsonb(v_product), 'variants', v_variants, 'mappings', v_mappings);
end;
$$;

create or replace function public.save_product_catalog(p_product jsonb, p_variants jsonb, p_mappings jsonb default '[]'::jsonb)
returns jsonb language sql security invoker set search_path = ''
as $$ select private.save_product_catalog(p_product, p_variants, p_mappings); $$;

-- Replace security-definer views with explicit, role-checked private functions and invoker wrappers.
drop view if exists public.authorized_product_prices;
drop view if exists public.authorized_variant_prices;

create or replace function private.get_authorized_product_prices()
returns table (id uuid, base_price numeric, base_currency text)
language sql stable security definer set search_path = ''
as $$
  select products.id, products.base_price, products.base_currency
  from public.products products
  where exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role in ('admin'::public.user_role, 'reseller'::public.user_role)
  ) and (products.published = true or (select private.is_admin()));
$$;

create or replace function private.get_authorized_variant_prices()
returns table (id uuid, base_price numeric, base_currency text)
language sql stable security definer set search_path = ''
as $$
  select variants.id, variants.base_price, variants.base_currency
  from public.product_variants variants
  join public.products products on products.id = variants.product_id
  where exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role in ('admin'::public.user_role, 'reseller'::public.user_role)
  ) and ((products.published = true and variants.published = true) or (select private.is_admin()));
$$;

create or replace function public.get_authorized_product_prices()
returns table (id uuid, base_price numeric, base_currency text)
language sql stable security invoker set search_path = ''
as $$ select * from private.get_authorized_product_prices(); $$;

create or replace function public.get_authorized_variant_prices()
returns table (id uuid, base_price numeric, base_currency text)
language sql stable security invoker set search_path = ''
as $$ select * from private.get_authorized_variant_prices(); $$;

-- Move public SECURITY DEFINER account/invite endpoints behind invoker wrappers.
drop function if exists public.update_own_profile(text,text,text);
create or replace function private.update_own_profile(p_full_name text, p_company_name text, p_phone text)
returns public.profiles language plpgsql security definer set search_path = ''
as $$
declare v_profile public.profiles;
begin
  if (select auth.uid()) is null then raise exception 'Sign in to update your profile.'; end if;
  update public.profiles set
    full_name = nullif(btrim(p_full_name), ''), company_name = nullif(btrim(p_company_name), ''),
    phone = nullif(btrim(p_phone), ''), updated_at = now()
  where id = (select auth.uid()) returning * into v_profile;
  if not found then raise exception 'Profile not found for the signed-in user.'; end if;
  update public.reseller_directory_entries set
    company_name = coalesce(nullif(btrim(p_company_name), ''), company_name),
    phone = nullif(btrim(p_phone), ''), full_name = nullif(btrim(p_full_name), ''), updated_at = now()
  where user_id = (select auth.uid());
  return v_profile;
end;
$$;
create or replace function public.update_own_profile(p_full_name text, p_company_name text, p_phone text)
returns public.profiles language sql security invoker set search_path = ''
as $$ select private.update_own_profile(p_full_name,p_company_name,p_phone); $$;

drop function if exists public.lookup_admin_invite(text);
create or replace function private.lookup_admin_invite(p_token text)
returns table (email text, note text, status public.admin_invite_status, created_at timestamptz, expires_at timestamptz, used_at timestamptz, revoked_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select invites.email, invites.note,
    case when invites.status = 'pending'::public.admin_invite_status and invites.expires_at < now()
      then 'expired'::public.admin_invite_status else invites.status end,
    invites.created_at, invites.expires_at, invites.used_at, invites.revoked_at
  from public.admin_invites invites
  where invites.token_hash = private.admin_invite_token_hash(p_token) limit 1;
$$;
create or replace function public.lookup_admin_invite(p_token text)
returns table (email text, note text, status public.admin_invite_status, created_at timestamptz, expires_at timestamptz, used_at timestamptz, revoked_at timestamptz)
language sql stable security invoker set search_path = ''
as $$ select * from private.lookup_admin_invite(p_token); $$;

drop function if exists public.claim_admin_invite(text);
create or replace function private.claim_admin_invite(p_token text)
returns public.admin_invites language plpgsql security definer set search_path = ''
as $$
declare v_invite public.admin_invites; v_email text;
begin
  if (select auth.uid()) is null then raise exception 'Sign in with Google to continue.'; end if;
  select email into v_email from auth.users where id = (select auth.uid());
  if v_email is null then raise exception 'Unable to verify the signed-in account.'; end if;
  select * into v_invite from public.admin_invites
  where token_hash = private.admin_invite_token_hash(p_token) for update;
  if not found then raise exception 'This admin invite link is invalid or has already been used.'; end if;
  if v_invite.status <> 'pending'::public.admin_invite_status then raise exception 'This admin invite is no longer active.'; end if;
  if v_invite.expires_at < now() then
    update public.admin_invites set status = 'expired'::public.admin_invite_status where id = v_invite.id;
    raise exception 'This admin invite link has expired.';
  end if;
  if lower(btrim(v_invite.email)) <> lower(btrim(v_email)) then raise exception 'This invite was sent to a different email address.'; end if;
  insert into public.profiles (id,email,role,updated_at)
  values ((select auth.uid()),v_email,'admin'::public.user_role,now())
  on conflict (id) do update set email=excluded.email,role=excluded.role,updated_at=now();
  update public.admin_invites set status='used'::public.admin_invite_status,claimed_by=(select auth.uid()),used_at=now()
  where id=v_invite.id returning * into v_invite;
  return v_invite;
end;
$$;
create or replace function public.claim_admin_invite(p_token text)
returns public.admin_invites language sql security invoker set search_path = ''
as $$ select private.claim_admin_invite(p_token); $$;

create table if not exists public.client_error_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  route text,
  message text not null,
  source text,
  line_number integer,
  column_number integer,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists client_error_events_user_id_idx on public.client_error_events (user_id, created_at desc);
create index if not exists client_error_events_created_at_idx on public.client_error_events (created_at desc);
alter table public.client_error_events enable row level security;
revoke all on table public.client_error_events from public, anon, authenticated;
grant select on table public.client_error_events to authenticated;
create policy "Admins can read client error events" on public.client_error_events
for select to authenticated using ((select private.is_admin()));

create or replace function private.report_client_error(p_route text, p_message text, p_source text default null, p_line integer default null, p_column integer default null, p_user_agent text default null)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null or nullif(btrim(coalesce(p_message,'')),'') is null then return; end if;
  insert into public.client_error_events(user_id,route,message,source,line_number,column_number,user_agent)
  values ((select auth.uid()),left(p_route,120),left(p_message,1000),left(p_source,300),p_line,p_column,left(p_user_agent,500));
end;
$$;
create or replace function public.report_client_error(p_route text, p_message text, p_source text default null, p_line integer default null, p_column integer default null, p_user_agent text default null)
returns void language sql security invoker set search_path = ''
as $$ select private.report_client_error(p_route,p_message,p_source,p_line,p_column,p_user_agent); $$;

create index if not exists admin_invites_claimed_by_idx on public.admin_invites (claimed_by);
create index if not exists admin_invites_created_by_idx on public.admin_invites (created_by);
create index if not exists blog_posts_created_by_idx on public.blog_posts (created_by);
create index if not exists hero_sections_created_by_idx on public.hero_sections (created_by);
create index if not exists homepage_flyers_created_by_idx on public.homepage_flyers (created_by);
create index if not exists inventory_adjustments_changed_by_idx on public.inventory_adjustments (changed_by);
create index if not exists public_product_flyers_created_by_idx on public.public_product_flyers (created_by);
create index if not exists public_product_flyers_updated_by_idx on public.public_product_flyers (updated_by);
create index if not exists site_content_created_by_idx on public.site_content (created_by);
create index if not exists site_themes_created_by_idx on public.site_themes (created_by);

revoke all on function private.publish_site_controls(jsonb,jsonb,jsonb) from public,anon,authenticated,service_role;
revoke all on function private.save_product_catalog(jsonb,jsonb,jsonb) from public,anon,authenticated,service_role;
revoke all on function private.get_authorized_product_prices() from public,anon,authenticated,service_role;
revoke all on function private.get_authorized_variant_prices() from public,anon,authenticated,service_role;
revoke all on function private.update_own_profile(text,text,text) from public,anon,authenticated,service_role;
revoke all on function private.lookup_admin_invite(text) from public,anon,authenticated,service_role;
revoke all on function private.claim_admin_invite(text) from public,anon,authenticated,service_role;
revoke all on function private.report_client_error(text,text,text,integer,integer,text) from public,anon,authenticated,service_role;
grant execute on function private.publish_site_controls(jsonb,jsonb,jsonb) to authenticated;
grant execute on function private.save_product_catalog(jsonb,jsonb,jsonb) to authenticated;
grant execute on function private.get_authorized_product_prices() to authenticated;
grant execute on function private.get_authorized_variant_prices() to authenticated;
grant execute on function private.update_own_profile(text,text,text) to authenticated;
grant execute on function private.lookup_admin_invite(text) to anon,authenticated;
grant execute on function private.claim_admin_invite(text) to authenticated;
grant execute on function private.report_client_error(text,text,text,integer,integer,text) to authenticated;
grant usage on schema private to anon, authenticated;

revoke all on function public.publish_site_controls(jsonb,jsonb,jsonb) from public,anon,authenticated,service_role;
revoke all on function public.save_product_catalog(jsonb,jsonb,jsonb) from public,anon,authenticated,service_role;
revoke all on function public.get_authorized_product_prices() from public,anon,authenticated,service_role;
revoke all on function public.get_authorized_variant_prices() from public,anon,authenticated,service_role;
revoke all on function public.update_own_profile(text,text,text) from public,anon,authenticated,service_role;
revoke all on function public.lookup_admin_invite(text) from public,anon,authenticated,service_role;
revoke all on function public.claim_admin_invite(text) from public,anon,authenticated,service_role;
revoke all on function public.report_client_error(text,text,text,integer,integer,text) from public,anon,authenticated,service_role;
grant execute on function public.publish_site_controls(jsonb,jsonb,jsonb) to authenticated;
grant execute on function public.save_product_catalog(jsonb,jsonb,jsonb) to authenticated;
grant execute on function public.get_authorized_product_prices() to authenticated;
grant execute on function public.get_authorized_variant_prices() to authenticated;
grant execute on function public.update_own_profile(text,text,text) to authenticated;
grant execute on function public.lookup_admin_invite(text) to anon,authenticated;
grant execute on function public.claim_admin_invite(text) to authenticated;
grant execute on function public.report_client_error(text,text,text,integer,integer,text) to authenticated;

notify pgrst, 'reload schema';
