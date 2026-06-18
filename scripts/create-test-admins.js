const SUPABASE_URL = process.env.SUPABASE_URL || "https://llicocwonbokahpbireg.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const accounts = [
  {
    email: "admin.test@irunsvan.africa",
    passwordEnv: "IRUNSVAN_TEST_ADMIN_PASSWORD",
    full_name: "Admin Test",
    company_name: "Irunsvan Africa",
    role: "admin",
  },
  {
    email: "ops.admin@irunsvan.africa",
    passwordEnv: "IRUNSVAN_TEST_OPS_PASSWORD",
    full_name: "Ops Admin",
    company_name: "Irunsvan Africa",
    role: "admin",
  },
  {
    email: "reseller.test@irunsvan.africa",
    passwordEnv: "IRUNSVAN_TEST_RESELLER_PASSWORD",
    full_name: "Reseller Test",
    company_name: "Test Reseller Co",
    role: "reseller",
  },
  {
    email: "pending.test@irunsvan.africa",
    passwordEnv: "IRUNSVAN_TEST_PENDING_PASSWORD",
    full_name: "Pending Test",
    company_name: "Pending Reseller Co",
    role: "pending_reseller",
  },
];

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

async function createOrFindUser(account) {
  const password = process.env[account.passwordEnv];
  if (!password) throw new Error(`Set ${account.passwordEnv} before creating ${account.email}.`);

  const createResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      email: account.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: account.full_name },
    }),
  });
  const created = await readBody(createResponse);

  if (createResponse.ok) return created;
  const message = String(created.message || created.error || "");
  if (!/already|registered|exists/i.test(message)) {
    throw new Error(`${account.email}: ${message || `create failed with ${createResponse.status}`}`);
  }

  const lookupResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(account.email)}`, {
    headers: headers(),
  });
  const lookup = await readBody(lookupResponse);
  if (!lookupResponse.ok) {
    throw new Error(`${account.email}: lookup failed with ${lookupResponse.status}`);
  }
  const user = Array.isArray(lookup.users) ? lookup.users.find((entry) => entry.email === account.email) : null;
  if (!user) throw new Error(`${account.email}: account exists but could not be found`);
  return user;
}

async function promoteProfile(user, account) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?on_conflict=id`, {
    method: "POST",
    headers: headers({ Prefer: "resolution=merge-duplicates,return=representation" }),
    body: JSON.stringify({
      id: user.id,
      email: account.email,
      full_name: account.full_name,
      company_name: account.company_name,
      role: account.role,
    }),
  });
  const body = await readBody(response);
  if (!response.ok) {
    throw new Error(`${account.email}: profile promotion failed with ${response.status}: ${body.message || body.hint || ""}`);
  }
  return Array.isArray(body) ? body[0] : body;
}

async function main() {
  if (!SERVICE_ROLE_KEY) {
    throw new Error("Set SUPABASE_SERVICE_ROLE_KEY before running this script.");
  }

  for (const account of accounts) {
    const user = await createOrFindUser(account);
    const profile = await promoteProfile(user, account);
    console.log(`${account.email} -> auth user ${user.id}, profile role ${profile.role}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
