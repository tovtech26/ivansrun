# Repository Threat Model

## Scope

This repository ships a public web application backed by Supabase database, auth, and RPC surfaces.
The main runtime surfaces are:

- browser application code in `src/`
- Postgres schema, policies, functions, and views in `supabase/sql/`
- Supabase Edge Functions in `supabase/functions/`
- import and catalog generation tooling in `supabase/imports/`

## Assets That Matter

- authenticated user sessions and identity bindings
- admin and reseller privileges
- profile and role records
- invite links and invite redemption state
- product, order, inventory, and site-content data
- authorization rules enforced in SQL, RPC, and client bootstrap code
- email delivery flows that may reveal or trigger privileged state changes

## Trust Boundaries

- unauthenticated browser visitor to authenticated session
- authenticated user to admin or reseller privileged actions
- invite recipient to claimed admin role
- client-side state to Supabase session state
- browser-controlled input to SQL RPCs and row-level security
- import tooling to database-write operations
- edge-function request input to outbound email side effects

## Attacker-Controlled Inputs

- URL path, query string, and hash parameters
- OAuth callback results and session fragments
- login, signup, password reset, and invite form fields
- profile and application update form data
- admin invite token and invite email address
- import files and generated SQL payloads
- any request body or header reaching edge functions

## Security Invariants

- identity must be bound to the authenticated Supabase user, not to stale client state
- invite redemption must only succeed for the intended email and only once
- admin-only actions must remain inaccessible to non-admin sessions
- reseller-only data must not leak to public or other tenants
- profile updates must not permit privilege or identity escalation
- RPCs and views must not bypass row-level security or expose privileged data to public callers
- import and publish flows must not let attacker input escape into arbitrary database writes or unauthorized content mutation

## Main Failure Modes

- auth/session desynchronization caused by stale or invalid client state
- invite token leakage, replay, or wrong-account claim
- broken role assignment or privilege escalation through SQL functions or profile updates
- object-level authorization bypass in public or authenticated endpoints
- overly broad `SECURITY DEFINER` functions or views
- unsafe handling of session storage, OAuth redirects, or callback parameters
- privilege-bearing content mutation through import, publish, or edge-function flows

## Review Focus

The highest-risk review areas are:

- Supabase auth bootstrap and session restoration
- admin invite lookup and claim logic
- role binding during profile updates and invite redemption
- SQL functions and views marked `SECURITY DEFINER`
- any client code that restores, caches, or clears auth state

