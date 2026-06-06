const assert = require("node:assert/strict");
const { buildImportPreview } = require("../src/admin-imports.js");

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

console.log("admin-imports tests passed");
