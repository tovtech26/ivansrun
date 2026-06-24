const assert = require("node:assert/strict");
const {
  normalizeAuthState,
  canAccessRoute,
  fallbackRouteForRole,
} = require("../src/auth.js");

assert.deepEqual(normalizeAuthState({ user: null, profile: null }), {
  user: null,
  profile: null,
  role: "public",
  isAdmin: false,
  isReseller: false,
  isPending: false,
  isAuthenticated: false,
});

assert.deepEqual(
  normalizeAuthState({
    user: { id: "user-1", email: "pending@example.com" },
    profile: { id: "user-1", role: "pending_reseller", company_name: "Pending Co" },
  }),
  {
    user: { id: "user-1", email: "pending@example.com" },
    profile: { id: "user-1", role: "pending_reseller", company_name: "Pending Co" },
    role: "pending_reseller",
    isAdmin: false,
    isReseller: false,
    isPending: true,
    isAuthenticated: true,
  },
);

assert.equal(canAccessRoute("store", { role: "public" }), true);
assert.equal(canAccessRoute("story", { role: "public" }), true);
assert.equal(canAccessRoute("product", { role: "public" }), true);
assert.equal(canAccessRoute("product-flyers", { role: "public" }), true);
assert.equal(canAccessRoute("product-flyer", { role: "public" }), true);
assert.equal(canAccessRoute("find-reseller", { role: "public" }), true);
assert.equal(canAccessRoute("signup", { role: "public" }), true);
assert.equal(canAccessRoute("admin-login", { role: "public" }), true);
assert.equal(canAccessRoute("account", { role: "public" }), false);
assert.equal(canAccessRoute("account", { user: { id: "user-1" }, profile: { id: "user-1", role: "pending_reseller" } }), true);
assert.equal(canAccessRoute("reseller", { role: "public" }), false);
assert.equal(canAccessRoute("reseller", { role: "pending_reseller" }), false);
assert.equal(canAccessRoute("reseller", { role: "reseller" }), true);
assert.equal(canAccessRoute("request-confirmation", { role: "reseller" }), true);
assert.equal(canAccessRoute("history", { role: "reseller" }), true);
assert.equal(canAccessRoute("current-orders", { role: "reseller" }), true);
assert.equal(canAccessRoute("expected-orders", { role: "reseller" }), true);
assert.equal(canAccessRoute("fulfillment", { role: "reseller" }), true);
assert.equal(canAccessRoute("order", { role: "reseller" }), true);
assert.equal(canAccessRoute("order", { role: "admin" }), true);
assert.equal(canAccessRoute("order", { role: "public" }), false);
assert.equal(canAccessRoute("site", { role: "reseller" }), false);
assert.equal(canAccessRoute("site", { role: "admin" }), true);
assert.equal(canAccessRoute("team", { role: "admin" }), true);
assert.equal(canAccessRoute("products", { role: "admin" }), true);
assert.equal(canAccessRoute("imports", { role: "admin" }), true);
assert.equal(canAccessRoute("requests", { role: "admin" }), true);
assert.equal(canAccessRoute("requests-review", { role: "admin" }), true);
assert.equal(canAccessRoute("requests-payment", { role: "admin" }), true);
assert.equal(canAccessRoute("requests-supplier", { role: "admin" }), true);
assert.equal(canAccessRoute("requests-completed", { role: "admin" }), true);
assert.equal(canAccessRoute("applications", { role: "admin" }), true);
assert.equal(canAccessRoute("requests", { role: "reseller" }), false);
assert.equal(canAccessRoute("applications", { role: "reseller" }), false);

assert.equal(fallbackRouteForRole("public"), "login");
assert.equal(fallbackRouteForRole("pending_reseller"), "apply");
assert.equal(fallbackRouteForRole("reseller"), "reseller");
assert.equal(fallbackRouteForRole("admin"), "admin");

console.log("auth-state tests passed");
