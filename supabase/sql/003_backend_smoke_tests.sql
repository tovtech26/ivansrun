with expected_tables(table_name) as (
  values
    ('profiles'),
    ('reseller_applications'),
    ('products'),
    ('product_variants'),
    ('inventory'),
    ('order_requests'),
    ('order_request_items'),
    ('import_jobs')
),
actual_tables as (
  select table_name
  from information_schema.tables
  where table_schema = 'public'
)
select
  expected_tables.table_name,
  (actual_tables.table_name is not null) as exists
from expected_tables
left join actual_tables using (table_name)
order by expected_tables.table_name;

select
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'profiles',
    'reseller_applications',
    'products',
    'product_variants',
    'inventory',
    'order_requests',
    'order_request_items',
    'import_jobs'
  )
order by tablename;

select
  tablename,
  count(*) as policy_count
from pg_policies
where schemaname = 'public'
  and tablename in (
    'profiles',
    'reseller_applications',
    'products',
    'product_variants',
    'inventory',
    'order_requests',
    'order_request_items',
    'import_jobs'
  )
group by tablename
order by tablename;

select enumtypid::regtype::text as enum_name, enumlabel
from pg_enum
where enumtypid in (
  'public.user_role'::regtype,
  'public.application_status'::regtype,
  'public.order_request_status'::regtype,
  'public.import_job_type'::regtype,
  'public.import_job_status'::regtype
)
order by enum_name, enumsortorder;

