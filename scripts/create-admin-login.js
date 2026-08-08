const { adminLoginEmail } = require("../src/supabase-client.js");

const SUPABASE_URL = process.env.SUPABASE_URL || "https://llicocwonbokahpbireg.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const username = String(process.env.IRUNSVAN_ADMIN_USERNAME || "RAMOCHA").trim().toUpperCase();
const password = String(process.env.IRUNSVAN_ADMIN_PASSWORD || "");
const email = adminLoginEmail(username);

function headers(extra = {}) {
  return {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function readBody(response) {
  const text = await response.text().catch(() => "");
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function responseMessage(body, fallback) {
  return String(body?.message || body?.msg || body?.error_description || body?.error || fallback || "Request failed");
}

async function findUser() {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
    headers: headers(),
  });
  const body = await readBody(response);
  if (!response.ok) throw new Error(responseMessage(body, `User lookup failed with ${response.status}`));
  return Array.isArray(body.users) ? body.users.find((entry) => String(entry.email).toLowerCase() === email) || null : null;
}

async function createOrUpdateUser() {
  const createResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: username },
    }),
  });
  const created = await readBody(createResponse);
  if (createResponse.ok) return created;

  const createMessage = responseMessage(created, `User creation failed with ${createResponse.status}`);
  if (!/already|registered|exists/i.test(createMessage)) throw new Error(createMessage);

  const existing = await findUser();
  if (!existing?.id) throw new Error("The admin login exists but could not be loaded.");

  const updateResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(existing.id)}`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify({
      password,
      email_confirm: true,
      user_metadata: { ...existing.user_metadata, full_name: username },
    }),
  });
  const updated = await readBody(updateResponse);
  if (!updateResponse.ok) throw new Error(responseMessage(updated, `Password update failed with ${updateResponse.status}`));
  return updated;
}

async function promoteProfile(user) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?on_conflict=id`, {
    method: "POST",
    headers: headers({ Prefer: "resolution=merge-duplicates,return=representation" }),
    body: JSON.stringify({
      id: user.id,
      email,
      full_name: username,
      company_name: "Irunsvan Africa",
      role: "admin",
    }),
  });
  const body = await readBody(response);
  if (!response.ok) throw new Error(responseMessage(body, `Profile promotion failed with ${response.status}`));
  return Array.isArray(body) ? body[0] : body;
}

async function verifyPasswordLogin() {
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!publishableKey) return { skipped: true };
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: publishableKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await readBody(response);
  if (!response.ok || !body.access_token) throw new Error(responseMessage(body, "Password login verification failed"));
  return { skipped: false };
}

async function main() {
  if (!SERVICE_ROLE_KEY) throw new Error("Set SUPABASE_SERVICE_ROLE_KEY before creating the admin login.");
  if (password.length < 12) throw new Error("IRUNSVAN_ADMIN_PASSWORD must be at least 12 characters.");

  const user = await createOrUpdateUser();
  const profile = await promoteProfile(user);
  if (profile?.role !== "admin") throw new Error("The profile was saved but the admin role could not be verified.");
  const loginCheck = await verifyPasswordLogin();

  console.log(`Admin login ${username} is ready with profile role ${profile.role}.`);
  console.log(loginCheck.skipped ? "Password login check skipped because SUPABASE_PUBLISHABLE_KEY is not set." : "Password login verified.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
