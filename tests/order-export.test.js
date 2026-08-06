const assert = require("node:assert/strict");
const {
  MASTER_HEADERS,
  buildSupplierOrderRows,
  buildSupplierWorkbookData,
  buildSupplierCsv,
  downloadBlob,
  downloadSupplierCsv,
  downloadSupplierXlsx,
  ALL_ORDER_HEADERS,
  buildAllOrderRows,
  buildAllOrdersCsv,
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

const csv = buildSupplierCsv({ order, items, inventory, variants, products });
assert.equal(csv.startsWith("\uFEFF"), true);
assert.equal(csv.includes("202300500138"), true);
assert.equal(csv.includes("\r\n"), true);

const allRows = buildAllOrderRows({
  orders: [order, { id: "empty-order", reseller_id: "reseller-1", status: "rejected", created_at: "2026-06-25T10:00:00Z" }],
  items,
  profiles: [{ id: "reseller-1", company_name: "TOV Reseller", email: "buyer@example.com" }],
});
assert.equal(allRows.length, 3);
assert.equal(allRows[0]["Order Code"], "#RE-0FC318");
assert.equal(allRows[0]["Line Total"], 180);
assert.equal(allRows[2].Status, "rejected");
assert.equal(allRows[2].Quantity, 0);
const allCsv = buildAllOrdersCsv({ orders: [order], items, profiles: [] });
assert.equal(allCsv.startsWith(`\uFEFF${ALL_ORDER_HEADERS.join(",")}`), true);
assert.equal(allCsv.includes("202300500139"), true);

const clickedDownloads = [];
const revokedUrls = [];
let createdUrlCount = 0;
global.Blob = class Blob {
  constructor(parts, options) {
    this.parts = parts;
    this.type = options?.type || "";
  }
};
global.URL = {
  createObjectURL(blob) {
    createdUrlCount += 1;
    return `blob:test-${createdUrlCount}-${blob.type}`;
  },
  revokeObjectURL(url) {
    revokedUrls.push(url);
  },
};
global.document = {
  body: {
    appendChild(node) {
      node.appended = true;
    },
    removeChild(node) {
      node.removed = true;
    },
  },
  createElement(tagName) {
    assert.equal(tagName, "a");
    return {
      style: {},
      click() {
        clickedDownloads.push({ href: this.href, download: this.download, appended: this.appended });
      },
    };
  },
};

const originalSetTimeout = global.setTimeout;
global.setTimeout = (callback) => {
  callback();
  return 1;
};

downloadSupplierCsv({ order, items, inventory, variants, products });
downloadSupplierCsv({ order, items, inventory, variants, products });
assert.equal(clickedDownloads.length, 2);
assert.equal(clickedDownloads[0].appended, true);
assert.equal(clickedDownloads[0].download, "supplier-order-CC496C4D.csv");
assert.equal(clickedDownloads[1].download, "supplier-order-CC496C4D.csv");
assert.equal(new Set(clickedDownloads.map((entry) => entry.href)).size, 2);
assert.deepEqual(revokedUrls, clickedDownloads.map((entry) => entry.href));

const xlsxWrites = [];
const fakeXlsx = {
  utils: {
    book_new: () => ({ sheets: [] }),
    aoa_to_sheet: (rows) => ({ rows }),
    book_append_sheet: (workbook, sheet, name) => workbook.sheets.push({ sheet, name }),
  },
  write: (workbook, options) => {
    xlsxWrites.push({ workbook, options });
    return new Uint8Array([1, 2, 3]);
  },
};
downloadSupplierXlsx({ order, items, inventory, variants, products, companyName: "TOV Reseller", XLSX: fakeXlsx });
downloadSupplierXlsx({ order, items, inventory, variants, products, companyName: "TOV Reseller", XLSX: fakeXlsx });
assert.equal(xlsxWrites.length, 2);
assert.equal(clickedDownloads.at(-1).download, "supplier-order-CC496C4D.xlsx");

assert.throws(() => downloadBlob({ blob: null, fileName: "bad.csv" }), /Download data is not available/);
global.setTimeout = originalSetTimeout;

console.log("order-export tests passed");
