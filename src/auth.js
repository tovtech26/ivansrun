(function attachAuth(root) {
  const PUBLIC_ROUTES = new Set(["store", "story", "product", "product-flyers", "product-flyer", "find-reseller", "apply", "signup", "login", "admin-login", "about", "contact", "terms", "privacy"]);
  const AUTHED_ROUTES = new Set(["account"]);
  const RESELLER_ROUTES = new Set(["reseller", "reseller-product", "request-confirmation", "history", "current-orders", "expected-orders", "fulfillment", "order"]);
  const ADMIN_ROUTES = new Set(["admin", "products", "site", "requests", "requests-review", "requests-payment", "requests-supplier", "requests-completed", "applications", "approvals", "imports", "email", "team"]);

  function normalizeRole(role) {
    if (role === "admin" || role === "reseller" || role === "pending_reseller") return role;
    return "public";
  }

  function normalizeAuthState(input = {}) {
    const user = input.user || null;
    const profile = input.profile || null;
    const explicitRole = normalizeRole(input.role);
    const profileRole = normalizeRole(profile?.role);
    const role = explicitRole !== "public" ? explicitRole : user ? profileRole : "public";
    return {
      user,
      profile,
      role,
      isAdmin: role === "admin",
      isReseller: role === "reseller",
      isPending: role === "pending_reseller",
      isAuthenticated: Boolean(user),
    };
  }

  function canAccessRoute(route, authLike = {}) {
    const auth = normalizeAuthState(authLike);
    if (PUBLIC_ROUTES.has(route)) return true;
    if (AUTHED_ROUTES.has(route)) return auth.isAuthenticated;
    if (RESELLER_ROUTES.has(route)) return auth.isReseller || auth.isAdmin;
    if (ADMIN_ROUTES.has(route)) return auth.isAdmin;
    return false;
  }

  function fallbackRouteForRole(role) {
    switch (normalizeRole(role)) {
      case "admin":
        return "admin";
      case "reseller":
        return "reseller";
      case "pending_reseller":
        return "apply";
      default:
        return "login";
    }
  }

  const api = {
    PUBLIC_ROUTES,
    AUTHED_ROUTES,
    RESELLER_ROUTES,
    ADMIN_ROUTES,
    normalizeRole,
    normalizeAuthState,
    canAccessRoute,
    fallbackRouteForRole,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IrunsvanAuth = api;
})(typeof window !== "undefined" ? window : globalThis);
