const assert = require("node:assert/strict");
const { buildCatalogSeed } = require("../src/catalog-seed-builder.js");

const seed = buildCatalogSeed({
  inventoryRows: [
    { source_style_code: "23028", source_sku: "202302800138", model_code: "028", color_code: "", original_colour: "亮桔色/海蓝", size: "38", stock_quantity: 117 },
    { source_style_code: "23028", source_sku: "202302800139", model_code: "028", color_code: "", original_colour: "亮桔色/海蓝", size: "39", stock_quantity: 46 },
    { source_style_code: "2503", source_sku: "202425030137", model_code: "2503", color_code: "", original_colour: "绿野仙踪/青橙", size: "37", stock_quantity: 25 },
    { source_style_code: "23086", source_sku: "202308600137", model_code: "086", color_code: "", original_colour: "未选择产品", size: "37", stock_quantity: 10 },
  ],
  selectedModelCodes: ["028", "2503"],
  imageLibrary: {
    "028": ["028-1.jpg", "028-2.jpg"],
    "2503": ["2503-1.jpg", "2503-2.jpg"],
  },
  priceByModel: new Map([["028", 38], ["2503", 58]]),
});

assert.equal(seed.products.length, 2);
assert.equal(seed.variants.length, 3);
assert.equal(seed.inventorySeedRows.length, 3);
assert.equal(seed.skippedRows.length, 1);
assert.deepEqual(seed.variants.map((variant) => variant.sku), ["202302800138", "202302800139", "202425030137"]);
assert.equal(seed.inventorySeedRows[0].stock_quantity, 0);
assert.deepEqual(seed.summary.missingSelectedModels, []);

const explicitImageMap = buildCatalogSeed({
  inventoryRows: [
    { source_style_code: "23001002", source_sku: "2023001002138", model_code: "001", color_code: "002", original_colour: "珍珠白", size: "38", stock_quantity: 40 },
  ],
  selectedModelCodes: ["001"],
  imageLibrary: { "001": ["001-1.jpg", "001-2.jpg"] },
});

assert.equal(explicitImageMap.colourMappings[0].image_name, "001-2.jpg");
assert.equal(explicitImageMap.variants[0].image_name, "001-2.jpg");

const fallbackImageMap = buildCatalogSeed({
  inventoryRows: [
    { source_style_code: "2503", source_sku: "202425030137", model_code: "2503", color_code: "", original_colour: "绿野仙踪/青橙", size: "37", stock_quantity: 25 },
    { source_style_code: "2503", source_sku: "202425030237", model_code: "2503", color_code: "", original_colour: "花红/蓝白", size: "37", stock_quantity: 20 },
  ],
  selectedModelCodes: ["2503"],
  imageLibrary: { "2503": ["2503-1.jpg", "2503-2.jpg"] },
});

assert.equal(fallbackImageMap.colourMappings[0].image_name, "2503-1.jpg");
assert.equal(fallbackImageMap.colourMappings[1].image_name, "2503-2.jpg");
assert.equal(fallbackImageMap.variants[0].image_name, "2503-1.jpg");
assert.equal(fallbackImageMap.variants[1].image_name, "2503-2.jpg");

console.log("catalog-seed-builder tests passed");
