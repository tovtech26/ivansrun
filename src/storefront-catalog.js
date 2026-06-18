(function attachStorefrontCatalog(root) {
  function skuRank(sku = "") {
    const match = String(sku).match(/(\d+)/);
    return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
  }

  function lower(value) {
    return String(value || "").toLowerCase();
  }

  function priceValue(product) {
    const amount = Number(product?.base_price);
    return Number.isFinite(amount) ? amount : Number.MAX_SAFE_INTEGER;
  }

  function filterAndSortCatalog(products = [], variantsByProductId = new Map(), filters = {}) {
    const search = lower(filters.search).trim();
    const categories = new Set(filters.categories || []);
    const sizes = new Set(filters.sizes || []);
    const maxPrice = Number(filters.maxPrice ?? 80);
    const sort = filters.sort || "sku";

    return [...products]
      .filter((product) => {
        if (search) {
          const haystack = [product.name, product.sku, product.category].map(lower).join(" ");
          if (!haystack.includes(search)) return false;
        }

        if (categories.size && !categories.has(product.category)) return false;

        const productPrice = Number(product.base_price);
        if (Number.isFinite(maxPrice) && Number.isFinite(productPrice) && productPrice > maxPrice) return false;

        if (sizes.size) {
          const variants = variantsByProductId.get(product.id) || [];
          if (!variants.some((variant) => sizes.has(String(variant.size)))) return false;
        }

        return true;
      })
      .sort((left, right) => {
        if (sort === "price-low") return priceValue(left) - priceValue(right) || skuRank(left.sku) - skuRank(right.sku);
        if (sort === "name") return String(left.name).localeCompare(String(right.name)) || skuRank(left.sku) - skuRank(right.sku);
        return skuRank(left.sku) - skuRank(right.sku) || String(left.name).localeCompare(String(right.name));
      });
  }

  const api = {
    filterAndSortCatalog,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IrunsvanStorefrontCatalog = api;
})(typeof window !== "undefined" ? window : globalThis);
