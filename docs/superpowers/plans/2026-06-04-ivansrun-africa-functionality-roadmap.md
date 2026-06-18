# Irunsvan Africa Functionality Roadmap

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:writing-plans` before implementing each phase. This roadmap is the master plan. Each phase should become its own task-level implementation plan before code changes.

**Goal:** Turn the current Irunsvan Africa static frontend into a company-ready ecommerce/reseller operations site backed by Supabase.

**Architecture:** Keep the public storefront, reseller portal, and admin operations as one static frontend deployed on Render, with Supabase providing Auth, Postgres, Storage, RLS, and Edge Functions. Move all business workflows away from local/sample state into authenticated Supabase reads/writes.

**Tech Stack:** Static HTML/CSS/JavaScript, Supabase Auth, Supabase Postgres with RLS, Supabase Storage, Supabase Edge Functions for email/import processing, Render Static Site.

---

## Execution Rule: Build, Test, Then Continue

Every phase and every meaningful task must be executed in this order:

1. Write or update the relevant test first.
2. Run that test and confirm it fails for the expected reason.
3. Implement the smallest working code change.
4. Run the same test again and confirm it passes.
5. Run the phase-level verification commands.
6. Fix any failure immediately.
7. Only move to the next task after the current task is verified.

Do not stack multiple features and test later. If a task changes reseller ordering, test reseller ordering before starting admin approvals. If a task changes admin theme controls, test admin theme controls before starting import logic.

Minimum verification after each task:

```powershell
npm.cmd test
npm.cmd run check
```

Minimum verification after each phase:

```powershell
npm.cmd test
npm.cmd run check
npm.cmd run build
```

For UI-visible work, also run the relevant browser/manual test immediately before continuing.

For Supabase/RLS work, also run the relevant SQL/security verification immediately before continuing.

If any verification fails, stop the phase, fix the failure, rerun the verification, and only then continue.

## Current State

The app currently has the right shape, but not enough real workflow.

Working or partially working:

- Public catalog reads products and variants from Supabase.
- Public homepage exists and has a dynamic hero/theme control model.
- Admin pages exist visually.
- Reseller portal exists visually.
- Supabase schema exists for products, variants, inventory, reseller applications, order requests, import jobs, and site controls.
- Render static build exists through `npm run build`.

Still demo/prototype:

- Login does not authenticate users.
- Role-based access is not enforced in the frontend.
- Reseller portal uses `sampleStock`.
- Order request submission does not write to Supabase.
- Order history is static.
- Admin approvals do not update database rows.
- Admin Site Controls save to `localStorage`, not Supabase.
- Import UI does not parse/upload files.
- Product images are placeholders.
- Email notifications are not implemented.
- Deployment is not finalized because GitHub push/auth was previously blocked.

## Product Roles

### Public Visitor

Public visitors can:

- Browse published shoes.
- View product details and prices.
- Search/filter the catalog.
- Apply to become a reseller.
- Contact the company.

Public visitors cannot:

- See exact stock.
- Submit order requests.
- Access admin or reseller screens.

### Pending Reseller

Pending resellers can:

- Sign in.
- See their application status.
- Browse public products.

Pending resellers cannot:

- See exact stock.
- Submit order requests.

### Approved Reseller

Approved resellers can:

- Sign in.
- View live exact inventory by SKU, size, and color.
- Search/filter inventory.
- Build an order request cart.
- Submit order requests.
- View order history and order details.
- See admin status updates and notes.

### Admin

Admins can:

- Sign in.
- Approve/reject reseller applications.
- View all reseller accounts.
- View, approve, reject, and fulfill order requests.
- Add admin notes.
- Upload product catalog CSV files.
- Upload inventory XLSX/CSV files.
- Manage homepage hero, theme, holiday colors, reseller banner, and featured products.
- Manage product visibility.
- Receive operational email notifications.

## Phase 0: Stabilize The Current Local App

**Goal:** Make the current local frontend reliable before adding more business logic.

**Files:**

- Modify: `src/app.js`
- Modify: `src/styles.css`
- Modify: `src/site-controls.js`
- Modify: `tests/site-controls.test.js`
- Modify: `package.json`
- Verify: `index.html`
- Verify: `render.yaml`

**Tasks:**

1. Remove or replace remaining sample labels that make the app look like a demo.
2. Keep fallback product data only as an offline error state, not as normal business data.
3. Add a visible loading state for catalog, inventory, applications, orders, and site settings.
4. Add a visible error state when Supabase calls fail.
5. Keep browser layout checks for desktop and mobile before every deployment.

**Verification commands:**

```powershell
npm.cmd test
npm.cmd run check
npm.cmd run build
```

**Done when:**

- Local root URL renders without white screen.
- Public catalog shows Supabase data or a clear error message.
- No visible “demo” or “simulation” language remains.
- App still builds into `dist`.

## Phase 1: Supabase Auth And Role-Gated Routing

**Goal:** Make login real and enforce public/reseller/admin access.

**Files:**

- Create: `src/supabase-client.js`
- Create: `src/auth.js`
- Create: `tests/auth-state.test.js`
- Modify: `src/app.js`
- Modify: `src/styles.css`
- Verify: `supabase/sql/001_backend_schema.sql`
- Verify: `supabase/sql/002_backend_seed_admin.sql`

**Data involved:**

- `auth.users`
- `public.profiles`
- `public.reseller_applications`

**Frontend behavior:**

- On page load, fetch current Supabase session.
- Fetch current profile from `profiles`.
- Store auth state:
  - `user`
  - `profile`
  - `role`
  - `authLoading`
  - `authError`
- Login form calls Supabase Auth.
- Logout button clears session.
- Route guards:
  - Public routes always allowed.
  - Reseller routes require role `reseller`.
  - Admin routes require role `admin`.
  - Pending users see an application status page.

**Security rules:**

- Frontend route guards are for UX only.
- Supabase RLS remains the real security boundary.
- Never trust user-editable metadata for authorization.
- Role checks must come from `profiles.role`.

**User flows:**

- Public user clicks Reseller Portal.
- If not logged in, user is sent to login.
- If logged in as pending reseller, user sees “Application pending.”
- If logged in as approved reseller, inventory loads.
- If logged in as admin, admin panel loads.

**Tests:**

- `auth-state.test.js` should verify:
  - unauthenticated users cannot enter reseller/admin routes.
  - `pending_reseller` cannot enter reseller portal.
  - `reseller` can enter reseller portal.
  - `admin` can enter admin routes.

**Verification commands:**

```powershell
npm.cmd test
npm.cmd run check
npm.cmd run build
```

**Done when:**

- Login is not a fake form.
- Reseller/admin screens are blocked unless the role is correct.
- Manual browser testing confirms role redirects.

## Phase 2: Real Reseller Inventory Portal

**Goal:** Replace `sampleStock` with live Supabase inventory and make the reseller portal operational.

**Files:**

- Create: `src/reseller-data.js`
- Create: `src/order-cart.js`
- Create: `tests/order-cart.test.js`
- Modify: `src/app.js`
- Modify: `src/styles.css`
- Verify: `supabase/sql/001_backend_schema.sql`
- Verify: `supabase/sql/006_public_catalog_policy_fix.sql`

**Data involved:**

- `products`
- `product_variants`
- `inventory`
- `profiles`

**Inventory query design:**

Approved reseller needs a joined inventory view:

- product id
- product name
- product SKU
- variant id
- variant SKU
- color
- size
- price
- currency
- exact stock
- image reference

Preferred backend improvement:

- Create a Supabase/Postgres view named `reseller_inventory_view`.
- Use `security_invoker = true` where supported.
- RLS still controls underlying table access.

**Portal features:**

- Search by SKU, product name, color, and size.
- Filter by:
  - in stock
  - low stock
  - product/category
  - color
  - size
- Sort by:
  - SKU
  - product
  - stock low to high
  - stock high to low
  - price
- Quantity input per SKU.
- Add to order cart.
- Prevent quantity below 0.
- Prevent quantity above exact stock.
- Show line total.
- Show cart subtotal.

**Cart behavior:**

- Cart stores selected variant IDs and quantities.
- If a quantity becomes 0, remove from cart.
- If stock changes and cart quantity exceeds stock, clamp quantity and show warning.
- Cart survives route changes during the same session.
- Cart can be cleared.

**Tests:**

- `order-cart.test.js` should verify:
  - adding quantity creates line item.
  - increasing quantity updates same line.
  - quantity cannot exceed stock.
  - zero removes item.
  - subtotal uses quantity multiplied by price.

**Done when:**

- `sampleStock` is removed from normal portal rendering.
- Portal shows exact stock from Supabase for approved resellers.
- Search/filter/sort work locally.
- Cart reflects selected quantities accurately.

## Phase 3: Real Order Request Submission

**Goal:** Submitted reseller orders create real rows in Supabase.

**Files:**

- Create: `src/order-requests.js`
- Create: `tests/order-submit.test.js`
- Modify: `src/app.js`
- Modify: `src/styles.css`
- Verify: `supabase/sql/001_backend_schema.sql`
- Verify: `supabase/sql/005_backend_order_item_insert_policy_merge.sql`

**Data involved:**

- `order_requests`
- `order_request_items`
- `inventory`
- `product_variants`
- `products`

**Submission rules:**

- Reseller must be authenticated and approved.
- Cart must have at least one item.
- Each item quantity must be positive.
- Each item quantity must be less than or equal to current stock.
- Submitting an order request does not deduct stock.
- Admin approval does not automatically deduct stock in V1.
- Stock remains controlled by import/admin processing.

**Submission flow:**

1. Reseller adds quantities to cart.
2. Reseller enters optional notes.
3. App refreshes selected SKU stock before submit.
4. App blocks any item that now exceeds stock.
5. App creates `order_requests` row with status `submitted`.
6. App inserts `order_request_items`.
7. App clears cart.
8. App shows confirmation number.
9. App sends admin email through Edge Function in a later phase.

**Error states:**

- Not signed in.
- Not approved reseller.
- Empty cart.
- Quantity exceeds stock.
- Product/variant no longer available.
- Supabase insert failed.

**Tests:**

- Verify payload builder creates one order row and multiple item rows.
- Verify over-stock request is rejected before insert.
- Verify empty cart cannot submit.

**Done when:**

- Reseller can submit a real order request.
- Supabase contains the order and items.
- UI shows submitted request ID.

## Phase 4: Real Order History And Order Detail

**Goal:** Reseller can track real submitted orders.

**Files:**

- Create: `src/order-history.js`
- Create: `tests/order-history.test.js`
- Modify: `src/app.js`
- Modify: `src/styles.css`

**Data involved:**

- `order_requests`
- `order_request_items`

**Features:**

- List current reseller’s order requests.
- Show status.
- Show created date.
- Show item count.
- Show total units.
- Show estimated total.
- Detail view for each order.
- Show admin notes if present.
- Show rejection reason if rejected.

**Statuses:**

- submitted
- approved
- rejected
- fulfilled
- cancelled

**Done when:**

- Static `historyRows` are removed from normal rendering.
- Reseller sees only their own orders.
- Order detail shows the actual SKU lines.

## Phase 5: Admin Order Review

**Goal:** Admin can process real order requests.

**Files:**

- Create: `src/admin-orders.js`
- Create: `tests/admin-orders.test.js`
- Modify: `src/app.js`
- Modify: `src/styles.css`

**Data involved:**

- `order_requests`
- `order_request_items`
- `profiles`
- `inventory`

**Admin features:**

- List all submitted order requests.
- Filter by status.
- Open request detail.
- See reseller company/contact.
- See each requested SKU against current stock.
- Approve order.
- Reject order.
- Mark fulfilled.
- Add admin notes.

**Business rules:**

- Admin can approve even if stock changed, but UI must warn.
- Admin notes are saved to `admin_notes`.
- Status transitions:
  - submitted → approved
  - submitted → rejected
  - approved → fulfilled
  - submitted/approved → cancelled only if business allows later

**Done when:**

- Admin approval buttons update Supabase.
- Reseller order history reflects new status.
- Admin no longer sees sample order requests.

## Phase 6: Reseller Applications

**Goal:** Public applications and admin approval become real.

**Files:**

- Create: `src/applications.js`
- Create: `tests/applications.test.js`
- Modify: `src/app.js`
- Modify: `src/styles.css`

**Data involved:**

- `profiles`
- `reseller_applications`

**Public apply flow:**

- Visitor fills reseller application.
- If not signed in, user is invited to create/sign in.
- Application creates `reseller_applications` row.
- Profile role remains `pending_reseller`.

**Admin flow:**

- Admin views pending applications.
- Admin approves/rejects.
- Approval sets `reseller_applications.status = approved`.
- Approval sets `profiles.role = reseller`.
- Rejection sets application status and optional review note.

**Done when:**

- Static `resellerApplications` are removed from admin rendering.
- Approved user can access reseller portal after approval.

## Phase 7: Admin Site Controls To Supabase

**Goal:** Admin Site Controls publish to Supabase, not localStorage.

**Files:**

- Modify: `src/site-controls.js`
- Create: `src/admin-site-controls.js`
- Create: `tests/site-controls-submit.test.js`
- Modify: `src/app.js`
- Modify: `src/styles.css`
- Verify: `supabase/sql/007_site_controls.sql`

**Data involved:**

- `hero_sections`
- `site_themes`
- `site_content`

**Features:**

- Load active hero/theme/content from Supabase.
- Admin edits hero.
- Admin edits theme colors.
- Admin edits reseller banner.
- Admin saves draft locally only if offline.
- Admin publishes active rows to Supabase.
- Public storefront reads active rows.

**Admin controls:**

- Hero eyebrow.
- Hero title.
- Hero copy.
- Hero background image path.
- Primary CTA label/route.
- Secondary CTA label/route.
- Electricity effect toggle.
- Theme name.
- Primary color.
- Dark primary color.
- Background color.
- Surface color.
- Electric accent color.
- Deep header color.
- Reseller banner.

**Future scheduling:**

- Add `starts_at` and `ends_at` support for holiday themes.
- Keep only one active theme for V1.

**Done when:**

- Admin changes persist across devices.
- LocalStorage is fallback only.
- Public site updates after refresh.

## Phase 8: Product Images And Storage

**Goal:** Replace placeholder shoe cards with real product imagery.

**Files:**

- Create: `src/product-images.js`
- Create: `tests/product-images.test.js`
- Modify: `src/app.js`
- Modify: `src/styles.css`
- Add SQL/storage policy file if needed.

**Data involved:**

- `products.image_names`
- `product_variants.image_name`
- Supabase Storage bucket, likely `product-images`

**Features:**

- Admin uploads product images.
- Images are stored in Supabase Storage.
- Product/variant rows reference image paths.
- Storefront uses real image when available.
- Placeholder only appears when no image exists.

**Storage rules:**

- Public can read product images.
- Admin can upload/update/delete product images.
- Resellers do not need write access.

**Done when:**

- Product cards show real images for available image paths.
- Product detail page shows image gallery.

## Phase 9: Inventory And Catalog Imports

**Goal:** Admin uploads CSV/XLSX files and updates products, variants, and inventory.

**Files:**

- Create: `src/import-parser.js`
- Create: `src/admin-imports.js`
- Create: `tests/import-parser.test.js`
- Modify: `src/app.js`
- Modify: `src/styles.css`
- Add Edge Function later if browser parsing becomes too heavy.

**Data involved:**

- `products`
- `product_variants`
- `inventory`
- `import_jobs`

**Import flow:**

1. Admin selects catalog CSV or inventory XLSX/CSV.
2. App parses file.
3. App validates required columns.
4. App previews rows.
5. App shows skipped rows and errors.
6. Admin confirms import.
7. App upserts products/variants/inventory.
8. App writes `import_jobs` summary.

**Validation rules:**

- SKU required.
- Product name required for product catalog.
- Price must be numeric or empty.
- Stock must be non-negative integer.
- Currency must be 3 letters.
- Duplicate SKUs must be reported.

**Done when:**

- Admin can update inventory without editing Supabase manually.
- Import report shows processed and skipped rows.

## Phase 10: Email Notifications

**Goal:** Company receives operational emails for applications and order requests.

**Files:**

- Create: `supabase/functions/send-order-email/index.ts`
- Create: `supabase/functions/send-application-email/index.ts`
- Modify: `src/order-requests.js`
- Modify: `src/applications.js`

**Events:**

- New reseller application → email admin.
- New order request → email admin.
- Order approved/rejected → email reseller.
- Application approved/rejected → email applicant/reseller.

**Recommended email provider:**

- Resend, SendGrid, or Postmark.

**Email contents for new order:**

- Request ID.
- Reseller company.
- Reseller email.
- Total SKUs.
- Total units.
- Estimated total.
- Notes.
- Link to admin order detail.

**Done when:**

- Submit order sends admin email.
- Approve/reject sends reseller email.
- Failures are logged but do not break database writes.

## Phase 11: Public Storefront Polish

**Goal:** Make public browsing feel like a real ecommerce catalog.

**Files:**

- Modify: `src/app.js`
- Modify: `src/styles.css`
- Create focused modules if `app.js` becomes too large.

**Features:**

- Search actually filters products.
- Category filters work.
- Size filters work from variant data.
- Sort works.
- Product detail page shows:
  - gallery
  - variants
  - available public options
  - reseller CTA
  - related products
- Public site hides exact stock.
- Public site never shows reseller-only controls.

**Done when:**

- Public visitor can browse naturally and understand how to become reseller.

## Phase 12: Mobile And UX Hardening

**Goal:** The site works cleanly on phones, tablets, and desktop.

**Screens to verify:**

- Public homepage.
- Product catalog.
- Product detail.
- Login.
- Reseller portal inventory table.
- Order cart.
- Order history.
- Admin dashboard.
- Admin order detail.
- Admin site controls.
- Admin imports.

**UX requirements:**

- No horizontal overflow.
- Tables have usable mobile layout.
- Buttons are not too small.
- Header does not cover content.
- Hero fits first viewport where practical.
- Error states are readable.
- Empty states are useful.

**Done when:**

- Manual screenshots pass at 390px, 768px, 1440px widths.

## Phase 13: Deployment Readiness

**Goal:** Render deployment works reliably and reflects GitHub.

**Files:**

- Verify: `render.yaml`
- Verify: `package.json`
- Verify: `index.html`
- Verify: `.gitignore`

**Steps:**

1. Clean the working tree intentionally.
2. Commit functionality in logical commits.
3. Fix GitHub auth for `tovtech26/irunsvan`.
4. Push `main`.
5. Render static site settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Root directory: blank
   - Rewrite: `/*` → `/index.html`
6. Apply Supabase SQL in order.
7. Create admin user.
8. Test public/reseller/admin flows from deployed URL.

**Done when:**

- Render URL works.
- Supabase auth works from Render domain.
- Admin can log in from Render.
- Reseller can submit order from Render.

## Phase 14: Company Acceptance Checklist

**Public:**

- Homepage loads.
- Catalog loads.
- Product detail works.
- Reseller application submits.

**Reseller:**

- Approved reseller logs in.
- Exact stock loads.
- Search/filter works.
- Order request submits.
- Order appears in history.
- Rejected/approved status appears after admin action.

**Admin:**

- Admin logs in.
- Admin approves reseller.
- Admin reviews order.
- Admin edits hero/theme.
- Admin uploads inventory file.
- Admin receives email notification.

**Security:**

- Public cannot see exact stock.
- Pending reseller cannot submit orders.
- Reseller cannot access admin.
- Reseller cannot read another reseller’s orders.
- Admin-only writes are blocked for non-admin users.

**Deployment:**

- Render deploy succeeds.
- No white screen.
- No console crash.
- Hard refresh works.
- Mobile layout is usable.

## Real Test Plan

The implementation must not rely on visual inspection alone. Each phase needs automated tests plus a manual browser acceptance path. The project can stay lightweight, but the tests must exercise real business rules, not only syntax.

### Test Stack To Add

Use Node's built-in test runner first. Add Playwright only when browser behavior needs real DOM interaction.

**Files to create:**

- `tests/helpers/mock-supabase.js`
- `tests/auth-state.test.js`
- `tests/order-cart.test.js`
- `tests/order-submit.test.js`
- `tests/order-history.test.js`
- `tests/admin-orders.test.js`
- `tests/applications.test.js`
- `tests/site-controls-submit.test.js`
- `tests/import-parser.test.js`
- `tests/security-rls.sql`
- `tests/browser/public-storefront.spec.js`
- `tests/browser/reseller-portal.spec.js`
- `tests/browser/admin-controls.spec.js`

**Package scripts to add:**

```json
{
  "scripts": {
    "test": "node tests/site-controls.test.js && node tests/auth-state.test.js && node tests/order-cart.test.js && node tests/order-submit.test.js && node tests/order-history.test.js && node tests/admin-orders.test.js && node tests/applications.test.js && node tests/site-controls-submit.test.js && node tests/import-parser.test.js",
    "test:browser": "playwright test tests/browser",
    "check": "node --check src/site-controls.js && node --check src/app.js",
    "build": "node scripts/build-static.js"
  }
}
```

The exact script can be split later if a test file becomes slow, but every business module must be included before a phase is marked complete.

### Shared Mock Supabase Helper

Create `tests/helpers/mock-supabase.js` so tests can verify requests without calling the real database.

```js
function createMockSupabase(routes = {}) {
  const calls = [];

  async function fetchMock(url, options = {}) {
    const parsed = new URL(url);
    const table = parsed.pathname.split("/").pop();
    const method = options.method || "GET";
    const key = `${method} ${table}`;
    calls.push({ table, method, url: String(url), options });

    if (!routes[key]) {
      return {
        ok: false,
        status: 404,
        json: async () => ({ message: `No mock route for ${key}` }),
      };
    }

    const result = typeof routes[key] === "function" ? routes[key]({ table, method, url, options, calls }) : routes[key];
    return {
      ok: result.ok !== false,
      status: result.status || 200,
      json: async () => result.body ?? result,
    };
  }

  return { fetchMock, calls };
}

module.exports = { createMockSupabase };
```

### Auth Tests

Create `tests/auth-state.test.js`.

```js
const assert = require("node:assert/strict");
const {
  canAccessRoute,
  normalizeAuthState,
} = require("../src/auth.js");

assert.deepEqual(
  normalizeAuthState({ user: null, profile: null }),
  { user: null, profile: null, role: "public", isAdmin: false, isReseller: false, isPending: false },
);

assert.equal(canAccessRoute("reseller", { role: "public" }), false);
assert.equal(canAccessRoute("reseller", { role: "pending_reseller" }), false);
assert.equal(canAccessRoute("reseller", { role: "reseller" }), true);
assert.equal(canAccessRoute("admin", { role: "reseller" }), false);
assert.equal(canAccessRoute("admin", { role: "admin" }), true);

console.log("auth-state tests passed");
```

Expected red step before implementation:

```powershell
node tests\auth-state.test.js
```

Expected failure:

```text
Error: Cannot find module '../src/auth.js'
```

Expected green step after implementation:

```text
auth-state tests passed
```

### Order Cart Tests

Create `tests/order-cart.test.js`.

```js
const assert = require("node:assert/strict");
const {
  createEmptyCart,
  setCartQuantity,
  cartLines,
  cartSubtotal,
  cartTotalUnits,
} = require("../src/order-cart.js");

const variant = {
  variant_id: "variant-001",
  sku: "202300100138",
  product_name: "IRUNSVAN 001 Running Shoe",
  colour: "Bright Orange / Ocean Blue",
  size: "38",
  base_price: 30,
  stock_quantity: 117,
};

let cart = createEmptyCart();
cart = setCartQuantity(cart, variant, 4);

assert.equal(cartLines(cart).length, 1);
assert.equal(cartLines(cart)[0].quantity, 4);
assert.equal(cartTotalUnits(cart), 4);
assert.equal(cartSubtotal(cart), 120);

cart = setCartQuantity(cart, variant, 999);
assert.equal(cartLines(cart)[0].quantity, 117);
assert.equal(cartTotalUnits(cart), 117);

cart = setCartQuantity(cart, variant, 0);
assert.equal(cartLines(cart).length, 0);
assert.equal(cartSubtotal(cart), 0);

console.log("order-cart tests passed");
```

Expected business coverage:

- Adds SKU to cart.
- Updates existing SKU quantity.
- Clamps request to exact stock.
- Removes SKU when quantity is zero.
- Calculates subtotal from live quantity and price.

### Order Submit Tests

Create `tests/order-submit.test.js`.

```js
const assert = require("node:assert/strict");
const {
  buildOrderRequestPayload,
  validateOrderRequest,
} = require("../src/order-requests.js");

const resellerId = "00000000-0000-0000-0000-000000000001";
const validCart = [
  {
    variant_id: "variant-001",
    sku: "202300100138",
    product_name: "IRUNSVAN 001 Running Shoe",
    colour: "Bright Orange / Ocean Blue",
    size: "38",
    quantity: 4,
    stock_quantity: 117,
    base_price: 30,
    base_currency: "USD",
  },
];

assert.deepEqual(validateOrderRequest(validCart), []);

const payload = buildOrderRequestPayload({
  resellerId,
  notes: "Ship with next available container.",
  cartLines: validCart,
});

assert.equal(payload.order.reseller_id, resellerId);
assert.equal(payload.order.status, "submitted");
assert.equal(payload.items.length, 1);
assert.equal(payload.items[0].quantity, 4);
assert.equal(payload.items[0].sku, "202300100138");

const invalid = validateOrderRequest([{ ...validCart[0], quantity: 118 }]);
assert.equal(invalid[0].code, "quantity_exceeds_stock");

const empty = validateOrderRequest([]);
assert.equal(empty[0].code, "empty_cart");

console.log("order-submit tests passed");
```

Expected business coverage:

- Empty cart blocked.
- Over-stock request blocked.
- Valid request builds one order row and item rows.
- Payload includes reseller ID, notes, SKU, product, size, color, quantity, price, and currency.

### Order History Tests

Create `tests/order-history.test.js`.

```js
const assert = require("node:assert/strict");
const {
  summarizeOrder,
  orderStatusLabel,
  canResellerViewOrder,
} = require("../src/order-history.js");

const order = {
  id: "order-001",
  reseller_id: "reseller-001",
  status: "approved",
  admin_notes: "Approved for pickup Friday.",
  order_request_items: [
    { quantity: 4, base_price: 30 },
    { quantity: 2, base_price: 36 },
  ],
};

assert.deepEqual(summarizeOrder(order), {
  itemCount: 2,
  totalUnits: 6,
  estimatedTotal: 192,
});

assert.equal(orderStatusLabel("submitted"), "Submitted");
assert.equal(orderStatusLabel("approved"), "Approved");
assert.equal(canResellerViewOrder(order, "reseller-001"), true);
assert.equal(canResellerViewOrder(order, "another-reseller"), false);

console.log("order-history tests passed");
```

Expected business coverage:

- Reseller sees only their own orders.
- Totals are calculated from order items.
- Status labels are consistent.
- Admin notes can be displayed when present.

### Admin Order Review Tests

Create `tests/admin-orders.test.js`.

```js
const assert = require("node:assert/strict");
const {
  canTransitionOrderStatus,
  buildAdminOrderUpdate,
  stockWarningsForOrder,
} = require("../src/admin-orders.js");

assert.equal(canTransitionOrderStatus("submitted", "approved"), true);
assert.equal(canTransitionOrderStatus("submitted", "rejected"), true);
assert.equal(canTransitionOrderStatus("approved", "fulfilled"), true);
assert.equal(canTransitionOrderStatus("fulfilled", "approved"), false);

assert.deepEqual(
  buildAdminOrderUpdate({ status: "approved", adminNotes: "Ready for invoice." }),
  { status: "approved", admin_notes: "Ready for invoice." },
);

const warnings = stockWarningsForOrder([
  { sku: "SKU-1", quantity: 10, stock_quantity: 4 },
  { sku: "SKU-2", quantity: 2, stock_quantity: 9 },
]);

assert.equal(warnings.length, 1);
assert.equal(warnings[0].sku, "SKU-1");
assert.equal(warnings[0].code, "requested_quantity_above_current_stock");

console.log("admin-orders tests passed");
```

Expected business coverage:

- Admin status transition rules are enforced.
- Admin notes map to database field.
- Admin sees stock warnings before approval.

### Reseller Application Tests

Create `tests/applications.test.js`.

```js
const assert = require("node:assert/strict");
const {
  buildApplicationPayload,
  buildApplicationApprovalUpdates,
  validateApplication,
} = require("../src/applications.js");

const form = {
  userId: "user-001",
  email: "buyer@example.com",
  fullName: "Ivan Buyer",
  companyName: "Africa Runner Supply",
  phone: "+26770000000",
  country: "Botswana",
  message: "We resell athletic footwear.",
};

assert.deepEqual(validateApplication(form), []);

const payload = buildApplicationPayload(form);
assert.equal(payload.status, "pending");
assert.equal(payload.company_name, "Africa Runner Supply");
assert.equal(payload.email, "buyer@example.com");

const updates = buildApplicationApprovalUpdates({
  applicationId: "application-001",
  userId: "user-001",
  reviewerId: "admin-001",
  status: "approved",
});

assert.equal(updates.application.status, "approved");
assert.equal(updates.application.reviewed_by, "admin-001");
assert.equal(updates.profile.role, "reseller");

const rejected = buildApplicationApprovalUpdates({
  applicationId: "application-001",
  userId: "user-001",
  reviewerId: "admin-001",
  status: "rejected",
});

assert.equal(rejected.profile.role, "pending_reseller");

console.log("applications tests passed");
```

Expected business coverage:

- Required application fields are validated.
- New applications start as pending.
- Approval updates application and profile role.
- Rejection does not grant reseller role.

### Site Controls Publish Tests

Create `tests/site-controls-submit.test.js`.

```js
const assert = require("node:assert/strict");
const {
  buildHeroSectionPayload,
  buildSiteThemePayload,
  buildSiteContentPayload,
} = require("../src/admin-site-controls.js");

const hero = buildHeroSectionPayload({
  eyebrow: "Holiday Mode",
  title: "Black Friday running stock.",
  copy: "Limited seasonal buying window for approved resellers.",
  backgroundImage: "/Flyer Templates/Flyer Template.jpg",
  primaryCta: "Shop Stock",
  primaryRoute: "catalog",
  secondaryCta: "Apply",
  secondaryRoute: "apply",
  electricity: true,
});

assert.equal(hero.active, true);
assert.equal(hero.background_image, "/Flyer Templates/Flyer Template.jpg");
assert.equal(hero.primary_route, "catalog");

const theme = buildSiteThemePayload({
  name: "Black Friday",
  primary: "#111827",
  primaryDark: "#000000",
  background: "#f9fafb",
  surface: "#e5e7eb",
  accent: "#38bdf8",
  text: "#111827",
  deep: "#030712",
});

assert.equal(theme.active, true);
assert.equal(theme.primary_color, "#111827");
assert.equal(theme.accent_color, "#38bdf8");

const content = buildSiteContentPayload({
  banner: "Black Friday wholesale ordering is open for approved resellers.",
});

assert.equal(content.active, true);
assert.equal(content.reseller_banner, "Black Friday wholesale ordering is open for approved resellers.");

console.log("site-controls-submit tests passed");
```

Expected business coverage:

- Admin hero fields map to `hero_sections`.
- Admin colors map to `site_themes`.
- Banner maps to `site_content`.
- Published rows are active.

### Import Parser Tests

Create `tests/import-parser.test.js`.

```js
const assert = require("node:assert/strict");
const {
  parseCatalogRows,
  parseInventoryRows,
  validateCatalogRows,
  validateInventoryRows,
} = require("../src/import-parser.js");

const catalogRows = parseCatalogRows([
  {
    SKU: "202300100138",
    Name: "IRUNSVAN 001 Running Shoe",
    Price: "30",
    Category: "Running Shoes",
    Color: "Bright Orange / Ocean Blue",
    Size: "38",
    Images: "001-1.jpg",
  },
]);

assert.equal(catalogRows[0].sku, "202300100138");
assert.equal(catalogRows[0].base_price, 30);
assert.equal(validateCatalogRows(catalogRows).length, 0);

const inventoryRows = parseInventoryRows([
  {
    SKU: "202300100138",
    "Style Code": "001",
    Stock: "117",
    Source: "MASTER INVENTORY FILE.xlsx",
  },
]);

assert.equal(inventoryRows[0].stock_quantity, 117);
assert.equal(validateInventoryRows(inventoryRows).length, 0);

const invalidInventory = parseInventoryRows([{ SKU: "", Stock: "-5" }]);
const errors = validateInventoryRows(invalidInventory);
assert.equal(errors.length, 2);
assert.equal(errors[0].code, "missing_sku");
assert.equal(errors[1].code, "invalid_stock_quantity");

console.log("import-parser tests passed");
```

Expected business coverage:

- Catalog rows normalize SKU, product name, price, category, color, size, image filename.
- Inventory rows normalize SKU, style code, stock, source.
- Missing SKU is rejected.
- Negative stock is rejected.

### RLS Security Tests

Create `tests/security-rls.sql`. Run this against a test Supabase database after migrations are applied.

```sql
-- Expected setup:
-- - one admin profile
-- - one approved reseller profile
-- - one pending reseller profile
-- - one order for approved reseller
-- - one order for another reseller

-- Public can read published products.
set local role anon;
select count(*) >= 1 as public_can_read_products
from public.products
where published = true;

-- Public cannot read inventory.
set local role anon;
do $$
begin
  perform * from public.inventory limit 1;
  raise exception 'anon inventory read should have failed';
exception
  when insufficient_privilege then null;
end $$;

-- Authenticated non-admin cannot update site themes.
set local role authenticated;
do $$
begin
  update public.site_themes set primary_color = '#000000';
  raise exception 'non-admin site theme update should have failed';
exception
  when insufficient_privilege then null;
end $$;

-- Reseller cannot read another reseller order through RLS.
-- This assertion must be executed with a JWT/session for the reseller user.
-- Expected query result: zero rows for another reseller's order id.
select count(*) = 0 as reseller_cannot_read_other_orders
from public.order_requests
where id = '00000000-0000-0000-0000-000000000999';
```

For real Supabase verification, run RLS tests through MCP/SQL with authenticated JWT contexts where possible. If direct role simulation is not enough for auth policies, create a small manual security checklist using real admin/reseller accounts.

### Browser Tests

Add Playwright after the first real auth flow exists.

Create `tests/browser/public-storefront.spec.js`.

```js
const { test, expect } = require("@playwright/test");

test("public storefront loads catalog without exact stock", async ({ page }) => {
  await page.goto("http://127.0.0.1:5175/");
  await expect(page.getByRole("heading", { name: /Irunsvan Africa products/i })).toBeVisible();
  await expect(page.getByText(/Exact Stock/i)).toHaveCount(0);
  await expect(page.getByRole("button", { name: /View details/i }).first()).toBeVisible();
});
```

Create `tests/browser/reseller-portal.spec.js`.

```js
const { test, expect } = require("@playwright/test");

test("approved reseller can add stock to order request", async ({ page }) => {
  await page.goto("http://127.0.0.1:5175/");
  await page.getByRole("button", { name: "Login" }).click();
  await page.getByLabel("Email").fill("reseller@example.com");
  await page.getByLabel("Password").fill("password-for-local-test");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Reseller Portal" }).click();
  await expect(page.getByRole("heading", { name: /Reseller Dashboard/i })).toBeVisible();
  await page.getByRole("spinbutton").first().fill("2");
  await expect(page.getByText(/Subtotal/i)).toBeVisible();
});
```

Create `tests/browser/admin-controls.spec.js`.

```js
const { test, expect } = require("@playwright/test");

test("admin can open site controls", async ({ page }) => {
  await page.goto("http://127.0.0.1:5175/");
  await page.getByRole("button", { name: "Admin" }).click();
  await expect(page.getByRole("heading", { name: /Irunsvan Africa Operations/i })).toBeVisible();
  await page.getByRole("button", { name: "Site Controls" }).click();
  await expect(page.getByRole("heading", { name: "Site Controls" })).toBeVisible();
  await expect(page.getByLabel("Headline")).toBeVisible();
});
```

These browser tests must be updated after real auth is implemented so they use test accounts and do not bypass login.

### Manual Acceptance Tests

Run these manually before any company demo.

**Public visitor:**

1. Open homepage.
2. Confirm hero image renders.
3. Confirm catalog products render.
4. Confirm no exact stock is visible.
5. Open a product detail page.
6. Submit reseller application.

**Approved reseller:**

1. Log in as approved reseller.
2. Open reseller portal.
3. Search by SKU.
4. Filter by size.
5. Add a quantity below stock.
6. Try a quantity above stock and confirm it is blocked.
7. Submit order request.
8. Confirm request appears in order history.

**Admin:**

1. Log in as admin.
2. Open applications.
3. Approve a pending reseller.
4. Open order requests.
5. Approve an order request.
6. Add admin notes.
7. Open Site Controls.
8. Change theme color.
9. Publish and confirm public homepage updates.

### Phase Completion Test Gate

No phase is complete unless these pass:

```powershell
npm.cmd test
npm.cmd run check
npm.cmd run build
```

For browser-impacting phases, this must also pass:

```powershell
npx playwright test tests/browser
```

For Supabase/RLS phases, run:

```powershell
supabase --version
supabase db --help
```

Then run the phase SQL/RLS verification using Supabase MCP or the Supabase SQL editor if the local CLI is not authenticated.

### Immediate Verification Gate

After finishing any single task, do not begin the next task until the task has been verified.

Use this checklist after every task:

1. Re-run the specific test file for the task.
2. Re-run `npm.cmd run check`.
3. If the task changed rendered UI, open the affected local route and verify the screen manually or with Playwright.
4. If the task changed Supabase permissions, run the relevant SQL/RLS test before moving on.
5. Record any failure and fix it immediately.

Examples:

- After building `src/order-cart.js`, run `node tests\order-cart.test.js`, then `npm.cmd run check`.
- After building real order submission, run `node tests\order-submit.test.js`, then submit one local test order through the UI.
- After changing RLS policies, run `tests/security-rls.sql` or equivalent Supabase SQL checks before touching frontend code.
- After changing admin Site Controls, run `node tests\site-controls-submit.test.js`, then open Admin → Site Controls locally and verify save/publish behavior.

The rule is simple: **finish one thing, prove it works, then continue.**

## Recommended Implementation Order

1. Phase 0: Stabilize current app.
2. Phase 1: Real Auth and role-gated routing.
3. Phase 2: Real Reseller Inventory Portal.
4. Phase 3: Real Order Request Submission.
5. Phase 4: Real Order History.
6. Phase 5: Admin Order Review.
7. Phase 6: Reseller Applications.
8. Phase 7: Admin Site Controls to Supabase.
9. Phase 8: Product Images.
10. Phase 9: Imports.
11. Phase 10: Emails.
12. Phase 11: Storefront polish.
13. Phase 12: Mobile hardening.
14. Phase 13: Render deployment.
15. Phase 14: Company acceptance test.

## First Implementation Plan To Write Next

The first detailed implementation plan should be:

`2026-06-04-real-auth-and-role-routing-plan.md`

Reason:

- Every company-ready feature depends on knowing who is logged in.
- Admin writes must not exist before admin authorization is real.
- Reseller exact stock must not be exposed without approved reseller checks.

The second detailed implementation plan should be:

`2026-06-04-real-reseller-ordering-plan.md`

Reason:

- This removes the largest demo-feeling section: `sampleStock`.
- It creates immediate business value for the company.
