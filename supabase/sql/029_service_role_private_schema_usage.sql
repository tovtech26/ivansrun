-- The Edge Function's service-role PostgREST call enters a security-invoker
-- public wrapper before calling the locked private claim function.
grant usage on schema private to service_role;

notify pgrst, 'reload schema';
