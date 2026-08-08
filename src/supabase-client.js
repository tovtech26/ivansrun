(function attachSupabaseClient(root) {
  const AUTH_STORAGE_KEY = "irunsvan_auth_session";
  const OAUTH_ERROR_STORAGE_KEY = "irunsvan_oauth_error";
  const LEGACY_AUTH_STORAGE_KEY = "ivan" + "srun_auth_session";
  const LEGACY_OAUTH_ERROR_STORAGE_KEY = "ivan" + "srun_oauth_error";
  const ADMIN_LOGIN_DOMAIN = "irunsvan.africa";

  function adminLoginEmail(username) {
    const normalized = String(username || "").trim().toUpperCase();
    if (!/^[A-Z][A-Z0-9_-]{2,31}$/.test(normalized)) {
      throw new Error("Enter a valid admin username.");
    }
    return `${normalized.toLowerCase()}.admin@${ADMIN_LOGIN_DOMAIN}`;
  }

  function headers(key, accessToken) {
    return {
      apikey: key,
      Authorization: `Bearer ${accessToken || key}`,
    };
  }

  function authErrorMessage(body, fallback) {
    const message = String(body?.msg || body?.error_description || body?.error || body?.message || fallback || "Authentication failed").trim();
    if (/bad_oauth_state/i.test(message)) {
      return "OAuth sign-in state expired. Start from a fresh login page and try again.";
    }
    if (/invalid login credentials/i.test(message)) return "Invalid email or password.";
    if (/email not confirmed/i.test(message)) return "Confirm your email address before signing in.";
    if (/provider is not enabled|unsupported provider|oauth provider.*disabled/i.test(message)) {
      return "Google login is not configured in Supabase yet.";
    }
    if (/client id/i.test(message) && /google|provider|oauth/i.test(message)) {
      return "Google login is not configured in Supabase yet.";
    }
    return message || fallback || "Authentication failed";
  }

  function readStoredSession() {
    try {
      const sessionText = localStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(LEGACY_AUTH_STORAGE_KEY);
      if (sessionText && !localStorage.getItem(AUTH_STORAGE_KEY)) {
        localStorage.setItem(AUTH_STORAGE_KEY, sessionText);
        localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
      }
      return JSON.parse(sessionText || "null");
    } catch {
      return null;
    }
  }

  function normalizeSession(session, nowMs = Date.now()) {
    if (!session || typeof session !== "object") return session;
    const normalized = { ...session };
    if (!normalized.expires_at && Number(normalized.expires_in) > 0) {
      normalized.expires_at = Math.floor(nowMs / 1000) + Number(normalized.expires_in);
    }
    return normalized;
  }

  function writeStoredSession(session) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalizeSession(session)));
  }

  function clearStoredSession() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
  }

  function buildOAuthUrl({ url, provider = "google", redirectTo }) {
    const authorizeUrl = new URL(`${url}/auth/v1/authorize`);
    authorizeUrl.searchParams.set("provider", provider);
    if (redirectTo) authorizeUrl.searchParams.set("redirect_to", redirectTo);
    return authorizeUrl.toString();
  }

  function signInWithOAuth({ url, provider = "google", redirectTo }) {
    const authUrl = buildOAuthUrl({ url, provider, redirectTo });
    root.location.assign(authUrl);
  }

  function oauthResultFromSearch(search = "") {
    const params = new URLSearchParams(String(search || "").replace(/^\?/, ""));
    const error = params.get("error_description") || params.get("error") || params.get("error_code");
    const code = params.get("code");
    if (error) return { handled: true, error: authErrorMessage({ error_description: error }, "OAuth sign-in failed") };
    if (code) {
      return {
        handled: true,
        error: "OAuth callback returned an authorization code that this client cannot exchange automatically.",
      };
    }
    return { handled: false };
  }

  function oauthSessionFromHash(hash = "") {
    const params = new URLSearchParams(String(hash || "").replace(/^#/, ""));
    const accessToken = params.get("access_token");
    if (!accessToken) {
      const error = params.get("error_description") || params.get("error");
      return { handled: Boolean(error), error: error ? authErrorMessage({ error_description: error }, "OAuth sign-in failed") : null };
    }
    return {
      handled: true,
      session: {
        access_token: accessToken,
        refresh_token: params.get("refresh_token") || "",
        expires_in: Number(params.get("expires_in") || 0),
        expires_at: params.get("expires_at") ? Number(params.get("expires_at")) : null,
        token_type: params.get("token_type") || "bearer",
        provider_token: params.get("provider_token") || null,
        provider_refresh_token: params.get("provider_refresh_token") || null,
      },
    };
  }

  function consumeOAuthSessionFromUrl() {
    const searchResult = oauthResultFromSearch(root.location?.search || "");
    if (searchResult.handled) {
      if (searchResult.error) localStorage.setItem(OAUTH_ERROR_STORAGE_KEY, searchResult.error);
      const cleanSearchUrl = new URL(root.location.href);
      cleanSearchUrl.hash = "";
      cleanSearchUrl.searchParams.delete("oauth");
      cleanSearchUrl.searchParams.delete("code");
      cleanSearchUrl.searchParams.delete("error_code");
      cleanSearchUrl.searchParams.delete("error");
      cleanSearchUrl.searchParams.delete("error_description");
      root.history?.replaceState?.({}, "", `${cleanSearchUrl.pathname}${cleanSearchUrl.search}`);
      return searchResult;
    }
    if (!root.location?.hash) return { handled: false };
    const result = oauthSessionFromHash(root.location.hash);
    if (!result.handled) return result;
    if (result.session?.access_token) writeStoredSession(result.session);
    if (result.error) localStorage.setItem(OAUTH_ERROR_STORAGE_KEY, result.error);

    const cleanUrl = new URL(root.location.href);
    cleanUrl.hash = "";
    cleanUrl.searchParams.delete("oauth");
    cleanUrl.searchParams.delete("error_code");
    root.history?.replaceState?.({}, "", `${cleanUrl.pathname}${cleanUrl.search}`);
    return result;
  }

  function consumeOAuthError() {
    const error = localStorage.getItem(OAUTH_ERROR_STORAGE_KEY) || localStorage.getItem(LEGACY_OAUTH_ERROR_STORAGE_KEY);
    localStorage.removeItem(OAUTH_ERROR_STORAGE_KEY);
    localStorage.removeItem(LEGACY_OAUTH_ERROR_STORAGE_KEY);
    return error;
  }

  async function signInWithPassword({ url, key, email, password }) {
    const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        apikey: key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    const body = await response.json();
    if (!response.ok) {
      throw new Error(authErrorMessage(body, "Login failed"));
    }
    writeStoredSession(body);
    return body;
  }

  async function signUpWithPassword({ url, key, email, password, metadata = {} }) {
    const response = await fetch(`${url}/auth/v1/signup`, {
      method: "POST",
      headers: {
        apikey: key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        data: metadata,
      }),
    });
    const body = await response.json();
    if (!response.ok) {
      throw new Error(authErrorMessage(body, "Account creation failed"));
    }
    if (body?.access_token) {
      writeStoredSession(body);
    }
    return body;
  }

  async function fetchCurrentUser({ url, key, accessToken }) {
    const response = await fetch(`${url}/auth/v1/user`, {
      headers: headers(key, accessToken),
    });
    if (response.status === 401) return null;
    if (!response.ok) throw new Error("Unable to load current user");
    return response.json();
  }

  async function fetchProfile({ url, key, accessToken, userId }) {
    const response = await fetch(`${url}/rest/v1/profiles?select=id,email,full_name,company_name,phone,role&id=eq.${encodeURIComponent(userId)}&limit=1`, {
      headers: headers(key, accessToken),
    });
    if (!response.ok) throw new Error("Unable to load profile");
    const rows = await response.json();
    return rows[0] || null;
  }

  async function requestPasswordReset({ url, key, email, redirectTo }) {
    const response = await fetch(`${url}/auth/v1/recover`, {
      method: "POST",
      headers: {
        apikey: key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        redirect_to: redirectTo,
      }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(authErrorMessage(body, "Password reset failed"));
    return body;
  }

  async function updatePassword({ url, key, accessToken, password }) {
    const response = await fetch(`${url}/auth/v1/user`, {
      method: "PUT",
      headers: {
        ...headers(key, accessToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(authErrorMessage(body, "Password update failed"));
    return body;
  }

  function sessionExpiresSoon(session, skewSeconds = 60, nowMs = Date.now()) {
    if (!session?.access_token) return true;
    const expiresAt = Number(session.expires_at || 0);
    if (!expiresAt) return Boolean(session.refresh_token && Number(session.expires_in || 0) > 0);
    return expiresAt <= Math.floor(nowMs / 1000) + Number(skewSeconds || 0);
  }

  async function refreshSession({ url, key, session }) {
    if (!session?.refresh_token) throw new Error("Stored session is expired. Sign in again.");
    const response = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: {
        apikey: key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(authErrorMessage(body, "Unable to refresh session"));
    const refreshed = normalizeSession({ ...session, ...body });
    writeStoredSession(refreshed);
    return refreshed;
  }

  async function getValidSession({ url, key, skewSeconds = 60 }) {
    const session = readStoredSession();
    if (!session?.access_token) return null;
    if (!sessionExpiresSoon(session, skewSeconds)) return session;
    return refreshSession({ url, key, session });
  }

  async function restoreAuthState({ url, key }) {
    let session = readStoredSession();
    if (!session?.access_token) return { session: null, user: null, profile: null };

    try {
      session = await getValidSession({ url, key });
      if (!session?.access_token) return { session: null, user: null, profile: null };
      const user = await fetchCurrentUser({ url, key, accessToken: session.access_token });
      if (!user?.id) {
        clearStoredSession();
        return { session: null, user: null, profile: null };
      }
      const profile = await fetchProfile({ url, key, accessToken: session.access_token, userId: user.id });
      return { session, user, profile };
    } catch (error) {
      clearStoredSession();
      throw error;
    }
  }

  async function signOut({ url, key, scope = "local" } = {}) {
    const session = readStoredSession();
    try {
      if (url && key && session?.access_token) {
        const logoutUrl = new URL(`${url}/auth/v1/logout`);
        logoutUrl.searchParams.set("scope", scope || "local");
        await fetch(logoutUrl.toString(), {
          method: "POST",
          headers: headers(key, session.access_token),
        });
      }
    } catch {
      // Local sign-out must still complete if the revoke request cannot reach Supabase.
    } finally {
      clearStoredSession();
    }
  }

  const api = {
    AUTH_STORAGE_KEY,
    OAUTH_ERROR_STORAGE_KEY,
    ADMIN_LOGIN_DOMAIN,
    adminLoginEmail,
    headers,
    readStoredSession,
    writeStoredSession,
    clearStoredSession,
    normalizeSession,
    buildOAuthUrl,
    authErrorMessage,
    signInWithOAuth,
    oauthResultFromSearch,
    oauthSessionFromHash,
    consumeOAuthSessionFromUrl,
    consumeOAuthError,
    signInWithPassword,
    signUpWithPassword,
    fetchCurrentUser,
    fetchProfile,
    requestPasswordReset,
    updatePassword,
    sessionExpiresSoon,
    refreshSession,
    getValidSession,
    restoreAuthState,
    signOut,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IrunsvanSupabaseClient = api;
})(typeof window !== "undefined" ? window : globalThis);
