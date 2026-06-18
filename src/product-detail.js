(function attachProductDetail(root) {
  function unique(values = []) {
    return [...new Set(values.filter(Boolean).map((value) => String(value).trim()).filter(Boolean))];
  }

  function resolveImageUrl(imageName, supabaseUrl) {
    const value = String(imageName || "").trim();
    if (!value) return "";
    if (/^https?:\/\//i.test(value) || value.startsWith("/")) return value;
    return `${String(supabaseUrl || "").replace(/\/$/, "")}/storage/v1/object/public/product-images/${encodeURIComponent(value)}`;
  }

  function buildProductDetailModel({ product, variants = [], catalogProducts = [], supabaseUrl }) {
    const galleryNames = unique([
      ...variants.map((variant) => variant.image_name),
      ...(Array.isArray(product?.image_names) ? product.image_names : []),
    ]);

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
