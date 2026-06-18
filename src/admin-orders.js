(function attachAdminOrders(root) {
  const VALID_ORDER_STATUSES = new Set(["submitted", "approved", "rejected", "fulfilled", "draft"]);

  function requestCode(id) {
    const compact = String(id || "")
      .replace(/[^a-z0-9]/gi, "")
      .toUpperCase();
    if (!compact) return "#RE-UNKNOWN";
    return `#RE-${compact.slice(-8)}`;
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

  function buildApprovalInventoryAdjustments({ orderId, items = [], inventory = [] } = {}) {
    const orderItems = items.filter((item) => item.order_request_id === orderId);
    if (!orderItems.length) {
      throw new Error("This order has no items to approve.");
    }

    const requestedByVariantId = orderItems.reduce((map, item) => {
      const variantId = item.variant_id;
      if (!variantId) throw new Error("Every order item needs a product variant before approval.");
      map.set(variantId, (map.get(variantId) || 0) + Number(item.quantity || 0));
      return map;
    }, new Map());
    const inventoryByVariantId = new Map(inventory.map((row) => [row.variant_id, row]));

    return [...requestedByVariantId.entries()].map(([variantId, requestedQuantity]) => {
      if (!Number.isInteger(requestedQuantity) || requestedQuantity <= 0) {
        throw new Error("Every order item needs a positive quantity before approval.");
      }
      const stockRow = inventoryByVariantId.get(variantId);
      if (!stockRow) {
        throw new Error("Inventory is missing for one or more order items.");
      }
      const previousStock = Number(stockRow.stock_quantity || 0);
      if (requestedQuantity > previousStock) {
        throw new Error("This order cannot be approved because stock is no longer enough.");
      }
      return {
        id: stockRow.id,
        variant_id: variantId,
        sku: stockRow.sku,
        requestedQuantity,
        previousStock,
        nextStock: previousStock - requestedQuantity,
      };
    });
  }

  const api = {
    VALID_ORDER_STATUSES,
    buildAdminOrderRecords,
    countRequestsByStatus,
    buildOrderStatusPatch,
    buildApprovalInventoryAdjustments,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IrunsvanAdminOrders = api;
})(typeof window !== "undefined" ? window : globalThis);
