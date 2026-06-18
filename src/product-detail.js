(function attachProductDetail(root) {
  const ProductImages =
    root.IrunsvanProductImages ||
    (typeof require !== "undefined" ? require("./product-images.js") : null);

  function imageKey(value) {
    const text = String(value || "").trim();
    if (!text) return "";
    if (/^https?:\/\//i.test(text)) return text;
    const parts = text.split("/").filter(Boolean);
    return parts[parts.length - 1] || text;
  }

  function unique(values = [], keyFor = (value) => String(value).trim()) {
    const seen = new Set();
    return values
      .filter(Boolean)
      .map((value) => String(value).trim())
      .filter(Boolean)
      .filter((value) => {
        const key = keyFor(value);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  function resolveImageUrl(imageName, supabaseUrl) {
    const value = String(imageName || "").trim();
    if (!value) return "";
    if (ProductImages?.resolveProductImageUrl) {
      return ProductImages.resolveProductImageUrl(value, supabaseUrl);
    }
    if (/^https?:\/\//i.test(value) || value.startsWith("/")) return value;
    return `${String(supabaseUrl || "").replace(/\/$/, "")}/storage/v1/object/public/product-images/${encodeURIComponent(value)}`;
  }

  function buildProductDetailModel({ product, variants = [], catalogProducts = [], supabaseUrl }) {
    const galleryNames = unique([
      ...variants.map((variant) => variant.image_name),
      ...(Array.isArray(product?.image_names) ? product.image_names : []),
    ], imageKey);

    const gallery = galleryNames.map((imageName) => ({
      imageName,
      imageUrl: resolveImageUrl(imageName, supabaseUrl),
    }));

    const colours = unique(variants.map((variant) => variant.colour));
    const sizes = unique(variants.map((variant) => variant.size)).sort((left, right) => Number(left) - Number(right));
    const relatedProducts = catalogProducts
      .filter((candidate) => candidate.id !== product.id && candidate.category === product.category)
      .slice(0, 2);

    return {
      gallery,
      colours,
      sizes,
      relatedProducts,
    };
  }

  const api = {
    buildProductDetailModel,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IrunsvanProductDetail = api;
})(typeof window !== "undefined" ? window : globalThis);
