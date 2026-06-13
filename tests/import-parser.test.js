const assert = require("node:assert/strict");
const {
  parseCsvText,
  parseCatalogRows,
  parseInventoryRows,
  parseMasterInventoryRows,
} = require("../src/import-parser.js");

const catalogCsv = [
  'Type,SKU,Name,Categories,Regular price,Attribute 1 name,Attribute 1 value(s),Attribute 2 name,Attribute 2 value(s),Images,Parent SKU',
  'variation,202300100138,IRUNSVAN 001 Running Shoe,Running Shoes,30,Color,Bright Orange / Ocean Blue,Size,38,"001-1.jpg,001-2.jpg",IRUNSVAN-001',
  'variation,202300100139,IRUNSVAN 001 Running Shoe,Running Shoes,30,Color,Bright Orange / Ocean Blue,Size,39,"001-1.jpg,001-2.jpg",IRUNSVAN-001',
  'variation,,Broken Row,Running Shoes,30,Color,Black,Size,42,"broken.jpg",IRUNSVAN-099',
].join("\n");

const parsedCatalog = parseCatalogRows(parseCsvText(catalogCsv));

assert.equal(parsedCatalog.products.length, 1);
assert.deepEqual(parsedCatalog.products[0], {
  sku: "IRUNSVAN-001",
  name: "IRUNSVAN 001 Running Shoe",
  slug: "irunsvan-001-running-shoe-irunsvan-001",
  category: "Running Shoes",
  base_price: 30,
  base_currency: "USD",
  image_names: ["001-1.jpg", "001-2.jpg"],
  published: true,
});

assert.equal(parsedCatalog.variants.length, 2);
assert.deepEqual(parsedCatalog.variants[0], {
  product_sku: "IRUNSVAN-001",
  sku: "202300100138",
  name: "IRUNSVAN 001 Running Shoe",
  colour: "Bright Orange / Ocean Blue",
  size: "38",
  base_price: 30,
  base_currency: "USD",
  image_name: "001-1.jpg",
  published: true,
});

assert.equal(parsedCatalog.errors.length, 1);
assert.equal(parsedCatalog.errors[0].code, "missing_sku");

const inventoryRows = parseInventoryRows([
  { SKU: "202300100138", "Style Code": "IRUNSVAN-001", Stock: "117" },
  { sku: "202300100139", style_code: "IRUNSVAN-001", stock_quantity: "3" },
  { SKU: "", Stock: "-5" },
]);

assert.deepEqual(inventoryRows.rows, [
  { sku: "202300100138", style_code: "IRUNSVAN-001", stock_quantity: 117, source: "import" },
  { sku: "202300100139", style_code: "IRUNSVAN-001", stock_quantity: 3, source: "import" },
]);
assert.equal(inventoryRows.errors.length, 2);
assert.equal(inventoryRows.errors[0].code, "missing_sku");
assert.equal(inventoryRows.errors[1].code, "invalid_stock_quantity");

const masterRows = [
  { "款式编码": "23001002", "商品编码": "2023001002138", "颜色及规格": "珍珠白;38", "库存": "40" },
  { "款式编码": "23001", "商品编码": "202300100138", "颜色及规格": "亮桔色/海蓝;38", "库存": "117" },
  { "款式编码": "", "商品编码": "", "颜色及规格": "坏数据", "库存": "-1" },
];

const parsedMaster = parseMasterInventoryRows(masterRows);

assert.deepEqual(parsedMaster.rows, [
  {
    source_style_code: "23001002",
    source_sku: "2023001002138",
    model_code: "001",
    color_code: "002",
    original_colour: "珍珠白",
    size: "38",
    stock_quantity: 40,
    source: "master_inventory",
  },
  {
    source_style_code: "23001",
    source_sku: "202300100138",
    model_code: "001",
    color_code: "",
    original_colour: "亮桔色/海蓝",
    size: "38",
    stock_quantity: 117,
    source: "master_inventory",
  },
]);
assert.equal(parsedMaster.errors.length, 4);
assert.equal(parsedMaster.errors[0].code, "missing_style_code");
assert.equal(parsedMaster.errors[1].code, "missing_sku");
assert.equal(parsedMaster.errors[2].code, "missing_size");
assert.equal(parsedMaster.errors[3].code, "invalid_stock_quantity");

const realChineseMasterCsv = [
  "款式编码,商品编码,颜色及规格,库存",
  "2503,202425030137,绿野仙踪/青橙;37,25",
].join("\n");
const parsedChineseCsvMaster = parseMasterInventoryRows(parseCsvText(realChineseMasterCsv));
assert.deepEqual(parsedChineseCsvMaster.rows, [
  {
    source_style_code: "2503",
    source_sku: "202425030137",
    model_code: "2503",
    color_code: "",
    original_colour: "绿野仙踪/青橙",
    size: "37",
    stock_quantity: 25,
    source: "master_inventory",
  },
]);
assert.equal(parsedChineseCsvMaster.errors.length, 0);

const actualChineseMasterRows = [
  { 款式编码: "2503", 商品编码: "202425030137", 颜色及规格: "绿野仙踪/青橙;37", 库存: "25" },
  { 款式编码: "23028", 商品编码: "202302800138", 颜色及规格: "亮桔色/海蓝;38", 库存: "117" },
  { 款式编码: "23001002", 商品编码: "2023001002138", 颜色及规格: "珍珠白;38", 库存: "40" },
];

const parsedActualChineseMaster = parseMasterInventoryRows(actualChineseMasterRows);
assert.deepEqual(
  parsedActualChineseMaster.rows.map((row) => ({
    source_style_code: row.source_style_code,
    source_sku: row.source_sku,
    model_code: row.model_code,
    color_code: row.color_code,
    original_colour: row.original_colour,
    size: row.size,
    stock_quantity: row.stock_quantity,
  })),
  [
    {
      source_style_code: "2503",
      source_sku: "202425030137",
      model_code: "2503",
      color_code: "",
      original_colour: "绿野仙踪/青橙",
      size: "37",
      stock_quantity: 25,
    },
    {
      source_style_code: "23028",
      source_sku: "202302800138",
      model_code: "028",
      color_code: "",
      original_colour: "亮桔色/海蓝",
      size: "38",
      stock_quantity: 117,
    },
    {
      source_style_code: "23001002",
      source_sku: "2023001002138",
      model_code: "001",
      color_code: "002",
      original_colour: "珍珠白",
      size: "38",
      stock_quantity: 40,
    },
  ]
);
assert.equal(parsedActualChineseMaster.errors.length, 0);

console.log("import-parser tests passed");
