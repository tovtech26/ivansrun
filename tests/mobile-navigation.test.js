const assert = require("node:assert/strict");
const {
  backTargetForRoute,
  buildRouteUrl,
  parseRouteUrl,
} = require("../src/mobile-navigation.js");

assert.deepEqual(backTargetForRoute("product"), { route: "store" });
assert.deepEqual(backTargetForRoute("product-flyers"), { route: "store" });
assert.deepEqual(backTargetForRoute("product-flyer"), { route: "product-flyers" });
assert.deepEqual(backTargetForRoute("reseller-product"), { route: "reseller" });
assert.deepEqual(backTargetForRoute("request-confirmation"), { route: "history" });
assert.deepEqual(backTargetForRoute("history"), { route: "reseller" });
assert.deepEqual(backTargetForRoute("current-orders"), { route: "history" });
assert.deepEqual(backTargetForRoute("expected-orders"), { route: "history" });
assert.deepEqual(backTargetForRoute("fulfillment"), { route: "history" });
assert.deepEqual(backTargetForRoute("order"), { route: "history" });
assert.deepEqual(backTargetForRoute("requests-review"), { route: "requests" });
assert.deepEqual(backTargetForRoute("requests-payment"), { route: "requests" });
assert.deepEqual(backTargetForRoute("requests-supplier"), { route: "requests" });
assert.deepEqual(backTargetForRoute("requests-completed"), { route: "requests" });
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
assert.equal(buildRouteUrl("product-flyers"), "#/product-flyers");
assert.equal(buildRouteUrl("product-flyer", { flyerSlug: "irunsvan-005" }), "#/product-flyer/irunsvan-005");
assert.equal(buildRouteUrl("product", { productId: "fallback-001" }), "#/product/fallback-001");
assert.equal(buildRouteUrl("find-reseller"), "#/find-reseller");
assert.equal(buildRouteUrl("signup"), "#/signup");
assert.equal(buildRouteUrl("account"), "#/account");
assert.equal(buildRouteUrl("story", { storySlug: "new-launch" }), "#/story/new-launch");
assert.equal(buildRouteUrl("reseller-product", { productId: "product-001" }), "#/reseller-product/product-001");
assert.equal(buildRouteUrl("request-confirmation"), "#/request-confirmation");
assert.equal(buildRouteUrl("current-orders"), "#/current-orders");
assert.equal(buildRouteUrl("order", { orderId: "request-001" }), "#/order/request-001");
assert.deepEqual(parseRouteUrl("#/product/fallback-001"), { route: "product", productId: "fallback-001", orderId: null, storySlug: null });
assert.deepEqual(parseRouteUrl("#/product-flyer/irunsvan-005"), { route: "product-flyer", productId: null, orderId: null, storySlug: null, flyerSlug: "irunsvan-005" });
assert.deepEqual(parseRouteUrl("#/story/new-launch"), { route: "story", productId: null, orderId: null, storySlug: "new-launch" });
assert.deepEqual(parseRouteUrl("#/admin-login"), { route: "admin-login", productId: null, orderId: null, storySlug: null });
assert.deepEqual(parseRouteUrl("#/signup"), { route: "signup", productId: null, orderId: null, storySlug: null });
assert.deepEqual(parseRouteUrl("#/team"), { route: "team", productId: null, orderId: null, storySlug: null });
assert.deepEqual(parseRouteUrl("#/reseller-product/product-001"), { route: "reseller-product", productId: "product-001", orderId: null, storySlug: null });
assert.deepEqual(parseRouteUrl("#/request-confirmation"), { route: "request-confirmation", productId: null, orderId: null, storySlug: null });
assert.deepEqual(parseRouteUrl("#/fulfillment"), { route: "fulfillment", productId: null, orderId: null, storySlug: null });
assert.deepEqual(parseRouteUrl("#/order/request-001"), { route: "order", productId: null, orderId: "request-001", storySlug: null });
assert.deepEqual(parseRouteUrl("#/requests-payment"), { route: "requests-payment", productId: null, orderId: null, storySlug: null });
assert.deepEqual(parseRouteUrl("#/imports"), { route: "imports", productId: null, orderId: null, storySlug: null });
assert.deepEqual(parseRouteUrl("#/bad"), null);

console.log("mobile-navigation tests passed");
