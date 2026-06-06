const assert = require("node:assert/strict");
const {
  backTargetForRoute,
  buildRouteUrl,
  parseRouteUrl,
} = require("../src/mobile-navigation.js");

assert.deepEqual(backTargetForRoute("product"), { route: "store" });
assert.deepEqual(backTargetForRoute("history"), { route: "reseller" });
assert.deepEqual(backTargetForRoute("products"), { route: "admin" });
assert.deepEqual(backTargetForRoute("site"), { route: "admin" });
assert.deepEqual(backTargetForRoute("imports"), { route: "admin" });
assert.deepEqual(backTargetForRoute("admin"), { route: "store" });
assert.deepEqual(backTargetForRoute("apply"), { route: "store" });
assert.deepEqual(backTargetForRoute("store"), null);

assert.equal(buildRouteUrl("store"), "#/store");
assert.equal(buildRouteUrl("product", { productId: "fallback-001" }), "#/product/fallback-001");
assert.deepEqual(parseRouteUrl("#/product/fallback-001"), { route: "product", productId: "fallback-001" });
assert.deepEqual(parseRouteUrl("#/imports"), { route: "imports", productId: null });
assert.deepEqual(parseRouteUrl("#/bad"), null);

console.log("mobile-navigation tests passed");
