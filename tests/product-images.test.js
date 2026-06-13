const assert = require("node:assert/strict");
const { resolveProductImageUrl, productImageSource } = require("../src/product-images.js");

assert.equal(
  resolveProductImageUrl("028-1.jpg", "https://llicocwonbokahpbireg.supabase.co"),
  "/public/product-images/SKUs/028/028-1.jpg",
);

assert.equal(
  resolveProductImageUrl("001-1.jpg", "https://llicocwonbokahpbireg.supabase.co"),
  "",
);

assert.equal(
  resolveProductImageUrl("products/irunsvan-2503/20260605-front.jpg", "https://llicocwonbokahpbireg.supabase.co"),
  "https://llicocwonbokahpbireg.supabase.co/storage/v1/object/public/product-images/products/irunsvan-2503/20260605-front.jpg",
);

assert.equal(resolveProductImageUrl("/products/001-1.jpg", "https://example.com"), "/products/001-1.jpg");
assert.equal(resolveProductImageUrl("https://cdn.example.com/001-1.jpg", "https://example.com"), "https://cdn.example.com/001-1.jpg");
assert.equal(resolveProductImageUrl("", "https://example.com"), "");

assert.deepEqual(
  productImageSource(
    {
      image_names: ["028-1.jpg"],
    },
    { image_name: "028-2.jpg" },
    "https://llicocwonbokahpbireg.supabase.co",
  ),
  {
    imageName: "028-2.jpg",
    imageUrl: "/public/product-images/SKUs/028/028-2.jpg",
    hasRealImage: true,
  },
);

assert.deepEqual(productImageSource({ image_names: [] }, null, "https://example.com"), {
  imageName: "",
  imageUrl: "",
  hasRealImage: false,
});

console.log("product-images tests passed");
