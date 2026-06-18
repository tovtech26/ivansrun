(function attachCatalogData(root) {
  function fallbackCatalog() {
    const fallback = root.IrunsvanCatalogFallback || {};
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

  function colourMappingSelectQuery() {
    return "select=id,product_id,model_code,original_colour,colour,color_code,image_name,published&published=eq.true&order=model_code.asc&limit=5000";
  }

  function protectedProductSelectQuery() {
    return "select=id,sku,model_code,product_type,name,slug,description,short_description,category,image_names,published&order=sku.asc&limit=500";
  }

  function protectedVariantSelectQuery() {
    return "select=id,product_id,sku,name,colour,original_colour,color_code,size,image_name,published&order=sku.asc&limit=5000";
  }

  function protectedProductSource() {
    return "reseller_products";
  }

  function protectedVariantSource() {
    return "reseller_product_variants";
  }

  function protectedColourMappingSource() {
    return "product_colour_mappings";
  }

  function protectedColourMappingSelectQuery() {
    return "select=id,product_id,model_code,original_colour,colour,color_code,image_name,published&order=model_code.asc&limit=5000";
  }

  function protectedProductPriceSource() {
    return "authorized_product_prices";
  }

  function protectedVariantPriceSource() {
    return "authorized_variant_prices";
  }

  function protectedProductPriceSelectQuery() {
    return "select=id,base_price,base_currency&order=id.asc&limit=5000";
  }

  function protectedVariantPriceSelectQuery() {
    return "select=id,base_price,base_currency&order=id.asc&limit=5000";
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
    colourMappingSelectQuery,
    protectedProductSelectQuery,
    protectedVariantSelectQuery,
    protectedColourMappingSelectQuery,
    protectedProductPriceSelectQuery,
    protectedVariantPriceSelectQuery,
    protectedProductSource,
    protectedVariantSource,
    protectedColourMappingSource,
    protectedProductPriceSource,
    protectedVariantPriceSource,
    normalizeCatalogRows,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IrunsvanCatalogData = api;
})(typeof window !== "undefined" ? window : globalThis);
