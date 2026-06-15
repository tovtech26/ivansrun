const assert = require("node:assert/strict");
const {
  authErrorMessage,
  buildOAuthUrl,
  oauthResultFromSearch,
  oauthSessionFromHash,
  requestPasswordReset,
  updatePassword,
} = require("../src/supabase-client.js");

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
assert.equal(typeof updatePassword, "function");

console.log("supabase-client tests passed");
