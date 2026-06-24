const assert = require("node:assert/strict");
const {
  ORDER_STATUS_META,
  buildAdminOrderRecords,
  buildApprovalInventoryAdjustments,
  buildClientOrderBuckets,
  buildOrderStatusPatch,
  countRequestsByStatus,
  nextAdminActions,
  normalizeOrderStatus,
} = require("../src/admin-orders.js");

const requests = [
  {
    id: "request-1",
    status: "submitted",
    notes: "Urgent",
    admin_notes: null,
    created_at: "2026-06-04T10:00:00Z",
    updated_at: "2026-06-04T11:00:00Z",
  },
  {
    id: "request-2",
    status: "approved",
    notes: null,
    admin_notes: "Pack with July launch",
    created_at: "2026-06-03T10:00:00Z",
    updated_at: "2026-06-03T11:00:00Z",
  },
];

const items = [
  { order_request_id: "request-1", quantity: 4, base_price: 30 },
  { order_request_id: "request-1", quantity: 2, base_price: 36 },
  { order_request_id: "request-2", quantity: 8, base_price: 38 },
];

assert.equal(normalizeOrderStatus("approved"), "awaiting_payment");
assert.equal(normalizeOrderStatus("in_fulfillment"), "processing");
assert.equal(normalizeOrderStatus("unknown"), "submitted");

assert.deepEqual(buildAdminOrderRecords(requests, items), [
  {
    id: "request-1",
    code: "#RE-REQUEST1",
    status: "submitted",
    normalizedStatus: "submitted",
    statusMeta: ORDER_STATUS_META.submitted,
    notes: "Urgent",
    adminNotes: null,
    createdAt: "2026-06-04T10:00:00Z",
    updatedAt: "2026-06-04T11:00:00Z",
    approvedAt: null,
    paidAt: null,
    supplierSubmittedAt: null,
    processingAt: null,
    shippedAt: null,
    fulfilledAt: null,
    expectedFulfillmentDate: null,
    invoiceNumber: null,
    paymentReference: null,
    paymentNote: null,
    supplierExportedAt: null,
    totalItems: 2,
    totalUnits: 6,
    subtotal: 192,
  },
  {
    id: "request-2",
    code: "#RE-REQUEST2",
    status: "approved",
    normalizedStatus: "awaiting_payment",
    statusMeta: ORDER_STATUS_META.awaiting_payment,
    notes: null,
    adminNotes: "Pack with July launch",
    createdAt: "2026-06-03T10:00:00Z",
    updatedAt: "2026-06-03T11:00:00Z",
    approvedAt: null,
    paidAt: null,
    supplierSubmittedAt: null,
    processingAt: null,
    shippedAt: null,
    fulfilledAt: null,
    expectedFulfillmentDate: null,
    invoiceNumber: null,
    paymentReference: null,
    paymentNote: null,
    supplierExportedAt: null,
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
assert.equal(countRequestsByStatus(buildAdminOrderRecords(requests, items), ["submitted", "awaiting_payment"]), 2);

const awaitingPaymentPatch = buildOrderStatusPatch("awaiting_payment", "Ready to allocate");
assert.equal(awaitingPaymentPatch.status, "awaiting_payment");
assert.equal(awaitingPaymentPatch.admin_notes, "Ready to allocate");
assert.match(awaitingPaymentPatch.approved_at, /^\d{4}-\d{2}-\d{2}T/);

assert.throws(() => buildOrderStatusPatch("unknown"), /invalid order status/i);

assert.deepEqual(
  buildClientOrderBuckets([
    { id: "1", status: "submitted", normalizedStatus: "submitted" },
    { id: "2", status: "approved", normalizedStatus: "awaiting_payment" },
    { id: "3", status: "paid", normalizedStatus: "paid" },
    { id: "4", status: "submitted_to_supplier", normalizedStatus: "submitted_to_supplier" },
    { id: "5", status: "processing", normalizedStatus: "processing" },
    { id: "6", status: "shipped", normalizedStatus: "shipped" },
    { id: "7", status: "fulfilled", normalizedStatus: "fulfilled" },
    { id: "8", status: "cancelled", normalizedStatus: "cancelled" },
  ]),
  {
    new: [{ id: "1", status: "submitted", normalizedStatus: "submitted" }],
    awaitingPayment: [{ id: "2", status: "approved", normalizedStatus: "awaiting_payment" }],
    active: [
      { id: "3", status: "paid", normalizedStatus: "paid" },
      { id: "4", status: "submitted_to_supplier", normalizedStatus: "submitted_to_supplier" },
      { id: "5", status: "processing", normalizedStatus: "processing" },
    ],
    shipped: [{ id: "6", status: "shipped", normalizedStatus: "shipped" }],
    fulfilled: [{ id: "7", status: "fulfilled", normalizedStatus: "fulfilled" }],
    closed: [{ id: "8", status: "cancelled", normalizedStatus: "cancelled" }],
  },
);

assert.deepEqual(nextAdminActions("submitted"), [
  { status: "awaiting_payment", label: "Agree to Supply" },
  { status: "rejected", label: "Cannot Supply", tone: "secondary" },
]);
assert.deepEqual(nextAdminActions("approved"), [
  { status: "paid", label: "Mark Payment Received" },
  { status: "cancelled", label: "Cancel", tone: "secondary" },
]);
assert.deepEqual(nextAdminActions("submitted_to_supplier"), [{ status: "processing", label: "Mark Processing" }]);
assert.deepEqual(nextAdminActions("processing"), [{ status: "shipped", label: "Mark Shipped" }]);
assert.deepEqual(nextAdminActions("shipped"), [{ status: "fulfilled", label: "Mark Fulfilled" }]);

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
