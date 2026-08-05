-- Durable reseller/application/order workflows and a public-safe reseller directory.

alter table public.reseller_applications
  add column if not exists review_notes text;

alter table public.order_requests
  add column if not exists rejection_reason text,
  add column if not exists rejected_at timestamptz,
  add column if not exists cancelled_at timestamptz;

-- Keep the newest application if historical duplicates exist, then enforce one row per account.
with ranked as (
  select id, row_number() over (partition by user_id order by created_at desc, id desc) as row_number
  from public.reseller_applications
)
delete from public.reseller_applications applications
using ranked
where applications.id = ranked.id and ranked.row_number > 1;

create unique index if not exists reseller_applications_user_id_unique_idx
  on public.reseller_applications (user_id);

create table if not exists public.reseller_directory_entries (
  user_id uuid primary key references auth.users(id) on delete cascade,
  company_name text not null,
  country text not null default 'Region not published',
  phone text,
  email text,
  full_name text,
  published boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.reseller_directory_entries enable row level security;
revoke all on table public.reseller_directory_entries from public, anon, authenticated;
grant select on table public.reseller_directory_entries to anon, authenticated;

drop policy if exists "Public can read listed reseller directory entries" on public.reseller_directory_entries;
create policy "Public can read listed reseller directory entries"
on public.reseller_directory_entries for select to anon, authenticated
using (published = true);

insert into public.reseller_directory_entries (user_id, company_name, country, phone, email, full_name, published)
select distinct on (applications.user_id)
  applications.user_id,
  applications.company_name,
  coalesce(nullif(btrim(applications.country), ''), 'Region not published'),
  nullif(btrim(applications.phone), ''),
  nullif(btrim(applications.email), ''),
  nullif(btrim(applications.full_name), ''),
  true
from public.reseller_applications applications
join public.profiles profiles on profiles.id = applications.user_id
where applications.status = 'approved'::public.application_status
  and profiles.role = 'reseller'::public.user_role
  and nullif(btrim(applications.company_name), '') is not null
order by applications.user_id, applications.created_at desc
on conflict (user_id) do nothing;

create or replace view public.reseller_directory
with (security_invoker = true)
as
select
  user_id as id,
  company_name,
  country,
  phone,
  email,
  full_name
from public.reseller_directory_entries
where published = true;

revoke all on public.reseller_directory from public, anon, authenticated;
grant select on public.reseller_directory to anon, authenticated;

create table if not exists public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  aggregate_type text not null,
  aggregate_id uuid not null,
  recipient_email text,
  payload jsonb not null default '{}'::jsonb,
  actor_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending',
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  provider_message_id text,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_outbox_status_check check (status in ('pending', 'sending', 'sent', 'failed')),
  constraint notification_outbox_attempts_check check (attempts >= 0),
  constraint notification_outbox_event_type_check check (event_type ~ '^(application|order)_[a-z_]+$'),
  constraint notification_outbox_aggregate_type_check check (aggregate_type in ('application', 'order'))
);

create index if not exists notification_outbox_pending_idx
  on public.notification_outbox (next_attempt_at, created_at)
  where status in ('pending', 'failed');
create index if not exists notification_outbox_aggregate_idx
  on public.notification_outbox (aggregate_type, aggregate_id, created_at desc);
create index if not exists notification_outbox_actor_id_idx
  on public.notification_outbox (actor_id, created_at desc);

alter table public.notification_outbox enable row level security;
revoke all on table public.notification_outbox from public, anon, authenticated;
grant select on table public.notification_outbox to authenticated;

drop policy if exists "Admins can read notification outbox" on public.notification_outbox;
create policy "Admins can read notification outbox"
on public.notification_outbox for select to authenticated
using ((select private.is_admin()));

create or replace function private.queue_workflow_notification(
  p_event_type text,
  p_aggregate_type text,
  p_aggregate_id uuid,
  p_recipient_email text,
  p_payload jsonb,
  p_actor_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  insert into public.notification_outbox (
    event_type, aggregate_type, aggregate_id, recipient_email, payload, actor_id
  ) values (
    p_event_type,
    p_aggregate_type,
    p_aggregate_id,
    nullif(lower(btrim(coalesce(p_recipient_email, ''))), ''),
    coalesce(p_payload, '{}'::jsonb),
    p_actor_id
  ) returning id into v_id;
  return v_id;
end;
$$;

revoke all on function private.queue_workflow_notification(text, text, uuid, text, jsonb, uuid)
  from public, anon, authenticated, service_role;

create or replace function private.queue_new_order_notifications()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
  v_company_name text;
  v_payload jsonb;
begin
  select email, company_name into v_email, v_company_name
  from public.profiles where id = new.reseller_id;
  v_payload := jsonb_build_object(
    'orderCode', concat('#RE-', upper(substr(replace(new.id::text, '-', ''), 1, 6))),
    'resellerCompany', coalesce(v_company_name, 'Irunsvan reseller'),
    'resellerEmail', v_email,
    'notes', new.notes
  );
  perform private.queue_workflow_notification('order_submitted', 'order', new.id, null, v_payload, (select auth.uid()));
  perform private.queue_workflow_notification('order_received', 'order', new.id, v_email, v_payload, (select auth.uid()));
  return new;
end;
$$;

revoke all on function private.queue_new_order_notifications() from public, anon, authenticated, service_role;
drop trigger if exists queue_new_order_notifications on public.order_requests;
create trigger queue_new_order_notifications
after insert on public.order_requests
for each row execute function private.queue_new_order_notifications();

create or replace function private.submit_reseller_application(
  p_email text,
  p_full_name text,
  p_company_name text,
  p_phone text default null,
  p_country text default null,
  p_message text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_application public.reseller_applications%rowtype;
begin
  if v_user_id is null then raise exception 'Sign in before submitting a reseller application.'; end if;
  if nullif(btrim(coalesce(p_email, '')), '') is null
    or nullif(btrim(coalesce(p_full_name, '')), '') is null
    or nullif(btrim(coalesce(p_company_name, '')), '') is null then
    raise exception 'Email, full name, and company name are required.';
  end if;
  if exists (
    select 1 from public.profiles
    where id = v_user_id and role in ('admin'::public.user_role, 'reseller'::public.user_role)
  ) then
    raise exception 'This account already has approved access.';
  end if;

  insert into public.profiles (id, email, full_name, company_name, phone, role, updated_at)
  values (
    v_user_id, lower(btrim(p_email)), btrim(p_full_name), btrim(p_company_name),
    nullif(btrim(coalesce(p_phone, '')), ''), 'pending_reseller'::public.user_role, now()
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    company_name = excluded.company_name,
    phone = excluded.phone,
    role = 'pending_reseller'::public.user_role,
    updated_at = now();

  insert into public.reseller_applications (
    user_id, email, full_name, company_name, phone, country, message, status,
    reviewed_by, reviewed_at, review_notes
  ) values (
    v_user_id, lower(btrim(p_email)), btrim(p_full_name), btrim(p_company_name),
    nullif(btrim(coalesce(p_phone, '')), ''), nullif(btrim(coalesce(p_country, '')), ''),
    nullif(btrim(coalesce(p_message, '')), ''), 'pending'::public.application_status,
    null, null, null
  )
  on conflict (user_id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    company_name = excluded.company_name,
    phone = excluded.phone,
    country = excluded.country,
    message = excluded.message,
    status = 'pending'::public.application_status,
    reviewed_by = null,
    reviewed_at = null,
    review_notes = null,
    created_at = now()
  returning * into v_application;

  perform private.queue_workflow_notification(
    'application_submitted', 'application', v_application.id, null,
    jsonb_build_object(
      'companyName', v_application.company_name, 'fullName', v_application.full_name,
      'email', v_application.email, 'country', v_application.country,
      'message', v_application.message
    ), v_user_id
  );
  perform private.queue_workflow_notification(
    'application_received', 'application', v_application.id, v_application.email,
    jsonb_build_object('companyName', v_application.company_name, 'fullName', v_application.full_name),
    v_user_id
  );

  return to_jsonb(v_application);
end;
$$;

drop function if exists public.review_reseller_application(uuid, public.application_status);
drop function if exists private.review_reseller_application(uuid, public.application_status);

create or replace function private.review_reseller_application(
  p_application_id uuid,
  p_status public.application_status,
  p_review_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_application public.reseller_applications%rowtype;
begin
  if v_user_id is null or not exists (
    select 1 from public.profiles where id = v_user_id and role = 'admin'::public.user_role
  ) then raise exception 'Admin access is required to review reseller applications.'; end if;
  if p_status::text not in ('approved', 'rejected') then
    raise exception 'Application status must be approved or rejected.';
  end if;
  if p_status::text = 'rejected' and nullif(btrim(coalesce(p_review_notes, '')), '') is null then
    raise exception 'A rejection reason is required.';
  end if;

  select * into v_application from public.reseller_applications
  where id = p_application_id for update;
  if not found then raise exception 'Reseller application was not found.'; end if;

  update public.reseller_applications set
    status = p_status,
    reviewed_by = v_user_id,
    reviewed_at = now(),
    review_notes = nullif(btrim(coalesce(p_review_notes, '')), '')
  where id = p_application_id returning * into v_application;

  update public.profiles set
    role = case when p_status::text = 'approved' then 'reseller'::public.user_role else 'pending_reseller'::public.user_role end,
    updated_at = now()
  where id = v_application.user_id;
  if not found then raise exception 'The reseller profile linked to this application was not found.'; end if;

  if p_status::text = 'approved' then
    insert into public.reseller_directory_entries (
      user_id, company_name, country, phone, email, full_name, published, updated_at
    ) values (
      v_application.user_id, v_application.company_name,
      coalesce(nullif(btrim(coalesce(v_application.country, '')), ''), 'Region not published'),
      nullif(btrim(coalesce(v_application.phone, '')), ''), v_application.email,
      v_application.full_name, false, now()
    ) on conflict (user_id) do update set
      company_name = excluded.company_name, country = excluded.country, phone = excluded.phone,
      email = excluded.email, full_name = excluded.full_name, updated_at = now();
  else
    update public.reseller_directory_entries set published = false, updated_at = now()
    where user_id = v_application.user_id;
  end if;

  perform private.queue_workflow_notification(
    concat('application_', p_status::text), 'application', v_application.id, v_application.email,
    jsonb_build_object(
      'companyName', v_application.company_name, 'fullName', v_application.full_name,
      'status', p_status::text, 'reviewNotes', v_application.review_notes
    ), v_user_id
  );
  return to_jsonb(v_application);
end;
$$;

create or replace function private.transition_order_request(
  p_order_id uuid,
  p_status public.order_request_status,
  p_admin_notes text default null,
  p_payment_reference text default null,
  p_expected_fulfillment_date date default null,
  p_rejection_reason text default null,
  p_invoice_number text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_order public.order_requests%rowtype;
  v_item record;
  v_current text;
  v_next text := p_status::text;
  v_allowed boolean := false;
  v_reseller_email text;
  v_company_name text;
begin
  if v_user_id is null or not exists (
    select 1 from public.profiles where id = v_user_id and role = 'admin'::public.user_role
  ) then raise exception 'Admin access is required to update an order.'; end if;

  select * into v_order from public.order_requests where id = p_order_id for update;
  if not found then raise exception 'Order request was not found.'; end if;
  if p_status is null then raise exception 'An order status is required.'; end if;
  v_current := case when v_order.status::text = 'approved' then 'awaiting_payment' else v_order.status::text end;
  if v_current = v_next then return to_jsonb(v_order); end if;

  v_allowed :=
    (v_current = 'submitted' and v_next in ('awaiting_payment', 'rejected', 'cancelled')) or
    (v_current = 'awaiting_payment' and v_next in ('paid', 'cancelled')) or
    (v_current = 'paid' and v_next in ('submitted_to_supplier', 'cancelled')) or
    (v_current = 'submitted_to_supplier' and v_next = 'processing') or
    (v_current = 'processing' and v_next = 'shipped') or
    (v_current = 'shipped' and v_next = 'fulfilled');
  if not v_allowed then raise exception 'The requested order status transition is not allowed.'; end if;
  if v_next = 'paid' and nullif(btrim(coalesce(p_payment_reference, '')), '') is null then
    raise exception 'A payment reference is required before marking the order paid.';
  end if;
  if v_next in ('rejected', 'cancelled') and nullif(btrim(coalesce(p_rejection_reason, '')), '') is null then
    raise exception 'A reason is required when rejecting or cancelling an order.';
  end if;

  if v_next = 'awaiting_payment' then
    lock table public.inventory in share row exclusive mode;
    if not exists (select 1 from public.order_request_items where order_request_id = p_order_id) then
      raise exception 'This order has no items to approve.';
    end if;
    for v_item in
      select variant_id, sum(quantity)::integer requested_quantity
      from public.order_request_items where order_request_id = p_order_id
      group by variant_id order by variant_id
    loop
      update public.inventory set
        stock_quantity = stock_quantity - v_item.requested_quantity,
        source = 'order_reserved', updated_at = now()
      where variant_id = v_item.variant_id and stock_quantity >= v_item.requested_quantity;
      if not found then raise exception 'This order cannot be approved because stock is no longer enough.'; end if;
    end loop;
  elsif v_next = 'cancelled' and v_current in ('awaiting_payment', 'paid') then
    lock table public.inventory in share row exclusive mode;
    for v_item in
      select variant_id, sum(quantity)::integer requested_quantity
      from public.order_request_items where order_request_id = p_order_id
      group by variant_id order by variant_id
    loop
      update public.inventory set
        stock_quantity = stock_quantity + v_item.requested_quantity,
        source = 'order_reservation_released', updated_at = now()
      where variant_id = v_item.variant_id;
      if not found then raise exception 'Inventory is missing for one or more cancelled order items.'; end if;
    end loop;
  end if;

  update public.order_requests set
    status = p_status,
    admin_notes = coalesce(nullif(btrim(coalesce(p_admin_notes, '')), ''), admin_notes),
    payment_reference = coalesce(nullif(btrim(coalesce(p_payment_reference, '')), ''), payment_reference),
    expected_fulfillment_date = coalesce(p_expected_fulfillment_date, expected_fulfillment_date),
    invoice_number = coalesce(nullif(btrim(coalesce(p_invoice_number, '')), ''), invoice_number),
    rejection_reason = case when v_next in ('rejected', 'cancelled') then nullif(btrim(p_rejection_reason), '') else rejection_reason end,
    approved_at = case when v_next = 'awaiting_payment' then coalesce(approved_at, now()) else approved_at end,
    paid_at = case when v_next = 'paid' then coalesce(paid_at, now()) else paid_at end,
    supplier_submitted_at = case when v_next = 'submitted_to_supplier' then coalesce(supplier_submitted_at, now()) else supplier_submitted_at end,
    processing_at = case when v_next = 'processing' then coalesce(processing_at, now()) else processing_at end,
    shipped_at = case when v_next = 'shipped' then coalesce(shipped_at, now()) else shipped_at end,
    fulfilled_at = case when v_next = 'fulfilled' then coalesce(fulfilled_at, now()) else fulfilled_at end,
    rejected_at = case when v_next = 'rejected' then coalesce(rejected_at, now()) else rejected_at end,
    cancelled_at = case when v_next = 'cancelled' then coalesce(cancelled_at, now()) else cancelled_at end,
    updated_at = now()
  where id = p_order_id returning * into v_order;

  select email, company_name into v_reseller_email, v_company_name
  from public.profiles where id = v_order.reseller_id;
  perform private.queue_workflow_notification(
    concat('order_', v_next), 'order', v_order.id, v_reseller_email,
    jsonb_build_object(
      'orderCode', concat('#RE-', upper(substr(replace(v_order.id::text, '-', ''), 1, 6))),
      'resellerCompany', coalesce(v_company_name, 'Irunsvan reseller'),
      'status', v_next, 'adminNotes', v_order.admin_notes,
      'paymentReference', v_order.payment_reference,
      'expectedFulfillmentDate', v_order.expected_fulfillment_date,
      'rejectionReason', v_order.rejection_reason
    ), v_user_id
  );
  return to_jsonb(v_order);
end;
$$;

create or replace function public.submit_reseller_application(
  p_email text, p_full_name text, p_company_name text, p_phone text default null,
  p_country text default null, p_message text default null
)
returns jsonb language sql security invoker set search_path = ''
as $$ select private.submit_reseller_application(p_email, p_full_name, p_company_name, p_phone, p_country, p_message); $$;

create or replace function public.review_reseller_application(
  p_application_id uuid, p_status public.application_status, p_review_notes text default null
)
returns jsonb language sql security invoker set search_path = ''
as $$ select private.review_reseller_application(p_application_id, p_status, p_review_notes); $$;

create or replace function public.transition_order_request(
  p_order_id uuid, p_status public.order_request_status, p_admin_notes text default null,
  p_payment_reference text default null, p_expected_fulfillment_date date default null,
  p_rejection_reason text default null, p_invoice_number text default null
)
returns jsonb language sql security invoker set search_path = ''
as $$ select private.transition_order_request(p_order_id, p_status, p_admin_notes, p_payment_reference, p_expected_fulfillment_date, p_rejection_reason, p_invoice_number); $$;

create or replace function private.set_reseller_directory_listing(
  p_published boolean,
  p_country text default null,
  p_phone text default null,
  p_email text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_entry public.reseller_directory_entries%rowtype;
  v_profile public.profiles%rowtype;
  v_application public.reseller_applications%rowtype;
begin
  if v_user_id is null then raise exception 'Sign in to update your directory listing.'; end if;
  select * into v_profile from public.profiles where id = v_user_id;
  if v_profile.role <> 'reseller'::public.user_role then raise exception 'Only approved resellers can publish a directory listing.'; end if;
  select * into v_application from public.reseller_applications
  where user_id = v_user_id and status = 'approved'::public.application_status
  order by created_at desc limit 1;
  if not found then raise exception 'An approved reseller application is required.'; end if;

  insert into public.reseller_directory_entries (
    user_id, company_name, country, phone, email, full_name, published, updated_at
  ) values (
    v_user_id, coalesce(nullif(btrim(v_profile.company_name), ''), v_application.company_name),
    coalesce(nullif(btrim(coalesce(p_country, '')), ''), nullif(btrim(v_application.country), ''), 'Region not published'),
    coalesce(nullif(btrim(coalesce(p_phone, '')), ''), nullif(btrim(v_profile.phone), ''), nullif(btrim(v_application.phone), '')),
    coalesce(nullif(lower(btrim(coalesce(p_email, ''))), ''), v_profile.email),
    coalesce(nullif(btrim(v_profile.full_name), ''), v_application.full_name),
    coalesce(p_published, false), now()
  ) on conflict (user_id) do update set
    company_name = excluded.company_name, country = excluded.country, phone = excluded.phone,
    email = excluded.email, full_name = excluded.full_name, published = excluded.published, updated_at = now()
  returning * into v_entry;
  return to_jsonb(v_entry);
end;
$$;

create or replace function public.set_reseller_directory_listing(
  p_published boolean, p_country text default null, p_phone text default null, p_email text default null
)
returns jsonb language sql security invoker set search_path = ''
as $$ select private.set_reseller_directory_listing(p_published, p_country, p_phone, p_email); $$;

revoke all on function private.submit_reseller_application(text,text,text,text,text,text) from public, anon, authenticated, service_role;
revoke all on function private.review_reseller_application(uuid,public.application_status,text) from public, anon, authenticated, service_role;
revoke all on function private.transition_order_request(uuid,public.order_request_status,text,text,date,text,text) from public, anon, authenticated, service_role;
revoke all on function private.set_reseller_directory_listing(boolean,text,text,text) from public, anon, authenticated, service_role;
grant execute on function private.submit_reseller_application(text,text,text,text,text,text) to authenticated;
grant execute on function private.review_reseller_application(uuid,public.application_status,text) to authenticated;
grant execute on function private.transition_order_request(uuid,public.order_request_status,text,text,date,text,text) to authenticated;
grant execute on function private.set_reseller_directory_listing(boolean,text,text,text) to authenticated;

revoke all on function public.submit_reseller_application(text,text,text,text,text,text) from public, anon, authenticated, service_role;
revoke all on function public.review_reseller_application(uuid,public.application_status,text) from public, anon, authenticated, service_role;
revoke all on function public.transition_order_request(uuid,public.order_request_status,text,text,date,text,text) from public, anon, authenticated, service_role;
revoke all on function public.set_reseller_directory_listing(boolean,text,text,text) from public, anon, authenticated, service_role;
grant execute on function public.submit_reseller_application(text,text,text,text,text,text) to authenticated;
grant execute on function public.review_reseller_application(uuid,public.application_status,text) to authenticated;
grant execute on function public.transition_order_request(uuid,public.order_request_status,text,text,date,text,text) to authenticated;
grant execute on function public.set_reseller_directory_listing(boolean,text,text,text) to authenticated;

notify pgrst, 'reload schema';
