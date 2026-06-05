(function attachAuth(root) {
  const PUBLIC_ROUTES = new Set(["store", "product", "apply", "login", "about", "contact", "terms", "privacy"]);
  const RESELLER_ROUTES = new Set(["reseller", "history"]);
  const ADMIN_ROUTES = new Set(["admin", "products", "site", "approvals", "imports", "email"]);

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

  function buildDevAdminAuthState() {
    return normalizeAuthState({
      user: { id: "local-admin", email: "admin@ivansrun.africa" },
      profile: {
        id: "local-admin",
        email: "admin@ivansrun.africa",
        full_name: "Local Admin",
        company_name: "Ivansrun Africa",
        role: "admin",
        approved: true,
      },
    });
  }

  const api = {
    PUBLIC_ROUTES,
    RESELLER_ROUTES,
    ADMIN_ROUTES,
    normalizeRole,
    normalizeAuthState,
    canAccessRoute,
    fallbackRouteForRole,
    buildDevAdminAuthState,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IvansrunAuth = api;
})(typeof window !== "undefined" ? window : globalThis);
