(function attachProductImages(root) {
  function resolveProductImageUrl(imageName, supabaseUrl) {
    const value = String(imageName || "").trim();
    if (!value) return "";
    if (/^https?:\/\//i.test(value)) return value;
    if (value.startsWith("/")) return value;
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
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IvansrunProductImages = api;
})(typeof window !== "undefined" ? window : globalThis);
