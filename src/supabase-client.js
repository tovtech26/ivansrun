(function attachSupabaseClient(root) {
  const AUTH_STORAGE_KEY = "ivansrun_auth_session";

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
    headers,
    readStoredSession,
    writeStoredSession,
    clearStoredSession,
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
