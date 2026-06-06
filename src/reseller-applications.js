(function attachResellerApplications(root) {
  const REVIEWABLE_STATUSES = new Set(["approved", "rejected"]);

  function requireText(value, label) {
    const text = String(value || "").trim();
    if (!text) throw new Error(`${label} is required.`);
    return text;
  }

  function requireEmail(value) {
    const email = requireText(value, "Email");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("A valid email is required.");
    }
    return email;
  }

  function buildApplicationPayload({ userId, email, fullName, companyName, phone = "", country = "", message = "" } = {}) {
    const safeUserId = String(userId || "").trim();
    if (!safeUserId) {
      throw new Error("An authenticated account is required before submitting an application.");
    }
    return {
      user_id: safeUserId,
      email: requireEmail(email),
      full_name: requireText(fullName, "Full name"),
      company_name: requireText(companyName, "Company name"),
      phone: String(phone || "").trim() || null,
      country: String(country || "").trim() || null,
      message: String(message || "").trim() || null,
      status: "pending",
    };
  }

  function summarizeApplications(applications = []) {
    return applications.reduce(
      (summary, application) => {
        const status = String(application.status || "");
        if (status === "pending") summary.pending += 1;
        if (status === "approved") summary.approved += 1;
        if (status === "rejected") summary.rejected += 1;
        summary.total += 1;
        return summary;
      },
      { pending: 0, approved: 0, rejected: 0, total: 0 },
    );
  }

  function buildApplicationApprovalUpdate({ status, adminUserId } = {}) {
    if (!REVIEWABLE_STATUSES.has(status)) {
      throw new Error("Invalid application status");
    }
    if (!String(adminUserId || "").trim()) {
      throw new Error("An admin user is required to review applications.");
    }

    return {
      applicationPatch: {
        status,
        reviewed_by: String(adminUserId).trim(),
        reviewed_at: "NOW",
      },
      profilePatch: {
        role: status === "approved" ? "reseller" : "pending_reseller",
      },
    };
  }

  const api = {
    REVIEWABLE_STATUSES,
    buildApplicationPayload,
    summarizeApplications,
    buildApplicationApprovalUpdate,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IvansrunResellerApplications = api;
})(typeof window !== "undefined" ? window : globalThis);
