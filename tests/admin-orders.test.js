const assert = require("node:assert/strict");
const {
  buildAdminOrderRecords,
  buildApprovalInventoryAdjustments,
  buildOrderStatusPatch,
  countRequestsByStatus,
} = require("../src/admin-orders.js");

const requests = [
  {
    id: "request-1",
    status: "submitted",
    notes: "Urgent",
    admin_notes: null,
    created_at: "2026-06-04T10:00:00Z",
  },
  {
    id: "request-2",
    status: "approved",
    notes: null,
    admin_notes: "Pack with July launch",
    created_at: "2026-06-03T10:00:00Z",
  },
];

const items = [
  { order_request_id: "request-1", quantity: 4, base_price: 30 },
  { order_request_id: "request-1", quantity: 2, base_price: 36 },
  { order_request_id: "request-2", quantity: 8, base_price: 38 },
];

assert.deepEqual(buildAdminOrderRecords(requests, items), [
  {
    id: "request-1",
    code: "#RE-REQUEST1",
    status: "submitted",
    notes: "Urgent",
    adminNotes: null,
    createdAt: "2026-06-04T10:00:00Z",
    totalItems: 2,
    totalUnits: 6,
    subtotal: 192,
  },
  {
    id: "request-2",
    code: "#RE-REQUEST2",
    status: "approved",
    notes: null,
    adminNotes: "Pack with July launch",
    createdAt: "2026-06-03T10:00:00Z",
    totalItems: 1,
    totalUnits: 8,
    subtotal: 304,
  },
]);

const uniqueRecords = buildAdminOrderRecords(
  [
    { id: "request-1", status: "submitted" },
    { id: "request-2", status: "submitted" },
    { id: "e5b6f0a1-7d44-4a29-a3d3-1f8e64ac70bb", status: "submitted" },
  ],
  [],
);
assert.notEqual(uniqueRecords[0].code, uniqueRecords[1].code);
assert.equal(uniqueRecords[2].code, "#RE-64AC70BB");

assert.equal(countRequestsByStatus(buildAdminOrderRecords(requests, items), ["submitted"]), 1);
assert.equal(countRequestsByStatus(buildAdminOrderRecords(requests, items), ["submitted", "approved"]), 2);

assert.deepEqual(buildOrderStatusPatch("approved", "Ready to allocate"), {
  status: "approved",
  admin_notes: "Ready to allocate",
});

assert.throws(() => buildOrderStatusPatch("unknown"), /invalid order status/i);

assert.deepEqual(
  buildApprovalInventoryAdjustments({
    orderId: "request-1",
    items: [
      { order_request_id: "request-1", variant_id: "variant-1", quantity: 4 },
      { order_request_id: "request-1", variant_id: "variant-1", quantity: 2 },
      { order_request_id: "request-1", variant_id: "variant-2", quantity: 1 },
      { order_request_id: "request-2", variant_id: "variant-1", quantity: 100 },
    ],
    inventory: [
      { id: "stock-1", variant_id: "variant-1", sku: "SKU-1", stock_quantity: 10 },
      { id: "stock-2", variant_id: "variant-2", sku: "SKU-2", stock_quantity: 1 },
    ],
  }),
  [
    { id: "stock-1", variant_id: "variant-1", sku: "SKU-1", requestedQuantity: 6, previousStock: 10, nextStock: 4 },
    { id: "stock-2", variant_id: "variant-2", sku: "SKU-2", requestedQuantity: 1, previousStock: 1, nextStock: 0 },
  ],
);

assert.throws(
  () =>
    buildApprovalInventoryAdjustments({
      orderId: "request-1",
      items: [{ order_request_id: "request-1", variant_id: "variant-1", quantity: 3 }],
      inventory: [{ id: "stock-1", variant_id: "variant-1", sku: "SKU-1", stock_quantity: 2 }],
    }),
  /stock is no longer enough/i,
);

assert.throws(
  () =>
    buildApprovalInventoryAdjustments({
      orderId: "request-1",
      items: [{ order_request_id: "request-1", variant_id: "variant-1", quantity: 1 }],
      inventory: [],
    }),
  /inventory is missing/i,
);

console.log("admin-orders tests passed");
