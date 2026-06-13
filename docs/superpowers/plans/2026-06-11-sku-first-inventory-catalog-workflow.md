# SKU-First Inventory Catalog Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Ivansrun Africa product/inventory import workflow so selected products from the SKU folders become real Supabase products, variants use manufacturer SKU as the permanent key, colours/images are reviewable, and future master inventory uploads update stock reliably.

**Architecture:** Manufacturer SKU (`商品编码`) becomes the source of truth for each sellable variant. Model code selects which products Ivansrun Africa sells, colour mapping controls the human-facing colour and image, and inventory uploads update stock by SKU first. The browser can parse XLSX/CSV for preview, but persistence must write products, colour mappings, variants, and inventory in a predictable order with clear review reports.

**Tech Stack:** Browser JavaScript, `xlsx`, Supabase REST/RPC or Edge Function, Postgres SQL migrations, static Render frontend, Node test scripts.

**Execution note:** Do not commit changes until the user explicitly asks. Use test checkpoints after each task.

---

## Current Problem

The existing system has two disconnected partial paths:

1. `src/catalog-fallback.js` displays local product folders, but it creates no Supabase products and no variants. It currently has 21 products and 0 variants.
2. `supabase/imports/generated_sql` can import a larger WooCommerce-derived catalog, but it is not part of the current admin flow and does not align with newer fields like `model_code`, `original_colour`, and `color_code`.

The current stock matcher also relies mainly on:

```text
model_code + original_colour + size
```

That is too fragile. The master inventory already gives an exact unique key:

```text
商品编码 = manufacturer SKU
```

The rebuilt system must use:

```text
master_inventory.商品编码 -> product_variants.sku
```

as the primary stock match.

---

## Target Workflow

### Initial Catalog Setup

Admin uploads the master inventory file and chooses the products Ivansrun Africa sells.

The system reads:

```text
款式编码 = source style / model-colour code
商品编码 = exact manufacturer SKU
颜色及规格 = original colour + size
库存 = current stock
```

For each selected model:

```text
Create product
Create colour mappings
Create variants using manufacturer SKU
Create inventory rows at 0 or current stock based on admin confirmation
```

### Future Inventory Updates

Admin uploads a new master inventory file.

The system:

```text
Parses every row
Matches by manufacturer SKU
Resets tracked variants to 0
Applies new stock to matched SKUs
Reports unknown SKUs
Reports products missing from latest file
```

### Colour Handling

Each colour needs three fields:

```text
original_colour = manufacturer text, kept unchanged
colour = display text shown to reseller
color_code = colour group code used to connect image to colour
```

Example:

```text
original_colour: 绿野仙踪/青橙
colour: Green / Orange
color_code: 001
image_name: 2503-1.jpg
```

The stock update does not depend on the display colour. It depends on SKU.

---

## Files

### Create

- `src/catalog-seed-builder.js`
  - Converts parsed master inventory rows plus selected model codes into products, colour mappings, variants, inventory seed rows, and review reports.

- `tests/catalog-seed-builder.test.js`
  - Covers selected-model matching, SKU-first variant creation, colour/image grouping, and summary counts.

- `supabase/sql/011_sku_first_catalog_import.sql`
  - Adds colour mapping table and any missing columns/indexes/grants needed for the SKU-first workflow.

### Modify

- `src/import-parser.js`
  - Preserve actual Chinese headers and normalize model/colour code parsing consistently.

- `tests/import-parser.test.js`
  - Add tests using real Chinese header strings, not only mojibake strings.

- `src/product-catalog-manager.js`
  - Change inventory matching to SKU-first with model/colour/size fallback only for review.

- `tests/product-catalog-manager.test.js`
  - Add tests showing SKU match wins even when display colour differs.

- `src/product-persistence.js`
  - Add payload builders for colour mappings and SKU-based variants.

- `tests/product-persistence.test.js`
  - Verify payloads include manufacturer SKU, original colour, display colour, colour code, image, and model link.

- `src/admin-imports.js`
  - Add preview shape for catalog seeding and SKU-first stock publishing.

- `tests/admin-imports.test.js`
  - Verify preview summaries for products, colours, variants, stock matches, and unknown SKUs.

- `src/app.js`
  - Add admin flow for "Build Catalog From Inventory" and update "Upload Master Inventory" to match by SKU.

- `src/catalog-data.js`
  - Load colour mapping data where needed for admin review.

- `docs/DEPLOYMENT_RUNBOOK.md`
  - Add SQL `011` and the catalog seed/import operating procedure.

---

## Data Model

### Existing Tables To Keep

```text
products
product_variants
inventory
import_jobs
```

### New Table

```sql
create table if not exists public.product_colour_mappings (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  model_code text not null,
  original_colour text not null,
  colour text not null,
  color_code text,
  image_name text,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, original_colour, color_code)
);
```

### Product Variant Rule

For variants created from master inventory:

```text
product_variants.sku = 商品编码
```

Example:

```text
product_variants.sku = 202425030137
```

Do not generate SKUs like:

```text
IRUNSVAN-2503-GREEN-ORANGE-37
```

Those are useful for humans but not for the real inventory source.

---

## Task 1: Strengthen Master Inventory Parsing

**Files:**
- Modify: `src/import-parser.js`
- Modify: `tests/import-parser.test.js`

- [ ] **Step 1: Add a failing parser test using actual Chinese headers**

Add a test case:

```js
const realChineseRows = [
  { "款式编码": "2503", "商品编码": "202425030137", "颜色及规格": "绿野仙踪/青橙;37", "库存": "25" },
  { "款式编码": "23028", "商品编码": "202302800138", "颜色及规格": "亮桔色/海蓝;38", "库存": "117" },
  { "款式编码": "23001002", "商品编码": "2023001002138", "颜色及规格": "珍珠白;38", "库存": "40" },
];

const parsed = parseMasterInventoryRows(realChineseRows);

assert.deepEqual(parsed.rows.map((row) => ({
  source_style_code: row.source_style_code,
  source_sku: row.source_sku,
  model_code: row.model_code,
  color_code: row.color_code,
  original_colour: row.original_colour,
  size: row.size,
  stock_quantity: row.stock_quantity,
})), [
  {
    source_style_code: "2503",
    source_sku: "202425030137",
    model_code: "2503",
    color_code: "",
    original_colour: "绿野仙踪/青橙",
    size: "37",
    stock_quantity: 25,
  },
  {
    source_style_code: "23028",
    source_sku: "202302800138",
    model_code: "028",
    color_code: "",
    original_colour: "亮桔色/海蓝",
    size: "38",
    stock_quantity: 117,
  },
  {
    source_style_code: "23001002",
    source_sku: "2023001002138",
    model_code: "001",
    color_code: "002",
    original_colour: "珍珠白",
    size: "38",
    stock_quantity: 40,
  },
]);
```

- [ ] **Step 2: Run the focused test**

Run:

```powershell
node tests\import-parser.test.js
```

Expected before implementation: fail if actual Chinese aliases are not recognized.

- [ ] **Step 3: Update header aliases**

`HEADER_ALIASES` must include both actual Chinese headers and the currently mojibake-encoded strings:

```js
["款式编码", "style_code"],
["商品编码", "sku"],
["颜色及规格", "colour_size"],
["库存", "stock"],
["æ¬¾å¼ç¼–ç ", "style_code"],
["å•†å“ç¼–ç ", "sku"],
["é¢œè‰²åŠè§„æ ¼", "colour_size"],
["åº“å­˜", "stock"],
```

- [ ] **Step 4: Verify parser**

Run:

```powershell
node tests\import-parser.test.js
npm.cmd test
```

Expected: pass.

---

## Task 2: Build The SKU-First Catalog Seed Engine

**Files:**
- Create: `src/catalog-seed-builder.js`
- Create: `tests/catalog-seed-builder.test.js`
- Modify: `index.html`
- Modify: `package.json`

- [ ] **Step 1: Write failing tests for selected model seeding**

Use a small fixture:

```js
const inventoryRows = [
  { source_style_code: "23028", source_sku: "202302800138", model_code: "028", color_code: "", original_colour: "亮桔色/海蓝", size: "38", stock_quantity: 117 },
  { source_style_code: "23028", source_sku: "202302800139", model_code: "028", color_code: "", original_colour: "亮桔色/海蓝", size: "39", stock_quantity: 46 },
  { source_style_code: "2503", source_sku: "202425030137", model_code: "2503", color_code: "", original_colour: "绿野仙踪/青橙", size: "37", stock_quantity: 25 },
  { source_style_code: "23086", source_sku: "202308600137", model_code: "086", color_code: "", original_colour: "未选择产品", size: "37", stock_quantity: 10 },
];

const result = buildCatalogSeed({
  inventoryRows,
  selectedModelCodes: ["028", "2503"],
  imageLibrary: {
    "028": ["028-1.jpg", "028-2.jpg"],
    "2503": ["2503-1.jpg", "2503-2.jpg"],
  },
  priceByModel: new Map([["028", 38], ["2503", 58]]),
});

assert.equal(result.products.length, 2);
assert.equal(result.variants.length, 3);
assert.equal(result.inventorySeedRows.length, 3);
assert.equal(result.skippedRows.length, 1);
assert.deepEqual(result.variants.map((variant) => variant.sku), [
  "202302800138",
  "202302800139",
  "202425030137",
]);
```

- [ ] **Step 2: Run failing test**

Run:

```powershell
node tests\catalog-seed-builder.test.js
```

Expected: fail because module does not exist.

- [ ] **Step 3: Implement `buildCatalogSeed`**

The function must return:

```js
{
  products,
  colourMappings,
  variants,
  inventorySeedRows,
  skippedRows,
  summary,
}
```

Rules:

```text
products: one per selected model with at least one inventory row
variants: one per manufacturer SKU
inventorySeedRows: one per variant, stock starts at 0 unless explicitly publishing
skippedRows: inventory rows where model is not selected
summary: counts for selected models, matched models, missing selected models, variants, colours, skipped rows
```

- [ ] **Step 4: Add script references**

Add `src/catalog-seed-builder.js` before `src/app.js` in `index.html`.

Update `package.json`:

```json
"check": "... && node --check src/catalog-seed-builder.js && ...",
"test": "... && node tests/catalog-seed-builder.test.js && ..."
```

- [ ] **Step 5: Verify**

Run:

```powershell
node tests\catalog-seed-builder.test.js
npm.cmd run check
npm.cmd test
```

Expected: pass.

---

## Task 3: Implement Colour Group And Image Mapping

**Files:**
- Modify: `src/catalog-seed-builder.js`
- Modify: `tests/catalog-seed-builder.test.js`

- [ ] **Step 1: Add failing tests for image mapping**

Test explicit colour code:

```js
const result = buildCatalogSeed({
  inventoryRows: [
    { source_style_code: "23001002", source_sku: "2023001002138", model_code: "001", color_code: "002", original_colour: "珍珠白", size: "38", stock_quantity: 40 },
  ],
  selectedModelCodes: ["001"],
  imageLibrary: { "001": ["001-1.jpg", "001-2.jpg"] },
});

assert.equal(result.colourMappings[0].image_name, "001-2.jpg");
assert.equal(result.variants[0].image_name, "001-2.jpg");
```

Test fallback order when no colour code exists:

```js
const result = buildCatalogSeed({
  inventoryRows: [
    { source_style_code: "2503", source_sku: "202425030137", model_code: "2503", color_code: "", original_colour: "绿野仙踪/青橙", size: "37", stock_quantity: 25 },
    { source_style_code: "2503", source_sku: "202425030237", model_code: "2503", color_code: "", original_colour: "花红/蓝白", size: "37", stock_quantity: 20 },
  ],
  selectedModelCodes: ["2503"],
  imageLibrary: { "2503": ["2503-1.jpg", "2503-2.jpg"] },
});

assert.equal(result.colourMappings[0].image_name, "2503-1.jpg");
assert.equal(result.colourMappings[1].image_name, "2503-2.jpg");
```

- [ ] **Step 2: Run failing test**

Run:

```powershell
node tests\catalog-seed-builder.test.js
```

- [ ] **Step 3: Implement mapping rule**

Image rule:

```text
If color_code is numeric, image index = Number(color_code) - 1
If no color_code, group unique original colours by first appearance and assign images in order
If no image exists, image_name = null and warning = missing_image
```

Default display colour:

```text
colour = original_colour
```

Later admin review can replace display colour with English names.

- [ ] **Step 4: Verify**

Run:

```powershell
node tests\catalog-seed-builder.test.js
npm.cmd test
```

Expected: pass.

---

## Task 4: Add Supabase Colour Mapping Schema

**Files:**
- Create: `supabase/sql/011_sku_first_catalog_import.sql`
- Modify: `tests/supabase-sql.test.js`
- Modify: `docs/DEPLOYMENT_RUNBOOK.md`

- [ ] **Step 1: Add SQL guard tests**

Add assertions that `011_sku_first_catalog_import.sql` contains:

```js
assert.match(sql, /create table if not exists public\.product_colour_mappings/i);
assert.match(sql, /unique \(product_id, original_colour, color_code\)/i);
assert.match(sql, /alter table public\.product_colour_mappings enable row level security/i);
assert.match(sql, /grant select, insert, update, delete on public\.product_colour_mappings to authenticated/i);
```

- [ ] **Step 2: Run failing SQL test**

Run:

```powershell
node tests\supabase-sql.test.js
```

Expected: fail because SQL file does not exist.

- [ ] **Step 3: Create SQL migration**

The SQL must:

```sql
create table if not exists public.product_colour_mappings (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  model_code text not null,
  original_colour text not null,
  colour text not null,
  color_code text,
  image_name text,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, original_colour, color_code)
);

create index if not exists product_colour_mappings_product_id_idx
on public.product_colour_mappings (product_id);

create index if not exists product_colour_mappings_model_code_idx
on public.product_colour_mappings (model_code);

alter table public.product_colour_mappings enable row level security;

grant select on public.product_colour_mappings to anon, authenticated;
grant insert, update, delete on public.product_colour_mappings to authenticated;

drop policy if exists "Public can read published colour mappings" on public.product_colour_mappings;
create policy "Public can read published colour mappings"
on public.product_colour_mappings
for select
to anon, authenticated
using (published = true);

drop policy if exists "Admins can manage colour mappings" on public.product_colour_mappings;
create policy "Admins can manage colour mappings"
on public.product_colour_mappings
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());
```

Also recreate reseller views only if colour mappings need to be exposed through joins later. Keep this migration focused.

- [ ] **Step 4: Update runbook**

Add:

```text
supabase/sql/011_sku_first_catalog_import.sql
```

after `010_schema_catchup_repair.sql` guidance.

- [ ] **Step 5: Verify**

Run:

```powershell
node tests\supabase-sql.test.js
npm.cmd test
```

Expected: pass.

---

## Task 5: Add Persistence Payloads For Seeded Products

**Files:**
- Modify: `src/product-persistence.js`
- Modify: `tests/product-persistence.test.js`

- [ ] **Step 1: Add failing payload tests**

Add tests for:

```js
buildColourMappingUpsertPayloads([
  {
    product_id: "product-2503",
    model_code: "2503",
    original_colour: "绿野仙踪/青橙",
    colour: "Green / Orange",
    color_code: "001",
    image_name: "2503-1.jpg",
    published: true,
  },
]);
```

Expected output:

```js
[
  {
    product_id: "product-2503",
    model_code: "2503",
    original_colour: "绿野仙踪/青橙",
    colour: "Green / Orange",
    color_code: "001",
    image_name: "2503-1.jpg",
    published: true,
  },
]
```

Also assert variant payloads preserve manufacturer SKU:

```js
assert.equal(payload[0].sku, "202425030137");
```

- [ ] **Step 2: Run failing test**

Run:

```powershell
node tests\product-persistence.test.js
```

- [ ] **Step 3: Implement payload helper**

Export:

```js
buildColourMappingUpsertPayloads
```

Keep null handling consistent with existing `nullableText`.

- [ ] **Step 4: Verify**

Run:

```powershell
node tests\product-persistence.test.js
npm.cmd test
```

Expected: pass.

---

## Task 6: Rebuild Inventory Matching As SKU-First

**Files:**
- Modify: `src/product-catalog-manager.js`
- Modify: `tests/product-catalog-manager.test.js`

- [ ] **Step 1: Add failing SKU-first match test**

```js
const review = matchInventoryToVariants({
  inventoryRows: [
    {
      source_sku: "202425030137",
      model_code: "2503",
      original_colour: "绿野仙踪/青橙",
      size: "37",
      stock_quantity: 25,
    },
  ],
  products: [{ id: "product-2503", sku: "IRUNSVAN-2503", model_code: "2503", name: "IRUNSVAN 2503 Running Shoe" }],
  variants: [
    {
      id: "variant-2503-37",
      product_id: "product-2503",
      sku: "202425030137",
      colour: "Green / Orange",
      original_colour: "Different old text",
      size: "37",
    },
  ],
  inventory: [{ variant_id: "variant-2503-37", sku: "202425030137", stock_quantity: 0 }],
});

assert.equal(review.matches.length, 1);
assert.equal(review.matches[0].variantSku, "202425030137");
assert.equal(review.matches[0].nextStock, 25);
```

- [ ] **Step 2: Add fallback review test**

If SKU does not exist but model/colour/size exists, return a match with `matchType: "model_colour_size"` and a warning:

```js
assert.equal(review.matches[0].matchType, "model_colour_size");
assert.equal(review.matches[0].warnings.includes("sku_mismatch"), true);
```

- [ ] **Step 3: Run failing tests**

Run:

```powershell
node tests\product-catalog-manager.test.js
```

- [ ] **Step 4: Implement SKU-first logic**

Match order:

```text
1. source_sku -> variant.sku
2. model_code + original_colour + size fallback
3. exception: missing_variant_sku
4. exception: missing_product
5. exception: missing_colour
6. exception: missing_size
```

- [ ] **Step 5: Verify**

Run:

```powershell
node tests\product-catalog-manager.test.js
npm.cmd test
```

Expected: pass.

---

## Task 7: Add Catalog Seed Preview To Admin Imports

**Files:**
- Modify: `src/admin-imports.js`
- Modify: `tests/admin-imports.test.js`
- Modify: `src/app.js`

- [ ] **Step 1: Add failing preview test**

Preview must support:

```js
buildImportPreview({
  type: "catalog_seed_inventory",
  filename: "MASTER INVENTORY FILE.xlsx",
  rowsTotal: 3748,
  processedRows: 1312,
  products: [{ sku: "IRUNSVAN-028" }],
  variants: [{ sku: "202302800138" }],
  colourMappings: [{ model_code: "028", original_colour: "亮桔色/海蓝" }],
  inventoryRows: [{ sku: "202302800138", stock_quantity: 0 }],
  stockMatches: [{ sourceSku: "202302800138" }],
  stockSummary: { matchedRows: 1312, exceptionRows: 0 },
});
```

Assert:

```js
assert.equal(preview.products.length, 1);
assert.equal(preview.variants.length, 1);
assert.equal(preview.colourMappings.length, 1);
```

- [ ] **Step 2: Run failing test**

Run:

```powershell
node tests\admin-imports.test.js
```

- [ ] **Step 3: Extend preview object**

Add:

```js
colourMappings = []
catalogSeedSummary = null
selectedModelCodes = []
missingSelectedModels = []
```

- [ ] **Step 4: Add admin import mode**

In `adminImports()`, add an upload box:

```text
Build Catalog From Master Inventory
```

Accepted files:

```text
.xlsx,.xls,.csv
```

This mode should:

```text
Parse master inventory
Read selected model codes from current SKU folder products or admin selection
Build products, colour mappings, variants, and zero inventory rows
Show preview before commit
```

- [ ] **Step 5: Verify**

Run:

```powershell
node tests\admin-imports.test.js
npm.cmd run check
npm.cmd test
```

Expected: pass.

---

## Task 8: Commit Catalog Seed To Supabase

**Files:**
- Modify: `src/app.js`
- Modify: `tests/app-wiring.test.js`

- [ ] **Step 1: Add wiring test**

Assert app source contains:

```js
upsertAuthedSupabase("product_colour_mappings"
```

Assert catalog seed mode does not call the old catalog CSV path:

```js
assert.equal(appSource.includes('state.importPreview.type === "catalog_seed_inventory"'), true);
```

- [ ] **Step 2: Run failing test**

Run:

```powershell
node tests\app-wiring.test.js
```

- [ ] **Step 3: Implement commit order**

For `catalog_seed_inventory`:

```text
1. Upsert products by sku
2. Map product sku -> returned product id
3. Upsert colour mappings with product ids
4. Upsert product variants by manufacturer sku
5. Upsert zero inventory rows by manufacturer sku
6. Reload catalog and protected data
```

Important:

```text
Do not publish stock automatically unless preview explicitly says publish_stock = true.
```

- [ ] **Step 4: Verify**

Run:

```powershell
node tests\app-wiring.test.js
npm.cmd run check
npm.cmd test
```

Expected: pass.

---

## Task 9: Publish Stock By SKU

**Files:**
- Modify: `src/inventory-workflow.js`
- Modify: `tests/inventory-workflow.test.js`
- Modify: `src/product-catalog-manager.js`
- Modify: `src/app.js`

- [ ] **Step 1: Add failing stock publish test**

Given inventory rows:

```js
const inventory = [
  { id: "inv-1", variant_id: "variant-1", sku: "202302800138", stock_quantity: 12 },
  { id: "inv-2", variant_id: "variant-2", sku: "202302800139", stock_quantity: 5 },
];

const stockMatches = [
  { sourceSku: "202302800138", variantId: "variant-1", variantSku: "202302800138", nextStock: 117 },
];
```

Expected:

```text
202302800138 -> 117
202302800139 -> 0
```

- [ ] **Step 2: Run failing test**

Run:

```powershell
node tests\inventory-workflow.test.js
```

- [ ] **Step 3: Ensure publish plan uses SKU matches**

The existing reset-first workflow can stay, but `stockMatches` must come from SKU-first matching.

- [ ] **Step 4: Verify**

Run:

```powershell
node tests\inventory-workflow.test.js
npm.cmd test
```

Expected: pass.

---

## Task 10: Colour Review Screen

**Files:**
- Modify: `src/app.js`
- Modify: `src/styles.css`
- Modify: `tests/app-wiring.test.js`

- [ ] **Step 1: Add wiring test for colour review UI**

Assert source includes:

```text
Colour Review
original_colour
product_colour_mappings
```

- [ ] **Step 2: Add admin UI section**

In Products or Inventory admin, add grouped colour review:

```text
Model
Original colour
Display colour
Image
Published
```

- [ ] **Step 3: Add save action**

Saving colour review updates:

```text
product_colour_mappings.colour
product_colour_mappings.image_name
product_colour_mappings.published
matching product_variants.colour
matching product_variants.image_name
matching product_variants.published
```

Use `original_colour + product_id + color_code` to locate related variants.

- [ ] **Step 4: Verify**

Run:

```powershell
node tests\app-wiring.test.js
npm.cmd run check
npm.cmd test
```

Expected: pass.

---

## Task 11: End-To-End Local Data Test

**Files:**
- Create: `tests/catalog-seed-real-master.test.js`
- Modify: `package.json`

- [ ] **Step 1: Add non-destructive real-file analysis test**

This test should only run if the file exists:

```js
const masterPath = "D:\\downloads from my laptop\\MASTER INVENTORY FILE.xlsx";
```

Expected from the current file:

```text
inventory rows: 3748
current selected products: 21
matched selected models: 20
matched selected SKU rows: 1312
unmatched selected model: 165
```

Use tolerant assertions:

```js
assert.equal(summary.selectedModelCodes.length, 21);
assert.equal(summary.matchedModels.length, 20);
assert.equal(summary.missingSelectedModels.includes("165"), true);
assert.equal(summary.variantRows, 1312);
```

- [ ] **Step 2: Run real-file test**

Run:

```powershell
node tests\catalog-seed-real-master.test.js
```

Expected: pass on the local machine with that file present; skip with a clear message if missing.

- [ ] **Step 3: Add to package test only if stable**

If the local file dependency is not appropriate for CI, do not add it to `npm.cmd test`. Keep it as a manual verification command documented in the runbook.

---

## Task 12: Update Operating Documentation

**Files:**
- Modify: `docs/DEPLOYMENT_RUNBOOK.md`

- [ ] **Step 1: Document setup order**

Add:

```text
1. Run schema SQL through 011.
2. Open Admin -> Inventory.
3. Upload master inventory under Build Catalog From Master Inventory.
4. Confirm selected models.
5. Review products, colour mappings, variants, and missing models.
6. Save catalog.
7. Upload master inventory under Publish Stock.
8. Confirm SKU matches and publish stock.
```

- [ ] **Step 2: Document why SKU is the key**

Add:

```text
Manufacturer SKU is the permanent variant key. Colour and size are used for display and review. Future stock updates must match by SKU first.
```

- [ ] **Step 3: Document expected current master-file numbers**

Add:

```text
Current known master file:
3,748 rows
76 models
21 selected product folders
20 selected models found in inventory
1,312 selected SKU rows
165 has no matching inventory rows
```

- [ ] **Step 4: Verify docs are coherent**

Run:

```powershell
npm.cmd run check
npm.cmd test
```

Expected: pass.

---

## Final Acceptance Criteria

The workflow is complete only when all of this is true:

```text
The 21 selected SKU folders can become real Supabase products.
The master inventory can generate variants for the selected products.
Each variant uses manufacturer SKU as product_variants.sku.
Colours are stored as original_colour and display colour.
Images are mapped by colour code or stable colour order.
Inventory updates match by SKU first.
Stock publish resets tracked SKUs to zero before applying latest stock.
Admin can review missing products, unknown SKUs, missing images, and colour mappings.
Public catalog still hides prices and exact stock.
Reseller catalog shows product shopping cards with live availability after approval.
```

For the current master file and selected SKU folders, the first successful preview should show roughly:

```text
20 matched product models
1 missing selected model: 165
1,312 selected SKU variants
67,002 units available after stock publish
```

---

## Execution Order

Implement in this order:

```text
1. Parser correctness
2. Catalog seed builder
3. Colour/image mapping
4. Supabase schema
5. Persistence payloads
6. SKU-first matching
7. Admin preview
8. Catalog seed commit
9. Stock publish by SKU
10. Colour review UI
11. Real master-file verification
12. Runbook update
```

Do not start UI changes until the parser, seed builder, and matching tests pass.

