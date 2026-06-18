(function attachProductImages(root) {
  const LOCAL_PRODUCT_IMAGE_MODELS = new Set([
    "005",
    "026",
    "028",
    "038",
    "046",
    "066",
    "072",
    "087",
    "090",
    "098",
    "106",
    "121",
    "125",
    "126",
    "128",
    "130",
    "131",
    "135",
    "165",
    "166",
    "2503",
  ]);

  function localCatalogImagePath(value) {
    const match = String(value || "").match(/^([A-Za-z0-9]+)-\d+\.(?:jpe?g|png|webp|svg)$/i);
    if (!match) return "";
    const modelCode = match[1].toUpperCase();
    if (!LOCAL_PRODUCT_IMAGE_MODELS.has(modelCode)) return "";
    return `/public/product-images/SKUs/${encodeURIComponent(modelCode)}/${String(value)
      .split("/")
      .map((part) => encodeURIComponent(part))
      .join("/")}`;
  }

  function resolveProductImageUrl(imageName, supabaseUrl) {
    const value = String(imageName || "").trim();
    if (!value) return "";
    if (/^https?:\/\//i.test(value)) return value;
    if (value.startsWith("/")) return value;
    const localPath = localCatalogImagePath(value);
    if (localPath) return localPath;
    if (!value.includes("/")) return "";
    const encodedPath = value
      .split("/")
      .map((part) => encodeURIComponent(part))
      .join("/");
    return `${String(supabaseUrl || "").replace(/\/$/, "")}/storage/v1/object/public/product-images/${encodedPath}`;
  }

  function productImageSource(product, variant, supabaseUrl) {
    const imageName = String(variant?.image_name || (Array.isArray(product?.image_names) ? product.image_names[0] || "" : "")).trim();
    const imageUrl = resolveProductImageUrl(imageName, supabaseUrl);
    return {
      imageName,
      imageUrl,
      hasRealImage: Boolean(imageUrl),
    };
  }

  const api = {
    resolveProductImageUrl,
    productImageSource,
    localCatalogImagePath,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IrunsvanProductImages = api;
})(typeof window !== "undefined" ? window : globalThis);
