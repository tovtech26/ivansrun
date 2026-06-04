const SUPABASE_URL = "https://llicocwonbokahpbireg.supabase.co";
const SUPABASE_KEY = "sb_publishable_6V8LkQ_EwGCeYqtdqxcpqg_RcaqSINj";

const ROUTES = [
  "store",
  "product",
  "apply",
  "login",
  "reseller",
  "history",
  "admin",
  "approvals",
  "imports",
  "email",
  "about",
  "contact",
  "terms",
  "privacy",
];

const state = {
  route: "store",
  selectedProductId: null,
  products: [],
  variants: [],
  loading: true,
  error: null,
  applicationSubmitted: false,
  orderSubmitted: false,
  loginSubmitted: false,
};

const fallbackProducts = [
  {
    id: "fallback-001",
    sku: "IRUNSVAN-001",
    name: "IRUNSVAN 001 Running Shoe",
    category: "Running Shoes",
    base_price: "30.00",
    image_names: ["001-1.jpg"],
  },
  {
    id: "fallback-005",
    sku: "IRUNSVAN-005",
    name: "IRUNSVAN 005 Running Shoe",
    category: "Running Shoes",
    base_price: "36.00",
    image_names: ["005-1.jpg"],
  },
  {
    id: "fallback-025",
    sku: "IRUNSVAN-025",
    name: "IRUNSVAN 025 Running Shoe",
    category: "Running Shoes",
    base_price: "38.00",
    image_names: ["025-1.jpg"],
  },
  {
    id: "fallback-026",
    sku: "IRUNSVAN-026",
    name: "IRUNSVAN 026 Running Shoe",
    category: "Running Shoes",
    base_price: "36.00",
    image_names: ["026-1.jpg"],
  },
];

const sampleStock = [
  ["IRUNSVAN 001 Running Shoe", "202300100138", "Bright Orange / Ocean Blue", "38", 30, 117, 4],
  ["IRUNSVAN 001 Running Shoe", "202300100139", "Bright Orange / Ocean Blue", "39", 30, 46, 0],
  ["IRUNSVAN 001 Running Shoe", "202300100143", "Bright Orange / Ocean Blue", "43", 30, 96, 0],
  ["IRUNSVAN 005 Running Shoe", "202300500642", "Elegant Black", "42", 36, 3, 2],
  ["IRUNSVAN 025 Running Shoe", "202302502540", "Cloud White", "40", 38, 156, 10],
];

const historyRows = [
  ["#RE-9821", "Draft", "2 SKUs", "14 units", "$492.00"],
  ["#RE-9818", "Submitted", "5 SKUs", "30 units", "$1,080.00"],
  ["#RE-9815", "Approved", "12 SKUs", "96 units", "$3,456.00"],
  ["#RE-9809", "Rejected", "1 SKU", "5 units", "$180.00"],
];

const resellerApplications = [
  ["China Sports Wholesale", "China", "Li Wei", "Pending"],
  ["Botswana Runner Supply", "Botswana", "M. Dube", "Pending"],
  ["South Africa Active Trade", "South Africa", "A. Naidoo", "Approved"],
];

const orderRequests = [
  ["#RE-9821", "Botswana Runner Supply", "2 SKUs / 14 units", "Draft"],
  ["#RE-9818", "China Sports Wholesale", "5 SKUs / 30 units", "Submitted"],
  ["#RE-9815", "South Africa Active Trade", "12 SKUs / 96 units", "Approved"],
];

function money(value) {
  if (value === null || value === undefined || value === "") return "Price TBC";
  const amount = Number(value);
  return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : "Price TBC";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function skuRank(sku = "") {
  const match = String(sku).match(/(\d+)/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function catalogProducts() {
  const products = state.products.length ? state.products : fallbackProducts;
  return [...products].sort((a, b) => {
    const pricedA = a.base_price === null || a.base_price === undefined || a.base_price === "" ? 1 : 0;
    const pricedB = b.base_price === null || b.base_price === undefined || b.base_price === "" ? 1 : 0;
    return pricedA - pricedB || skuRank(a.sku) - skuRank(b.sku) || String(a.name).localeCompare(String(b.name));
  });
}

function variantsFor(productId) {
  return state.variants.filter((variant) => variant.product_id === productId);
}

function selectedProduct() {
  const products = catalogProducts();
  return products.find((product) => product.id === state.selectedProductId) || products[0] || fallbackProducts[0];
}

function logo(tone = "dark") {
  const src =
    tone === "light"
      ? "public/brand/Irunsvan_White-removebg-preview.svg"
      : tone === "blue"
        ? "public/brand/Irunsvan_Blue-removebg-preview.svg"
        : "public/brand/Irunsvan_Black-removebg-preview.svg";
  return `<img class="brand-logo" src="${src}" alt="IRUNSVAN" />`;
}

function productVisual(label, imageName = "") {
  const safeLabel = escapeHtml(label || "IRUNSVAN Shoe");
  const safeImageName = escapeHtml(imageName);
  const shortLabel = escapeHtml(String(label || "IRUNSVAN").replace("IRUNSVAN ", "").replace(" Running Shoe", ""));
  return `
    <div class="product-visual" aria-label="${safeLabel} product image">
      <div class="shoe-shadow"></div>
      <div class="shoe-shape"><span>${shortLabel}</span></div>
      ${safeImageName ? `<em>${safeImageName}</em>` : ""}
    </div>
  `;
}

async function fetchSupabase(table, query) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  if (!response.ok) throw new Error(`${table} fetch failed: ${response.status}`);
  return response.json();
}

async function loadCatalog() {
  try {
    const [products, variants] = await Promise.all([
      fetchSupabase(
        "products",
        "select=id,sku,name,slug,category,base_price,base_currency,image_names&published=eq.true&order=sku.asc&limit=75",
      ),
      fetchSupabase(
        "product_variants",
        "select=id,product_id,sku,name,colour,size,base_price,image_name&published=eq.true&order=sku.asc&limit=500",
      ),
    ]);
    state.products = products;
    state.variants = variants;
  } catch (error) {
    state.error = error instanceof Error ? error.message : "Unable to load catalog";
  } finally {
    state.loading = false;
    render();
  }
}

function setRoute(route, params = {}) {
  if (!ROUTES.includes(route)) return;
  state.route = route;
  if (params.productId) state.selectedProductId = params.productId;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function topNav() {
  const active = (routes) => (routes.includes(state.route) ? "active" : "");
  return `
    <header class="top-nav">
      <button class="logo-link bare-button" data-route="store" aria-label="IRUNSVAN home">${logo()}</button>
      <nav class="main-nav" aria-label="Primary navigation">
        <button class="${active(["store", "product"])}" data-route="store">Catalog</button>
        <button class="${active(["apply"])}" data-route="apply">Become a Reseller</button>
        <button class="${active(["reseller", "history"])}" data-route="reseller">Reseller Portal</button>
        <button class="${active(["admin", "approvals", "imports", "email"])}" data-route="admin">Admin</button>
      </nav>
      <div class="nav-actions">
        <button class="icon-button" data-route="login">Login</button>
      </div>
    </header>
  `;
}

function storefront() {
  const products = catalogProducts();
  const visibleProducts = products.slice(0, 8);
  const variantCounts = new Map();
  state.variants.forEach((variant) => {
    variantCounts.set(variant.product_id, (variantCounts.get(variant.product_id) || 0) + 1);
  });

  return `
    <main>
      <section class="reseller-strip">Resellers can log in to view live stock and submit order requests.</section>
      <section class="hero">
        <div class="hero-bg"></div>
        <div class="hero-content">
          <span class="eyebrow">IRUNSVAN</span>
          <h1>Engineered for the run.</h1>
          <p>High-performance running shoes for public browsing and reseller ordering. Public visitors see the catalog and prices; approved resellers get exact SKU stock.</p>
          <div class="hero-actions">
            <a href="#catalog" class="button primary">Shop Collection</a>
            <button class="button ghost" data-route="apply">Become a Reseller</button>
          </div>
        </div>
      </section>
      <section class="catalog-section" id="catalog">
        <aside class="filters">
          <h2>Filters</h2>
          <label class="search-field"><span>Search</span><input placeholder="Search models" /></label>
          ${filterGroup("Category", ["Running Shoes", "Road Racing", "Trail Performance"])}
          <div>
            <p class="filter-title">Size</p>
            <div class="size-grid">${["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45"].map((size) => `<button>${size}</button>`).join("")}</div>
          </div>
          <div>
            <p class="filter-title">Price Range</p>
            <input type="range" min="0" max="80" value="38" />
            <div class="range-labels"><span>$0</span><span>$80</span></div>
          </div>
        </aside>
        <div class="catalog-content">
          <div class="section-header">
            <div>
              <span class="eyebrow dark">Catalog</span>
              <h2>${state.loading ? "Loading products" : `${products.length} IRUNSVAN products`}</h2>
              <p class="section-note">Public view hides exact stock. Resellers see live quantities after approval.</p>
            </div>
            <select aria-label="Sort catalog"><option>SKU order</option><option>Price: Low to High</option><option>Name</option></select>
          </div>
          ${state.error ? `<p class="notice error">Catalog data could not load: ${escapeHtml(state.error)}</p>` : ""}
          <div class="product-grid">
            ${visibleProducts.map((product) => productCard(product, variantCounts.get(product.id))).join("")}
          </div>
          ${pager(`Showing 1-${Math.min(8, products.length)} of ${products.length} products`)}
        </div>
      </section>
      <section class="lab-section">
        <div class="lab-panel"><span>75</span><p>Imported product lines</p></div>
        <div>
          <span class="eyebrow dark">Wholesale workflow</span>
          <h2>Browse publicly. Order through approval.</h2>
          <p>Customers can inspect the product range without seeing warehouse quantities. Approved resellers get access to exact stock and order requests.</p>
        </div>
      </section>
      ${footer()}
    </main>
  `;
}

function productCard(product, variantCount) {
  const productName = escapeHtml(product.name || "IRUNSVAN Running Shoe");
  const category = escapeHtml(product.category || "Running Shoes");
  const imageName = Array.isArray(product.image_names) ? product.image_names[0] : "";
  const variantLabel = variantCount ? `${variantCount} variants` : "Variants available";
  return `
    <article class="product-card">
      ${productVisual(product.name, imageName)}
      <div class="product-card-body">
        <div>
          <h3>${productName}</h3>
          <p>${category}</p>
          <div class="swatches"><span class="swatch orange"></span><span class="swatch blue"></span><span class="swatch black"></span><span class="swatch white"></span></div>
        </div>
        <div class="price-stack">
          <strong>${money(product.base_price)}</strong>
          <small>${variantLabel}</small>
        </div>
      </div>
      <button class="card-action" data-route="product" data-product-id="${escapeHtml(product.id)}">View details</button>
    </article>
  `;
}

function productDetail() {
  const product = selectedProduct();
  const variants = variantsFor(product.id);
  const colours = [...new Set(variants.map((variant) => variant.colour).filter(Boolean))].slice(0, 6);
  const sizes = [...new Set(variants.map((variant) => variant.size).filter(Boolean))].slice(0, 12);
  const imageName = Array.isArray(product.image_names) ? product.image_names[0] : "";
  return `
    <main class="detail-page">
      <button class="text-link" data-route="store">Back to catalog</button>
      <section class="detail-grid">
        ${productVisual(product.name, imageName)}
        <div class="detail-copy">
          <span class="eyebrow dark">${escapeHtml(product.sku || "IRUNSVAN")}</span>
          <h1>${escapeHtml(product.name || "IRUNSVAN Running Shoe")}</h1>
          <p class="detail-price">${money(product.base_price)}</p>
          <p class="section-note">Public buyers can browse product information and pricing. Exact SKU stock is reserved for approved reseller accounts.</p>
          ${selectorGroup("Colours", colours.length ? colours : ["Bright Orange", "Ocean Blue", "Elegant Black", "Cloud White"])}
          ${selectorGroup("Sizes", sizes.length ? sizes : ["38", "39", "40", "41", "42", "43"])}
          <div class="detail-actions">
            <button class="button primary" data-route="apply">Apply for Reseller Access</button>
            <button class="button secondary" data-route="login">Reseller Login</button>
          </div>
          <div class="detail-note">Exact availability and order requests unlock after admin approval.</div>
        </div>
      </section>
      ${footer(true)}
    </main>
  `;
}

function selectorGroup(title, values) {
  return `
    <div class="selector-group">
      <p class="filter-title">${escapeHtml(title)}</p>
      <div>${values.map((value, index) => `<button class="${index === 0 ? "selected" : ""}">${escapeHtml(value)}</button>`).join("")}</div>
    </div>
  `;
}

function filterGroup(title, options) {
  return `
    <div>
      <p class="filter-title">${escapeHtml(title)}</p>
      <div class="filter-options">
        ${options
          .map(
            (option, index) => `
              <label>
                <input type="checkbox" ${index === 0 ? "checked" : ""} />
                <span>${escapeHtml(option)}</span>
              </label>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function resellerApplication() {
  return `
    <main class="form-page">
      <section class="form-hero">
        <span class="eyebrow dark">Reseller Access</span>
        <h1>Apply to view live stock and request bulk orders.</h1>
        <p>Submit your business details. Admin approval is required before exact inventory is visible.</p>
      </section>
      <section class="form-grid">
        <form class="workflow-form" data-form="application">
          ${inputField("Company Name", "company", "TOV Sports Distribution")}
          ${inputField("Contact Person", "contact", "Your name")}
          ${inputField("Email", "email", "buyer@example.com", "email")}
          ${inputField("Country", "country", "Botswana")}
          ${inputField("Business Type", "business", "Retailer / reseller / distributor")}
          <label><span>Notes</span><textarea name="notes" placeholder="Tell us what you want to buy and where you resell."></textarea></label>
          <button class="button primary full">Submit Application</button>
        </form>
        <aside class="process-panel">
          <h2>Approval flow</h2>
          ${processStep("1", "Apply", "Send business and contact details.")}
          ${processStep("2", "Admin Review", "Admin approves or rejects the account.")}
          ${processStep("3", "Reseller Access", "Approved accounts can see exact SKU stock.")}
          ${state.applicationSubmitted ? `<p class="notice success">Application received. The admin review step is next.</p>` : ""}
        </aside>
      </section>
      ${footer(true)}
    </main>
  `;
}

function loginPage() {
  return `
    <main class="form-page narrow">
      <section class="form-hero">
        <span class="eyebrow dark">Account Login</span>
        <h1>Sign in to continue.</h1>
        <p>Approved resellers use this entry for stock and order requests. Admin users continue to operations tools.</p>
      </section>
      <form class="workflow-form" data-form="login">
        ${inputField("Email", "email", "name@example.com", "email")}
        ${inputField("Password", "password", "Password", "password")}
        <button class="button primary full">Continue</button>
        <div class="split-actions">
          <button type="button" class="text-link" data-route="apply">Need reseller access?</button>
          <button type="button" class="text-link" data-route="admin">Admin area</button>
        </div>
        ${state.loginSubmitted ? `<p class="notice success">Sign-in received. Continue to the correct account area after verification.</p>` : ""}
      </form>
    </main>
  `;
}

function inputField(label, name, placeholder, type = "text") {
  return `<label><span>${escapeHtml(label)}</span><input name="${escapeHtml(name)}" type="${type}" placeholder="${escapeHtml(placeholder)}" /></label>`;
}

function processStep(number, title, copy) {
  return `<div class="process-step"><strong>${number}</strong><div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(copy)}</p></div></div>`;
}

function resellerPortal() {
  const orderItems = sampleStock.filter((row) => row[6] > 0);
  const totalUnits = orderItems.reduce((sum, row) => sum + row[6], 0);
  const subtotal = orderItems.reduce((sum, row) => sum + row[4] * row[6], 0);
  return `
    <main class="portal-page">
      <section class="portal-header">
        <div>
        <span class="eyebrow dark">Reseller portal</span>
          <h1>Reseller Dashboard</h1>
          <p>Browse exact variation stock and prepare order requests for admin review.</p>
        </div>
        <div class="portal-actions">
          <button class="button secondary" data-route="history">Request History</button>
          <div class="protected-pill">Approved reseller access</div>
        </div>
      </section>
      ${metricGrid([
        ["Total Products", String(state.products.length || 75), "Active lines"],
        ["Available SKUs", "3,735", "Imported variants"],
        ["Inventory Rows", "3,735", "Exact stock"],
        ["Current Request", money(subtotal), "USD"],
      ])}
      <section class="reseller-grid">
        <div class="inventory-panel">
          <div class="panel-toolbar">
            <h2>Live Inventory</h2>
            <div class="toolbar-actions">
              <label class="compact-search"><span>Search</span><input placeholder="Search SKU or product" /></label>
              <button class="button small secondary">Filter</button>
            </div>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Product</th><th>SKU</th><th>Colour</th><th>Size</th><th>Price</th><th>Exact Stock</th><th>Request Qty</th><th>Add</th></tr></thead>
              <tbody>
                ${sampleStock
                  .map(
                    ([product, sku, colour, size, price, stock, qty]) => `
                    <tr>
                      <td><div class="table-product">${productVisual(product)}<strong>${escapeHtml(product)}</strong></div></td>
                      <td class="mono">${escapeHtml(sku)}</td>
                      <td>${escapeHtml(colour)}</td>
                      <td>${escapeHtml(size)}</td>
                      <td class="price">${money(price)}</td>
                      <td><span class="${stock <= 5 ? "stock-badge low" : "stock-badge"}">${stock} units</span></td>
                      <td><input class="qty-input" type="number" min="0" value="${qty || ""}" /></td>
                      <td><button class="button mini">Add</button></td>
                    </tr>
                  `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
          ${pager(`Showing 1-5 of ${state.variants.length || 3735} SKUs`)}
        </div>
        <aside class="order-sidebar">
          <div class="sidebar-head"><h2>Order Request</h2><p>Request #RE-9821</p></div>
          <div class="order-items">
            ${orderItems
              .map(
                ([product, sku, colour, size, price, , qty]) => `
                <div class="order-item">
                  ${productVisual(product)}
                  <div>
                    <div class="order-title-row"><strong>${escapeHtml(product)}</strong><button aria-label="Remove ${escapeHtml(sku)}">Remove</button></div>
                    <p class="mono">SKU: ${escapeHtml(sku)}</p>
                    <p>${escapeHtml(colour)} / Size ${escapeHtml(size)}</p>
                    <div class="line-total"><span>${qty} x ${money(price)}</span><strong>${money(price * qty)}</strong></div>
                  </div>
                </div>
              `,
              )
              .join("")}
          </div>
          <form class="order-summary" data-form="order">
            ${summaryRow("Items", String(orderItems.length))}
            ${summaryRow("Total units", String(totalUnits))}
            ${summaryRow("Subtotal", money(subtotal))}
            ${summaryRow("Est. shipping", "TBD", false, true)}
            ${summaryRow("Total", money(subtotal), true)}
            <textarea placeholder="Notes for admin" aria-label="Notes for admin"></textarea>
            <button class="button primary full">Submit Order Request</button>
            ${state.orderSubmitted ? `<p class="notice success">Order request submitted. Admin review is now required before confirmation.</p>` : `<p class="notice">Order requests are reviewed before confirmation. Stock is not reserved until approved.</p>`}
          </form>
        </aside>
      </section>
      ${footer(true)}
    </main>
  `;
}

function requestHistory() {
  return `
    <main class="portal-page">
      <section class="portal-header">
        <div>
          <span class="eyebrow dark">Reseller requests</span>
          <h1>Request History</h1>
          <p>Track order requests from draft through admin approval.</p>
        </div>
        <button class="button secondary" data-route="reseller">Back to Inventory</button>
      </section>
      <section class="inventory-panel">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Request</th><th>Status</th><th>Items</th><th>Quantity</th><th>Total</th><th>Action</th></tr></thead>
            <tbody>${historyRows.map((row) => `<tr>${row.map((cell, index) => `<td>${index === 1 ? statusPill(cell) : escapeHtml(cell)}</td>`).join("")}<td><button class="button mini">View</button></td></tr>`).join("")}</tbody>
          </table>
        </div>
      </section>
      ${footer(true)}
    </main>
  `;
}

function adminDashboard() {
  const products = catalogProducts();
  return `
    <main class="admin-layout">
      ${adminSidebar("admin")}
      <section class="admin-main">
        <header class="admin-topbar">
          <div><h1>Operations Dashboard</h1><p>System overview and controls for catalog, stock, reseller access, and orders.</p></div>
          <button class="icon-button" data-route="email">Alerts</button>
        </header>
        ${metricGrid([
          ["Pending Apps", "2", "Awaiting review"],
          ["Submitted Requests", "1", "Order pipeline"],
          ["Total Products", String(products.length || 75), "Imported catalog"],
          ["Inventory Rows", "3,735", "Imported stock"],
        ])}
        <section class="admin-panels">
          ${adminTable("Reseller Applications", ["Company", "Country", "Status", "Actions"], resellerApplications.map(([company, country, , status]) => [company, country, status, "Review"]))}
          ${adminTable("Order Requests", ["Order #", "Items / Qty", "Status", "Action"], orderRequests.map(([id, , qty, status]) => [id, qty, status, "View"]))}
        </section>
        <section class="product-overview">
          <div class="panel-toolbar"><h2>Product / Inventory Overview</h2><span>${state.variants.length || 3735} SKUs</span></div>
          <div class="overview-list">
            ${products
              .slice(0, 6)
              .map((product) => `<div class="overview-row"><strong>${escapeHtml(product.sku)}</strong><span>${escapeHtml(product.name)}</span><span>${money(product.base_price)}</span></div>`)
              .join("")}
          </div>
        </section>
      </section>
    </main>
  `;
}

function adminApprovals() {
  return `
    <main class="admin-layout">
      ${adminSidebar("approvals")}
      <section class="admin-main">
        <header class="admin-topbar"><div><h1>Approvals</h1><p>Review reseller applications and order requests before access or stock confirmation.</p></div></header>
        <section class="admin-panels">
          ${approvalCard("Reseller Applications", ["Company", "Country", "Contact", "Status"], resellerApplications)}
          ${approvalCard("Order Requests", ["Request", "Reseller", "Items", "Status"], orderRequests)}
        </section>
      </section>
    </main>
  `;
}

function adminImports() {
  return `
    <main class="admin-layout">
      ${adminSidebar("imports")}
      <section class="admin-main">
        <header class="admin-topbar"><div><h1>Inventory Imports</h1><p>Upload catalog CSV and warehouse XLSX files, then validate changes before commit.</p></div></header>
        <section class="import-panel">
          <div class="upload-grid">
            ${uploadBox("Product Catalog CSV", "Updates products, variants, colors, sizes, prices, and image filenames.")}
            ${uploadBox("Inventory XLSX", "Updates exact SKU stock from the master inventory workbook.")}
          </div>
          <div class="import-status">Last import loaded 75 products, 3,735 variants, and 3,735 stock rows.</div>
        </section>
        <section class="timeline-panel">
          ${processStep("1", "Upload", "Admin selects CSV or XLSX file.")}
          ${processStep("2", "Validate", "System checks required columns, SKU matches, and skipped rows.")}
          ${processStep("3", "Commit", "Validated rows update catalog and inventory records.")}
        </section>
      </section>
    </main>
  `;
}

function emailCenter() {
  return `
    <main class="admin-layout">
      ${adminSidebar("email")}
      <section class="admin-main">
        <header class="admin-topbar"><div><h1>Email Center</h1><p>Manage operational emails for applications, order requests, approvals, and imports.</p></div></header>
        <section class="email-grid">
          ${emailCard("New order request", "Admin receives order summary, reseller details, item count, and total.")}
          ${emailCard("Application submitted", "Admin receives company, contact, country, and business notes.")}
          ${emailCard("Approval notice", "Reseller receives account approval and login instructions.")}
          ${emailCard("Import warning", "Admin receives skipped SKU report after a catalog or stock import.")}
        </section>
      </section>
    </main>
  `;
}

function adminSidebar(activeRoute) {
  return `
    <aside class="admin-sidebar">
      ${logo("light")}<span class="admin-chip">Admin</span>
      <nav>
        ${adminLink("Dashboard", "admin", activeRoute)}
        ${adminLink("Approvals", "approvals", activeRoute)}
        ${adminLink("Order Requests", "approvals", activeRoute)}
        ${adminLink("Products", "admin", activeRoute)}
        ${adminLink("Inventory Imports", "imports", activeRoute)}
        ${adminLink("Email Center", "email", activeRoute)}
      </nav>
    </aside>
  `;
}

function adminLink(label, route, activeRoute) {
  return `<button class="${route === activeRoute ? "active" : ""}" data-route="${route}">${escapeHtml(label)}</button>`;
}

function approvalCard(title, headers, rows) {
  return `
    <div class="admin-card">
      <div class="admin-card-head"><h2>${escapeHtml(title)}</h2><button>View all</button></div>
      <div class="table-wrap">
        <table>
          <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}<th>Action</th></tr></thead>
          <tbody>${rows
            .map((row) => `<tr>${row.map((cell, index) => `<td>${index === row.length - 1 ? statusPill(cell) : escapeHtml(cell)}</td>`).join("")}<td><div class="row-actions"><button class="button mini">Approve</button><button class="button mini secondary">Reject</button></div></td></tr>`)
            .join("")}</tbody>
        </table>
      </div>
    </div>
  `;
}

function adminTable(title, headers, rows) {
  return `
    <div class="admin-card">
      <div class="admin-card-head"><h2>${escapeHtml(title)}</h2><button data-route="approvals">View all</button></div>
      <div class="table-wrap">
        <table>
          <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
          <tbody>${rows
            .map((row) => `<tr>${row.map((cell, index) => `<td>${index === 2 ? statusPill(cell) : escapeHtml(cell)}</td>`).join("")}</tr>`)
            .join("")}</tbody>
        </table>
      </div>
    </div>
  `;
}

function statusPill(status) {
  return `<span class="status ${escapeHtml(status).toLowerCase()}">${escapeHtml(status)}</span>`;
}

function uploadBox(title, copy) {
  return `<button class="upload-box"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(copy)}</span></button>`;
}

function emailCard(title, copy) {
  return `<article class="email-card"><span>Email</span><h2>${escapeHtml(title)}</h2><p>${escapeHtml(copy)}</p><button class="button secondary">View Template</button></article>`;
}

function infoPage(route) {
  const pages = {
    about: ["About IRUNSVAN", "High-performance footwear built around a reseller-ready operating model.", "IRUNSVAN combines public product discovery with private wholesale inventory workflows for approved business buyers."],
    contact: ["Contact", "Reach the IRUNSVAN team for product, reseller, and order questions.", "Use the reseller application for wholesale access. General support requests are handled by the IRUNSVAN operations team."],
    terms: ["Terms", "Clear operating terms for browsing, reseller requests, approval, and order confirmation.", "Order requests are not final purchases until reviewed and confirmed by admin."],
    privacy: ["Privacy", "Customer, reseller, and admin data is handled through protected account and inventory workflows.", "Public visitors can browse products without an account. Exact stock and order workflows require approved access."],
  };
  const [title, subtitle, copy] = pages[route] || pages.about;
  return `
    <main class="info-page">
      <section>
        <span class="eyebrow dark">IRUNSVAN</span>
        <h1>${escapeHtml(title)}</h1>
        <p class="lead-copy">${escapeHtml(subtitle)}</p>
        <p>${escapeHtml(copy)}</p>
      </section>
      ${footer(true)}
    </main>
  `;
}

function metricGrid(items) {
  return `
    <section class="metric-grid">
      ${items
        .map(
          ([label, value, sub]) => `<article class="metric-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(sub)}</small></article>`,
        )
        .join("")}
    </section>
  `;
}

function summaryRow(label, value, strong = false, muted = false) {
  return `<div class="${strong ? "summary-row strong" : "summary-row"}"><span>${escapeHtml(label)}</span><strong class="${muted ? "muted" : ""}">${escapeHtml(value)}</strong></div>`;
}

function pager(label) {
  return `
    <div class="pager">
      <span>${escapeHtml(label)}</span>
      <div><button disabled>Prev</button><button class="active">1</button><button>2</button><button>3</button><button>Next</button></div>
    </div>
  `;
}

function footer(compact = false) {
  return `
    <footer class="${compact ? "footer compact" : "footer"}">
      <div>${logo("light")}<p>High-performance athletic footwear with reseller-ready inventory workflows.</p></div>
      <div><strong>Resources</strong><button data-route="store">Catalog</button><button data-route="apply">Reseller Terms</button><button data-route="contact">Support</button></div>
      <div><strong>Operations</strong><button data-route="history">Order Requests</button><button data-route="imports">Inventory Imports</button><button data-route="privacy">Privacy Policy</button></div>
      <p class="copyright">Copyright 2026 IRUNSVAN High-Performance Footwear.</p>
    </footer>
  `;
}

function routeView() {
  const views = {
    store: storefront,
    product: productDetail,
    apply: resellerApplication,
    login: loginPage,
    reseller: resellerPortal,
    history: requestHistory,
    admin: adminDashboard,
    approvals: adminApprovals,
    imports: adminImports,
    email: emailCenter,
    about: () => infoPage("about"),
    contact: () => infoPage("contact"),
    terms: () => infoPage("terms"),
    privacy: () => infoPage("privacy"),
  };
  return (views[state.route] || storefront)();
}

function bindEvents() {
  document.querySelectorAll("[data-route]").forEach((button) => {
    button.addEventListener("click", () => setRoute(button.getAttribute("data-route"), { productId: button.getAttribute("data-product-id") }));
  });

  document.querySelectorAll("[data-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const formName = form.getAttribute("data-form");
      if (formName === "application") state.applicationSubmitted = true;
      if (formName === "order") state.orderSubmitted = true;
      if (formName === "login") state.loginSubmitted = true;
      render();
    });
  });
}

function render() {
  document.getElementById("app").innerHTML = topNav() + routeView();
  bindEvents();
}

render();
loadCatalog();
