-- Atomically claim due notifications so concurrent admin sessions cannot send
-- the same email twice. A stale sending claim can be recovered after 10 minutes.

create index if not exists notification_outbox_stale_sending_idx
on public.notification_outbox (updated_at, created_at)
where status = 'sending';

create or replace function private.claim_notification_outbox(
  p_channel text,
  p_requester uuid,
  p_is_admin boolean,
  p_notification_ids uuid[],
  p_aggregate_id uuid,
  p_limit integer
)
returns setof public.notification_outbox
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_channel not in ('application', 'order') then
    raise exception 'Invalid notification channel';
  end if;

  return query
  with candidates as materialized (
    select outbox.id
    from public.notification_outbox as outbox
    where outbox.aggregate_type = p_channel
      and (
        (outbox.status in ('pending', 'failed') and outbox.next_attempt_at <= now())
        or (outbox.status = 'sending' and outbox.updated_at <= now() - interval '10 minutes')
      )
      and (coalesce(cardinality(p_notification_ids), 0) = 0 or outbox.id = any(p_notification_ids))
      and (p_aggregate_id is null or outbox.aggregate_id = p_aggregate_id)
      and (coalesce(p_is_admin, false) or outbox.actor_id = p_requester)
    order by outbox.created_at asc
    for update skip locked
    limit greatest(1, least(coalesce(p_limit, 25), 100))
  )
  update public.notification_outbox as outbox
  set status = 'sending',
      attempts = outbox.attempts + 1,
      last_error = null,
      updated_at = now()
  from candidates
  where outbox.id = candidates.id
  returning outbox.*;
end;
$$;

create or replace function public.claim_notification_outbox(
  p_channel text,
  p_requester uuid,
  p_is_admin boolean,
  p_notification_ids uuid[],
  p_aggregate_id uuid,
  p_limit integer
)
returns setof public.notification_outbox
language sql
security invoker
set search_path = ''
as $$
  select *
  from private.claim_notification_outbox(
    p_channel,
    p_requester,
    p_is_admin,
    p_notification_ids,
    p_aggregate_id,
    p_limit
  );
$$;

revoke all on function private.claim_notification_outbox(text, uuid, boolean, uuid[], uuid, integer) from public, anon, authenticated;
revoke all on function public.claim_notification_outbox(text, uuid, boolean, uuid[], uuid, integer) from public, anon, authenticated;
grant usage on schema private to service_role;
grant execute on function private.claim_notification_outbox(text, uuid, boolean, uuid[], uuid, integer) to service_role;
grant execute on function public.claim_notification_outbox(text, uuid, boolean, uuid[], uuid, integer) to service_role;

notify pgrst, 'reload schema';
