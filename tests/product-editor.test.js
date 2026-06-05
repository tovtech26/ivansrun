const assert = require("node:assert/strict");
const {
  buildImageOptions,
  suggestDisplayColour,
  buildProductInputFromEditor,
} = require("../src/product-editor.js");

assert.equal(suggestDisplayColour("珍珠白"), "Pearl White");
assert.equal(suggestDisplayColour("亮桔色/海蓝"), "Bright Orange / Ocean Blue");
assert.equal(suggestDisplayColour("黑蓝"), "Black / Blue");
assert.equal(suggestDisplayColour("未知色"), "");

assert.deepEqual(buildImageOptions([{ name: "2503-1.jpg" }, { name: "2503-2.jpg" }, "manual.jpg"]), [
  { name: "2503-1.jpg", label: "2503-1.jpg" },
  { name: "2503-2.jpg", label: "2503-2.jpg" },
  { name: "manual.jpg", label: "manual.jpg" },
]);

const productInput = buildProductInputFromEditor({
  fields: {
    model_code: "2503",
    name: "IRUNSVAN 2503 Shadow Wing PRO+",
    category: "Running Shoes",
    price: "38",
    sizes: "38,39,40",
    product_type: "shoe",
  },
  colourRows: [
    { original: "珍珠白", display: "", code: "002", image: "2503-2.jpg" },
    { original: "黑蓝", display: "Night Blue / Black", code: "001", image: "2503-1.jpg" },
    { original: "", display: "", code: "", image: "" },
  ],
  imageNames: ["2503-1.jpg", "2503-2.jpg"],
});

assert.deepEqual(productInput, {
  model_code: "2503",
  name: "IRUNSVAN 2503 Shadow Wing PRO+",
  category: "Running Shoes",
  price: "38",
  product_type: "shoe",
  sizes: "38,39,40",
  images: "2503-1.jpg, 2503-2.jpg",
  colours: [
    { name: "Pearl White", original: "珍珠白", code: "002", image: "2503-2.jpg" },
    { name: "Night Blue / Black", original: "黑蓝", code: "001", image: "2503-1.jpg" },
  ],
});

console.log("product-editor tests passed");
