const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const appSource = readFileSync(join(__dirname, "..", "src", "app.js"), "utf8");

assert.equal(appSource.includes("<button>View all</button>"), false, "View all buttons must navigate or trigger an action.");
assert.equal(appSource.includes('<button class="button mini">Approve</button>'), false, "Approve buttons must use real approval actions.");
assert.equal(appSource.includes('<button class="button mini secondary">Reject</button>'), false, "Reject buttons must use real rejection actions.");
assert.equal(appSource.includes('<button class="button secondary">View Template</button>'), false, "Email template buttons must open a real preview.");
assert.equal(appSource.includes("Saved only in this browser"), false, "Product saves must not fall back to browser-only data.");
assert.equal(appSource.includes("Product draft is visible locally"), false, "Product saves must fail loudly instead of creating local-only products.");
assert.equal(appSource.includes('<p class="detail-price">${money(product.base_price)}</p>'), false, "Public product detail must not show prices.");
assert.equal(appSource.includes("<strong>${money(product.base_price)}</strong>"), false, "Public product cards must not show prices.");
assert.equal(appSource.includes("Price: Low to High"), false, "Public catalogue must not offer price sorting.");
assert.equal(appSource.includes("Price Range"), false, "Public catalogue must not expose price filtering.");
assert.equal(appSource.includes("Public browsing shows product information and pricing"), false, "Public catalogue copy must not promise public pricing.");
assert.equal(appSource.includes('${inputField("Product Type", "product_type", "shoe")}'), true, "Admin product form must let the admin choose product type.");
assert.equal(appSource.includes("product_type: data.get(\"product_type\")"), true, "Product saves must use the admin-entered product type.");
assert.equal(appSource.includes("const LOGIN_BYPASS_ENABLED = true"), false, "Login bypass must not be globally enabled for deployed builds.");
assert.equal(appSource.includes('["localhost", "127.0.0.1", ""]'), true, "Login bypass must be limited to local development hosts.");
assert.equal(appSource.includes("loadCatalog();\ninitAuth();"), false, "Startup must not race public catalog loading against protected auth loading.");
assert.equal(appSource.includes("await loadCatalog();\n  await initAuth();"), true, "Startup must load public catalog before protected auth data.");
assert.equal(appSource.includes("const hasStoredSession = Boolean(SupabaseClient.readStoredSession()?.access_token);"), true, "Local dev admin bypass must detect whether a real Supabase session exists.");
assert.equal(appSource.includes("if (LOGIN_BYPASS_ENABLED && !hasStoredSession)"), true, "Local dev admin bypass must skip protected remote fetches without a real session.");
assert.equal(appSource.includes("<h2>Live Inventory</h2>"), false, "Reseller portal must not present ordering as a live inventory table.");
assert.equal(appSource.includes("<th>Exact Stock</th>"), false, "Reseller portal must not expose exact-stock table headings.");
assert.equal(appSource.includes("Add live inventory lines"), false, "Reseller draft copy must describe products, not inventory lines.");
assert.equal(appSource.includes("reseller-product-card"), true, "Reseller portal must render ecommerce-style product cards.");
assert.equal(appSource.includes('<div><button disabled>Prev</button><button class="active">1</button><button>2</button><button>3</button><button>Next</button></div>'), false, "Catalog pager must not be static fake controls.");
assert.equal(appSource.includes("data-action=\"catalog-page\""), true, "Catalog pager buttons must have real page actions.");

console.log("app-wiring tests passed");
