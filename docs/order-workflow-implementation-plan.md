# Order Workflow Implementation Plan

## Objective

Build a complete, safe order workflow around the existing reseller request system without deleting or replacing current data.

The app should end up with:

- a public product experience that works and matches the homepage theme
- an admin `Orders` command center
- a reseller `My Orders` page
- a shared `Order Detail` page
- invoice/payment states inside the order detail
- supplier-ready XLSX/CSV export
- reliable tests around routing, status transitions, and export format

Do not start over. Work with the current code.

## Current Code Context

Relevant files:

- [src/app.js](</C:/Users/TOV tech/Desktop/ivansrun website/src/app.js>)
- [src/admin-orders.js](</C:/Users/TOV tech/Desktop/ivansrun website/src/admin-orders.js>)
- [src/reseller-orders.js](</C:/Users/TOV tech/Desktop/ivansrun website/src/reseller-orders.js>)
- [src/mobile-navigation.js](</C:/Users/TOV tech/Desktop/ivansrun website/src/mobile-navigation.js>)
- [src/auth.js](</C:/Users/TOV tech/Desktop/ivansrun website/src/auth.js>)
- [src/styles.css](</C:/Users/TOV tech/Desktop/ivansrun website/src/styles.css>)
- [supabase/sql/001_backend_schema.sql](</C:/Users/TOV tech/Desktop/ivansrun website/supabase/sql/001_backend_schema.sql>)
- [supabase/sql/019_order_workflow_statuses.sql](</C:/Users/TOV tech/Desktop/ivansrun website/supabase/sql/019_order_workflow_statuses.sql>)

Existing request data lives in:

- `public.order_requests`
- `public.order_request_items`

Do not wipe these tables.

## Critical First Fixes

Before building new features, fix the obvious routing/data issues.

### 1. Add missing routes to `ROUTES` in [src/app.js](</C:/Users/TOV tech/Desktop/ivansrun website/src/app.js>)

Current problem:

`routeView()` contains:

```js
"current-orders": currentOrdersPage,
"expected-orders": expectedOrdersPage,
fulfillment: fulfillmentStatusPage,
```

But the top-level `ROUTES` array does not include these routes.

Add:

```js
"current-orders",
"expected-orders",
"fulfillment",
```

Later, when adding order detail, also add:

```js
"order"
```

### 2. Keep the `order_requests` fetch backward-compatible

Do not fetch newly planned database columns until the migration is actually applied and verified.

Use the safe current fetch:

```text
select=id,reseller_id,status,notes,admin_notes,created_at,updated_at&order=created_at.desc&limit=100
```

After migration is applied and verified, expand it.

### 3. Confirm backend rows exist

After Supabase MCP is authenticated, run:

```sql
select count(*) from public.order_requests;
select count(*) from public.order_request_items;
select id, reseller_id, status, created_at, updated_at
from public.order_requests
order by created_at desc
limit 20;
```

If rows exist but frontend is empty, debug frontend load/render.

If rows do not exist, stop and report before doing anything else.

## Status Model

Use this final status model:

```text
submitted
awaiting_payment
paid
submitted_to_supplier
processing
shipped
fulfilled
cancelled
rejected
```

Keep compatibility:

- Existing `approved` rows should behave like `awaiting_payment`.

Do not rename existing rows destructively.

Status meanings:

- `submitted`: reseller created the request
- `awaiting_payment`: admin agreed to supply and payment is needed
- `paid`: payment received
- `submitted_to_supplier`: supplier file/order sent
- `processing`: supplier/order is being prepared
- `shipped`: order has shipped
- `fulfilled`: order completed
- `cancelled`: cancelled
- `rejected`: cannot supply

## Phase 1: Harden Order Helper Logic

File:

- [src/admin-orders.js](</C:/Users/TOV tech/Desktop/ivansrun website/src/admin-orders.js>)

Create or refine these helper functions.

### 1. `normalizeOrderStatus(status)`

Return `awaiting_payment` when status is `approved`.

Return `submitted` for missing/unknown statuses.

Example:

```js
function normalizeOrderStatus(status) {
  if (status === "approved") return "awaiting_payment";
  if (ORDER_STATUS_META[status]) return status;
  return "submitted";
}
```

### 2. `ORDER_STATUS_META`

Include:

```text
submitted
awaiting_payment
paid
submitted_to_supplier
processing
shipped
fulfilled
cancelled
rejected
approved
draft
```

For `approved`, set bucket and label equivalent to `awaiting_payment`.

### 3. `buildAdminOrderRecords(requests, items)`

Ensure each record includes:

```text
id
code
status
normalizedStatus
statusMeta
notes
adminNotes
createdAt
updatedAt
totalItems
totalUnits
subtotal
```

Later, after migration:

```text
approvedAt
paidAt
supplierSubmittedAt
processingAt
shippedAt
fulfilledAt
invoiceNumber
paymentReference
supplierExportedAt
```

### 4. `buildClientOrderBuckets(records)`

Return:

```js
{
  new: [],
  awaitingPayment: [],
  active: [],
  shipped: [],
  fulfilled: [],
  closed: []
}
```

Map:

- `submitted` -> `new`
- `awaiting_payment` -> `awaitingPayment`
- `paid`, `submitted_to_supplier`, `processing` -> `active`
- `shipped` -> `shipped`
- `fulfilled` -> `fulfilled`
- `cancelled`, `rejected` -> `closed`

### 5. `nextAdminActions(status)`

Return action objects:

```js
{ status: "awaiting_payment", label: "Agree to Supply" }
{ status: "rejected", label: "Cannot Supply", tone: "secondary" }
{ status: "paid", label: "Mark Payment Received" }
{ status: "submitted_to_supplier", label: "Mark Sent to Supplier" }
{ status: "processing", label: "Mark Processing" }
{ status: "shipped", label: "Mark Shipped" }
{ status: "fulfilled", label: "Mark Fulfilled" }
```

### 6. `buildOrderStatusPatch(status, adminNotes, currentRequest)`

Set status and timestamps only when supported by DB.

For now, keep minimal:

```js
{
  status,
  admin_notes
}
```

After migration is verified, add timestamp fields.

## Phase 2: Routing

Files:

- [src/app.js](</C:/Users/TOV tech/Desktop/ivansrun website/src/app.js>)
- [src/mobile-navigation.js](</C:/Users/TOV tech/Desktop/ivansrun website/src/mobile-navigation.js>)
- [src/auth.js](</C:/Users/TOV tech/Desktop/ivansrun website/src/auth.js>)

### 1. Add route

```text
order
```

### 2. Add state

```js
selectedOrderId: initialRouteState.orderId || null
```

### 3. Update `setRoute(route, params)`

- If `params.orderId`, set `state.selectedOrderId`.
- Clear `selectedOrderId` when navigating away from order routes if needed.

### 4. Update `MobileNavigation.buildRouteUrl()`

```js
if (safeRoute === "order" && orderId) {
  return `#/order/${encodeURIComponent(orderId)}`;
}
```

### 5. Update `MobileNavigation.parseRouteUrl()`

Parse `#/order/<id>` into:

```js
{ route: "order", orderId: "..." }
```

### 6. Update `backTargetForRoute()`

```js
if (route === "order") return { route: "history" };
```

### 7. Update `Auth.RESELLER_ROUTES`

```text
order
```

### 8. Admin should also access `order`

Best option:

- allow route if admin or reseller.
- If auth route logic is too rigid, include `order` in reseller routes and `canAccessRoute()` already allows admin through reseller routes if coded that way. If not, adjust deliberately.

## Phase 3: Data Access Helpers

File:

- [src/app.js](</C:/Users/TOV tech/Desktop/ivansrun website/src/app.js>)

Add helpers:

```js
function orderRecordById(orderId) {}
function orderItemsFor(orderId) {}
function selectedOrderRecord() {}
function visibleOrderRecords() {}
function orderCompanyFor(record) {}
function orderStatusTimeline(record) {}
function orderActionLabel(action) {}
```

Rules:

- Admin sees all loaded orders.
- Reseller sees own orders.
- Do not hide all orders if `reseller_id` is missing in dev/test data; be careful with fallback behavior.
- On admin pages, always use full `requestHistoryRecords()`.

Important:

The previous `visibleRequestHistoryRecords()` filter hid orders. Do not repeat that mistake.

## Phase 4: Replace Scattered Reseller Pages With `My Orders`

File:

- [src/app.js](</C:/Users/TOV tech/Desktop/ivansrun website/src/app.js>)

Current:

- `requestHistory()`
- `currentOrdersPage()`
- `expectedOrdersPage()`
- `fulfillmentStatusPage()`

Target:

- Keep route `history`, but rename UI to `My Orders`.
- Use grouped sections inside one page.
- Keep old routes temporarily redirecting/rendering filtered views only if necessary, but navigation should mainly use `history`.

`My Orders` should show:

- Loading state
- Error state
- Empty state
- Grouped order sections:
  - New Requests
  - Awaiting Payment
  - Active Orders
  - Shipped
  - Fulfilled
  - Closed

Each order card:

- order code
- status
- total pairs
- total value
- date
- brief note
- button: `View Order`

Each card button:

```html
<button data-route="order" data-order-id="...">View Order</button>
```

Add support in `bindEvents()` for `orderId`:

```js
orderId: button.getAttribute("data-order-id")
```

## Phase 5: Admin `Orders` Page

File:

- [src/app.js](</C:/Users/TOV tech/Desktop/ivansrun website/src/app.js>)

Current:

`adminRequests()` renders `Product Requests`.

Change:

- Page title: `Orders`
- Admin sidebar label can remain `Requests` initially, but best final label is `Orders`.
- Group orders by workflow.

Sections:

- New Requests
- Awaiting Payment
- Paid / Ready for Supplier
- Supplier / Processing
- Shipped
- Fulfilled
- Closed

Admin order card:

- order code
- company/reseller
- status
- request total
- total units
- created date
- item preview
- next action buttons
- `Open Order`

Admin actions from list:

- `Agree to Supply`
- `Cannot Supply`
- `Mark Payment Received`
- `Mark Sent to Supplier`
- `Mark Processing`
- `Mark Shipped`
- `Mark Fulfilled`

Do not overload each card. Show max two primary next actions plus `Open Order`.

## Phase 6: Shared `Order Detail` Page

File:

- [src/app.js](</C:/Users/TOV tech/Desktop/ivansrun website/src/app.js>)

Create:

```js
function orderDetailPage() {}
```

Route:

```js
order: orderDetailPage
```

Layout:

- top back button
- order code
- status
- reseller/company
- created date
- timeline
- items
- invoice section
- payment section
- supplier export section
- fulfillment section
- notes

If no selected order:

- Show safe empty state:

```text
Order not found
```

- Button back to `My Orders` or `Admin Orders` depending on role.

Admin view:

- Show action controls.
- Show supplier export controls.
- Show payment controls.

Reseller view:

- No admin buttons.
- Show invoice/payment instructions.
- Show fulfillment status.

## Phase 7: Invoice Section

No separate invoice page for now.

Inside `Order Detail`, create:

```js
function orderInvoicePanel(record, items) {}
```

Data shown:

- invoice number
- invoice date
- order code
- reseller company
- line items
- quantity
- unit price
- line total
- subtotal
- payment status
- payment instructions

Invoice number format:

```text
INV-<last 8 chars of order id>
```

For now, invoice is generated visually from order data.

Do not create PDF yet.

Admin actions:

- `Generate Invoice` if status is `submitted`
- `Send Invoice` can be placeholder/copy for now unless email integration is ready
- `Mark Payment Received`

Reseller view:

- If `submitted`: `Awaiting admin approval`
- If `awaiting_payment`: show invoice/payment block
- If `paid`: show payment received

## Phase 8: Payment Section

Inside `Order Detail`, create:

```js
function orderPaymentPanel(record) {}
```

Admin controls:

- payment reference input
- payment note input
- payment date input
- button: `Mark Payment Received`

Initial minimal version:

- If we do not add DB fields yet, button only changes status to `paid`.
- After migration, save:

```text
payment_reference
payment_note
paid_at
```

Reseller sees:

- `Awaiting payment`
- `Payment received`
- `Payment reference` if available

## Phase 9: Supplier Export

Create new file:

- [src/order-export.js](</C:/Users/TOV tech/Desktop/ivansrun website/src/order-export.js>)

Load it in [index.html](</C:/Users/TOV tech/Desktop/ivansrun website/index.html>) before `app.js`.

Export module API:

```js
buildSupplierOrderRows({ order, items, inventory, variants, products })
buildSupplierWorkbookData({ order, items, inventory, variants, products })
downloadSupplierXlsx({ order, items, inventory, variants, products, XLSX })
downloadSupplierCsv(...)
```

XLSX requirements:

- Use SheetJS already lazy-loaded through `xlsx`.
- Use `ensureImportLibraries("order_xlsx")` or create a clearer helper.
- Do not load XLSX globally in `index.html`.

Workbook sheets:

### 1. `Order Summary`

- branded title
- order code
- reseller/company
- date
- status
- total units
- notes
- readable item table

### 2. `Master Format`

Exact supplier-compatible columns:

```text
款式编码
商品编码
颜色及规格
库存
```

Rows:

- `款式编码`: style/model code from inventory/style_code or product model_code
- `商品编码`: SKU/product code
- `颜色及规格`: color + `;` + size
- `库存`: requested quantity

Formatting:

- header bold
- column widths set
- order metadata styled
- text format for code columns to preserve leading zeros
- freeze first row if practical
- no random decorative colors
- use Irunsvan blue/ink lightly

CSV:

- same master format rows
- UTF-8 BOM if needed for Excel/Chinese compatibility

Admin button:

- visible when status is `paid` or later
- label: `Download Supplier XLSX`
- secondary: `Download CSV`

## Phase 10: Supabase Migration

File:

- [supabase/sql/019_order_workflow_statuses.sql](</C:/Users/TOV tech/Desktop/ivansrun website/supabase/sql/019_order_workflow_statuses.sql>)

Update migration to include:

```sql
alter type public.order_request_status add value if not exists 'awaiting_payment';
alter type public.order_request_status add value if not exists 'paid';
alter type public.order_request_status add value if not exists 'submitted_to_supplier';
alter type public.order_request_status add value if not exists 'processing';
alter type public.order_request_status add value if not exists 'shipped';
```

Add columns:

```sql
alter table public.order_requests
  add column if not exists approved_at timestamptz,
  add column if not exists paid_at timestamptz,
  add column if not exists supplier_submitted_at timestamptz,
  add column if not exists processing_at timestamptz,
  add column if not exists shipped_at timestamptz,
  add column if not exists fulfilled_at timestamptz,
  add column if not exists invoice_number text,
  add column if not exists payment_reference text,
  add column if not exists payment_note text,
  add column if not exists supplier_exported_at timestamptz;
```

Best practice:

- Apply migration only after frontend is compatible with old schema.
- After migration succeeds, update fetch query to include new fields.
- Run Supabase advisors if available.

## Phase 11: Product Click Bug

Files:

- [src/app.js](</C:/Users/TOV tech/Desktop/ivansrun website/src/app.js>)
- [src/mobile-navigation.js](</C:/Users/TOV tech/Desktop/ivansrun website/src/mobile-navigation.js>)
- [tests/app-wiring.test.js](</C:/Users/TOV tech/Desktop/ivansrun website/tests/app-wiring.test.js>)

Steps:

1. Inspect rendered product card markup.
2. Confirm public product cards have:

```html
data-route="product"
data-product-id="..."
```

3. Confirm `bindEvents()` passes `productId`.
4. Confirm `setRoute()` stores `selectedProductId`.
5. Confirm `MobileNavigation.buildRouteUrl("product", { productId })` produces `#/product/<id>`.
6. Confirm `MobileNavigation.parseRouteUrl()` restores product ID on refresh.
7. If product click fails because nested carousel buttons stop or steal events, make card action explicit:

- card body button opens product
- carousel arrows only move images
- avoid making the whole card clickable if it conflicts

Add test:

- `appSource.includes('data-route="product"')`
- `appSource.includes('productId: button.getAttribute("data-product-id")')`
- `mobile-navigation.test.js` validates product route

## Phase 12: Public Product Theme

File:

- [src/styles.css](</C:/Users/TOV tech/Desktop/ivansrun website/src/styles.css>)

Goal:

Make product pages visually align with homepage.

Use existing homepage tokens:

```css
--home-shell
--home-panel
--home-panel-alt
--home-ink
--home-line
--home-muted
--home-accent
--home-shadow-soft
```

Product catalog should:

- feel editorial
- use strong imagery
- avoid ecommerce/cart language
- avoid price public display
- avoid generic product cards
- match homepage spacing and color tone

Product detail should:

- have large product image
- magazine-like copy block
- clean color/size presentation
- no order form
- CTA: `Find a Reseller`, `Apply as Reseller`

Do not overdo:

- no fake luxury fluff
- no excessive gradients
- no decorative blobs
- no nested cards

## Phase 13: Tests

Update or add the following.

### 1. [tests/admin-orders.test.js](</C:/Users/TOV tech/Desktop/ivansrun website/tests/admin-orders.test.js>)

- status normalization
- legacy `approved`
- buckets
- next actions
- timestamp patch behavior

### 2. [tests/mobile-navigation.test.js](</C:/Users/TOV tech/Desktop/ivansrun website/tests/mobile-navigation.test.js>)

- `#/order/<id>`
- product route
- reseller product route
- back target for order

### 3. [tests/auth-state.test.js](</C:/Users/TOV tech/Desktop/ivansrun website/tests/auth-state.test.js>)

- reseller can access `order`
- admin can access `order`
- public cannot access `order`

### 4. [tests/app-wiring.test.js](</C:/Users/TOV tech/Desktop/ivansrun website/tests/app-wiring.test.js>)

- `ROUTES` includes new routes
- route map includes `order`
- order detail function exists
- admin orders page uses workflow action buttons
- supplier export button exists
- product detail public prices absent
- old unsafe Supabase query is not used before migration

### 5. New [tests/order-export.test.js](</C:/Users/TOV tech/Desktop/ivansrun website/tests/order-export.test.js>)

- rows match master format
- Chinese headers are exact
- codes preserved as strings
- quantities correct
- workbook data includes `Order Summary` and `Master Format`

## Phase 14: Verification

Run after every meaningful phase:

```powershell
cmd /c npm run check
cmd /c npm test
cmd /c npm run build
```

Then start local preview:

```powershell
node scripts/serve-static.js dist
```

Verify in browser:

- `/#/store`
- `/#/product/<id>`
- `/#/reseller`
- `/#/history`
- `/#/order/<id>`
- `/#/requests`

Manual checks:

- product card opens detail
- admin sees existing requests
- reseller sees own/my orders
- order detail opens from admin and reseller pages
- status buttons update status
- supplier XLSX downloads
- exported file opens in Excel
- Chinese headers are readable
- style/product codes keep leading zeros

## Implementation Priorities

Do this in this exact order:

1. Fix route list and product click.
2. Confirm backend request rows.
3. Build `Order Detail`.
4. Convert reseller history into `My Orders`.
5. Convert admin requests into `Admin Orders`.
6. Add safe migration.
7. Add invoice/payment UI.
8. Add supplier XLSX/CSV export.
9. Restyle public product catalog/detail to homepage theme.
10. Run full tests/build and local review.

This sequence protects existing data, fixes the current visible bugs first, and then builds the end-to-end order experience without scattering it across too many pages.
