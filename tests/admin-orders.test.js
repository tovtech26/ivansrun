const assert = require("node:assert/strict");
const {
  buildAdminOrderRecords,
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
    code: "#RE-REQUES",
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
    code: "#RE-REQUES",
    status: "approved",
    notes: null,
    adminNotes: "Pack with July launch",
    createdAt: "2026-06-03T10:00:00Z",
    totalItems: 1,
    totalUnits: 8,
    subtotal: 304,
  },
]);

assert.equal(countRequestsByStatus(buildAdminOrderRecords(requests, items), ["submitted"]), 1);
assert.equal(countRequestsByStatus(buildAdminOrderRecords(requests, items), ["submitted", "approved"]), 2);

assert.deepEqual(buildOrderStatusPatch("approved", "Ready to allocate"), {
  status: "approved",
  admin_notes: "Ready to allocate",
});

assert.throws(() => buildOrderStatusPatch("unknown"), /invalid order status/i);

console.log("admin-orders tests passed");
