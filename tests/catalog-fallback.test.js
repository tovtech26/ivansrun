const assert = require("node:assert/strict");
const fallback = require("../src/catalog-fallback.js");

assert.equal(Array.isArray(fallback.products), true);
assert.equal(Array.isArray(fallback.variants), true);
assert.equal(fallback.products.length, 21);
assert.equal(fallback.variants.length, 0);

const product028 = fallback.products.find((product) => product.model_code === "028");
assert.equal(product028?.name, "IRUNSVAN 028 Running Shoe");
assert.equal(product028?.image_names[0], "/public/product-images/SKUs/028/028-1.jpg");

console.log("catalog-fallback tests passed");
