const assert = require("node:assert/strict");
const { filterAndSortCatalog } = require("../src/storefront-catalog.js");

const products = [
  { id: "1", sku: "IRUNSVAN-001", name: "IRUNSVAN 001 Running Shoe", category: "Running Shoes", base_price: 30 },
  { id: "2", sku: "IRUNSVAN-005", name: "IRUNSVAN 005 Trail Shoe", category: "Trail Performance", base_price: 36 },
  { id: "3", sku: "IRUNSVAN-025", name: "IRUNSVAN 025 Road Racing Shoe", category: "Road Racing", base_price: 38 },
];

const variantsByProductId = new Map([
  ["1", [{ size: "38" }, { size: "39" }]],
  ["2", [{ size: "42" }]],
  ["3", [{ size: "44" }]],
]);

assert.deepEqual(
  filterAndSortCatalog(products, variantsByProductId, {
    search: "trail",
    categories: [],
    sizes: [],
    maxPrice: 80,
    sort: "sku",
  }).map((product) => product.sku),
  ["IRUNSVAN-005"],
);

assert.deepEqual(
  filterAndSortCatalog(products, variantsByProductId, {
    search: "",
    categories: ["Running Shoes", "Road Racing"],
    sizes: ["44"],
    maxPrice: 80,
    sort: "sku",
  }).map((product) => product.sku),
  ["IRUNSVAN-025"],
);

assert.deepEqual(
  filterAndSortCatalog(products, variantsByProductId, {
    search: "",
    categories: [],
    sizes: [],
    maxPrice: 35,
    sort: "price-low",
  }).map((product) => product.sku),
  ["IRUNSVAN-001"],
);

assert.deepEqual(
  filterAndSortCatalog(products, variantsByProductId, {
    search: "",
    categories: [],
    sizes: [],
    maxPrice: 80,
    sort: "name",
  }).map((product) => product.sku),
  ["IRUNSVAN-001", "IRUNSVAN-005", "IRUNSVAN-025"],
);

console.log("storefront-catalog tests passed");
