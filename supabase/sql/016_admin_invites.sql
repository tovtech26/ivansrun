do $$
begin
  create type public.admin_invite_status as enum ('pending', 'used', 'revoked', 'expired');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.admin_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token_hash text not null unique,
  note text,
  status public.admin_invite_status not null default 'pending',
  created_by uuid references auth.users(id) on delete set null,
  claimed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days'),
  used_at timestamptz,
  revoked_at timestamptz
);

create index if not exists admin_invites_email_idx on public.admin_invites (email);
create index if not exists admin_invites_status_idx on public.admin_invites (status);
create index if not exists admin_invites_created_at_idx on public.admin_invites (created_at desc);

alter table public.admin_invites enable row level security;

drop policy if exists "admin_invites_admin_all" on public.admin_invites;
create policy "admin_invites_admin_all"
on public.admin_invites
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create or replace function private.admin_invite_token_hash(p_token text)
returns text
language sql
immutable
set search_path = ''
as $$
  select encode(digest(lower(btrim(coalesce(p_token, ''))), 'sha256'), 'hex');
$$;

create or replace function public.lookup_admin_invite(p_token text)
returns table (
  email text,
  note text,
  status public.admin_invite_status,
  created_at timestamptz,
  expires_at timestamptz,
  used_at timestamptz,
  revoked_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    admin_invites.email,
    admin_invites.note,
    case
      when admin_invites.status = 'pending'::public.admin_invite_status and admin_invites.expires_at < now()
        then 'expired'::public.admin_invite_status
      else admin_invites.status
    end as status,
    admin_invites.created_at,
    admin_invites.expires_at,
    admin_invites.used_at,
    admin_invites.revoked_at
  from public.admin_invites
  where admin_invites.token_hash = private.admin_invite_token_hash(p_token)
  limit 1;
$$;

revoke all on function public.lookup_admin_invite(text) from public;
grant execute on function public.lookup_admin_invite(text) to anon, authenticated;

create or replace function public.claim_admin_invite(p_token text)
returns public.admin_invites
language plpgsql
security definer
set search_path = ''
as $$
declare
  invite_row public.admin_invites;
  user_email text;
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in with Google to continue.';
  end if;

  select email
  into user_email
  from auth.users
  where id = (select auth.uid());

  if user_email is null then
    raise exception 'Unable to verify the signed-in account.';
  end if;

  select *
  into invite_row
  from public.admin_invites
  where token_hash = private.admin_invite_token_hash(p_token)
  for update;

  if invite_row.id is null then
    raise exception 'This admin invite link is invalid or has already been used.';
  end if;

  if invite_row.status = 'revoked'::public.admin_invite_status then
    raise exception 'This admin invite link has been revoked.';
  end if;

  if invite_row.status = 'used'::public.admin_invite_status then
    raise exception 'This admin invite link has already been used.';
  end if;

  if invite_row.expires_at < now() then
    update public.admin_invites
    set status = 'expired'::public.admin_invite_status
    where id = invite_row.id
      and status = 'pending'::public.admin_invite_status;
    raise exception 'This admin invite link has expired.';
  end if;

  if lower(btrim(invite_row.email)) <> lower(btrim(user_email)) then
    raise exception 'This invite was sent to a different email address.';
  end if;

  insert into public.profiles (id, email, role, updated_at)
  values ((select auth.uid()), user_email, 'admin'::public.user_role, now())
  on conflict (id) do update
    set email = excluded.email,
        role = excluded.role,
        updated_at = now();

  update public.admin_invites
  set status = 'used'::public.admin_invite_status,
      claimed_by = (select auth.uid()),
      used_at = now()
  where id = invite_row.id
  returning * into invite_row;

  return invite_row;
end;
$$;

revoke all on function public.claim_admin_invite(text) from public;
grant execute on function public.claim_admin_invite(text) to authenticated;
