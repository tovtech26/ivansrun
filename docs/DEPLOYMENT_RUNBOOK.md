# Ivansrun Africa Deployment Runbook

## Local Verification

Run these from the project root:

```bash
npm run check
npm test
npm run build
npm run serve:dist
```

Open:

```text
http://127.0.0.1:4173
```

## Supabase Setup

Run the SQL files in order in the Supabase SQL editor:

```text
supabase/sql/001_backend_schema.sql
supabase/sql/002_backend_seed_admin.sql
supabase/sql/004_backend_policy_advisor_fixes.sql
supabase/sql/005_backend_order_item_insert_policy_merge.sql
supabase/sql/006_public_catalog_policy_fix.sql
supabase/sql/007_site_controls.sql
supabase/sql/008_product_catalog_workflow.sql
supabase/sql/009_reseller_price_privacy_and_grants.sql
```

Then confirm the REST API can see:

```text
products
product_variants
inventory
order_requests
order_request_items
reseller_applications
profiles
import_jobs
hero_sections
site_themes
site_content
reseller_products
reseller_product_variants
```

Public users should only receive product and variant information without `base_price` or `base_currency`.
Approved resellers and admins should receive pricing from `reseller_products` and `reseller_product_variants`.

## Render Setup

Use the existing `render.yaml` Blueprint:

```yaml
runtime: static
buildCommand: npm run build
staticPublishPath: ./dist
routes:
  - type: rewrite
    source: /*
    destination: /index.html
```

This prevents direct route refreshes from returning Not Found.

## Operating Workflow

1. Admin creates products from the Products page.
2. Product variants are generated from colours and sizes.
3. Every new variant starts with inventory `0`.
4. Admin uploads the manufacturer master inventory file.
5. The preview shows matched rows, unmatched rows, changed rows, and rows that will reset to zero.
6. Publishing the import resets tracked stock first, then applies the new matched stock.
7. Approved resellers submit order requests.
8. Admin approval deducts stock and blocks approval if stock is no longer enough.
