const assert = require("node:assert/strict");
const {
  PRODUCT_IMAGE_BUCKET,
  buildProductUpsertPayload,
  buildVariantUpsertPayloads,
  buildColourMappingUpsertPayloads,
  buildZeroInventoryPayloads,
  buildStoragePath,
  buildStoredImageRecords,
} = require("../src/product-persistence.js");

const product = {
  id: "product-2503",
  sku: "IRUNSVAN-2503",
  model_code: "2503",
  product_type: "shoe",
  name: "IRUNSVAN 2503 Shadow Wing PRO+",
  slug: "irunsvan-2503-shadow-wing-pro-irunsvan-2503",
  category: "Running Shoes",
  base_price: 38,
  base_currency: "USD",
  image_names: ["products/irunsvan-2503/20260605-front.jpg"],
  published: true,
  colours: [{ name: "Pearl White" }],
  sizes: ["38"],
};

assert.equal(PRODUCT_IMAGE_BUCKET, "product-images");
assert.deepEqual(buildProductUpsertPayload(product), {
  sku: "IRUNSVAN-2503",
  model_code: "2503",
  product_type: "shoe",
  name: "IRUNSVAN 2503 Shadow Wing PRO+",
  slug: "irunsvan-2503-shadow-wing-pro-irunsvan-2503",
  description: null,
  short_description: null,
  category: "Running Shoes",
  base_price: 38,
  base_currency: "USD",
  image_names: ["products/irunsvan-2503/20260605-front.jpg"],
  published: true,
});

assert.deepEqual(
  buildVariantUpsertPayloads(
    [
      {
        sku: "IRUNSVAN-2503-PEARL-WHITE-38",
        name: "IRUNSVAN 2503 Shadow Wing PRO+ - Pearl White - Size 38",
        colour: "Pearl White",
        original_colour: "珍珠白",
        color_code: "002",
        size: "38",
        base_price: 38,
        base_currency: "USD",
        image_name: "products/irunsvan-2503/20260605-front.jpg",
        published: true,
      },
    ],
    "product-2503",
  ),
  [
    {
      product_id: "product-2503",
      sku: "IRUNSVAN-2503-PEARL-WHITE-38",
      name: "IRUNSVAN 2503 Shadow Wing PRO+ - Pearl White - Size 38",
      colour: "Pearl White",
      original_colour: "珍珠白",
      color_code: "002",
      size: "38",
      base_price: 38,
      base_currency: "USD",
      image_name: "products/irunsvan-2503/20260605-front.jpg",
      published: true,
    },
  ],
);
assert.equal(
  buildVariantUpsertPayloads(
    [
      {
        sku: "202425030137",
        name: "IRUNSVAN 2503 Shadow Wing PRO+ - Green / Orange - Size 37",
        colour: "Green / Orange",
        original_colour: "绿野仙踪/青橙",
        color_code: "001",
        size: "37",
        base_price: 58,
        base_currency: "USD",
        image_name: "2503-1.jpg",
        published: true,
      },
    ],
    "product-2503",
  )[0].sku,
  "202425030137",
);

assert.deepEqual(
  buildColourMappingUpsertPayloads([
    {
      product_id: "product-2503",
      model_code: "2503",
      original_colour: "绿野仙踪/青橙",
      colour: "Green / Orange",
      color_code: "001",
      image_name: "2503-1.jpg",
      published: true,
    },
  ]),
  [
    {
      product_id: "product-2503",
      model_code: "2503",
      original_colour: "绿野仙踪/青橙",
      colour: "Green / Orange",
      color_code: "001",
      image_name: "2503-1.jpg",
      published: true,
    },
  ],
);

assert.deepEqual(
  buildZeroInventoryPayloads(
    [
      {
        id: "variant-2503-38",
        sku: "IRUNSVAN-2503-PEARL-WHITE-38",
        product_sku: "IRUNSVAN-2503",
      },
      {
        id: "variant-2503-39",
        sku: "IRUNSVAN-2503-PEARL-WHITE-39",
        product_sku: "IRUNSVAN-2503",
      },
    ],
    "manual_product_setup",
  ),
  [
    {
      variant_id: "variant-2503-38",
      sku: "IRUNSVAN-2503-PEARL-WHITE-38",
      style_code: "IRUNSVAN-2503",
      stock_quantity: 0,
      source: "manual_product_setup",
    },
    {
      variant_id: "variant-2503-39",
      sku: "IRUNSVAN-2503-PEARL-WHITE-39",
      style_code: "IRUNSVAN-2503",
      stock_quantity: 0,
      source: "manual_product_setup",
    },
  ],
);

assert.equal(
  buildStoragePath({ productSku: "IRUNSVAN 2503", fileName: "Front Shoe (Blue).JPG", uniquePrefix: "20260605" }),
  "products/irunsvan-2503/20260605-front-shoe-blue.jpg",
);

assert.deepEqual(
  buildStoredImageRecords({
    productSku: "IRUNSVAN 2503",
    files: [{ name: "Front Shoe.JPG", type: "image/jpeg" }, { name: "Side View.PNG", type: "image/png" }],
    uniquePrefix: "20260605",
  }),
  [
    {
      originalName: "Front Shoe.JPG",
      storagePath: "products/irunsvan-2503/20260605-front-shoe.jpg",
      contentType: "image/jpeg",
      file: { name: "Front Shoe.JPG", type: "image/jpeg" },
    },
    {
      originalName: "Side View.PNG",
      storagePath: "products/irunsvan-2503/20260605-side-view.png",
      contentType: "image/png",
      file: { name: "Side View.PNG", type: "image/png" },
    },
  ],
);

console.log("product-persistence tests passed");
