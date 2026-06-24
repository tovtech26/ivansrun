# Public Product Flyers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a separate public flyer-style product display system that admins control without touching reseller catalog, SKU, stock, pricing, or inventory workflows.

**Architecture:** Add a new Supabase table named `public_product_flyers` with RLS and explicit Data API grants. Extend the existing website content helper and Site Controls workflow to load, normalize, create, and display public flyer content through new `product-flyers` and `product-flyer` routes.

**Tech Stack:** Vanilla JavaScript frontend, Supabase REST/Data API, Supabase Storage public bucket, SQL migration files, Node test scripts.

---

### Task 1: Tests And SQL Contract

**Files:**
- Modify: `tests/website-content.test.js`
- Modify: `tests/app-wiring.test.js`
- Modify: `tests/auth-state.test.js`
- Modify: `tests/mobile-navigation.test.js`
- Modify: `tests/supabase-sql.test.js`
- Create: `supabase/sql/020_public_product_flyers.sql`

- [ ] **Step 1: Write failing tests**

Add assertions that require:
- `normalizeProductFlyers`, `buildProductFlyerSlug`, and `buildProductFlyerPayload`.
- public route access for `product-flyers` and `product-flyer`.
- mobile route URL parsing for `product-flyer/:slug`.
- app state and data fetches for `publicProductFlyers`.
- SQL table, indexes, grants, and RLS policies.

- [ ] **Step 2: Run tests and verify they fail**

Run:
```powershell
npm.cmd test
```

Expected: failures for missing helper exports, routes, app wiring, and SQL file.

- [ ] **Step 3: Add SQL migration**

Create `supabase/sql/020_public_product_flyers.sql` with `public_product_flyers`, indexes, updated_at trigger, grants, RLS, public read policy, and admin manage policy.

- [ ] **Step 4: Run SQL tests**

Run:
```powershell
node tests/supabase-sql.test.js
```

Expected: SQL tests pass after the migration exists.

### Task 2: Content Helper

**Files:**
- Modify: `src/website-content.js`
- Test: `tests/website-content.test.js`

- [ ] **Step 1: Implement helper functions**

Add:
- `buildProductFlyerSlug(title)`
- `normalizeProductFlyers(rows, options)`
- `buildProductFlyerPayload(input, adminUserId)`

- [ ] **Step 2: Run helper tests**

Run:
```powershell
node tests/website-content.test.js
```

Expected: website content tests pass.

### Task 3: Routes And Data Loading

**Files:**
- Modify: `src/auth.js`
- Modify: `src/mobile-navigation.js`
- Modify: `src/app.js`
- Test: `tests/auth-state.test.js`
- Test: `tests/mobile-navigation.test.js`
- Test: `tests/app-wiring.test.js`

- [ ] **Step 1: Add public routes**

Add `product-flyers` and `product-flyer` to public routing, mobile parsing, and app route map.

- [ ] **Step 2: Add app state and fetches**

Add `publicProductFlyers` and `selectedProductFlyerSlug`. Public bootstrap fetches published rows; admin bootstrap fetches all rows.

- [ ] **Step 3: Run route tests**

Run:
```powershell
node tests/auth-state.test.js
node tests/mobile-navigation.test.js
node tests/app-wiring.test.js
```

Expected: route and wiring tests pass.

### Task 4: Admin Site Controls

**Files:**
- Modify: `src/app.js`
- Test: `tests/app-wiring.test.js`

- [ ] **Step 1: Add admin form and list**

Add a Site Controls section named `Public Product Flyers` with title, product class, descriptions, main image, secondary image, display order, and published checkbox.

- [ ] **Step 2: Add submit handler**

Upload images to `content/public-products/...`, insert into `public_product_flyers`, and refresh local state.

- [ ] **Step 3: Run wiring tests**

Run:
```powershell
node tests/app-wiring.test.js
```

Expected: admin form and handler wiring tests pass.

### Task 5: Public Flyer Pages And Styling

**Files:**
- Modify: `src/app.js`
- Modify: `src/styles.css`
- Test: `tests/app-wiring.test.js`

- [ ] **Step 1: Add listing and detail pages**

Create `productFlyersPage()` and `productFlyerDetailPage()` that render only public flyer content. They must not render SKU, price, stock, reseller ordering, or inventory controls.

- [ ] **Step 2: Add minimal flyer CSS**

Use restrained layout, consistent padding, clear image framing, and no catalog/order controls.

- [ ] **Step 3: Run app wiring tests**

Run:
```powershell
node tests/app-wiring.test.js
```

Expected: public flyer page tests pass.

### Task 6: Full Verification And Push

**Files:**
- Build output: `dist/`

- [ ] **Step 1: Run syntax check**

Run:
```powershell
npm.cmd run check
```

Expected: pass.

- [ ] **Step 2: Run full tests**

Run:
```powershell
npm.cmd test
```

Expected: pass.

- [ ] **Step 3: Build**

Run:
```powershell
npm.cmd run build
```

Expected: `Built static site into dist/`.

- [ ] **Step 4: Commit and push current branch**

Run:
```powershell
git add .
git commit -m "feat: add public product flyer pages"
git push origin main
```

Expected: commit is created on `main` and pushed.

---

Self-review: This plan keeps public flyer products separate from reseller catalog products, uses explicit Supabase grants with RLS, avoids route names that collide with existing `products` and `product`, and includes tests before implementation.
