const assert = require("node:assert/strict");
const {
  buildInventoryPublishPlan,
  applyInventoryPublishPlan,
} = require("../src/inventory-workflow.js");

const inventory = [
  { id: "inv-1", variant_id: "variant-1", sku: "SKU-1", style_code: "028", stock_quantity: 12, source: "previous" },
  { id: "inv-2", variant_id: "variant-2", sku: "SKU-2", style_code: "028", stock_quantity: 5, source: "previous" },
  { id: "inv-3", variant_id: "variant-3", sku: "SKU-3", style_code: "066", stock_quantity: 0, source: "previous" },
];

const stockMatches = [
  {
    sourceSku: "MANUFACTURER-1",
    variantId: "variant-1",
    variantSku: "SKU-1",
    modelCode: "028",
    nextStock: 7,
  },
  {
    sourceSku: "MANUFACTURER-3",
    variantId: "variant-3",
    variantSku: "SKU-3",
    modelCode: "066",
    nextStock: 18,
  },
];

const plan = buildInventoryPublishPlan({
  inventory,
  stockMatches,
  source: "master_inventory",
});

assert.deepEqual(plan.summary, {
  trackedRowsReset: 3,
  matchedRowsApplied: 2,
  absentRowsZeroed: 1,
  totalNextStock: 25,
});

assert.deepEqual(plan.rows, [
  { id: "inv-1", variant_id: "variant-1", sku: "SKU-1", style_code: "028", stock_quantity: 7, source: "master_inventory:MANUFACTURER-1" },
  { id: "inv-2", variant_id: "variant-2", sku: "SKU-2", style_code: "028", stock_quantity: 0, source: "master_inventory:absent" },
  { id: "inv-3", variant_id: "variant-3", sku: "SKU-3", style_code: "066", stock_quantity: 18, source: "master_inventory:MANUFACTURER-3" },
]);

assert.deepEqual(plan.absentRows, [
  { variantId: "variant-2", sku: "SKU-2", previousStock: 5, nextStock: 0 },
]);

assert.deepEqual(applyInventoryPublishPlan(inventory, plan), [
  { id: "inv-1", variant_id: "variant-1", sku: "SKU-1", style_code: "028", stock_quantity: 7, source: "master_inventory:MANUFACTURER-1" },
  { id: "inv-2", variant_id: "variant-2", sku: "SKU-2", style_code: "028", stock_quantity: 0, source: "master_inventory:absent" },
  { id: "inv-3", variant_id: "variant-3", sku: "SKU-3", style_code: "066", stock_quantity: 18, source: "master_inventory:MANUFACTURER-3" },
]);

assert.throws(
  () =>
    buildInventoryPublishPlan({
      inventory,
      stockMatches: [{ variantId: "", variantSku: "SKU-X", nextStock: 1 }],
    }),
  /variant/i,
);

console.log("inventory-workflow tests passed");
