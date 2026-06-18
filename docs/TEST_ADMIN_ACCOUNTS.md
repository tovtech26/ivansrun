# Test Accounts

Use these accounts for role testing against the Supabase project `llicocwonbokahpbireg`.

All testing must use the normal site login form. There is no dev auto-login endpoint or local admin preview shell.

| Email | Role |
| --- | --- |
| `admin.test@irunsvan.africa` | `admin` |
| `ops.admin@irunsvan.africa` | `admin` |
| `reseller.test@irunsvan.africa` | `reseller` |
| `pending.test@irunsvan.africa` | `pending_reseller` |

Do not commit test account passwords. Set them through environment variables when creating or rotating the accounts.

## Automated Setup

Run this from the repo root with the project service-role key:

```powershell
$env:SUPABASE_SERVICE_ROLE_KEY="paste-service-role-key-here"
$env:IRUNSVAN_TEST_ADMIN_PASSWORD="set-a-strong-password"
$env:IRUNSVAN_TEST_OPS_PASSWORD="set-a-strong-password"
$env:IRUNSVAN_TEST_RESELLER_PASSWORD="set-a-strong-password"
$env:IRUNSVAN_TEST_PENDING_PASSWORD="set-a-strong-password"
node scripts/create-test-admins.js
```

The script creates confirmed Auth users and upserts their `public.profiles` rows.

Rotate these passwords in Supabase any time they are shared outside the password manager.

## Dashboard Fallback

If you do not want to expose the service-role key locally:

1. Open Supabase Dashboard for project `llicocwonbokahpbireg`.
2. Go to `Authentication` -> `Users` -> `Add user`.
3. Create the users with strong passwords from the password manager and mark them confirmed.
4. Run this in the SQL editor:

```sql
insert into public.profiles (id, email, full_name, company_name, role)
select
  users.id,
  users.email,
  case
    when users.email = 'admin.test@irunsvan.africa' then 'Admin Test'
    when users.email = 'ops.admin@irunsvan.africa' then 'Ops Admin'
    when users.email = 'reseller.test@irunsvan.africa' then 'Reseller Test'
    when users.email = 'pending.test@irunsvan.africa' then 'Pending Test'
    else users.email
  end,
  case
    when users.email in ('admin.test@irunsvan.africa', 'ops.admin@irunsvan.africa') then 'Irunsvan Africa'
    when users.email = 'reseller.test@irunsvan.africa' then 'Test Reseller Co'
    when users.email = 'pending.test@irunsvan.africa' then 'Pending Reseller Co'
    else 'Test Account'
  end,
  case
    when users.email in ('admin.test@irunsvan.africa', 'ops.admin@irunsvan.africa') then 'admin'::public.user_role
    when users.email = 'reseller.test@irunsvan.africa' then 'reseller'::public.user_role
    else 'pending_reseller'::public.user_role
  end
from auth.users
where users.email in (
  'admin.test@irunsvan.africa',
  'ops.admin@irunsvan.africa',
  'reseller.test@irunsvan.africa',
  'pending.test@irunsvan.africa'
)
on conflict (id) do update
set
  email = excluded.email,
  full_name = excluded.full_name,
  company_name = excluded.company_name,
  role = excluded.role;
```
