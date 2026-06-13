const assert = require("node:assert/strict");
const { buildImportPreview, buildImportJobFinish } = require("../src/admin-imports.js");

const preview = buildImportPreview({
  type: "inventory_xlsx",
  filename: "MASTER INVENTORY FILE.xlsx",
  rowsTotal: 4,
  processedRows: 2,
  errors: [{ row: 5, code: "missing_colour" }],
  inventoryRows: [{ source_sku: "SKU-1" }, { source_sku: "SKU-2" }],
  stockMatches: [{ variantId: "variant-1" }, { variantId: "variant-2" }],
  stockExceptions: [{ row: 4, code: "missing_product" }],
  stockSummary: { matchedRows: 2, exceptionRows: 1 },
  publishPlan: {
    rows: [{ variant_id: "variant-1", stock_quantity: 10 }],
    absentRows: [{ variantId: "variant-3", sku: "SKU-3", previousStock: 4, nextStock: 0 }],
    summary: { trackedRowsReset: 3, matchedRowsApplied: 2, absentRowsZeroed: 1, totalNextStock: 10 },
  },
});

assert.equal(preview.skippedRows, 2);
assert.deepEqual(preview.publishPlan.summary, {
  trackedRowsReset: 3,
  matchedRowsApplied: 2,
  absentRowsZeroed: 1,
  totalNextStock: 10,
});
assert.equal(preview.publishPlan.absentRows[0].sku, "SKU-3");

const seedPreview = buildImportPreview({
  type: "catalog_seed_inventory",
  filename: "MASTER INVENTORY FILE.xlsx",
  rowsTotal: 3748,
  processedRows: 1312,
  products: [{ sku: "IRUNSVAN-028" }],
  variants: [{ sku: "202302800138" }],
  colourMappings: [{ model_code: "028", original_colour: "亮桔色/海蓝" }],
  inventoryRows: [{ sku: "202302800138", stock_quantity: 0 }],
  seedSummary: { matchedModels: 20, variantCount: 1312, colourCount: 144, skippedRows: 2436 },
  errors: [],
});

assert.equal(seedPreview.colourMappings.length, 1);
assert.equal(seedPreview.seedSummary.variantCount, 1312);
assert.equal(seedPreview.inventoryRows[0].stock_quantity, 0);

assert.equal(buildImportJobFinish({ processedRows: 12, errorMessage: "3 rows need review" }).status, "completed");
assert.equal(buildImportJobFinish({ processedRows: 0, errorMessage: "No rows matched" }).status, "failed");

console.log("admin-imports tests passed");
