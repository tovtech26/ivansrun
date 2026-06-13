(function attachOperationsProducts(root) {
  function safeText(value) {
    return String(value || "").trim();
  }

  function safeNumber(value, fallback = 0) {
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : fallback;
  }

  function priceState(value, currency = "USD") {
    const amount = Number(value);
    const priced = Number.isFinite(amount) && amount > 0;
    return {
      amount: priced ? amount : null,
      currency: safeText(currency) || "USD",
      priced,
      label: priced ? `$${amount.toFixed(2)}` : "Missing price",
      tone: priced ? "good" : "danger",
    };
  }

  function buildStockMatrix(rows = []) {
    const colours = new Map();
    const sizeSet = new Set();

    rows.forEach((row) => {
      const colour = safeText(row.colour) || "Unspecified";
      const size = safeText(row.size) || "One size";
      const stockQuantity = Math.max(0, safeNumber(row.stockQuantity, 0));
      const colourRow = colours.get(colour) || { colour, totalStock: 0, sizes: new Map() };
      colourRow.totalStock += stockQuantity;
      colourRow.sizes.set(size, (colourRow.sizes.get(size) || 0) + stockQuantity);
      colours.set(colour, colourRow);
      sizeSet.add(size);
    });

    const sizes = [...sizeSet].sort((left, right) => safeNumber(left, Number.MAX_SAFE_INTEGER) - safeNumber(right, Number.MAX_SAFE_INTEGER) || left.localeCompare(right));
    return {
      sizes,
      rows: [...colours.values()]
        .sort((left, right) => right.totalStock - left.totalStock || left.colour.localeCompare(right.colour))
        .map((row) => ({
          colour: row.colour,
          totalStock: row.totalStock,
          sizes: sizes.map((size) => ({ size, stockQuantity: row.sizes.get(size) || 0 })),
        })),
    };
  }

  function buildAdminProductModels({ products = [], inventoryRows = [] } = {}) {
    const rowsByProductId = inventoryRows.reduce((map, row) => {
      const key = row.productId;
      if (!key) return map;
      const next = map.get(key) || [];
      next.push(row);
      map.set(key, next);
      return map;
    }, new Map());

    return products.map((product) => {
      const rows = rowsByProductId.get(product.id) || [];
      const stockTotal = rows.reduce((total, row) => total + Math.max(0, safeNumber(row.stockQuantity, 0)), 0);
      const colours = new Set(rows.map((row) => safeText(row.colour)).filter(Boolean));
      const sizes = new Set(rows.map((row) => safeText(row.size)).filter(Boolean));
      const imageNames = Array.isArray(product.image_names) ? product.image_names.filter(Boolean) : [];
      const price = priceState(product.base_price, product.base_currency);
      const warnings = [];

      if (!price.priced) warnings.push("Missing price");
      if (!imageNames.length) warnings.push("Missing image");
      if (stockTotal <= 0) warnings.push("Out of stock");

      return {
        id: product.id,
        sku: product.sku,
        modelCode: product.model_code || product.sku,
        name: product.name,
        category: product.category || "Uncategorized",
        published: Boolean(product.published),
        imageName: imageNames[0] || "",
        price,
        stockTotal,
        optionCount: rows.length,
        colourCount: colours.size,
        sizeCount: sizes.size,
        warnings,
        stockMatrix: buildStockMatrix(rows),
      };
    });
  }

  function summarizeAdminProducts(models = []) {
    return {
      total: models.length,
      missingPrice: models.filter((model) => !model.price.priced).length,
      missingImage: models.filter((model) => !model.imageName).length,
      outOfStock: models.filter((model) => model.stockTotal <= 0).length,
      totalUnits: models.reduce((total, model) => total + model.stockTotal, 0),
    };
  }

  const api = {
    priceState,
    buildStockMatrix,
    buildAdminProductModels,
    summarizeAdminProducts,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IvansrunOperationsProducts = api;
})(typeof window !== "undefined" ? window : globalThis);
