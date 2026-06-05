const assert = require("node:assert/strict");
const {
  parseMarketingProductFolder,
  scanMarketingEntries,
} = require("../src/media-pack-scanner.js");

assert.deepEqual(parseMarketingProductFolder("125款-飞染GT3.0-英文数据包"), {
  code: "125",
  name: "飞染GT3.0",
  displayName: "IRUNSVAN 125 飞染GT3.0",
  type: "shoe",
  needsReview: false,
});

assert.deepEqual(parseMarketingProductFolder("运动袜数据包"), {
  code: "SOCKS",
  name: "运动袜",
  displayName: "IRUNSVAN 运动袜",
  type: "sock",
  needsReview: false,
});

const scan = scanMarketingEntries([
  { fullName: "Marketing/125款-飞染GT3.0-英文数据包/飞染GT3.0.jpg", length: 17740640 },
  { fullName: "Marketing/125款-飞染GT3.0-英文数据包/sku/125-1.jpg", length: 588619 },
  { fullName: "Marketing/125款-飞染GT3.0-英文数据包/sku/125-2.jpg", length: 661546 },
  { fullName: "Marketing/125款-飞染GT3.0-英文数据包/白底/125-1.png", length: 1085120 },
  { fullName: "Marketing/125款-飞染GT3.0-英文数据包/1200x1600/1.jpg", length: 900740 },
  { fullName: "Marketing/125款-飞染GT3.0-英文数据包/视频/demo.mp4", length: 2500 },
  { fullName: "Marketing/运动袜数据包/sku/月光白.jpg", length: 140515 },
  { fullName: "Marketing/运动袜数据包/详请切片/运动袜_01.jpg", length: 358848 },
  { fullName: "Marketing/Irunsvan logo China.jpg", length: 127748 },
  { fullName: "Marketing/Videos/Selection/066/066-V5.mp4", length: 6517812 },
]);

assert.equal(scan.products.length, 2);
assert.equal(scan.summary.productsDetected, 2);
assert.equal(scan.summary.readyToCreate, 2);
assert.equal(scan.summary.needsReview, 0);
assert.equal(scan.summary.videosFound, 1);
assert.equal(scan.summary.skuImageSetsFound, 2);
assert.equal(scan.unassigned.length, 2);

const shoe = scan.products.find((product) => product.code === "125");
assert.equal(shoe.displayName, "IRUNSVAN 125 飞染GT3.0");
assert.equal(shoe.productType, "shoe");
assert.equal(shoe.media.skuImages.length, 2);
assert.equal(shoe.media.whiteBackgroundImages.length, 1);
assert.equal(shoe.media.galleryImages.length, 2);
assert.equal(shoe.media.videos.length, 1);
assert.equal(shoe.recommendedMainImage, "Marketing/125款-飞染GT3.0-英文数据包/白底/125-1.png");
assert.deepEqual(shoe.warnings, []);

const socks = scan.products.find((product) => product.code === "SOCKS");
assert.equal(socks.productType, "sock");
assert.equal(socks.media.skuImages.length, 1);
assert.equal(socks.warnings.length, 0);

const reviewScan = scanMarketingEntries([
  { fullName: "Marketing/Unknown Folder/random.jpg", length: 100 },
  { fullName: "Marketing/999款-新品-英文/详情切片/999_01.jpg", length: 100 },
]);

assert.equal(reviewScan.products.length, 1);
assert.equal(reviewScan.summary.needsReview, 1);
assert.equal(reviewScan.products[0].warnings.includes("missing_sku_images"), true);
assert.equal(reviewScan.products[0].warnings.includes("missing_primary_image"), true);
assert.equal(reviewScan.unassigned.length, 1);

console.log("media-pack-scanner tests passed");
