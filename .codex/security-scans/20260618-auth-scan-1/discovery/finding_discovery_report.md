# Discovery Report

Scan target: repository-wide

Reviewed high-risk surfaces:

- auth bootstrap and invite flow in `src/app.js`
- Supabase client auth/session handling in `src/supabase-client.js`
- SQL auth/RLS and invite functions in `supabase/sql/*.sql`
- import and inventory helpers in `src/import-parser.js` and `src/inventory-workflow.js`
- public mail edge functions in `supabase/functions/*.ts`

Confirmed reportable candidates:

1. `CF-001` - admin invite bearer token remains in the URL and browser history
2. `CAND-IMP-001` - CSV parser splits on raw newlines before quote-aware row handling
3. `CAND-MAIL-ORDER-001` - public order mail edge function lacks caller authentication
4. `CAND-MAIL-APP-001` - public application mail edge function lacks caller authentication

Suppressed / not_applicable / deferred:

- `CAND-INV-001` - inventory publish-plan helper is only reached through internal callers that already bind rows to known variants
- `src/supabase-client.js`, `src/auth.js`, `supabase/sql/015_account_and_directory.sql`, `supabase/sql/016_admin_invites.sql`, `src/admin-imports.js`, `src/admin-orders.js`, `src/product-persistence.js`, `src/site-publish.js`, `src/site-controls.js`, `src/product-images.js`, `src/product-editor.js`, `src/product-detail.js`, `src/product-catalog-manager.js`, `src/operations-products.js`, `src/reseller-applications.js`, `src/reseller-orders.js`, `src/inventory-workflow.js`, `src/email-notifications.js`, `src/catalog-data.js`, `src/catalog-fallback.js`, `src/catalog-seed-builder.js`, `src/storefront-catalog.js`, `src/mobile-navigation.js`, `supabase/functions/send-order-email/index.ts`, `supabase/functions/send-application-email/index.ts`, `supabase/imports/generate_import_sql.py`, `supabase/imports/import_to_supabase_rest.py`, `scripts/build-static.js`, `scripts/create-test-admins.js`, `scripts/serve-static.js`, `index.html`, `render.yaml`, `package.json`, `.superpowers/inbetweens-map.html`, `skills-lock.json`

