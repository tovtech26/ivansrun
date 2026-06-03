-- Replace the email below with the account that should become the first admin.
-- Run this after that user has signed up and has a row in public.profiles.

update public.profiles
set role = 'admin'::public.user_role
where email = 'admin@example.com';

