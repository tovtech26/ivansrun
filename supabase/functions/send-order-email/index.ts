const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") || "orders@irunsvan.africa";
const EMAIL_LOGO_URL =
  Deno.env.get("ORDER_EMAIL_LOGO_URL") ||
  "https://raw.githubusercontent.com/tovtech26/ivansrun/main/public/brand/Irunsvan_Blue-removebg-preview.svg";
const ADMIN_NOTIFICATION_EMAILS = (Deno.env.get("ADMIN_NOTIFICATION_EMAILS") || "")
  .split(",")
  .map((email) => email.trim())
  .filter(Boolean);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function fallbackOrderHtml(body: Record<string, unknown>) {
  const includes = Array.isArray(body.htmlIncludes) ? body.htmlIncludes : [];
  return `
    <div style="margin:0;background:#f4efe6;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#141414;">
      <div style="max-width:640px;margin:0 auto;background:#fffaf2;border:1px solid #ded2bf;border-radius:18px;overflow:hidden;">
        <div style="padding:28px 30px;border-bottom:1px solid #eadfce;">
          <img src="${EMAIL_LOGO_URL}" alt="IRUNSVAN" width="112" style="display:block;max-width:112px;height:auto;margin:0 0 10px;">
          <div style="font-weight:900;letter-spacing:.08em;color:#0057b8;font-size:14px;">IRUNSVAN</div>
          <p style="margin:8px 0 0;color:#6d6255;font-size:13px;letter-spacing:.12em;text-transform:uppercase;">Africa reseller footwear portal</p>
        </div>
        <div style="padding:30px;">
          <p style="display:inline-block;margin:0 0 18px;padding:7px 11px;border:1px solid #d9cab5;border-radius:999px;color:#6d6255;font-size:12px;text-transform:uppercase;letter-spacing:.08em;">${escapeHtml(body.statusLabel || "Order update")}</p>
          <h1 style="margin:0 0 18px;font-size:28px;line-height:1.12;color:#111;">${escapeHtml(body.subject || "Order update")}</h1>
          <ul style="margin:0;padding-left:18px;color:#4b4339;line-height:1.8;">
            ${includes.map((value) => `<li>${escapeHtml(value)}</li>`).join("")}
          </ul>
        </div>
      </div>
    </div>
  `;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const body = await request.json();
  const recipients = Array.isArray(body.to) && body.to.length ? body.to : ADMIN_NOTIFICATION_EMAILS;
  const html = typeof body.html === "string" && body.html.trim() ? body.html : fallbackOrderHtml(body);

  if (!RESEND_API_KEY || !recipients.length) {
    return new Response(JSON.stringify({ ok: false, reason: "Email secrets not configured" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: recipients,
      subject: body.subject,
      html,
    }),
  });

  const data = await response.json();
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
