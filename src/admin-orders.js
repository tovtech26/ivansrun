(function attachAdminOrders(root) {
  const VALID_ORDER_STATUSES = new Set(["submitted", "approved", "rejected", "fulfilled", "draft"]);

  function requestCode(id) {
    return `#RE-${String(id || "").replaceAll("-", "").slice(0, 6).toUpperCase()}`;
  }

  function buildAdminOrderRecords(requests = [], items = []) {
    const itemsByRequestId = items.reduce((map, item) => {
      const list = map.get(item.order_request_id) || [];
      list.push(item);
      map.set(item.order_request_id, list);
      return map;
    }, new Map());

    return requests.map((request) => {
      const requestItems = itemsByRequestId.get(request.id) || [];
      return {
        id: request.id,
        code: requestCode(request.id),
        status: request.status,
        notes: request.notes ?? null,
        adminNotes: request.admin_notes ?? null,
        createdAt: request.created_at,
        totalItems: requestItems.length,
        totalUnits: requestItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
        subtotal: requestItems.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.base_price || 0), 0),
      };
    });
  }

  function countRequestsByStatus(records = [], statuses = []) {
    const allowed = new Set(statuses);
    return records.filter((record) => allowed.has(record.status)).length;
  }

  function buildOrderStatusPatch(status, adminNotes = "") {
    if (!VALID_ORDER_STATUSES.has(status)) {
      throw new Error("Invalid order status");
    }
    return {
      status,
      admin_notes: String(adminNotes || "").trim() || null,
    };
  }

  const api = {
    VALID_ORDER_STATUSES,
    buildAdminOrderRecords,
    countRequestsByStatus,
    buildOrderStatusPatch,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IvansrunAdminOrders = api;
})(typeof window !== "undefined" ? window : globalThis);
