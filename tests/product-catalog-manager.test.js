const assert = require("node:assert/strict");
const {
  buildProductDraft,
  buildProductDraftFromForm,
  generateProductVariants,
  matchInventoryToVariants,
  buildStockReviewSummary,
} = require("../src/product-catalog-manager.js");

const product = buildProductDraft({
  modelCode: "125",
  name: "IRUNSVAN 125 Flying GT3.0",
  category: "Running Shoes",
  price: 36,
  colours: [
    { name: "Pearl White", original: "珍珠白", code: "002", image: "125-2.jpg" },
    { name: "Bright Orange / Ocean Blue", original: "亮桔色/海蓝", code: "001", image: "125-1.jpg" },
  ],
  sizes: ["38", "39"],
  imageNames: ["125-1.jpg", "125-2.jpg"],
});

assert.deepEqual(product, {
  sku: "IRUNSVAN-125",
  model_code: "125",
  product_type: "shoe",
  name: "IRUNSVAN 125 Flying GT3.0",
  slug: "irunsvan-125-flying-gt3-0-irunsvan-125",
  category: "Running Shoes",
  base_price: 36,
  base_currency: "USD",
  image_names: ["125-1.jpg", "125-2.jpg"],
  published: false,
  colours: [
    { name: "Pearl White", original: "珍珠白", code: "002", image: "125-2.jpg" },
    { name: "Bright Orange / Ocean Blue", original: "亮桔色/海蓝", code: "001", image: "125-1.jpg" },
  ],
  sizes: ["38", "39"],
});

const variants = generateProductVariants({ ...product, id: "product-125" });
assert.equal(variants.length, 4);
assert.deepEqual(variants[0], {
  product_id: "product-125",
  product_sku: "IRUNSVAN-125",
  sku: "IRUNSVAN-125-PEARL-WHITE-38",
  name: "IRUNSVAN 125 Flying GT3.0 - Pearl White - Size 38",
  colour: "Pearl White",
  original_colour: "珍珠白",
  color_code: "002",
  size: "38",
  base_price: 36,
  base_currency: "USD",
  image_name: "125-2.jpg",
  published: false,
});

const review = matchInventoryToVariants({
  inventoryRows: [
    { model_code: "125", original_colour: "珍珠白", size: "38", stock_quantity: 40, source_sku: "2023001002138" },
    { model_code: "125", original_colour: "不存在", size: "38", stock_quantity: 7, source_sku: "bad-color" },
    { model_code: "999", original_colour: "珍珠白", size: "38", stock_quantity: 3, source_sku: "bad-product" },
  ],
  products: [{ id: "product-125", sku: "IRUNSVAN-125", model_code: "125", name: "IRUNSVAN 125 Flying GT3.0" }],
  variants: [{ id: "variant-1", product_id: "product-125", sku: "IRUNSVAN-125-PEARL-WHITE-38", colour: "Pearl White", original_colour: "珍珠白", size: "38" }],
  inventory: [{ variant_id: "variant-1", stock_quantity: 10 }],
});

assert.equal(review.matches.length, 1);
assert.deepEqual(review.matches[0], {
  sourceSku: "2023001002138",
  productId: "product-125",
  productName: "IRUNSVAN 125 Flying GT3.0",
  variantId: "variant-1",
  variantSku: "IRUNSVAN-125-PEARL-WHITE-38",
  modelCode: "125",
  colour: "Pearl White",
  originalColour: "珍珠白",
  size: "38",
  previousStock: 10,
  nextStock: 40,
  changed: true,
});
assert.deepEqual(review.exceptions.map((exception) => exception.code), ["missing_colour", "missing_product"]);
assert.deepEqual(buildStockReviewSummary(review), {
  matchedRows: 1,
  exceptionRows: 2,
  stockChanged: 1,
  zeroStock: 0,
  totalNextStock: 40,
});

const formDraft = buildProductDraftFromForm({
  model_code: "2503",
  name: "IRUNSVAN 2503 Shadow Wing PRO+",
  category: "Running Shoes",
  price: "38",
  colours: ["Pearl White | 珍珠白 | 002 | 2503-2.jpg", "Black / Blue | 黑蓝 | 001 | 2503-1.jpg"].join("\n"),
  sizes: "38, 39, 40",
  images: "2503-1.jpg, 2503-2.jpg",
});

assert.equal(formDraft.sku, "IRUNSVAN-2503");
assert.equal(formDraft.base_price, 38);
assert.deepEqual(formDraft.colours, [
  { name: "Pearl White", original: "珍珠白", code: "002", image: "2503-2.jpg" },
  { name: "Black / Blue", original: "黑蓝", code: "001", image: "2503-1.jpg" },
]);
assert.deepEqual(formDraft.sizes, ["38", "39", "40"]);
assert.equal(generateProductVariants({ ...formDraft, id: "product-2503" }).length, 6);

console.log("product-catalog-manager tests passed");
