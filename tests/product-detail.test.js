const assert = require("node:assert/strict");
globalThis.IrunsvanProductImages = require("../src/product-images.js");
const { buildProductDetailModel } = require("../src/product-detail.js");

const product = {
  id: "product-1",
  sku: "IRUNSVAN-001",
  name: "IRUNSVAN 001 Running Shoe",
  category: "Running Shoes",
  base_price: 30,
  image_names: ["001-1.jpg", "001-2.jpg"],
};

const variants = [
  { id: "variant-1", product_id: "product-1", colour: "Bright Orange / Ocean Blue", size: "38", image_name: "001-v1.jpg" },
  { id: "variant-2", product_id: "product-1", colour: "Elegant Black", size: "39", image_name: "001-v2.jpg" },
];

const catalog = [
  product,
  { id: "product-2", sku: "IRUNSVAN-005", name: "IRUNSVAN 005 Trail Shoe", category: "Running Shoes", base_price: 36, image_names: ["005-1.jpg"] },
  { id: "product-3", sku: "IRUNSVAN-010", name: "IRUNSVAN 010 Sprint Shoe", category: "Road Racing", base_price: 32, image_names: ["010-1.jpg"] },
  { id: "product-4", sku: "IRUNSVAN-020", name: "IRUNSVAN 020 Marathon Shoe", category: "Running Shoes", base_price: 42, image_names: ["020-1.jpg"] },
];

const model = buildProductDetailModel({
  product,
  variants,
  catalogProducts: catalog,
  supabaseUrl: "https://llicocwonbokahpbireg.supabase.co",
});

assert.deepEqual(model.gallery.map((image) => image.imageName), ["001-v1.jpg", "001-v2.jpg", "001-1.jpg", "001-2.jpg"]);
assert.deepEqual(model.colours, ["Bright Orange / Ocean Blue", "Elegant Black"]);
assert.deepEqual(model.sizes, ["38", "39"]);
assert.equal(model.relatedProducts.length, 2);
assert.deepEqual(model.relatedProducts.map((item) => item.sku), ["IRUNSVAN-005", "IRUNSVAN-020"]);

const dbMixedPathModel = buildProductDetailModel({
  product: {
    id: "product-2503",
    sku: "IRUNSVAN-2503",
    name: "IRUNSVAN 2503 Running Shoe",
    category: "Running Shoes",
    image_names: [
      "/public/product-images/SKUs/2503/2503-1.jpg",
      "/public/product-images/SKUs/2503/2503-2.jpg",
    ],
  },
  variants: [
    { id: "variant-2503-1", product_id: "product-2503", colour: "Emerald Trail / Cyan Orange", size: "37", image_name: "2503-1.jpg" },
    { id: "variant-2503-2", product_id: "product-2503", colour: "Fresh Green Orange", size: "37", image_name: "2503-2.jpg" },
  ],
  catalogProducts: [],
  supabaseUrl: "https://llicocwonbokahpbireg.supabase.co",
});

assert.deepEqual(dbMixedPathModel.gallery.map((image) => image.imageName), ["2503-1.jpg", "2503-2.jpg"]);
assert.deepEqual(dbMixedPathModel.gallery.map((image) => image.imageUrl), [
  "/public/product-images/SKUs/2503/2503-1.jpg",
  "/public/product-images/SKUs/2503/2503-2.jpg",
]);

console.log("product-detail tests passed");
