const assert = require("node:assert/strict");
const { buildOrderEmailPayload, buildApplicationEmailPayload } = require("../src/email-notifications.js");

const submittedPayload = buildOrderEmailPayload({
    eventType: "order_submitted",
    adminEmails: ["ops@irunsvan.africa"],
    orderCode: "#RE-123456",
    resellerCompany: "TOV Sports Distribution",
    resellerEmail: "buyer@example.com",
    totalSkus: 2,
    totalUnits: 14,
    subtotal: 492,
    notes: "Urgent dispatch",
  });

assert.deepEqual(submittedPayload.to, ["buyer@example.com", "ops@irunsvan.africa"]);
assert.equal(submittedPayload.subject, "Your order #RE-123456 is pending approval");
assert.equal(submittedPayload.template, "order_status");
assert.equal(submittedPayload.statusLabel, "Pending approval");
assert.match(submittedPayload.logoUrl, /Irunsvan_Blue-removebg-preview\.svg/);
assert.match(submittedPayload.html, /IRUNSVAN/i);
assert.match(submittedPayload.html, /<img src="https:\/\/raw\.githubusercontent\.com\/tovtech26\/ivansrun\/main\/public\/brand\/Irunsvan_Blue-removebg-preview\.svg"/);
assert.match(submittedPayload.html, /Your order #RE-123456 is pending approval/);
assert.match(submittedPayload.html, /TOV Sports Distribution/);
assert.match(submittedPayload.html, /14 pairs/);
assert.deepEqual(submittedPayload.htmlIncludes, [
  "#RE-123456",
  "TOV Sports Distribution",
  "buyer@example.com",
  "2",
  "14",
  "$492.00",
  "Urgent dispatch",
  "Pending approval",
]);

const acceptedPayload = buildOrderEmailPayload({
  eventType: "order_awaiting_payment",
  adminEmails: [],
  orderCode: "#RE-654321",
  resellerCompany: "TOV Sports Distribution",
  resellerEmail: "buyer@example.com",
  totalSkus: 3,
  totalUnits: 22,
  subtotal: 875,
  notes: "Updated from admin dashboard",
});

assert.deepEqual(acceptedPayload.to, ["buyer@example.com"]);
assert.equal(acceptedPayload.subject, "Your order #RE-654321 has been accepted");
assert.equal(acceptedPayload.statusLabel, "Accepted");
assert.match(acceptedPayload.html, /Your order #RE-654321 has been accepted/);
assert.match(acceptedPayload.html, /accepted your order request/i);

assert.deepEqual(
  buildApplicationEmailPayload({
    eventType: "application_submitted",
    adminEmails: ["ops@irunsvan.africa"],
    companyName: "TOV Sports Distribution",
    fullName: "Buyer Name",
    email: "buyer@example.com",
    country: "Botswana",
    message: "We resell across Southern Africa.",
  }),
  {
    to: ["ops@irunsvan.africa"],
    subject: "New reseller application from TOV Sports Distribution",
    htmlIncludes: ["TOV Sports Distribution", "Buyer Name", "buyer@example.com", "Botswana", "We resell across Southern Africa."],
  },
);

console.log("email-notifications tests passed");
