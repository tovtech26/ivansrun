(function attachCatalogData(root) {
  function fallbackCatalog() {
    const fallback = root.IvansrunCatalogFallback || {};
    return {
      products: Array.isArray(fallback.products) ? fallback.products : [],
      variants: Array.isArray(fallback.variants) ? fallback.variants : [],
    };
  }

  function productSelectQuery() {
    return "select=id,sku,model_code,product_type,name,slug,description,short_description,category,image_names,published&published=eq.true&order=sku.asc&limit=500";
  }

  function variantSelectQuery() {
    return "select=id,product_id,sku,name,colour,original_colour,color_code,size,image_name,published&published=eq.true&order=sku.asc&limit=5000";
  }

  function protectedProductSelectQuery() {
    return "select=id,sku,model_code,product_type,name,slug,description,short_description,category,base_price,base_currency,image_names,published&order=sku.asc&limit=500";
  }

  function protectedVariantSelectQuery() {
    return "select=id,product_id,sku,name,colour,original_colour,color_code,size,base_price,base_currency,image_name,published&order=sku.asc&limit=5000";
  }

  function protectedProductSource() {
    return "reseller_products";
  }

  function protectedVariantSource() {
    return "reseller_product_variants";
  }

  function normalizeCatalogRows({ products = [], variants = [] } = {}) {
    return {
      products: products
        .filter((product) => product?.id && product?.sku)
        .map((product) => ({
          ...product,
          image_names: Array.isArray(product.image_names) ? product.image_names : [],
        })),
      variants: variants.filter((variant) => variant?.id && variant?.product_id && variant?.sku),
    };
  }

  const api = {
    fallbackCatalog,
    productSelectQuery,
    variantSelectQuery,
    protectedProductSelectQuery,
    protectedVariantSelectQuery,
    protectedProductSource,
    protectedVariantSource,
    normalizeCatalogRows,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IvansrunCatalogData = api;
})(typeof window !== "undefined" ? window : globalThis);
