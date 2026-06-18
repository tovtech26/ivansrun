(function attachEmailNotifications(root) {
  function money(value) {
    const amount = Number(value);
    return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : "$0.00";
  }

  function buildOrderEmailPayload({ eventType, adminEmails = [], orderCode, resellerCompany, resellerEmail, totalSkus, totalUnits, subtotal, notes }) {
    const subject =
      eventType === "order_submitted"
        ? `New order request ${orderCode} from ${resellerCompany}`
        : `Order update ${orderCode}`;

    return {
      to: adminEmails,
      subject,
      htmlIncludes: [orderCode, resellerCompany, resellerEmail, String(totalSkus), String(totalUnits), money(subtotal), notes || ""],
    };
  }

  function buildApplicationEmailPayload({ eventType, adminEmails = [], companyName, fullName, email, country, message }) {
    const subject =
      eventType === "application_submitted"
        ? `New reseller application from ${companyName}`
        : `Reseller application update for ${companyName}`;

    return {
      to: adminEmails,
      subject,
      htmlIncludes: [companyName, fullName, email, country || "", message || ""],
    };
  }

  const api = {
    buildOrderEmailPayload,
    buildApplicationEmailPayload,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IrunsvanEmailNotifications = api;
})(typeof window !== "undefined" ? window : globalThis);
