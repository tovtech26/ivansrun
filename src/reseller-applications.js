(function attachResellerApplications(root) {
  const REVIEWABLE_STATUSES = new Set(["approved", "rejected"]);

  function buildApplicationPayload({ userId, email, fullName, companyName, phone = "", country = "", message = "" } = {}) {
    if (!String(userId || "").trim()) {
      throw new Error("An authenticated account is required before submitting an application.");
    }
    return {
      user_id: String(userId).trim(),
      email: String(email || "").trim(),
      full_name: String(fullName || "").trim(),
      company_name: String(companyName || "").trim(),
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

    return {
      applicationPatch: {
        status,
        reviewed_by: adminUserId,
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
