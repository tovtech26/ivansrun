# In-Between Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the missing operational pages between the storefront, reseller portal, and admin dashboard so the site feels like a complete ecommerce/reseller workflow.

**Architecture:** Extend the existing vanilla JS single-page app router in `src/app.js` with route-based views and small shared UI helpers. Keep Supabase reads public-only for now; protected reseller/admin actions use realistic local UI states until auth and writes are wired.

**Tech Stack:** Static HTML, vanilla JavaScript, CSS, Supabase REST public catalog reads.

---

### Task 1: Add Route State And Navigation

**Files:**
- Modify: `src/app.js`

- [ ] Add route state for `store`, `product`, `apply`, `login`, `reseller`, `history`, `admin`, `approvals`, `imports`, `email`, `about`, `contact`, `terms`, and `privacy`.
- [ ] Add `setRoute(route, params)` and click handlers for `data-route` and `data-product-id`.
- [ ] Keep existing Supabase product loading intact.

### Task 2: Add Public In-Between Pages

**Files:**
- Modify: `src/app.js`
- Modify: `src/styles.css`

- [ ] Add product detail page with price, image placeholder, color/size selectors, reseller CTA, and no exact stock.
- [ ] Add reseller application page with business/contact fields and submitted state.
- [ ] Add login page explaining reseller/admin access.
- [ ] Add About, Contact, Terms, and Privacy pages.

### Task 3: Add Reseller In-Between Pages

**Files:**
- Modify: `src/app.js`
- Modify: `src/styles.css`

- [ ] Add request history page with draft/submitted/approved/rejected examples.
- [ ] Add confirmation state for order request submission.
- [ ] Keep exact inventory visible only inside reseller/admin routes.

### Task 4: Add Admin In-Between Pages

**Files:**
- Modify: `src/app.js`
- Modify: `src/styles.css`

- [ ] Add approvals page for reseller applications and order requests.
- [ ] Add imports page for CSV/XLSX upload workflow preview.
- [ ] Add email center page for admin alerts and templates.
- [ ] Wire admin sidebar links to the new admin routes.

### Task 5: Verify

**Files:**
- Test: `src/app.js`
- Test: local static server

- [ ] Run `node --check src\app.js` and expect exit code 0.
- [ ] Run `Select-String -Path 'src\app.js','src\styles.css','index.html' -Pattern '[^\x00-\x7F]'` and expect no matches.
- [ ] Request `http://localhost:5173/` and expect HTTP 200.
- [ ] Request Supabase public products endpoint and expect HTTP 200.
