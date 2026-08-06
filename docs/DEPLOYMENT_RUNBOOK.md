# Irunsvan Africa Deployment Runbook

## Local Verification

Run these from the project root:

```bash
npm run check
npm test
npm run build
npm run serve:dist
```

Manual local workbook verification:

```bash
node tests/catalog-seed-real-master.test.js
```

This test is intentionally not part of `npm test` because it depends on the local workbook at `D:\downloads from my laptop\MASTER INVENTORY FILE.xlsx`.

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
supabase/sql/010_schema_catchup_repair.sql
supabase/sql/011_sku_first_catalog_import.sql
supabase/sql/012_authorized_price_feeds.sql
supabase/sql/013_sku_zip_source_truth_images.sql
supabase/sql/014_irunsvan_brand_text_cleanup.sql
supabase/sql/015_account_and_directory.sql
supabase/sql/016_admin_invites.sql
```

If your Supabase project already exists and the app is showing errors like:

- `404` on `hero_sections`, `site_themes`, or `site_content`
- `400` on `products` or `product_variants` when selecting `model_code`, `product_type`, `original_colour`, or `color_code`
- missing `reseller_products` or `reseller_product_variants`

run this catch-up repair file once:

```text
supabase/sql/010_schema_catchup_repair.sql
```

After `010_schema_catchup_repair.sql`, run the later schema files too:

```text
supabase/sql/011_sku_first_catalog_import.sql
supabase/sql/012_authorized_price_feeds.sql
supabase/sql/013_sku_zip_source_truth_images.sql
supabase/sql/014_irunsvan_brand_text_cleanup.sql
supabase/sql/015_account_and_directory.sql
supabase/sql/016_admin_invites.sql
```

This repair file is idempotent. It creates the missing site-control tables, adds the later catalog columns, recreates the reseller pricing views, restores public-safe grants, and ensures the product image bucket policy exists.

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
admin_invites
```

Public users should only receive product and variant information without `base_price` or `base_currency`.
Approved resellers and admins should receive pricing from `reseller_products` and `reseller_product_variants`.

If invite creation fails with `PGRST205` or `Could not find the table 'public.admin_invites' in the schema cache`, run `supabase/sql/016_admin_invites.sql` in the Supabase SQL editor for project `llicocwonbokahpbireg`, then retry the invite from `Admin -> Team`.

## Netlify Production Deployment

The production domain `https://irunsvanafrica.com` is served by Netlify. Do not deploy this repository through the retired Render configuration.

Netlify must use the checked-in `netlify.toml` settings:

- Build command: `npm run build`
- Publish directory: `dist`
- SPA fallback: all routes rewrite to `/index.html`
- Production branch: `main`

Before pushing `main`, run the complete local verification above. After Netlify reports the deploy as published, confirm the deployed commit in Netlify matches `git rev-parse HEAD`, then smoke-test the public domain and authenticated admin workflows.

## Rollback

1. Record the failing deploy ID and Git commit.
2. In Netlify, open **Deploys**, select the last verified production deploy, and choose **Publish deploy**. This restores the previous static build without changing Supabase data.
3. If a Git rollback is required, create a new revert commit for the faulty commit and push it to `main`; do not force-push production history.
4. Database migration `p0_handover_workflows` is additive. Leave it in place during a frontend rollback; removing the function or seeded flyer is not required and must not be done during an incident without a separate reviewed migration.
5. Re-run the public smoke test and admin login/order/price/site-control checks after rollback.

## Operating Workflow

1. Run the schema SQL through `supabase/sql/034_active_hero_brand_cleanup.sql`.
2. Open `Admin -> Inventory`.
3. Upload the master inventory file to build the selected catalog from the manufacturer rows.
4. Review the preview for products, colour mappings, variants, skipped rows, and missing selected models.
5. Commit the catalog seed so products, manufacturer-SKU variants, and zero-stock inventory rows are saved.
6. Upload a later master inventory file to publish stock.
7. Review SKU matches, changed stock, and rows that will reset to zero.
8. Publish the stock update.
9. Use `Admin -> Products -> Colour Review` to rename customer-facing colours, choose images, and control what is published.
10. Admin can still add manual products from the Products page when needed.
11. Approved resellers submit order requests.
12. Admin approval deducts stock and blocks approval if stock is no longer enough.

Manufacturer SKU is the permanent variant key. Colour and size are used for display and review. Future stock updates must match by SKU first.

Current known master file reference:

- `3,748` inventory rows
- `76` total models
- `21` selected product folders
- `20` selected models found in inventory
- `1,312` selected SKU rows
- `165` has no matching inventory rows
