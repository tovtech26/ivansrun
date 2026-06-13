const assert = require("node:assert/strict");
const {
  fallbackCatalog,
  productSelectQuery,
  variantSelectQuery,
  colourMappingSelectQuery,
  protectedProductSource,
  protectedVariantSource,
  protectedColourMappingSource,
  protectedProductPriceSource,
  protectedVariantPriceSource,
  protectedProductSelectQuery,
  protectedVariantSelectQuery,
  protectedColourMappingSelectQuery,
  protectedProductPriceSelectQuery,
  protectedVariantPriceSelectQuery,
  normalizeCatalogRows,
} = require("../src/catalog-data.js");

assert.deepEqual(fallbackCatalog(), { products: [], variants: [] });

assert.equal(
  productSelectQuery(),
  "select=id,sku,model_code,product_type,name,slug,description,short_description,category,image_names,published&published=eq.true&order=sku.asc&limit=500",
);

assert.equal(
  variantSelectQuery(),
  "select=id,product_id,sku,name,colour,original_colour,color_code,size,image_name,published&published=eq.true&order=sku.asc&limit=5000",
);
assert.equal(
  colourMappingSelectQuery(),
  "select=id,product_id,model_code,original_colour,colour,color_code,image_name,published&published=eq.true&order=model_code.asc&limit=5000",
);

assert.equal(productSelectQuery().includes("base_price"), false);
assert.equal(variantSelectQuery().includes("base_price"), false);
assert.equal(colourMappingSelectQuery().includes("base_price"), false);
assert.equal(protectedProductSelectQuery().includes("base_price"), false);
assert.equal(protectedVariantSelectQuery().includes("base_price"), false);
assert.equal(protectedProductSource(), "reseller_products");
assert.equal(protectedVariantSource(), "reseller_product_variants");
assert.equal(protectedProductPriceSource(), "authorized_product_prices");
assert.equal(protectedVariantPriceSource(), "authorized_variant_prices");
assert.equal(protectedProductPriceSelectQuery(), "select=id,base_price,base_currency&order=id.asc&limit=5000");
assert.equal(protectedVariantPriceSelectQuery(), "select=id,base_price,base_currency&order=id.asc&limit=5000");
assert.equal(protectedColourMappingSource(), "product_colour_mappings");
assert.equal(protectedColourMappingSelectQuery(), "select=id,product_id,model_code,original_colour,colour,color_code,image_name,published&order=model_code.asc&limit=5000");

assert.deepEqual(
  normalizeCatalogRows({
    products: [
      { id: "product-1", sku: "IRUNSVAN-028", name: "IRUNSVAN 028", model_code: "028", image_names: null },
      { id: "", sku: "BROKEN", name: "Broken" },
    ],
    variants: [
      { id: "variant-1", product_id: "product-1", sku: "202302800138", original_colour: "亮桔色/海蓝", size: "38" },
      { id: "", product_id: "product-1", sku: "BROKEN" },
    ],
  }),
  {
    products: [{ id: "product-1", sku: "IRUNSVAN-028", name: "IRUNSVAN 028", model_code: "028", image_names: [] }],
    variants: [{ id: "variant-1", product_id: "product-1", sku: "202302800138", original_colour: "亮桔色/海蓝", size: "38" }],
  },
);

console.log("catalog-data tests passed");
