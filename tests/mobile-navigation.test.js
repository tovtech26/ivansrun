const assert = require("node:assert/strict");
const {
  backTargetForRoute,
  buildRouteUrl,
  parseRouteUrl,
} = require("../src/mobile-navigation.js");

assert.deepEqual(backTargetForRoute("product"), { route: "store" });
assert.deepEqual(backTargetForRoute("reseller-product"), { route: "reseller" });
assert.deepEqual(backTargetForRoute("request-confirmation"), { route: "history" });
assert.deepEqual(backTargetForRoute("history"), { route: "reseller" });
assert.deepEqual(backTargetForRoute("products"), { route: "admin" });
assert.deepEqual(backTargetForRoute("site"), { route: "admin" });
assert.deepEqual(backTargetForRoute("imports"), { route: "admin" });
assert.deepEqual(backTargetForRoute("admin"), { route: "store" });
assert.deepEqual(backTargetForRoute("find-reseller"), { route: "store" });
assert.deepEqual(backTargetForRoute("admin-login"), { route: "store" });
assert.deepEqual(backTargetForRoute("signup"), { route: "store" });
assert.deepEqual(backTargetForRoute("account"), { route: "store" });
assert.deepEqual(backTargetForRoute("story"), { route: "store" });
assert.deepEqual(backTargetForRoute("team"), { route: "admin" });
assert.deepEqual(backTargetForRoute("apply"), { route: "store" });
assert.deepEqual(backTargetForRoute("store"), null);

assert.equal(buildRouteUrl("store"), "#/store");
assert.equal(buildRouteUrl("product", { productId: "fallback-001" }), "#/product/fallback-001");
assert.equal(buildRouteUrl("find-reseller"), "#/find-reseller");
assert.equal(buildRouteUrl("signup"), "#/signup");
assert.equal(buildRouteUrl("account"), "#/account");
assert.equal(buildRouteUrl("story", { storySlug: "new-launch" }), "#/story/new-launch");
assert.equal(buildRouteUrl("reseller-product", { productId: "product-001" }), "#/reseller-product/product-001");
assert.equal(buildRouteUrl("request-confirmation"), "#/request-confirmation");
assert.deepEqual(parseRouteUrl("#/product/fallback-001"), { route: "product", productId: "fallback-001", storySlug: null });
assert.deepEqual(parseRouteUrl("#/story/new-launch"), { route: "story", productId: null, storySlug: "new-launch" });
assert.deepEqual(parseRouteUrl("#/admin-login"), { route: "admin-login", productId: null, storySlug: null });
assert.deepEqual(parseRouteUrl("#/signup"), { route: "signup", productId: null, storySlug: null });
assert.deepEqual(parseRouteUrl("#/team"), { route: "team", productId: null, storySlug: null });
assert.deepEqual(parseRouteUrl("#/reseller-product/product-001"), { route: "reseller-product", productId: "product-001", storySlug: null });
assert.deepEqual(parseRouteUrl("#/request-confirmation"), { route: "request-confirmation", productId: null, storySlug: null });
assert.deepEqual(parseRouteUrl("#/imports"), { route: "imports", productId: null, storySlug: null });
assert.deepEqual(parseRouteUrl("#/bad"), null);

console.log("mobile-navigation tests passed");
