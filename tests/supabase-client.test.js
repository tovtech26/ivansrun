const assert = require("node:assert/strict");
const {
  buildOAuthUrl,
  oauthSessionFromHash,
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

console.log("supabase-client tests passed");
