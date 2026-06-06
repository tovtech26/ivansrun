(function attachResellerOrders(root) {
  function safeNumber(value, fallback = 0) {
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : fallback;
  }

  function buildInventoryRows({ products = [], variants = [], inventory = [] } = {}) {
    const productsById = new Map(products.map((product) => [product.id, product]));
    const inventoryByVariantId = new Map(inventory.map((row) => [row.variant_id, row]));

    return variants
      .map((variant) => {
        const product = productsById.get(variant.product_id);
        const stock = inventoryByVariantId.get(variant.id);
        if (!product || !stock) return null;

        return {
          inventoryId: stock.id,
          variantId: variant.id,
          productId: product.id,
          productSku: product.sku,
          productName: product.name,
          category: product.category,
          sku: stock.sku || variant.sku,
          colour: variant.colour || "",
          size: variant.size || "",
          price: safeNumber(variant.base_price ?? product.base_price, 0),
          currency: variant.base_currency || "USD",
          stockQuantity: Math.max(0, safeNumber(stock.stock_quantity, 0)),
          imageName: variant.image_name || (Array.isArray(product.image_names) ? product.image_names[0] || "" : ""),
        };
      })
      .filter(Boolean)
      .sort((left, right) => String(left.sku).localeCompare(String(right.sku)));
  }

  function updateDraftQuantity(draft = {}, row, requestedQuantity) {
    if (!row?.variantId) return { ...draft };
    const next = { ...draft };
    const capped = Math.max(0, Math.min(Math.trunc(safeNumber(requestedQuantity, 0)), row.stockQuantity));
    if (capped <= 0) {
      delete next[row.variantId];
      return next;
    }
    next[row.variantId] = capped;
    return next;
  }

  function draftItems(rows = [], draft = {}) {
    const rowsByVariantId = new Map(rows.map((row) => [row.variantId, row]));
    return Object.entries(draft)
      .map(([variantId, quantity]) => {
        const row = rowsByVariantId.get(variantId);
        if (!row || quantity <= 0) return null;
        return {
          ...row,
          requestedQuantity: quantity,
          lineTotal: row.price * quantity,
        };
      })
      .filter(Boolean)
      .sort((left, right) => String(left.sku).localeCompare(String(right.sku)));
  }

  function draftSummary(items = []) {
    return items.reduce(
      (summary, item) => ({
        itemCount: summary.itemCount + 1,
        totalUnits: summary.totalUnits + item.requestedQuantity,
        subtotal: summary.subtotal + item.lineTotal,
      }),
      { itemCount: 0, totalUnits: 0, subtotal: 0 },
    );
  }

  function buildOrderPayload({ auth = {}, items = [], notes = "" } = {}) {
    if (!auth?.user?.id || (!auth.isReseller && !auth.isAdmin)) {
      throw new Error("An authenticated reseller account is required to submit an order.");
    }
    if (!items.length) {
      throw new Error("At least one inventory line is required to submit an order.");
    }

    const normalizedItems = items.map((item) => {
      const quantity = Math.trunc(safeNumber(item.requestedQuantity, 0));
      if (quantity <= 0) {
        throw new Error("Each order line requires a positive quantity.");
      }
      const available = safeNumber(item.stockQuantity, Number.POSITIVE_INFINITY);
      if (Number.isFinite(available) && quantity > available) {
        throw new Error("Requested quantity cannot exceed available stock.");
      }
      if (!String(item.variantId || "").trim()) {
        throw new Error("Each order line requires a product variant.");
      }
      return { ...item, requestedQuantity: quantity };
    });

    return {
      orderRequest: {
        reseller_id: auth.user.id,
        status: "submitted",
        notes: String(notes || "").trim() || null,
      },
      orderItems: normalizedItems.map((item) => ({
        variant_id: item.variantId,
        sku: item.sku,
        product_name: item.productName,
        colour: item.colour || null,
        size: item.size || null,
        quantity: item.requestedQuantity,
        base_price: item.price,
        base_currency: item.currency || "USD",
      })),
    };
  }

  const api = {
    buildInventoryRows,
    updateDraftQuantity,
    draftItems,
    draftSummary,
    buildOrderPayload,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IvansrunResellerOrders = api;
})(typeof window !== "undefined" ? window : globalThis);
