create or replace function public.update_own_profile(
  p_full_name text default null,
  p_company_name text default null,
  p_phone text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated_row public.profiles;
begin
  update public.profiles
  set
    full_name = nullif(btrim(p_full_name), ''),
    company_name = nullif(btrim(p_company_name), ''),
    phone = nullif(btrim(p_phone), ''),
    updated_at = now()
  where id = (select auth.uid())
  returning * into updated_row;

  if updated_row.id is null then
    raise exception 'Profile not found for the signed-in user.';
  end if;

  return updated_row;
end;
$$;

revoke all on function public.update_own_profile(text, text, text) from public, anon;
grant execute on function public.update_own_profile(text, text, text) to authenticated;

create or replace view public.reseller_directory
with (security_invoker = true)
as
select distinct on (applications.user_id)
  applications.user_id as id,
  applications.company_name,
  coalesce(nullif(applications.country, ''), 'Region not published') as country,
  nullif(applications.phone, '') as phone,
  applications.email,
  applications.full_name
from public.reseller_applications applications
join public.profiles profiles on profiles.id = applications.user_id
where applications.status = 'approved'::public.application_status
  and profiles.role = 'reseller'::public.user_role
  and nullif(applications.company_name, '') is not null
order by applications.user_id, applications.created_at desc;

revoke all on public.reseller_directory from public, anon, authenticated;
grant select on public.reseller_directory to anon, authenticated;
