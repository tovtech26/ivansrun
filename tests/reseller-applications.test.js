const assert = require("node:assert/strict");
const {
  buildApplicationPayload,
  summarizeApplications,
  buildApplicationApprovalUpdate,
} = require("../src/reseller-applications.js");

assert.deepEqual(
  buildApplicationPayload({
    userId: "user-1",
    email: "buyer@example.com",
    fullName: "Buyer Name",
    companyName: "TOV Sports Distribution",
    phone: "+26770000000",
    country: "Botswana",
    message: "We resell across Southern Africa.",
  }),
  {
    user_id: "user-1",
    email: "buyer@example.com",
    full_name: "Buyer Name",
    company_name: "TOV Sports Distribution",
    phone: "+26770000000",
    country: "Botswana",
    message: "We resell across Southern Africa.",
    status: "pending",
  },
);

assert.throws(
  () =>
    buildApplicationPayload({
      userId: "",
      email: "buyer@example.com",
      fullName: "Buyer Name",
      companyName: "TOV Sports Distribution",
    }),
  /authenticated account/i,
);

const applications = [
  {
    id: "app-1",
    user_id: "user-1",
    email: "buyer@example.com",
    full_name: "Buyer Name",
    company_name: "TOV Sports Distribution",
    country: "Botswana",
    status: "pending",
  },
  {
    id: "app-2",
    user_id: "user-2",
    email: "approved@example.com",
    full_name: "Approved Buyer",
    company_name: "Runner Supply",
    country: "South Africa",
    status: "approved",
  },
];

assert.deepEqual(summarizeApplications(applications), {
  pending: 1,
  approved: 1,
  rejected: 0,
  total: 2,
});

assert.deepEqual(buildApplicationApprovalUpdate({ status: "approved", adminUserId: "admin-1" }), {
  applicationPatch: {
    status: "approved",
    reviewed_by: "admin-1",
    reviewed_at: "NOW",
  },
  profilePatch: {
    role: "reseller",
  },
});

assert.deepEqual(buildApplicationApprovalUpdate({ status: "rejected", adminUserId: "admin-1" }), {
  applicationPatch: {
    status: "rejected",
    reviewed_by: "admin-1",
    reviewed_at: "NOW",
  },
  profilePatch: {
    role: "pending_reseller",
  },
});

assert.throws(() => buildApplicationApprovalUpdate({ status: "pending", adminUserId: "admin-1" }), /invalid application status/i);

console.log("reseller-applications tests passed");
