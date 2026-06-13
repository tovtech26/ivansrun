(function attachProductPersistence(root) {
  const PRODUCT_IMAGE_BUCKET = "product-images";

  function safeText(value) {
    return String(value || "").trim();
  }

  function safeNumber(value, fallback = null) {
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : fallback;
  }

  function slugPart(value) {
    return safeText(value)
      .toLowerCase()
      .replace(/\.[a-z0-9]+$/i, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function extension(fileName) {
    const match = safeText(fileName).toLowerCase().match(/\.([a-z0-9]+)$/);
    return match ? `.${match[1]}` : "";
  }

  function cleanTextArray(items) {
    return (Array.isArray(items) ? items : [])
      .map((item) => safeText(item))
      .filter(Boolean);
  }

  function nullableText(value) {
    const text = safeText(value);
    return text || null;
  }

  function buildProductUpsertPayload(product = {}) {
    return {
      sku: safeText(product.sku),
      model_code: safeText(product.model_code),
      product_type: safeText(product.product_type) || "shoe",
      name: safeText(product.name),
      slug: safeText(product.slug),
      description: nullableText(product.description),
      short_description: nullableText(product.short_description),
      category: nullableText(product.category),
      base_price: safeNumber(product.base_price, null),
      base_currency: safeText(product.base_currency) || "USD",
      image_names: cleanTextArray(product.image_names),
      published: Boolean(product.published),
    };
  }

  function buildVariantUpsertPayloads(variants = [], productId) {
    return variants.map((variant) => ({
      product_id: productId,
      sku: safeText(variant.sku),
      name: safeText(variant.name),
      colour: nullableText(variant.colour),
      original_colour: nullableText(variant.original_colour),
      color_code: nullableText(variant.color_code),
      size: nullableText(variant.size),
      base_price: safeNumber(variant.base_price, null),
      base_currency: safeText(variant.base_currency) || "USD",
      image_name: nullableText(variant.image_name),
      published: Boolean(variant.published),
    }));
  }

  function buildColourMappingUpsertPayloads(mappings = [], productId) {
    return mappings.map((mapping) => ({
      product_id: safeText(mapping.product_id || productId),
      model_code: safeText(mapping.model_code),
      original_colour: nullableText(mapping.original_colour),
      colour: nullableText(mapping.colour),
      color_code: nullableText(mapping.color_code),
      image_name: nullableText(mapping.image_name),
      published: Boolean(mapping.published),
    }));
  }

  function buildZeroInventoryPayloads(variants = [], source = "manual_product_setup") {
    return variants
      .map((variant) => ({
        variant_id: safeText(variant.id || variant.variant_id),
        sku: safeText(variant.sku),
        style_code: safeText(variant.product_sku || variant.style_code),
        stock_quantity: 0,
        source: safeText(source) || "manual_product_setup",
      }))
      .filter((row) => row.variant_id && row.sku);
  }

  function buildStoragePath({ productSku, fileName, uniquePrefix = "" } = {}) {
    const folder = slugPart(productSku) || "product";
    const name = slugPart(fileName) || "image";
    const prefix = slugPart(uniquePrefix);
    return `products/${folder}/${[prefix, name].filter(Boolean).join("-")}${extension(fileName)}`;
  }

  function buildStoredImageRecords({ productSku, files = [], uniquePrefix = "" } = {}) {
    return Array.from(files || [])
      .filter((file) => safeText(file?.name))
      .map((file) => ({
        originalName: file.name,
        storagePath: buildStoragePath({ productSku, fileName: file.name, uniquePrefix }),
        contentType: safeText(file.type) || "application/octet-stream",
        file,
      }));
  }

  const api = {
    PRODUCT_IMAGE_BUCKET,
    buildProductUpsertPayload,
    buildVariantUpsertPayloads,
    buildColourMappingUpsertPayloads,
    buildZeroInventoryPayloads,
    buildStoragePath,
    buildStoredImageRecords,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IvansrunProductPersistence = api;
})(typeof window !== "undefined" ? window : globalThis);
