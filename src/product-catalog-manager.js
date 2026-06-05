(function attachProductCatalogManager(root) {
  function safeText(value) {
    return String(value || "").trim();
  }

  function safeNumber(value, fallback = null) {
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : fallback;
  }

  function slugify(value) {
    return safeText(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function skuPart(value) {
    return safeText(value)
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function normalizeList(items) {
    if (Array.isArray(items)) return items.map((item) => safeText(item)).filter(Boolean);
    return safeText(items)
      .split(/[,\n]/)
      .map((item) => safeText(item))
      .filter(Boolean);
  }

  function normalizeColours(colours) {
    return (Array.isArray(colours) ? colours : normalizeList(colours)).map((colour) => {
      if (typeof colour === "string") {
        return { name: safeText(colour), original: safeText(colour), code: "", image: "" };
      }
      return {
        name: safeText(colour.name),
        original: safeText(colour.original || colour.original_colour || colour.name),
        code: safeText(colour.code || colour.color_code),
        image: safeText(colour.image || colour.image_name),
      };
    }).filter((colour) => colour.name);
  }

  function buildProductDraft(input = {}) {
    const modelCode = safeText(input.modelCode || input.model_code);
    const name = safeText(input.name);
    if (!modelCode) throw new Error("Model code is required.");
    if (!name) throw new Error("Product name is required.");

    const sku = safeText(input.sku) || `IRUNSVAN-${modelCode}`;
    return {
      sku,
      model_code: modelCode,
      product_type: safeText(input.productType || input.product_type) || "shoe",
      name,
      slug: safeText(input.slug) || `${slugify(name)}-${slugify(sku)}`,
      category: safeText(input.category) || null,
      base_price: safeNumber(input.price ?? input.base_price, null),
      base_currency: safeText(input.currency || input.base_currency) || "USD",
      image_names: normalizeList(input.imageNames || input.image_names),
      published: Boolean(input.published),
      colours: normalizeColours(input.colours || input.colors || []),
      sizes: normalizeList(input.sizes || []),
    };
  }

  function parseColourLines(value) {
    return safeText(value)
      .split("\n")
      .map((line) => safeText(line))
      .filter(Boolean)
      .map((line) => {
        const [name = "", original = "", code = "", image = ""] = line.split("|").map((part) => safeText(part));
        return {
          name,
          original: original || name,
          code,
          image,
        };
      })
      .filter((colour) => colour.name);
  }

  function buildProductDraftFromForm(form = {}) {
    return buildProductDraft({
      modelCode: form.model_code || form.modelCode,
      name: form.name,
      category: form.category,
      price: form.price,
      productType: form.product_type || form.productType,
      colours: parseColourLines(form.colours || form.colors || ""),
      sizes: form.sizes,
      imageNames: form.images || form.image_names,
      published: false,
    });
  }

  function generateProductVariants(product = {}) {
    const colours = normalizeColours(product.colours || product.colors || []);
    const sizes = normalizeList(product.sizes || []);
    const productSku = safeText(product.sku);
    const productName = safeText(product.name);
    const productId = product.id || product.product_id || null;
    const combinations = [];

    if (!colours.length && !sizes.length) combinations.push({ colour: null, size: "" });
    else if (!sizes.length) colours.forEach((colour) => combinations.push({ colour, size: "" }));
    else if (!colours.length) sizes.forEach((size) => combinations.push({ colour: null, size }));
    else colours.forEach((colour) => sizes.forEach((size) => combinations.push({ colour, size })));

    return combinations.map(({ colour, size }) => {
      const variantName = [productName, colour?.name, size ? `Size ${size}` : ""].filter(Boolean).join(" - ");
      const variantSku = [productSku, colour?.name ? skuPart(colour.name) : "", size ? skuPart(size) : ""].filter(Boolean).join("-");
      return {
        product_id: productId,
        product_sku: productSku,
        sku: variantSku,
        name: variantName,
        colour: colour?.name || null,
        original_colour: colour?.original || colour?.name || null,
        color_code: colour?.code || null,
        size: size || null,
        base_price: product.base_price ?? null,
        base_currency: product.base_currency || "USD",
        image_name: colour?.image || (Array.isArray(product.image_names) ? product.image_names[0] || null : null),
        published: Boolean(product.published),
      };
    });
  }

  function normalizeModel(value) {
    return safeText(value).replace(/^IRUNSVAN-/i, "");
  }

  function matchInventoryToVariants({ inventoryRows = [], products = [], variants = [], inventory = [] } = {}) {
    const productsByModel = new Map(products.map((product) => [normalizeModel(product.model_code || product.sku), product]));
    const variantsByProductId = variants.reduce((map, variant) => {
      const list = map.get(variant.product_id) || [];
      list.push(variant);
      map.set(variant.product_id, list);
      return map;
    }, new Map());
    const inventoryByVariantId = new Map(inventory.map((row) => [row.variant_id, row]));
    const matches = [];
    const exceptions = [];

    inventoryRows.forEach((row, index) => {
      const modelCode = normalizeModel(row.model_code);
      const product = productsByModel.get(modelCode);
      if (!product) {
        exceptions.push({ row: index + 1, code: "missing_product", sourceSku: row.source_sku || null, modelCode });
        return;
      }

      const productVariants = variantsByProductId.get(product.id) || [];
      const colourMatches = productVariants.filter(
        (variant) => safeText(variant.original_colour || variant.colour) === safeText(row.original_colour) || safeText(variant.colour) === safeText(row.original_colour),
      );
      if (!colourMatches.length) {
        exceptions.push({ row: index + 1, code: "missing_colour", sourceSku: row.source_sku || null, modelCode, originalColour: row.original_colour });
        return;
      }

      const variant = colourMatches.find((candidate) => safeText(candidate.size) === safeText(row.size));
      if (!variant) {
        exceptions.push({ row: index + 1, code: "missing_size", sourceSku: row.source_sku || null, modelCode, originalColour: row.original_colour, size: row.size });
        return;
      }

      const previousStock = Math.max(0, safeNumber(inventoryByVariantId.get(variant.id)?.stock_quantity, 0));
      const nextStock = Math.max(0, safeNumber(row.stock_quantity, 0));
      matches.push({
        sourceSku: row.source_sku || null,
        productId: product.id,
        productName: product.name,
        variantId: variant.id,
        variantSku: variant.sku,
        modelCode,
        colour: variant.colour || row.original_colour,
        originalColour: variant.original_colour || row.original_colour,
        size: variant.size || row.size,
        previousStock,
        nextStock,
        changed: previousStock !== nextStock,
      });
    });

    return { matches, exceptions };
  }

  function buildStockReviewSummary(review = {}) {
    const matches = review.matches || [];
    const exceptions = review.exceptions || [];
    return {
      matchedRows: matches.length,
      exceptionRows: exceptions.length,
      stockChanged: matches.filter((match) => match.changed).length,
      zeroStock: matches.filter((match) => match.nextStock === 0).length,
      totalNextStock: matches.reduce((total, match) => total + match.nextStock, 0),
    };
  }

  const api = {
    buildProductDraft,
    buildProductDraftFromForm,
    generateProductVariants,
    matchInventoryToVariants,
    buildStockReviewSummary,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IvansrunProductCatalogManager = api;
})(typeof window !== "undefined" ? window : globalThis);
