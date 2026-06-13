(function attachSupabaseClient(root) {
  const AUTH_STORAGE_KEY = "ivansrun_auth_session";
  const OAUTH_ERROR_STORAGE_KEY = "ivansrun_oauth_error";

  function headers(key, accessToken) {
    return {
      apikey: key,
      Authorization: `Bearer ${accessToken || key}`,
    };
  }

  function readStoredSession() {
    try {
      return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || "null");
    } catch {
      return null;
    }
  }

  function writeStoredSession(session) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  }

  function clearStoredSession() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
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

  function oauthSessionFromHash(hash = "") {
    const params = new URLSearchParams(String(hash || "").replace(/^#/, ""));
    const accessToken = params.get("access_token");
    if (!accessToken) {
      const error = params.get("error_description") || params.get("error");
      return { handled: Boolean(error), error };
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
    if (!root.location?.hash) return { handled: false };
    const result = oauthSessionFromHash(root.location.hash);
    if (!result.handled) return result;
    if (result.session?.access_token) writeStoredSession(result.session);
    if (result.error) localStorage.setItem(OAUTH_ERROR_STORAGE_KEY, result.error);

    const cleanUrl = new URL(root.location.href);
    cleanUrl.hash = "";
    cleanUrl.searchParams.delete("oauth");
    root.history?.replaceState?.({}, "", `${cleanUrl.pathname}${cleanUrl.search}`);
    return result;
  }

  function consumeOAuthError() {
    const error = localStorage.getItem(OAUTH_ERROR_STORAGE_KEY);
    localStorage.removeItem(OAUTH_ERROR_STORAGE_KEY);
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
      throw new Error(body?.msg || body?.error_description || "Login failed");
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
      throw new Error(body?.msg || body?.error_description || "Account creation failed");
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
    const response = await fetch(`${url}/rest/v1/profiles?select=id,email,full_name,company_name,role&id=eq.${encodeURIComponent(userId)}&limit=1`, {
      headers: headers(key, accessToken),
    });
    if (!response.ok) throw new Error("Unable to load profile");
    const rows = await response.json();
    return rows[0] || null;
  }

  async function restoreAuthState({ url, key }) {
    const session = readStoredSession();
    if (!session?.access_token) return { session: null, user: null, profile: null };

    try {
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

  async function signOut() {
    clearStoredSession();
  }

  const api = {
    AUTH_STORAGE_KEY,
    OAUTH_ERROR_STORAGE_KEY,
    headers,
    readStoredSession,
    writeStoredSession,
    clearStoredSession,
    buildOAuthUrl,
    signInWithOAuth,
    oauthSessionFromHash,
    consumeOAuthSessionFromUrl,
    consumeOAuthError,
    signInWithPassword,
    signUpWithPassword,
    fetchCurrentUser,
    fetchProfile,
    restoreAuthState,
    signOut,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IvansrunSupabaseClient = api;
})(typeof window !== "undefined" ? window : globalThis);
