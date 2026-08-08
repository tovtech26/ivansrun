const assert = require("node:assert/strict");

const storage = new Map();
global.localStorage = {
  getItem: (key) => (storage.has(key) ? storage.get(key) : null),
  setItem: (key, value) => {
    storage.set(key, String(value));
  },
  removeItem: (key) => {
    storage.delete(key);
  },
};

const {
  ADMIN_LOGIN_DOMAIN,
  adminLoginEmail,
  authErrorMessage,
  buildOAuthUrl,
  clearStoredSession,
  getValidSession,
  oauthResultFromSearch,
  oauthSessionFromHash,
  readStoredSession,
  requestPasswordReset,
  refreshSession,
  signInWithPassword,
  signUpWithPassword,
  signOut,
  sessionExpiresSoon,
  updatePassword,
  writeStoredSession,
} = require("../src/supabase-client.js");

assert.equal(ADMIN_LOGIN_DOMAIN, "irunsvan.africa");
assert.equal(adminLoginEmail("RAMOCHA"), "ramocha.admin@irunsvan.africa");
assert.equal(adminLoginEmail("  ramocha  "), "ramocha.admin@irunsvan.africa");
assert.throws(() => adminLoginEmail("ra"), /valid admin username/i);
assert.throws(() => adminLoginEmail("ramocha@example.com"), /valid admin username/i);

const authUrl = buildOAuthUrl({
  url: "https://example.supabase.co",
  provider: "google",
  redirectTo: "http://127.0.0.1:4173/?oauth=google",
});
const parsedAuthUrl = new URL(authUrl);
assert.equal(parsedAuthUrl.origin, "https://example.supabase.co");
assert.equal(parsedAuthUrl.pathname, "/auth/v1/authorize");
assert.equal(parsedAuthUrl.searchParams.get("provider"), "google");
assert.equal(parsedAuthUrl.searchParams.get("redirect_to"), "http://127.0.0.1:4173/?oauth=google");

const parsedSession = oauthSessionFromHash("#access_token=abc123&refresh_token=ref456&expires_in=3600&token_type=bearer&provider_token=google-token");
assert.equal(parsedSession.handled, true);
assert.equal(parsedSession.session.access_token, "abc123");
assert.equal(parsedSession.session.refresh_token, "ref456");
assert.equal(parsedSession.session.expires_in, 3600);
assert.equal(parsedSession.session.token_type, "bearer");
assert.equal(parsedSession.session.provider_token, "google-token");

const parsedError = oauthSessionFromHash("#error=access_denied&error_description=Denied");
assert.equal(parsedError.handled, true);
assert.equal(parsedError.error, "Denied");

assert.equal(oauthSessionFromHash("#/login").handled, false);

assert.equal(authErrorMessage({ error_description: "Invalid login credentials" }, "fallback"), "Invalid email or password.");
assert.equal(authErrorMessage({ error_description: "Email not confirmed" }, "fallback"), "Confirm your email address before signing in.");
assert.equal(authErrorMessage({ error_description: "Provider is not enabled" }, "fallback"), "Google login is not configured in Supabase yet.");

assert.deepEqual(oauthResultFromSearch("?error=access_denied&error_description=Google+Client+ID+missing"), {
  handled: true,
  error: "Google login is not configured in Supabase yet.",
});

assert.deepEqual(oauthResultFromSearch("?error_code=bad_oauth_state"), {
  handled: true,
  error: "OAuth sign-in state expired. Start from a fresh login page and try again.",
});

assert.deepEqual(oauthResultFromSearch("?code=auth-code-123"), {
  handled: true,
  error: "OAuth callback returned an authorization code that this client cannot exchange automatically.",
});

assert.equal(typeof requestPasswordReset, "function");
assert.equal(typeof signInWithPassword, "function");
assert.equal(typeof signUpWithPassword, "function");
assert.equal(typeof updatePassword, "function");
assert.equal(sessionExpiresSoon({ access_token: "token", expires_at: 100 }, 60, 50_000), true);
assert.equal(sessionExpiresSoon({ access_token: "token", expires_at: 500 }, 60, 50_000), false);
assert.equal(sessionExpiresSoon({ access_token: "token" }, 60, 50_000), false);

(async () => {
  const originalFetch = global.fetch;
  try {
    const requests = [];
    global.fetch = async (url, options = {}) => {
      requests.push({ url, options });
      return {
        ok: true,
        json: async () => ({
          access_token: "new-token",
          refresh_token: "new-refresh",
          expires_in: 3600,
          expires_at: 9999999999,
          token_type: "bearer",
        }),
      };
    };

    const refreshed = await refreshSession({
      url: "https://example.supabase.co",
      key: "anon-key",
      session: { access_token: "old-token", refresh_token: "old-refresh", expires_at: 1 },
    });
    assert.equal(refreshed.access_token, "new-token");
    assert.equal(JSON.parse(requests[0].options.body).refresh_token, "old-refresh");
    assert.equal(requests[0].url, "https://example.supabase.co/auth/v1/token?grant_type=refresh_token");

    clearStoredSession();
    writeStoredSession({ access_token: "stored-token", refresh_token: "stored-refresh", expires_at: 1 });
    const validSession = await getValidSession({ url: "https://example.supabase.co", key: "anon-key" });
    assert.equal(validSession.access_token, "new-token");
    assert.equal(readStoredSession().refresh_token, "new-refresh");

    requests.length = 0;
    clearStoredSession();
    localStorage.setItem(
      "irunsvan_auth_session",
      JSON.stringify({ access_token: "legacy-token", refresh_token: "legacy-refresh", expires_in: 3600 }),
    );
    const legacyValidSession = await getValidSession({ url: "https://example.supabase.co", key: "anon-key" });
    assert.equal(legacyValidSession.access_token, "new-token");
    assert.equal(JSON.parse(requests[0].options.body).refresh_token, "legacy-refresh");

    requests.length = 0;
    writeStoredSession({ access_token: "logout-token", refresh_token: "logout-refresh", expires_at: 9999999999 });
    await signOut({ url: "https://example.supabase.co", key: "anon-key" });
    assert.equal(readStoredSession(), null);
    assert.equal(requests[0].url, "https://example.supabase.co/auth/v1/logout?scope=local");
    assert.equal(requests[0].options.method, "POST");
    assert.equal(requests[0].options.headers.Authorization, "Bearer logout-token");

    global.fetch = async () => {
      throw new Error("network down");
    };
    writeStoredSession({ access_token: "offline-token", refresh_token: "offline-refresh", expires_at: 9999999999 });
    await signOut({ url: "https://example.supabase.co", key: "anon-key" });
    assert.equal(readStoredSession(), null);
  } finally {
    global.fetch = originalFetch;
    clearStoredSession();
  }

  console.log("supabase-client tests passed");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
