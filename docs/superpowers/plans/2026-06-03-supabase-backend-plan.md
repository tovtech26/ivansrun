# IRUNSVAN Supabase Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the Supabase database schema, RLS policies, and seed/admin setup needed for the IRUNSVAN reseller ecommerce backend.

**Architecture:** Supabase Auth owns identities, Postgres stores catalog/order/application data, and RLS enforces public, reseller, and admin access boundaries. This first backend pass creates database structure only; frontend screens, import parsing, image storage, exchange rates, and email delivery are separate follow-up features.

**Tech Stack:** Supabase Postgres, Supabase Auth, SQL migrations/RLS, Codex Supabase MCP.

---

## File Structure

- Create: `supabase/sql/001_backend_schema.sql`
  Contains enums, tables, indexes, triggers, RLS enablement, and policies.
- Create: `supabase/sql/002_backend_seed_admin.sql`
  Optional helper SQL for promoting a known user to admin after signup.
- Create: `supabase/sql/003_backend_smoke_tests.sql`
  Read-only checks for table existence, policies, and critical constraints.

## Task 1: Create Schema SQL

**Files:**
- Create: `supabase/sql/001_backend_schema.sql`

- [ ] **Step 1: Create enums and helper functions**

Define role/status enums and `is_admin()` / `is_approved_reseller()` helper functions as `security definer` functions in a private schema.

- [ ] **Step 2: Create core tables**

Create `profiles`, `reseller_applications`, `products`, `product_variants`, `inventory`, `order_requests`, `order_request_items`, and `import_jobs`.

- [ ] **Step 3: Create indexes and timestamps**

Add indexes for SKU, product parent lookup, reseller order lookup, and application status. Add an `updated_at` trigger.

- [ ] **Step 4: Enable RLS**

Enable RLS on every table in `public`.

## Task 2: Create RLS Policies

**Files:**
- Modify: `supabase/sql/001_backend_schema.sql`

- [ ] **Step 1: Public catalog policies**

Allow anonymous and authenticated users to read published `products` and `product_variants`.

- [ ] **Step 2: Private inventory policies**

Allow exact stock reads only for approved resellers and admins.

- [ ] **Step 3: Reseller application policies**

Allow users to create and read their own applications. Allow admins to read/update all applications.

- [ ] **Step 4: Order request policies**

Allow approved resellers to create and read their own order requests/items. Allow admins to read/update all order requests/items.

- [ ] **Step 5: Admin import policies**

Allow admins to manage import job records.

## Task 3: Create Admin Seed Helper

**Files:**
- Create: `supabase/sql/002_backend_seed_admin.sql`

- [ ] **Step 1: Add documented admin promotion SQL**

Create a safe SQL snippet that updates one existing profile to `admin` by email.

## Task 4: Create Smoke Test SQL

**Files:**
- Create: `supabase/sql/003_backend_smoke_tests.sql`

- [ ] **Step 1: Add table existence checks**

Query `information_schema.tables` for all expected tables.

- [ ] **Step 2: Add RLS checks**

Query `pg_tables` and `pg_policies` to confirm RLS and policies exist.

- [ ] **Step 3: Add constraint checks**

Query enum values and unique indexes for role/status/SKU assumptions.

## Task 5: Apply And Verify In Supabase

**Files:**
- Use: `supabase/sql/001_backend_schema.sql`
- Use: `supabase/sql/003_backend_smoke_tests.sql`

- [ ] **Step 1: Apply schema through Supabase MCP**

Run the schema SQL against project `llicocwonbokahpbireg`.

- [ ] **Step 2: Run smoke tests**

Run the smoke-test SQL and confirm all expected objects exist.

- [ ] **Step 3: Report status**

Summarize which tables and policies were created, and list any remaining setup values needed from the user.

## Self-Review

Spec coverage:

- Public browsing is covered by product and variant public read policies.
- Private exact stock is covered by inventory reseller/admin policies.
- Reseller approval is covered by profiles and reseller applications.
- Order requests are covered by order request tables and policies.
- Admin import tracking is covered by import jobs.

Scope limits:

- Frontend screens, file parsing, image upload, exchange rates, and emails are explicitly deferred from this backend schema pass.

