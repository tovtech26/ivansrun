const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") || "ramocha@irunsvanafrica.com";
const ADMIN_NOTIFICATION_EMAILS = (Deno.env.get("ADMIN_NOTIFICATION_EMAILS") || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Channel = "application" | "order";
type OutboxRow = {
  id: string;
  event_type: string;
  aggregate_type: string;
  aggregate_id: string;
  recipient_email: string | null;
  payload: Record<string, unknown>;
  actor_id: string | null;
  attempts: number;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function labelFor(eventType: string) {
  return eventType
    .replace(/^(application|order)_/, "")
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function subjectFor(row: OutboxRow) {
  const payload = row.payload || {};
  if (row.aggregate_type === "application") {
    const company = String(payload.companyName || "Reseller");
    if (row.event_type === "application_submitted") return `New reseller application: ${company}`;
    if (row.event_type === "application_received") return "We received your Irunsvan reseller application";
    if (row.event_type === "application_approved") return "Your Irunsvan reseller application was approved";
    if (row.event_type === "application_rejected") return "Update on your Irunsvan reseller application";
  }
  const code = String(payload.orderCode || "Order request");
  if (row.event_type === "order_submitted") return `New reseller order ${code}`;
  if (row.event_type === "order_received") return `${code} was received`;
  return `${code}: ${labelFor(row.event_type)}`;
}

function messageLines(row: OutboxRow) {
  const payload = row.payload || {};
  const lines: string[] = [];
  if (payload.companyName || payload.resellerCompany) lines.push(`Company: ${payload.companyName || payload.resellerCompany}`);
  if (payload.fullName) lines.push(`Contact: ${payload.fullName}`);
  if (payload.orderCode) lines.push(`Order: ${payload.orderCode}`);
  if (payload.country) lines.push(`Country: ${payload.country}`);
  if (payload.status) lines.push(`Status: ${labelFor(String(payload.status))}`);
  if (payload.expectedFulfillmentDate) lines.push(`Expected fulfillment: ${payload.expectedFulfillmentDate}`);
  if (payload.paymentReference) lines.push(`Payment reference: ${payload.paymentReference}`);
  if (payload.rejectionReason) lines.push(`Reason: ${payload.rejectionReason}`);
  if (payload.reviewNotes) lines.push(`Review note: ${payload.reviewNotes}`);
  if (payload.adminNotes) lines.push(`Admin note: ${payload.adminNotes}`);
  if (payload.notes) lines.push(`Request note: ${payload.notes}`);
  return lines;
}

function htmlFor(row: OutboxRow) {
  const subject = subjectFor(row);
  const lines = messageLines(row);
  return `
    <div style="margin:0;background:#f4efe6;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#171717">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #ded2bf;border-radius:10px;overflow:hidden">
        <div style="padding:24px 28px;border-bottom:1px solid #eadfce">
          <div style="font-weight:800;letter-spacing:.06em;color:#0057b8">IRUNSVAN AFRICA</div>
        </div>
        <div style="padding:28px">
          <h1 style="margin:0 0 18px;font-size:25px;line-height:1.25">${escapeHtml(subject)}</h1>
          <p style="margin:0 0 18px;color:#51483d;line-height:1.6">This message confirms the latest update recorded in the Irunsvan reseller portal.</p>
          ${lines.length ? `<ul style="margin:0;padding-left:20px;color:#51483d;line-height:1.8">${lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>` : ""}
        </div>
      </div>
    </div>`;
}

function serviceHeaders(prefer = "") {
  return {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    ...(prefer ? { Prefer: prefer } : {}),
  };
}

async function currentUser(request: Request) {
  const authorization = request.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) return null;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SERVICE_ROLE_KEY, Authorization: authorization },
  });
  if (!response.ok) return null;
  return response.json();
}

async function isAdmin(userId: string) {
  const query = new URLSearchParams({ select: "id", id: `eq.${userId}`, role: "eq.admin", limit: "1" });
  const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?${query}`, { headers: serviceHeaders() });
  return response.ok && ((await response.json()) as unknown[]).length === 1;
}

async function updateOutbox(id: string, payload: Record<string, unknown>) {
  await fetch(`${SUPABASE_URL}/rest/v1/notification_outbox?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: serviceHeaders("return=minimal"),
    body: JSON.stringify({ ...payload, updated_at: new Date().toISOString() }),
  });
}

async function pendingRows(channel: Channel, userId: string, admin: boolean, body: Record<string, unknown>) {
  const ids = Array.isArray(body.notificationIds)
    ? body.notificationIds.map(String).filter((id) => /^[0-9a-f-]{36}$/i.test(id)).slice(0, 25)
    : [];
  const aggregateId = /^[0-9a-f-]{36}$/i.test(String(body.aggregateId || "")) ? String(body.aggregateId) : "";
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/claim_notification_outbox`, {
    method: "POST",
    headers: serviceHeaders(),
    body: JSON.stringify({
      p_channel: channel,
      p_requester: userId,
      p_is_admin: admin,
      p_notification_ids: ids.length ? ids : null,
      p_aggregate_id: aggregateId || null,
      p_limit: 25,
    }),
  });
  if (!response.ok) throw new Error("Unable to claim queued notifications.");
  return (await response.json()) as OutboxRow[];
}

export async function handleEmailRequest(request: Request, channel: Channel) {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ ok: false, reason: "Method not allowed" }, 405);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json({ ok: false, reason: "Supabase function secrets are not configured" }, 503);

  const user = await currentUser(request);
  if (!user?.id) return json({ ok: false, reason: "A valid signed-in account is required" }, 401);
  const admin = await isAdmin(user.id);
  const body = await request.json().catch(() => ({}));
  const rows = await pendingRows(channel, user.id, admin, body);
  if (!rows.length) return json({ ok: true, sent: 0, failed: 0, reason: "No queued notifications were due" });
  if (!RESEND_API_KEY) return json({ ok: false, sent: 0, failed: rows.length, reason: "RESEND_API_KEY is not configured" }, 503);

  let sent = 0;
  let failed = 0;
  const results: Record<string, unknown>[] = [];
  for (const row of rows) {
    const recipients = row.recipient_email ? [row.recipient_email] : ADMIN_NOTIFICATION_EMAILS;
    if (!recipients.length) {
      failed += 1;
      await updateOutbox(row.id, { status: "failed", last_error: "No recipient email is configured", next_attempt_at: new Date(Date.now() + 300000).toISOString() });
      results.push({ id: row.id, ok: false, reason: "No recipient email is configured" });
      continue;
    }
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({ from: EMAIL_FROM, to: recipients, subject: subjectFor(row), html: htmlFor(row) }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(data?.message || "Email provider rejected the message"));
      sent += 1;
      await updateOutbox(row.id, { status: "sent", provider_message_id: data?.id || null, sent_at: new Date().toISOString(), last_error: null });
      results.push({ id: row.id, ok: true, providerMessageId: data?.id || null });
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : "Email delivery failed";
      const delayMs = Math.min(3600000, 300000 * Math.max(1, row.attempts));
      await updateOutbox(row.id, { status: "failed", last_error: message.slice(0, 1000), next_attempt_at: new Date(Date.now() + delayMs).toISOString() });
      results.push({ id: row.id, ok: false, reason: message });
    }
  }
  return json({ ok: failed === 0, sent, failed, results }, failed ? 502 : 200);
}
