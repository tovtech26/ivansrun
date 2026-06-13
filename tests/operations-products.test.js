const assert = require("node:assert/strict");
const {
  priceState,
  buildStockMatrix,
  buildAdminProductModels,
  summarizeAdminProducts,
} = require("../src/operations-products.js");

assert.deepEqual(priceState("27.5", "USD"), {
  amount: 27.5,
  currency: "USD",
  priced: true,
  label: "$27.50",
  tone: "good",
});

assert.deepEqual(priceState(null), {
  amount: null,
  currency: "USD",
  priced: false,
  label: "Missing price",
  tone: "danger",
});

const inventoryRows = [
  { productId: "product-1", colour: "Orange", size: "38", stockQuantity: 4 },
  { productId: "product-1", colour: "Orange", size: "39", stockQuantity: 0 },
  { productId: "product-1", colour: "Blue", size: "38", stockQuantity: 7 },
  { productId: "product-2", colour: "Black", size: "40", stockQuantity: 0 },
];

assert.deepEqual(buildStockMatrix(inventoryRows.filter((row) => row.productId === "product-1")), {
  sizes: ["38", "39"],
  rows: [
    {
      colour: "Blue",
      totalStock: 7,
      sizes: [
        { size: "38", stockQuantity: 7 },
        { size: "39", stockQuantity: 0 },
      ],
    },
    {
      colour: "Orange",
      totalStock: 4,
      sizes: [
        { size: "38", stockQuantity: 4 },
        { size: "39", stockQuantity: 0 },
      ],
    },
  ],
});

const models = buildAdminProductModels({
  products: [
    {
      id: "product-1",
      sku: "IRUNSVAN-001",
      model_code: "001",
      name: "IRUNSVAN 001",
      category: "Running Shoes",
      base_price: "25",
      base_currency: "USD",
      image_names: ["001-1.jpg"],
      published: true,
    },
    {
      id: "product-2",
      sku: "IRUNSVAN-002",
      model_code: "002",
      name: "IRUNSVAN 002",
      category: null,
      base_price: null,
      image_names: [],
      published: true,
    },
  ],
  inventoryRows,
});

assert.equal(models[0].price.label, "$25.00");
assert.equal(models[0].stockTotal, 11);
assert.deepEqual(models[0].warnings, []);
assert.deepEqual(models[1].warnings, ["Missing price", "Missing image", "Out of stock"]);

assert.deepEqual(summarizeAdminProducts(models), {
  total: 2,
  missingPrice: 1,
  missingImage: 1,
  outOfStock: 1,
  totalUnits: 11,
});

console.log("operations-products tests passed");
