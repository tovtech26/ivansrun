# Simple Admin Product Inventory Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the simple real workflow for Ivansrun Africa: admin reviews/creates products from media packs, defines colors/sizes/images, uploads inventory files, reviews matched stock changes, then publishes stock for the reseller shopping catalog.

**Architecture:** Keep Render as a static frontend and Supabase as the live backend. The browser handles normal CSV/XLSX inventory parsing and media-pack folder scanning; Supabase stores products, variants, inventory, orders, and later uploaded images. Product setup is the source of truth; inventory files only update stock for known model/color/size variants.

**Tech Stack:** Browser JavaScript, `xlsx`, `JSZip`, Supabase REST/Storage later, Node test scripts, static Render deployment.

---

## Product Decision

The admin workflow must stay simple:

```text
Products -> Add/Edit product, colors, sizes, images
Inventory -> Upload stock file, review changes, publish
Orders -> Reseller order requests
Site Controls -> Hero/theme/banner
```

The Marketing media pack is not a daily workflow. It is a helper that suggests products and image groups.

The master inventory file is not a product creator. It updates exact stock after products/variants exist.

---

## Files

- Modify: `src/import-parser.js`
  - Parse Chinese master inventory rows into normalized stock rows: model code, source style code, source SKU, original color, size, stock.
- Create: `src/product-catalog-manager.js`
  - Build draft products from media suggestions.
  - Generate variants from product colors and sizes.
  - Match normalized inventory rows against existing products/variants.
  - Produce review summaries.
- Modify: `src/admin-imports.js`
  - Add preview models for media suggestions and inventory review.
- Modify: `src/reseller-orders.js`
  - Add product-level stock summaries for shopping catalog cards/details.
- Modify: `src/app.js`
  - Simplify admin navigation and admin screens.
  - Add Products screen.
  - Make Inventory screen the main upload/review/publish workflow.
  - Keep Site Controls but secondary.
- Modify: `src/styles.css`
  - Simple operational admin layout, fewer panels, clearer review rows.
- Modify: `index.html`
  - Add new module script.
- Test: `tests/product-catalog-manager.test.js`
  - Product variants, media draft conversion, inventory matching, stock review summaries.
- Modify: `tests/import-parser.test.js`
  - Real Chinese inventory parsing rules.
- Modify: `tests/reseller-orders.test.js`
  - Product stock summaries.

---

## Task 1: Normalize Master Inventory Rows

**Files:**
- Modify: `tests/import-parser.test.js`
- Modify: `src/import-parser.js`

- [ ] **Step 1: Write failing tests for Chinese inventory rows**

Add assertions for:

```js
const masterRows = [
  { "款式编码": "23001002", "商品编码": "2023001002138", "颜色及规格": "珍珠白;38", "库存": "40" },
  { "款式编码": "23001", "商品编码": "202300100138", "颜色及规格": "亮桔色/海蓝;38", "库存": "117" },
];

const parsedMaster = parseMasterInventoryRows(masterRows);

assert.deepEqual(parsedMaster.rows[0], {
  source_style_code: "23001002",
  source_sku: "2023001002138",
  model_code: "001",
  color_code: "002",
  original_colour: "珍珠白",
  size: "38",
  stock_quantity: 40,
  source: "master_inventory",
});
```

- [ ] **Step 2: Run failing test**

Run:

```powershell
node tests\import-parser.test.js
```

Expected: FAIL because `parseMasterInventoryRows` is not exported.

- [ ] **Step 3: Implement parser**

Add:

```js
function parseStyleCode(value) {
  const digits = String(value || "").replace(/\D/g, "");
  const withoutYear = digits.length >= 5 ? digits.slice(2) : digits;
  return {
    model_code: withoutYear.slice(0, 3) || "",
    color_code: withoutYear.length > 3 ? withoutYear.slice(3).padStart(3, "0") : "",
  };
}

function splitColourAndSize(value) {
  const [colour = "", size = ""] = String(value || "").split(";");
  return { original_colour: colour.trim(), size: size.trim() };
}

function parseMasterInventoryRows(rows) {
  // use firstValue for Chinese and English aliases
}
```

- [ ] **Step 4: Run focused and full tests**

Run:

```powershell
node tests\import-parser.test.js
npm.cmd test
```

Expected: PASS.

---

## Task 2: Product Setup and Variant Generation

**Files:**
- Create: `src/product-catalog-manager.js`
- Create: `tests/product-catalog-manager.test.js`
- Modify: `index.html`
- Modify: `package.json`

- [ ] **Step 1: Write failing tests**

Test:

```js
const product = buildProductDraft({
  modelCode: "125",
  name: "IRUNSVAN 125 Flying GT3.0",
  category: "Running Shoes",
  price: 36,
  colours: ["Pearl White", "Bright Orange / Ocean Blue"],
  sizes: ["38", "39"],
  imageNames: ["125-1.jpg"],
});

const variants = generateProductVariants(product);
assert.equal(variants.length, 4);
assert.equal(variants[0].sku, "IRUNSVAN-125-PEARL-WHITE-38");
```

- [ ] **Step 2: Run failing test**

Run:

```powershell
node tests\product-catalog-manager.test.js
```

Expected: FAIL because module does not exist.

- [ ] **Step 3: Implement draft/variant helpers**

The helper must:
- require model code and product name
- preserve category, price, image names
- generate every color/size combination
- produce stable SKUs
- support non-shoe products with color-only or no-size variants

- [ ] **Step 4: Add script references and test command**

Add `src/product-catalog-manager.js` to `index.html`, `npm.cmd run check`, and `npm.cmd test`.

- [ ] **Step 5: Verify**

Run:

```powershell
node tests\product-catalog-manager.test.js
npm.cmd test
npm.cmd run check
```

Expected: PASS.

---

## Task 3: Inventory Matching Review

**Files:**
- Modify: `tests/product-catalog-manager.test.js`
- Modify: `src/product-catalog-manager.js`
- Modify: `src/admin-imports.js`

- [ ] **Step 1: Write failing tests for matching**

Test:

```js
const review = matchInventoryToVariants({
  inventoryRows: [
    { model_code: "125", original_colour: "珍珠白", size: "38", stock_quantity: 40, source_sku: "2023001002138" },
  ],
  products: [{ id: "p1", sku: "IRUNSVAN-125", model_code: "125", name: "IRUNSVAN 125 Flying GT3.0" }],
  variants: [{ id: "v1", product_id: "p1", sku: "IRUNSVAN-125-PEARL-WHITE-38", colour: "Pearl White", original_colour: "珍珠白", size: "38" }],
  inventory: [{ variant_id: "v1", stock_quantity: 10 }],
});

assert.equal(review.summary.matchedRows, 1);
assert.equal(review.summary.stockChanged, 1);
assert.equal(review.matches[0].previousStock, 10);
assert.equal(review.matches[0].nextStock, 40);
```

- [ ] **Step 2: Implement matching**

Match order:
1. product model code
2. variant original colour or display colour
3. size

Return:
- `matches`
- `exceptions`
- `summary`

Exception codes:
- `missing_product`
- `missing_colour`
- `missing_size`
- `invalid_row`

- [ ] **Step 3: Verify**

Run:

```powershell
node tests\product-catalog-manager.test.js
npm.cmd test
```

Expected: PASS.

---

## Task 4: Simplify Admin UI Around Products and Inventory

**Files:**
- Modify: `src/app.js`
- Modify: `src/styles.css`

- [ ] **Step 1: Change admin sidebar**

Show only:

```text
Dashboard
Products
Inventory
Orders
Site Controls
```

- [ ] **Step 2: Add Products screen**

Products screen shows:
- product name
- model code/SKU
- category
- total available stock
- colors count
- sizes count
- edit button placeholder
- add product button placeholder

- [ ] **Step 3: Make Inventory screen simple**

Inventory screen shows:
- one main upload box: `Upload Master Inventory`
- optional secondary: `Scan Media Pack`
- review grouped by matched rows, changed stock, needs attention
- publish button for matched stock

- [ ] **Step 4: Keep site controls**

Do not remove Site Controls.

- [ ] **Step 5: Verify**

Run:

```powershell
npm.cmd test
npm.cmd run check
npm.cmd run build
```

Expected: PASS.

---

## Task 5: Reseller Shopping Catalog Stock Display

**Files:**
- Modify: `src/reseller-orders.js`
- Modify: `tests/reseller-orders.test.js`
- Modify: `src/app.js`
- Modify: `src/styles.css`

- [ ] **Step 1: Add product stock summary tests**

Test:

```js
const summaries = buildProductStockSummaries(rows);
assert.equal(summaries[0].totalStock, 157);
assert.equal(summaries[0].colors.length, 2);
assert.equal(summaries[0].sizes.length, 2);
```

- [ ] **Step 2: Implement summary helper**

Group inventory rows by product:
- total stock
- available colors
- available sizes
- per variant exact stock

- [ ] **Step 3: Change reseller screen**

Default reseller screen becomes shopping catalog:
- product cards
- total available stock
- view details/order button

Keep table as a secondary bulk view placeholder.

- [ ] **Step 4: Verify**

Run:

```powershell
node tests\reseller-orders.test.js
npm.cmd test
npm.cmd run check
npm.cmd run build
```

Expected: PASS.

---

## Task 6: Supabase Schema Follow-Up

**Files:**
- Create: `supabase/sql/008_product_catalog_workflow.sql`

- [ ] **Step 1: Add columns needed by matching**

Add if missing:

```sql
alter table public.products add column if not exists model_code text;
alter table public.products add column if not exists product_type text not null default 'shoe';
alter table public.product_variants add column if not exists original_colour text;
alter table public.product_variants add column if not exists color_code text;
```

- [ ] **Step 2: Add indexes**

```sql
create index if not exists products_model_code_idx on public.products (model_code);
create index if not exists product_variants_original_colour_size_idx on public.product_variants (original_colour, size);
create index if not exists product_variants_color_code_idx on public.product_variants (color_code);
```

- [ ] **Step 3: Grant Data API access safely**

Use explicit grants only if needed by the project’s Data API settings and keep RLS enabled.

- [ ] **Step 4: Verify locally**

Run:

```powershell
npm.cmd run check
npm.cmd test
```

Expected: PASS.

---

## Acceptance Criteria

- Admin can understand the daily workflow without explanation.
- Products are the catalog source of truth.
- Media pack suggests product/media setup but does not publish automatically.
- Inventory upload updates availability only.
- Review screen shows stock changes and exceptions clearly.
- Reseller portal looks like a shopping catalog and shows stock availability.
- Login remains bypassed during local development.

---

## Execution Rule

For every task:

```text
write/update test -> run and see expected failure -> implement -> run focused test -> run full checks -> move on
```

No task is complete until its test and the phase verification pass.
