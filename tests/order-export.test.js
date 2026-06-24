const assert = require("node:assert/strict");
const {
  MASTER_HEADERS,
  buildSupplierOrderRows,
  buildSupplierWorkbookData,
} = require("../src/order-export.js");

const order = {
  id: "0fc31815-87c0-466f-8e74-6465cc496c4d",
  status: "paid",
  created_at: "2026-06-24T10:00:00Z",
  notes: "Supplier batch",
};

const items = [
  {
    order_request_id: order.id,
    variant_id: "variant-1",
    sku: "202300500138",
    product_name: "IRUNSVAN 005 Running Shoe",
    colour: "Signature Colour",
    size: "38",
    quantity: 5,
    base_price: 36,
  },
  {
    order_request_id: order.id,
    variant_id: "variant-2",
    sku: "202300500139",
    product_name: "IRUNSVAN 005 Running Shoe",
    colour: "Signature Colour",
    size: "39",
    quantity: 6,
    base_price: 36,
  },
];

const inventory = [
  { id: "inv-1", variant_id: "variant-1", sku: "202300500138", style_code: "23005", stock_quantity: 50 },
  { id: "inv-2", variant_id: "variant-2", sku: "202300500139", style_code: "23005", stock_quantity: 40 },
];

const variants = [
  { id: "variant-1", product_id: "product-1", style_code: "23005" },
  { id: "variant-2", product_id: "product-1", style_code: "23005" },
];

const products = [{ id: "product-1", model_code: "005", sku: "IRUNSVAN-005" }];

assert.deepEqual(MASTER_HEADERS, ["款式编码", "商品编码", "颜色及规格", "库存"]);

assert.deepEqual(buildSupplierOrderRows({ items, inventory, variants, products }), [
  {
    款式编码: "23005",
    商品编码: "202300500138",
    颜色及规格: "Signature Colour; Size 38",
    库存: 5,
  },
  {
    款式编码: "23005",
    商品编码: "202300500139",
    颜色及规格: "Signature Colour; Size 39",
    库存: 6,
  },
]);

const workbookData = buildSupplierWorkbookData({
  order,
  items,
  inventory,
  variants,
  products,
  companyName: "TOV Reseller",
});

assert.equal(workbookData.fileName, "supplier-order-CC496C4D.xlsx");
assert.equal(workbookData.summaryRows[0][0], "Irunsvan Africa Supplier Order");
assert.equal(workbookData.summaryRows[1][1], "#RE-0FC318");
assert.equal(workbookData.masterRows[0][0], "款式编码");
assert.equal(workbookData.masterRows[1][0], "23005");
assert.equal(workbookData.masterRows[1][1], "202300500138");
assert.equal(workbookData.masterRows[1][3], 5);
assert.equal(workbookData.masterRows[2][1], "202300500139");

console.log("order-export tests passed");
