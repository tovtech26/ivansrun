(function attachMobileNavigation(root) {
  const ROUTES = new Set([
    "store",
    "product",
    "find-reseller",
    "apply",
    "login",
    "admin-login",
    "account",
    "reseller",
    "reseller-product",
    "history",
    "admin",
    "team",
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

  const ADMIN_CHILDREN = new Set(["team", "products", "site", "approvals", "imports", "email"]);
  const INFO_ROUTES = new Set(["find-reseller", "apply", "login", "admin-login", "account", "about", "contact", "terms", "privacy"]);

  function backTargetForRoute(route) {
    if (route === "store") return null;
    if (route === "product") return { route: "store" };
    if (route === "reseller-product") return { route: "reseller" };
    if (route === "history") return { route: "reseller" };
    if (ADMIN_CHILDREN.has(route)) return { route: "admin" };
    if (route === "admin" || route === "reseller" || INFO_ROUTES.has(route)) return { route: "store" };
    return { route: "store" };
  }

  function buildRouteUrl(route, params = {}) {
    const safeRoute = ROUTES.has(route) ? route : "store";
    const productId = String(params.productId || "").trim();
    if ((safeRoute === "product" || safeRoute === "reseller-product") && productId) return `#/${safeRoute}/${encodeURIComponent(productId)}`;
    return `#/${safeRoute}`;
  }

  function parseRouteUrl(hash = "") {
    const parts = String(hash || "").replace(/^#\/?/, "").split("/").filter(Boolean);
    const route = parts[0] || "store";
    if (!ROUTES.has(route)) return null;
    return {
      route,
      productId: (route === "product" || route === "reseller-product") && parts[1] ? decodeURIComponent(parts[1]) : null,
    };
  }

  const api = {
    backTargetForRoute,
    buildRouteUrl,
    parseRouteUrl,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IvansrunMobileNavigation = api;
})(typeof window !== "undefined" ? window : globalThis);
