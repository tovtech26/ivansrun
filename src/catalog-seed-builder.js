(function attachCatalogSeedBuilder(root) {
  function safeText(value) {
    return String(value || "").trim();
  }

  function slugify(value) {
    return safeText(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function normalizeModelCode(value) {
    const digits = safeText(value).replace(/\D/g, "");
    if (!digits) return "";
    if (digits.length >= 4) return digits.slice(-4);
    return digits.padStart(3, "0");
  }

  function imageFileName(value) {
    const text = safeText(value);
    if (!text) return "";
    const parts = text.split(/[\\/]/);
    return parts[parts.length - 1] || "";
  }

  function toImageLibrary(imageLibrary = {}, selectedProducts = []) {
    const library = new Map();

    Object.entries(imageLibrary || {}).forEach(([modelCode, images]) => {
      library.set(
        normalizeModelCode(modelCode),
        (Array.isArray(images) ? images : [])
          .map((entry) => imageFileName(entry))
          .filter(Boolean),
      );
    });

    (Array.isArray(selectedProducts) ? selectedProducts : []).forEach((product) => {
      const modelCode = normalizeModelCode(product.model_code || product.modelCode || product.sku);
      if (!modelCode || library.has(modelCode)) return;
      const images = (Array.isArray(product.image_names) ? product.image_names : [])
        .map((entry) => imageFileName(entry))
        .filter(Boolean);
      library.set(modelCode, images);
    });

    return library;
  }

  function toPriceMap(priceByModel) {
    if (priceByModel instanceof Map) return priceByModel;
    return new Map(Object.entries(priceByModel || {}));
  }

  function toSelectedProductMap(selectedProducts = []) {
    return new Map(
      (Array.isArray(selectedProducts) ? selectedProducts : [])
        .map((product) => [normalizeModelCode(product.model_code || product.modelCode || product.sku), product])
        .filter(([modelCode]) => modelCode),
    );
  }

  function buildColourMappingForModel(modelCode, groups, imageNames) {
    const mappings = [];
    const warnings = [];
    let nextFallbackIndex = 0;

    groups.forEach((group) => {
      let imageName = null;
      const numericCode = Number.parseInt(safeText(group.color_code), 10);

      if (Number.isFinite(numericCode) && numericCode > 0) {
        imageName = imageNames[numericCode - 1] || null;
      } else if (imageNames[nextFallbackIndex]) {
        imageName = imageNames[nextFallbackIndex];
        nextFallbackIndex += 1;
      }

      if (!imageName) {
        warnings.push({
          code: "missing_image",
          model_code: modelCode,
          original_colour: group.original_colour,
          color_code: group.color_code || "",
        });
      }

      mappings.push({
        model_code: modelCode,
        original_colour: group.original_colour,
        colour: group.original_colour,
        color_code: group.color_code || "",
        image_name: imageName,
        published: true,
      });
    });

    return { mappings, warnings };
  }

  function buildProductRecord({ modelCode, selectedProduct, imageNames, priceByModel, defaultCategory, defaultCurrency }) {
    const displayName = safeText(selectedProduct?.name) || `IRUNSVAN ${modelCode} Running Shoe`;
    const sku = safeText(selectedProduct?.sku) || `IRUNSVAN-${modelCode}`;
    return {
      sku,
      model_code: modelCode,
      product_type: safeText(selectedProduct?.product_type) || "shoe",
      name: displayName,
      slug: safeText(selectedProduct?.slug) || `${slugify(displayName)}-${slugify(sku)}`,
      description: selectedProduct?.description || "Performance footwear from the Irunsvan Africa catalog.",
      short_description: selectedProduct?.short_description || "Performance footwear from the Irunsvan Africa catalog.",
      category: safeText(selectedProduct?.category) || defaultCategory,
      base_price: priceByModel.has(modelCode) ? Number(priceByModel.get(modelCode)) : null,
      base_currency: safeText(selectedProduct?.base_currency) || defaultCurrency,
      image_names: imageNames,
      published: selectedProduct?.published !== false,
    };
  }

  function buildCatalogSeed({
    inventoryRows = [],
    selectedModelCodes = [],
    selectedProducts = [],
    imageLibrary = {},
    priceByModel = new Map(),
    publishStock = false,
    defaultCategory = "Running Shoes",
    defaultCurrency = "USD",
  } = {}) {
    const selectedSet = new Set((Array.isArray(selectedModelCodes) ? selectedModelCodes : []).map(normalizeModelCode).filter(Boolean));
    const imageLibraryByModel = toImageLibrary(imageLibrary, selectedProducts);
    const priceMap = toPriceMap(priceByModel);
    const selectedProductMap = toSelectedProductMap(selectedProducts);

    const rowsByModel = new Map();
    const skippedRows = [];

    (Array.isArray(inventoryRows) ? inventoryRows : []).forEach((row) => {
      const modelCode = normalizeModelCode(row.model_code);
      if (!modelCode || !selectedSet.has(modelCode)) {
        skippedRows.push({
          ...row,
          reason: !modelCode ? "missing_model_code" : "model_not_selected",
        });
        return;
      }
      const list = rowsByModel.get(modelCode) || [];
      list.push({
        ...row,
        model_code: modelCode,
        source_sku: safeText(row.source_sku || row.sku),
        original_colour: safeText(row.original_colour),
        color_code: safeText(row.color_code),
        size: safeText(row.size),
      });
      rowsByModel.set(modelCode, list);
    });

    const products = [];
    const colourMappings = [];
    const variants = [];
    const inventorySeedRows = [];
    const warnings = [];
    const matchedModels = [];

    [...selectedSet].sort().forEach((modelCode) => {
      const modelRows = rowsByModel.get(modelCode) || [];
      if (!modelRows.length) return;
      matchedModels.push(modelCode);

      const product = buildProductRecord({
        modelCode,
        selectedProduct: selectedProductMap.get(modelCode),
        imageNames: imageLibraryByModel.get(modelCode) || [],
        priceByModel: priceMap,
        defaultCategory,
        defaultCurrency,
      });
      products.push(product);

      const colourGroups = [];
      const groupMap = new Map();
      modelRows.forEach((row) => {
        const key = `${safeText(row.original_colour)}::${safeText(row.color_code)}`;
        if (!groupMap.has(key)) {
          const group = {
            original_colour: safeText(row.original_colour),
            color_code: safeText(row.color_code),
          };
          groupMap.set(key, group);
          colourGroups.push(group);
        }
      });

      const mappingResult = buildColourMappingForModel(modelCode, colourGroups, imageLibraryByModel.get(modelCode) || []);
      warnings.push(...mappingResult.warnings);
      const mappingByKey = new Map();
      mappingResult.mappings.forEach((mapping) => {
        colourMappings.push(mapping);
        mappingByKey.set(`${mapping.original_colour}::${mapping.color_code || ""}`, mapping);
      });

      modelRows.forEach((row) => {
        const mappingKey = `${safeText(row.original_colour)}::${safeText(row.color_code)}`;
        const mapping = mappingByKey.get(mappingKey) || null;
        variants.push({
          product_sku: product.sku,
          sku: row.source_sku,
          name: [product.name, safeText(mapping?.colour || row.original_colour), safeText(row.size) ? `Size ${safeText(row.size)}` : ""]
            .filter(Boolean)
            .join(" - "),
          colour: safeText(mapping?.colour || row.original_colour) || null,
          original_colour: safeText(row.original_colour) || null,
          color_code: safeText(row.color_code) || null,
          size: safeText(row.size) || null,
          base_price: product.base_price,
          base_currency: product.base_currency,
          image_name: mapping?.image_name || null,
          published: true,
        });
        inventorySeedRows.push({
          sku: row.source_sku,
          style_code: row.source_style_code || product.sku,
          stock_quantity: publishStock ? Number(row.stock_quantity || 0) : 0,
          source: "catalog_seed",
        });
      });
    });

    const missingSelectedModels = [...selectedSet].filter((modelCode) => !matchedModels.includes(modelCode));

    return {
      products,
      colourMappings,
      variants,
      inventorySeedRows,
      skippedRows,
      warnings,
      summary: {
        selectedModels: selectedSet.size,
        selectedModelCodes: [...selectedSet].sort(),
        matchedModels: matchedModels.length,
        matchedModelCodes: [...matchedModels].sort(),
        missingSelectedModels,
        variantRows: variants.length,
        variantCount: variants.length,
        colourCount: colourMappings.length,
        skippedRows: skippedRows.length,
      },
    };
  }

  const api = {
    buildCatalogSeed,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IrunsvanCatalogSeedBuilder = api;
})(typeof window !== "undefined" ? window : globalThis);
