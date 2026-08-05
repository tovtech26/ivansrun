(function attachAdminOrders(root) {
  const ORDER_STATUS_META = {
    submitted: {
      label: "Submitted",
      bucket: "new",
      adminActionLabel: "Review request",
      clientLabel: "Waiting for review",
    },
    approved: {
      label: "Awaiting Payment",
      bucket: "awaitingPayment",
      adminActionLabel: "Approved to supply",
      clientLabel: "Approved to supply",
    },
    awaiting_payment: {
      label: "Awaiting Payment",
      bucket: "awaitingPayment",
      adminActionLabel: "Approved to supply",
      clientLabel: "Approved, awaiting payment",
    },
    paid: {
      label: "Paid",
      bucket: "active",
      adminActionLabel: "Ready for supplier",
      clientLabel: "Payment confirmed",
    },
    submitted_to_supplier: {
      label: "Submitted to Supplier",
      bucket: "active",
      adminActionLabel: "Sent to supplier",
      clientLabel: "Supplier order placed",
    },
    processing: {
      label: "Processing",
      bucket: "active",
      adminActionLabel: "Processing",
      clientLabel: "Being prepared",
    },
    in_fulfillment: {
      label: "Processing",
      bucket: "active",
      adminActionLabel: "Processing",
      clientLabel: "Being prepared",
    },
    shipped: {
      label: "Shipped",
      bucket: "shipped",
      adminActionLabel: "Shipped",
      clientLabel: "Shipped",
    },
    fulfilled: {
      label: "Fulfilled",
      bucket: "fulfilled",
      adminActionLabel: "Completed",
      clientLabel: "Completed",
    },
    rejected: {
      label: "Rejected",
      bucket: "closed",
      adminActionLabel: "Cannot supply",
      clientLabel: "Cannot supply",
    },
    cancelled: {
      label: "Cancelled",
      bucket: "closed",
      adminActionLabel: "Cancelled",
      clientLabel: "Cancelled",
    },
    draft: {
      label: "Draft",
      bucket: "expected",
      adminActionLabel: "Draft",
      clientLabel: "Draft",
    },
  };
  const VALID_ORDER_STATUSES = new Set(Object.keys(ORDER_STATUS_META));

  function normalizeOrderStatus(status) {
    if (status === "approved") return "awaiting_payment";
    if (status === "in_fulfillment") return "processing";
    if (ORDER_STATUS_META[status]) return status;
    return "submitted";
  }

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
      const normalizedStatus = normalizeOrderStatus(request.status);
      return {
        id: request.id,
        code: requestCode(request.id),
        status: request.status,
        normalizedStatus,
        statusMeta: ORDER_STATUS_META[normalizedStatus] || ORDER_STATUS_META.submitted,
        notes: request.notes ?? null,
        adminNotes: request.admin_notes ?? null,
        createdAt: request.created_at,
        updatedAt: request.updated_at ?? null,
        approvedAt: request.approved_at ?? null,
        paidAt: request.paid_at ?? null,
        supplierSubmittedAt: request.supplier_submitted_at ?? null,
        processingAt: request.processing_at ?? null,
        shippedAt: request.shipped_at ?? null,
        fulfilledAt: request.fulfilled_at ?? null,
        rejectedAt: request.rejected_at ?? null,
        cancelledAt: request.cancelled_at ?? null,
        rejectionReason: request.rejection_reason ?? null,
        expectedFulfillmentDate: request.expected_fulfillment_date ?? null,
        invoiceNumber: request.invoice_number ?? null,
        paymentReference: request.payment_reference ?? null,
        paymentNote: request.payment_note ?? null,
        supplierExportedAt: request.supplier_exported_at ?? null,
        totalItems: requestItems.length,
        totalUnits: requestItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
        subtotal: requestItems.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.base_price || 0), 0),
      };
    });
  }

  function countRequestsByStatus(records = [], statuses = []) {
    const allowed = new Set(statuses.map((status) => normalizeOrderStatus(status)));
    return records.filter((record) => allowed.has(normalizeOrderStatus(record.normalizedStatus || record.status))).length;
  }

  function buildOrderStatusPatch(status, adminNotes = "", currentRequest = {}) {
    if (!VALID_ORDER_STATUSES.has(status)) {
      throw new Error("Invalid order status");
    }
    const timestamp = new Date().toISOString();
    const patch = {
      status,
      admin_notes: String(adminNotes || "").trim() || null,
    };
    if (status === "awaiting_payment") {
      patch.approved_at = currentRequest.approved_at || timestamp;
    }
    if (status === "paid") {
      patch.approved_at = currentRequest.approved_at || timestamp;
      patch.paid_at = currentRequest.paid_at || timestamp;
    }
    if (status === "submitted_to_supplier") {
      patch.approved_at = currentRequest.approved_at || timestamp;
      patch.paid_at = currentRequest.paid_at || timestamp;
      patch.supplier_submitted_at = currentRequest.supplier_submitted_at || timestamp;
    }
    if (status === "processing" || status === "in_fulfillment") {
      patch.approved_at = currentRequest.approved_at || timestamp;
      patch.paid_at = currentRequest.paid_at || timestamp;
      patch.supplier_submitted_at = currentRequest.supplier_submitted_at || timestamp;
      patch.processing_at = currentRequest.processing_at || timestamp;
    }
    if (status === "shipped") {
      patch.approved_at = currentRequest.approved_at || timestamp;
      patch.paid_at = currentRequest.paid_at || timestamp;
      patch.supplier_submitted_at = currentRequest.supplier_submitted_at || timestamp;
      patch.processing_at = currentRequest.processing_at || timestamp;
      patch.shipped_at = currentRequest.shipped_at || timestamp;
    }
    if (status === "fulfilled") {
      patch.approved_at = currentRequest.approved_at || timestamp;
      patch.paid_at = currentRequest.paid_at || timestamp;
      patch.supplier_submitted_at = currentRequest.supplier_submitted_at || timestamp;
      patch.processing_at = currentRequest.processing_at || timestamp;
      patch.shipped_at = currentRequest.shipped_at || timestamp;
      patch.fulfilled_at = currentRequest.fulfilled_at || timestamp;
    }
    if (status === "rejected") patch.rejected_at = currentRequest.rejected_at || timestamp;
    if (status === "cancelled") patch.cancelled_at = currentRequest.cancelled_at || timestamp;
    return patch;
  }

  function bucketForStatus(status) {
    return (ORDER_STATUS_META[normalizeOrderStatus(status)] || ORDER_STATUS_META.submitted).bucket;
  }

  function buildClientOrderBuckets(records = []) {
    return records.reduce(
      (groups, record) => {
        const bucket = bucketForStatus(record.normalizedStatus || record.status);
        if (bucket === "new") groups.new.push(record);
        else if (bucket === "awaitingPayment") groups.awaitingPayment.push(record);
        else if (bucket === "active") groups.active.push(record);
        else if (bucket === "shipped") groups.shipped.push(record);
        else if (bucket === "fulfilled") groups.fulfilled.push(record);
        else groups.closed.push(record);
        return groups;
      },
      { new: [], awaitingPayment: [], active: [], shipped: [], fulfilled: [], closed: [] },
    );
  }

  function nextAdminActions(status) {
    switch (normalizeOrderStatus(status)) {
      case "submitted":
        return [
          { status: "awaiting_payment", label: "Agree to Supply" },
          { status: "rejected", label: "Cannot Supply", tone: "secondary" },
        ];
      case "awaiting_payment":
        return [
          { status: "paid", label: "Mark Payment Received" },
          { status: "cancelled", label: "Cancel", tone: "secondary" },
        ];
      case "paid":
        return [
          { status: "submitted_to_supplier", label: "Mark Sent to Supplier" },
          { status: "cancelled", label: "Cancel", tone: "secondary" },
        ];
      case "submitted_to_supplier":
        return [{ status: "processing", label: "Mark Processing" }];
      case "processing":
        return [{ status: "shipped", label: "Mark Shipped" }];
      case "shipped":
        return [{ status: "fulfilled", label: "Mark Fulfilled" }];
      default:
        return [];
    }
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
    ORDER_STATUS_META,
    VALID_ORDER_STATUSES,
    normalizeOrderStatus,
    buildAdminOrderRecords,
    buildClientOrderBuckets,
    countRequestsByStatus,
    buildOrderStatusPatch,
    buildApprovalInventoryAdjustments,
    nextAdminActions,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IrunsvanAdminOrders = api;
})(typeof window !== "undefined" ? window : globalThis);
