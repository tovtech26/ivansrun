-- Track obsolete content files without deleting production storage before backup.

create table if not exists public.storage_cleanup_candidates (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null,
  object_path text not null,
  reason text not null,
  source_id uuid,
  status text not null default 'pending_backup' check (status in ('pending_backup', 'backup_verified', 'delete_confirmed', 'deleted')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  backup_verified_at timestamptz,
  delete_confirmed_at timestamptz,
  deleted_at timestamptz,
  unique (bucket_id, object_path)
);

create index if not exists storage_cleanup_candidates_status_idx
on public.storage_cleanup_candidates (status, created_at);

alter table public.storage_cleanup_candidates enable row level security;
revoke all on public.storage_cleanup_candidates from public, anon;
grant select, insert, update, delete on public.storage_cleanup_candidates to authenticated;

drop policy if exists "Admins can read storage cleanup candidates" on public.storage_cleanup_candidates;
create policy "Admins can read storage cleanup candidates" on public.storage_cleanup_candidates
for select to authenticated using ((select private.is_admin()));

drop policy if exists "Admins can insert storage cleanup candidates" on public.storage_cleanup_candidates;
create policy "Admins can insert storage cleanup candidates" on public.storage_cleanup_candidates
for insert to authenticated with check ((select private.is_admin()));

drop policy if exists "Admins can update storage cleanup candidates" on public.storage_cleanup_candidates;
create policy "Admins can update storage cleanup candidates" on public.storage_cleanup_candidates
for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "Admins can delete storage cleanup candidates" on public.storage_cleanup_candidates;
create policy "Admins can delete storage cleanup candidates" on public.storage_cleanup_candidates
for delete to authenticated using ((select private.is_admin()));

notify pgrst, 'reload schema';
