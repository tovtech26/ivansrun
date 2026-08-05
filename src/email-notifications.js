(function attachEmailNotifications(root) {
  const BRAND_NAME = "IRUNSVAN";
  const BRAND_LOGO_URL =
    "https://raw.githubusercontent.com/tovtech26/ivansrun/main/public/brand/Irunsvan_Blue-removebg-preview.svg";

  function money(value) {
    const amount = Number(value);
    return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : "$0.00";
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function uniqueEmails(values) {
    const seen = new Set();
    return values
      .map((email) => String(email || "").trim())
      .filter((email) => {
        const key = email.toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  function orderStatusCopy(eventType, orderCode) {
    if (eventType === "order_submitted") {
      return {
        label: "Pending approval",
        subject: `Your order ${orderCode} is pending approval`,
        title: `Your order ${orderCode} is pending approval`,
        message:
          "We received your order request. The Irunsvan team will review availability and confirm the next step before payment is expected.",
      };
    }

    if (eventType === "order_awaiting_payment" || eventType === "order_approved") {
      return {
        label: "Accepted",
        subject: `Your order ${orderCode} has been accepted`,
        title: `Your order ${orderCode} has been accepted`,
        message:
          "We have accepted your order request and reserved the approved stock. Please wait for payment instructions or follow the instructions already shared by the Irunsvan team.",
      };
    }

    return {
      label: "Updated",
      subject: `Order update ${orderCode}`,
      title: `Your order ${orderCode} has been updated`,
      message: "There is a new update on your Irunsvan order request. Open your reseller portal to review the current status.",
    };
  }

  function orderEmailHtml({ title, message, statusLabel, orderCode, resellerCompany, resellerEmail, totalSkus, totalUnits, subtotal, notes }) {
    return `
      <div style="margin:0;background:#f4efe6;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#141414;">
        <div style="max-width:640px;margin:0 auto;background:#fffaf2;border:1px solid #ded2bf;border-radius:18px;overflow:hidden;">
          <div style="padding:28px 30px;border-bottom:1px solid #eadfce;">
            <img src="${BRAND_LOGO_URL}" alt="${BRAND_NAME}" width="112" style="display:block;max-width:112px;height:auto;margin:0 0 10px;">
            <div style="font-weight:900;letter-spacing:.08em;color:#0057b8;font-size:14px;">${BRAND_NAME}</div>
            <p style="margin:8px 0 0;color:#6d6255;font-size:13px;letter-spacing:.12em;text-transform:uppercase;">Africa reseller footwear portal</p>
          </div>
          <div style="padding:30px;">
            <p style="display:inline-block;margin:0 0 18px;padding:7px 11px;border:1px solid #d9cab5;border-radius:999px;color:#6d6255;font-size:12px;text-transform:uppercase;letter-spacing:.08em;">${escapeHtml(statusLabel)}</p>
            <h1 style="margin:0 0 14px;font-size:28px;line-height:1.12;color:#111;">${escapeHtml(title)}</h1>
            <p style="margin:0 0 26px;font-size:15px;line-height:1.7;color:#4b4339;">${escapeHtml(message)}</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px;">
              <tr>
                <td style="padding:14px;border:1px solid #eadfce;color:#6d6255;font-size:12px;text-transform:uppercase;">Order</td>
                <td style="padding:14px;border:1px solid #eadfce;font-weight:700;">${escapeHtml(orderCode)}</td>
              </tr>
              <tr>
                <td style="padding:14px;border:1px solid #eadfce;color:#6d6255;font-size:12px;text-transform:uppercase;">Account</td>
                <td style="padding:14px;border:1px solid #eadfce;">${escapeHtml(resellerCompany)}<br><span style="color:#6d6255;">${escapeHtml(resellerEmail)}</span></td>
              </tr>
              <tr>
                <td style="padding:14px;border:1px solid #eadfce;color:#6d6255;font-size:12px;text-transform:uppercase;">Request</td>
                <td style="padding:14px;border:1px solid #eadfce;">${escapeHtml(totalSkus)} styles / ${escapeHtml(totalUnits)} pairs / ${escapeHtml(money(subtotal))}</td>
              </tr>
            </table>
            ${
              notes
                ? `<div style="padding:16px 18px;background:#f7efe2;border-radius:14px;color:#4b4339;"><strong style="display:block;margin-bottom:6px;">Notes</strong>${escapeHtml(notes)}</div>`
                : ""
            }
            <p style="margin:26px 0 0;color:#6d6255;font-size:13px;line-height:1.6;">This email confirms the current order stage only. Payment and fulfillment are handled separately by the Irunsvan team.</p>
          </div>
        </div>
      </div>
    `;
  }

  function buildOrderEmailPayload({ eventType, adminEmails = [], orderCode, resellerCompany, resellerEmail, totalSkus, totalUnits, subtotal, notes }) {
    const statusCopy = orderStatusCopy(eventType, orderCode);
    const to = uniqueEmails([resellerEmail, ...adminEmails]);
    const htmlIncludes = [
      orderCode,
      resellerCompany,
      resellerEmail,
      String(totalSkus),
      String(totalUnits),
      money(subtotal),
      notes || "",
      statusCopy.label,
    ];

    return {
      to,
      subject: statusCopy.subject,
      template: "order_status",
      brandName: BRAND_NAME,
      logoUrl: BRAND_LOGO_URL,
      statusLabel: statusCopy.label,
      orderCode,
      resellerCompany,
      resellerEmail,
      totalSkus,
      totalUnits,
      subtotal: money(subtotal),
      notes: notes || "",
      htmlIncludes,
      html: orderEmailHtml({
        title: statusCopy.title,
        message: statusCopy.message,
        statusLabel: statusCopy.label,
        orderCode,
        resellerCompany,
        resellerEmail,
        totalSkus,
        totalUnits,
        subtotal,
        notes,
      }),
    };
  }

  function buildApplicationEmailPayload({ eventType, adminEmails = [], companyName, fullName, email, country, message }) {
    const status = eventType === "application_approved" ? "approved" : eventType === "application_rejected" ? "not approved" : "submitted";
    const subject = eventType === "application_submitted"
      ? `New reseller application from ${companyName}`
      : eventType === "application_approved"
        ? "Your Irunsvan reseller account has been approved"
        : "Update on your Irunsvan reseller application";
    const to = eventType === "application_submitted" ? uniqueEmails(adminEmails) : uniqueEmails([email, ...adminEmails]);
    const title = eventType === "application_approved"
      ? "Your reseller account is approved"
      : eventType === "application_rejected"
        ? "Your reseller application has been reviewed"
        : `New reseller application from ${companyName}`;
    const body = eventType === "application_approved"
      ? "You can now sign in to view live wholesale stock and submit order requests."
      : eventType === "application_rejected"
        ? "Your application was not approved at this time. Contact the Irunsvan team if you need more information."
        : `${fullName} submitted a reseller application for ${companyName}.`;
    const htmlIncludes = [companyName, fullName, email, country || "", message || "", status];

    return {
      to,
      subject,
      template: "reseller_application_status",
      status,
      htmlIncludes,
      html: `
        <div style="margin:0;background:#f4efe6;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#141414;">
          <div style="max-width:640px;margin:0 auto;background:#fffaf2;border:1px solid #ded2bf;overflow:hidden;">
            <div style="padding:26px 30px;border-bottom:1px solid #eadfce;">
              <img src="${BRAND_LOGO_URL}" alt="${BRAND_NAME}" width="112" style="display:block;max-width:112px;height:auto;margin:0 0 10px;">
              <strong style="color:#0057b8;letter-spacing:.08em;">${BRAND_NAME}</strong>
            </div>
            <div style="padding:30px;">
              <h1 style="margin:0 0 14px;font-size:26px;line-height:1.2;">${escapeHtml(title)}</h1>
              <p style="margin:0 0 22px;color:#4b4339;line-height:1.7;">${escapeHtml(body)}</p>
              <p style="margin:0 0 8px;"><strong>${escapeHtml(companyName)}</strong></p>
              <p style="margin:0;color:#6d6255;">${escapeHtml(fullName)} · ${escapeHtml(email)}${country ? ` · ${escapeHtml(country)}` : ""}</p>
            </div>
          </div>
        </div>
      `,
    };
  }

  const api = {
    buildOrderEmailPayload,
    buildApplicationEmailPayload,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IrunsvanEmailNotifications = api;
})(typeof window !== "undefined" ? window : globalThis);
