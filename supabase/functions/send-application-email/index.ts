const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") || "applications@ivansrun.africa";
const ADMIN_NOTIFICATION_EMAILS = (Deno.env.get("ADMIN_NOTIFICATION_EMAILS") || "")
  .split(",")
  .map((email) => email.trim())
  .filter(Boolean);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const body = await request.json();
  const recipients = Array.isArray(body.to) && body.to.length ? body.to : ADMIN_NOTIFICATION_EMAILS;

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
      html: body.html,
    }),
  });

  const data = await response.json();
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
