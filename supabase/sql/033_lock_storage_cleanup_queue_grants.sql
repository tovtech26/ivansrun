-- Ensure cleanup metadata is not granted to public or anonymous roles.
revoke all on public.storage_cleanup_candidates from public, anon;
grant select, insert, update, delete on public.storage_cleanup_candidates to authenticated;
notify pgrst, 'reload schema';
