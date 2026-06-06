const assert = require("node:assert/strict");
const {
  buildImageOptions,
  suggestDisplayColour,
  buildProductInputFromEditor,
} = require("../src/product-editor.js");

assert.equal(suggestDisplayColour("Any source colour"), "");

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
    { original: "Source Colour", display: "", code: "002", image: "2503-2.jpg" },
    { original: "Inventory Colour", display: "Display Colour", code: "001", image: "2503-1.jpg" },
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
    { name: "Source Colour", original: "Source Colour", code: "002", image: "2503-2.jpg" },
    { name: "Display Colour", original: "Inventory Colour", code: "001", image: "2503-1.jpg" },
  ],
});

console.log("product-editor tests passed");
