const assert = require("node:assert/strict");
const {
  buildInventoryRows,
  availableInventoryRows,
  visibleShopProductGroups,
  updateDraftQuantity,
  draftItems,
  draftSummary,
  buildDraftSummaryLabel,
  buildOrderPayload,
} = require("../src/reseller-orders.js");

const products = [
  {
    id: "product-1",
    sku: "IRUNSVAN-001",
    name: "IRUNSVAN 001 Running Shoe",
    category: "Running Shoes",
    base_price: "30.00",
    image_names: ["001-1.jpg"],
  },
];

const variants = [
  {
    id: "variant-1",
    product_id: "product-1",
    sku: "202300100138",
    colour: "Bright Orange / Ocean Blue",
    size: "38",
    base_price: "30.00",
    base_currency: "USD",
    image_name: "001-1.jpg",
  },
  {
    id: "variant-2",
    product_id: "product-1",
    sku: "202300100139",
    colour: "Bright Orange / Ocean Blue",
    size: "39",
    base_price: "30.00",
    base_currency: "USD",
    image_name: "001-2.jpg",
  },
];

const inventory = [
  {
    id: "inventory-1",
    variant_id: "variant-1",
    sku: "202300100138",
    stock_quantity: 117,
  },
  {
    id: "inventory-2",
    variant_id: "variant-2",
    sku: "202300100139",
    stock_quantity: 3,
  },
];

const rows = buildInventoryRows({ products, variants, inventory });

assert.equal(rows.length, 2);
assert.deepEqual(rows[0], {
  inventoryId: "inventory-1",
  variantId: "variant-1",
  productId: "product-1",
  productSku: "IRUNSVAN-001",
  productName: "IRUNSVAN 001 Running Shoe",
  category: "Running Shoes",
  sku: "202300100138",
  colour: "Bright Orange / Ocean Blue",
  size: "38",
  price: 30,
  priceKnown: true,
  currency: "USD",
  stockQuantity: 117,
  imageName: "001-1.jpg",
});

assert.deepEqual(
  availableInventoryRows([
    ...rows,
    { ...rows[0], variantId: "variant-3", sku: "202300100140", stockQuantity: 0 },
  ]).map((row) => row.variantId),
  ["variant-1", "variant-2"],
);

assert.deepEqual(
  visibleShopProductGroups([
    ...rows,
    { ...rows[0], variantId: "variant-3", sku: "202300100140", size: "40", stockQuantity: 8 },
    { ...rows[0], variantId: "variant-4", productId: "product-2", productName: "IRUNSVAN 002", productSku: "IRUNSVAN-002", sku: "202300200138", stockQuantity: 5 },
  ], { productLimit: 1, optionLimit: 2 }),
  [
    {
      productId: "product-1",
      productName: "IRUNSVAN 001 Running Shoe",
      productSku: "IRUNSVAN-001",
      category: "Running Shoes",
      imageName: "001-1.jpg",
      price: 30,
      priceKnown: true,
      currency: "USD",
      totalStock: 128,
      optionCount: 3,
      hiddenOptionCount: 1,
      rows: [rows[0], rows[1]],
    },
  ],
);

let draft = {};
draft = updateDraftQuantity(draft, rows[0], 4);
draft = updateDraftQuantity(draft, rows[1], 9);
assert.deepEqual(draft, {
  "variant-1": 4,
  "variant-2": 3,
});

draft = updateDraftQuantity(draft, rows[0], 0);
assert.deepEqual(draft, {
  "variant-2": 3,
});

const items = draftItems(rows, draft);
assert.equal(items.length, 1);
assert.deepEqual(items[0], {
  inventoryId: "inventory-2",
  variantId: "variant-2",
  productId: "product-1",
  productSku: "IRUNSVAN-001",
  productName: "IRUNSVAN 001 Running Shoe",
  category: "Running Shoes",
  sku: "202300100139",
  colour: "Bright Orange / Ocean Blue",
  size: "39",
  price: 30,
  priceKnown: true,
  currency: "USD",
  stockQuantity: 3,
  imageName: "001-2.jpg",
  requestedQuantity: 3,
  lineTotal: 90,
});

assert.deepEqual(draftSummary(items), {
  itemCount: 1,
  totalUnits: 3,
  subtotal: 90,
});

assert.deepEqual(buildDraftSummaryLabel(draftSummary(items)), {
  itemCount: 1,
  totalUnits: 3,
  subtotal: 90,
  itemLabel: "1 item",
  unitLabel: "3 pairs",
});

assert.throws(
  () =>
    buildOrderPayload({
      auth: { user: null, isReseller: false, isAdmin: false },
      items,
      notes: "Need urgent dispatch",
    }),
  /authenticated reseller/i,
);

assert.throws(
  () =>
    buildOrderPayload({
      auth: { user: { id: "user-1" }, isReseller: true, isAdmin: false },
      items: [{ ...items[0], requestedQuantity: 0 }],
    }),
  /positive quantity/i,
);

assert.throws(
  () =>
    buildOrderPayload({
      auth: { user: { id: "user-1" }, isReseller: true, isAdmin: false },
      items: [{ ...items[0], requestedQuantity: 4, stockQuantity: 3 }],
    }),
  /available stock/i,
);

assert.throws(
  () =>
    buildOrderPayload({
      auth: { user: { id: "user-1" }, isReseller: true, isAdmin: false },
      items: [{ ...items[0], price: null, priceKnown: false }],
    }),
  /approved product price/i,
);

assert.deepEqual(
  buildOrderPayload({
    auth: { user: { id: "user-1" }, isReseller: true, isAdmin: false },
    items,
    notes: "Need urgent dispatch",
  }),
  {
    orderRequest: {
      reseller_id: "user-1",
      status: "submitted",
      notes: "Need urgent dispatch",
    },
    orderItems: [
      {
        variant_id: "variant-2",
        sku: "202300100139",
        product_name: "IRUNSVAN 001 Running Shoe",
        colour: "Bright Orange / Ocean Blue",
        size: "39",
        quantity: 3,
        base_price: 30,
        base_currency: "USD",
      },
    ],
  },
);

console.log("reseller-orders tests passed");
