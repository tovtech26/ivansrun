const assert = require("node:assert/strict");
const { buildOrderEmailPayload, buildApplicationEmailPayload } = require("../src/email-notifications.js");

assert.deepEqual(
  buildOrderEmailPayload({
    eventType: "order_submitted",
    adminEmails: ["ops@ivansrun.africa"],
    orderCode: "#RE-123456",
    resellerCompany: "TOV Sports Distribution",
    resellerEmail: "buyer@example.com",
    totalSkus: 2,
    totalUnits: 14,
    subtotal: 492,
    notes: "Urgent dispatch",
  }),
  {
    to: ["ops@ivansrun.africa"],
    subject: "New order request #RE-123456 from TOV Sports Distribution",
    htmlIncludes: [
      "#RE-123456",
      "TOV Sports Distribution",
      "buyer@example.com",
      "2",
      "14",
      "$492.00",
      "Urgent dispatch",
    ],
  },
);

assert.deepEqual(
  buildApplicationEmailPayload({
    eventType: "application_submitted",
    adminEmails: ["ops@ivansrun.africa"],
    companyName: "TOV Sports Distribution",
    fullName: "Buyer Name",
    email: "buyer@example.com",
    country: "Botswana",
    message: "We resell across Southern Africa.",
  }),
  {
    to: ["ops@ivansrun.africa"],
    subject: "New reseller application from TOV Sports Distribution",
    htmlIncludes: ["TOV Sports Distribution", "Buyer Name", "buyer@example.com", "Botswana", "We resell across Southern Africa."],
  },
);

console.log("email-notifications tests passed");
