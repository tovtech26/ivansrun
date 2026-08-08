(function attachMobileNavigation(root) {
  const ROUTES = new Set([
    "store",
    "story",
    "ambassador",
    "product",
    "product-flyers",
    "product-flyer",
    "find-reseller",
    "apply",
    "signup",
    "login",
    "admin-login",
    "account",
    "reseller",
    "reseller-product",
    "request-confirmation",
    "history",
    "current-orders",
    "expected-orders",
    "fulfillment",
    "order",
    "admin",
    "team",
    "resellers",
    "requests",
    "requests-all",
    "requests-review",
    "requests-payment",
    "requests-supplier",
    "requests-completed",
    "applications",
    "products",
    "site",
    "approvals",
    "imports",
    "email",
    "about",
    "contact",
    "terms",
    "privacy",
  ]);

  const ADMIN_CHILDREN = new Set(["team", "resellers", "requests", "requests-all", "applications", "products", "site", "approvals", "imports", "email"]);
  const INFO_ROUTES = new Set(["find-reseller", "apply", "signup", "login", "admin-login", "account", "about", "contact", "terms", "privacy"]);

  function backTargetForRoute(route) {
    if (route === "store") return null;
    if (route === "story") return { route: "store" };
    if (route === "ambassador") return { route: "store" };
    if (route === "product") return { route: "store" };
    if (route === "product-flyers") return { route: "store" };
    if (route === "product-flyer") return { route: "product-flyers" };
    if (route === "reseller-product") return { route: "reseller" };
    if (route === "request-confirmation") return { route: "history" };
    if (route === "history") return { route: "reseller" };
    if (route === "current-orders" || route === "expected-orders" || route === "fulfillment") return { route: "history" };
    if (route === "order") return { route: "history" };
    if (route === "requests-all" || route === "requests-review" || route === "requests-payment" || route === "requests-supplier" || route === "requests-completed") return { route: "requests" };
    if (ADMIN_CHILDREN.has(route)) return { route: "admin" };
    if (route === "admin" || route === "reseller" || INFO_ROUTES.has(route)) return { route: "store" };
    return { route: "store" };
  }

  function buildRouteUrl(route, params = {}) {
    const safeRoute = ROUTES.has(route) ? route : "store";
    const productId = String(params.productId || "").trim();
    const orderId = String(params.orderId || "").trim();
    const storySlug = String(params.storySlug || "").trim();
    const ambassadorSlug = String(params.ambassadorSlug || "").trim();
    const flyerSlug = String(params.flyerSlug || "").trim();
    if (safeRoute === "story" && storySlug) return `#/${safeRoute}/${encodeURIComponent(storySlug)}`;
    if (safeRoute === "ambassador" && ambassadorSlug) return `#/${safeRoute}/${encodeURIComponent(ambassadorSlug)}`;
    if (safeRoute === "product-flyer" && flyerSlug) return `#/${safeRoute}/${encodeURIComponent(flyerSlug)}`;
    if ((safeRoute === "product" || safeRoute === "reseller-product") && productId) return `#/${safeRoute}/${encodeURIComponent(productId)}`;
    if (safeRoute === "order" && orderId) return `#/${safeRoute}/${encodeURIComponent(orderId)}`;
    return `#/${safeRoute}`;
  }

  function parseRouteUrl(hash = "") {
    const parts = String(hash || "").replace(/^#\/?/, "").split("/").filter(Boolean);
    const route = parts[0] || "store";
    if (!ROUTES.has(route)) return null;
    return {
      route,
      productId: (route === "product" || route === "reseller-product") && parts[1] ? decodeURIComponent(parts[1]) : null,
      orderId: route === "order" && parts[1] ? decodeURIComponent(parts[1]) : null,
      storySlug: route === "story" && parts[1] ? decodeURIComponent(parts[1]) : null,
      ...(route === "ambassador" ? { ambassadorSlug: parts[1] ? decodeURIComponent(parts[1]) : null } : {}),
      ...(route === "product-flyer" ? { flyerSlug: parts[1] ? decodeURIComponent(parts[1]) : null } : {}),
    };
  }

  const api = {
    backTargetForRoute,
    buildRouteUrl,
    parseRouteUrl,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IrunsvanMobileNavigation = api;
})(typeof window !== "undefined" ? window : globalThis);
