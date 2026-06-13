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
      const priceValue = variant.base_price ?? product.base_price;
      const price = safeNumber(priceValue, Number.NaN);
      const priceKnown = Number.isFinite(price) && price > 0;

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
          price: priceKnown ? price : null,
          priceKnown,
          currency: variant.base_currency || "USD",
          stockQuantity: Math.max(0, safeNumber(stock.stock_quantity, 0)),
          imageName: variant.image_name || (Array.isArray(product.image_names) ? product.image_names[0] || "" : ""),
        };
      })
      .filter(Boolean)
      .sort((left, right) => String(left.sku).localeCompare(String(right.sku)));
  }

  function availableInventoryRows(rows = []) {
    return rows.filter((row) => safeNumber(row?.stockQuantity, 0) > 0);
  }

  function visibleShopProductGroups(rows = [], { productLimit = 24, optionLimit = 8 } = {}) {
    const groupsByProduct = availableInventoryRows(rows).reduce((map, row) => {
      const key = row.productId || row.productSku || row.productName;
      const group = map.get(key) || {
        productId: row.productId,
        productName: row.productName,
        productSku: row.productSku,
        category: row.category,
        imageName: row.imageName,
        price: row.price,
        priceKnown: Boolean(row.priceKnown),
        currency: row.currency || "USD",
        totalStock: 0,
        optionCount: 0,
        hiddenOptionCount: 0,
        rows: [],
      };
      group.totalStock += Math.max(0, safeNumber(row.stockQuantity, 0));
      group.optionCount += 1;
      if (row.priceKnown) {
        group.price = group.priceKnown ? Math.min(safeNumber(group.price, row.price), row.price) : row.price;
        group.priceKnown = true;
      }
      if (!group.imageName && row.imageName) group.imageName = row.imageName;
      if (group.rows.length < optionLimit) group.rows.push(row);
      group.hiddenOptionCount = Math.max(0, group.optionCount - group.rows.length);
      map.set(key, group);
      return map;
    }, new Map());

    return [...groupsByProduct.values()]
      .sort((left, right) => String(left.productSku || left.productName).localeCompare(String(right.productSku || right.productName)))
      .slice(0, productLimit);
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
      lineTotal: safeNumber(row.price, 0) * quantity,
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
      if (!item.priceKnown || !Number.isFinite(safeNumber(item.price, Number.NaN)) || safeNumber(item.price, 0) <= 0) {
        throw new Error("Each order line requires an approved product price.");
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
    availableInventoryRows,
    visibleShopProductGroups,
    updateDraftQuantity,
    draftItems,
    draftSummary,
    buildOrderPayload,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IvansrunResellerOrders = api;
})(typeof window !== "undefined" ? window : globalThis);
