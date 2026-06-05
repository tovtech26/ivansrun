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
  "products",
  "site",
  "approvals",
  "imports",
  "email",
  "about",
  "contact",
  "terms",
  "privacy",
];

const SiteControls = window.IvansrunSiteControls;
const Auth = window.IvansrunAuth;
const SupabaseClient = window.IvansrunSupabaseClient;
const Orders = window.IvansrunResellerOrders;
const AdminOrders = window.IvansrunAdminOrders;
const Applications = window.IvansrunResellerApplications;
const SitePublish = window.IvansrunSitePublish;
const ImportParser = window.IvansrunImportParser;
const AdminImports = window.IvansrunAdminImports;
const ProductEditor = window.IvansrunProductEditor;
const ProductCatalogManager = window.IvansrunProductCatalogManager;
const ProductImages = window.IvansrunProductImages;
const StorefrontCatalog = window.IvansrunStorefrontCatalog;
const EmailNotifications = window.IvansrunEmailNotifications;
const ProductDetailModel = window.IvansrunProductDetail;
const SITE_CONTENT_STORAGE_KEY = "ivansrun_site_content";
const LOGIN_BYPASS_ENABLED = true;

function readStoredSiteContent() {
  try {
    return JSON.parse(localStorage.getItem(SITE_CONTENT_STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

const state = {
  route: "store",
  selectedProductId: null,
  products: [],
  variants: [],
  inventory: [],
  orderRequests: [],
  orderRequestItems: [],
  resellerApplicationsData: [],
  importJobs: [],
  loading: true,
  authLoading: true,
  inventoryLoading: false,
  historyLoading: false,
  applicationsLoading: false,
  error: null,
  authError: null,
  inventoryError: null,
  historyError: null,
  applicationError: null,
  routeNotice: null,
  applicationSubmitted: false,
  orderSubmitted: false,
  loginSubmitted: false,
  loginPending: false,
  orderSubmitPending: false,
  applicationSubmitPending: false,
  siteSavePending: false,
  importPending: false,
  siteSaved: false,
  siteSaveError: null,
  productFormOpen: false,
  productFormError: null,
  productFormSaved: false,
  productImageDrafts: [],
  importError: null,
  importPreview: null,
  resellerSearch: "",
  resellerNotes: "",
  resellerDraft: {},
  catalogSearch: "",
  catalogCategories: ["Running Shoes"],
  catalogSizes: [],
  catalogMaxPrice: 80,
  catalogSort: "sku",
  siteContent: SiteControls.sanitizeSiteContent(readStoredSiteContent()),
  auth: Auth.buildDevAdminAuthState ? Auth.buildDevAdminAuthState() : Auth.normalizeAuthState({ role: "admin", user: { id: "local-admin", email: "admin@ivansrun.africa" } }),
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

function storefrontProducts() {
  const variantsByProductId = state.variants.reduce((map, variant) => {
    const list = map.get(variant.product_id) || [];
    list.push(variant);
    map.set(variant.product_id, list);
    return map;
  }, new Map());

  return StorefrontCatalog.filterAndSortCatalog(catalogProducts(), variantsByProductId, {
    search: state.catalogSearch,
    categories: state.catalogCategories,
    sizes: state.catalogSizes,
    maxPrice: state.catalogMaxPrice,
    sort: state.catalogSort,
  });
}

function variantsFor(productId) {
  return state.variants.filter((variant) => variant.product_id === productId);
}

function selectedProduct() {
  const products = catalogProducts();
  return products.find((product) => product.id === state.selectedProductId) || products[0] || fallbackProducts[0];
}

function cssUrl(value) {
  const safe = encodeURI(String(value || SiteControls.DEFAULT_SITE_CONTENT.hero.backgroundImage).replaceAll("\\", "/"))
    .replaceAll('"', "%22")
    .replaceAll("'", "%27")
    .replaceAll("(", "%28")
    .replaceAll(")", "%29");
  return `--hero-image: url(${safe})`;
}

function ctaMarkup(label, route, classes) {
  const safeLabel = escapeHtml(label);
  const safeRoute = String(route || "").trim();
  if (safeRoute === "catalog") {
    return `<a href="#catalog" class="${classes}">${safeLabel} <span class="button-mark" aria-hidden="true">&nearr;</span></a>`;
  }
  const appRoute = ROUTES.includes(safeRoute) ? safeRoute : "apply";
  return `<button class="${classes}" data-route="${escapeHtml(appRoute)}">${safeLabel} <span class="button-mark" aria-hidden="true">&rarr;</span></button>`;
}

function logo(tone = "dark") {
  const src =
    tone === "light"
      ? "public/brand/Irunsvan_White-removebg-preview.svg"
      : tone === "blue"
        ? "public/brand/Irunsvan_Blue-removebg-preview.svg"
        : "public/brand/Irunsvan_Blue-removebg-preview.svg";
  return `<img class="brand-logo" src="${src}" alt="Ivansrun Africa" />`;
}

function productVisual(label, imageName = "") {
  const safeLabel = escapeHtml(label || "IRUNSVAN Shoe");
  const safeImageName = escapeHtml(imageName);
  const shortLabel = escapeHtml(String(label || "IRUNSVAN").replace("IRUNSVAN ", "").replace(" Running Shoe", ""));
  const imageUrl = ProductImages.resolveProductImageUrl(imageName, SUPABASE_URL);
  const visualBody = imageUrl
    ? `<img class="product-photo" src="${escapeHtml(imageUrl)}" alt="${safeLabel}" loading="lazy" />`
    : `<img class="product-visual-logo" src="public/brand/Irunsvan_Blue-removebg-preview.svg" alt="" aria-hidden="true" /><div class="shoe-shadow"></div><div class="shoe-shape"><span>${shortLabel}</span></div>`;
  return `
    <div class="product-visual" aria-label="${safeLabel} product image">
      ${visualBody}
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

async function fetchAuthedSupabase(table, query) {
  const session = SupabaseClient.readStoredSession();
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: SupabaseClient.headers(SUPABASE_KEY, session?.access_token),
  });
  if (!response.ok) throw new Error(`${table} fetch failed: ${response.status}`);
  return response.json();
}

async function insertAuthedSupabase(table, payload) {
  const session = SupabaseClient.readStoredSession();
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      ...SupabaseClient.headers(SUPABASE_KEY, session?.access_token),
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message || body?.hint || `${table} insert failed: ${response.status}`);
  }
  return response.json();
}

async function upsertAuthedSupabase(table, payload, conflictColumn) {
  const session = SupabaseClient.readStoredSession();
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=${encodeURIComponent(conflictColumn)}`, {
    method: "POST",
    headers: {
      ...SupabaseClient.headers(SUPABASE_KEY, session?.access_token),
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message || body?.hint || `${table} upsert failed: ${response.status}`);
  }
  return response.json();
}

async function invokeAuthedFunction(functionName, payload) {
  const session = SupabaseClient.readStoredSession();
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: "POST",
    headers: {
      ...SupabaseClient.headers(SUPABASE_KEY, session?.access_token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(body || `${functionName} invoke failed: ${response.status}`);
  }
  return response.json().catch(() => ({}));
}

function htmlFromIncludes(title, values) {
  return `
    <h1>${escapeHtml(title)}</h1>
    <ul>
      ${values.map((value) => `<li>${escapeHtml(value)}</li>`).join("")}
    </ul>
  `;
}

async function patchAuthedSupabase(table, filters, payload) {
  const session = SupabaseClient.readStoredSession();
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filters}`, {
    method: "PATCH",
    headers: {
      ...SupabaseClient.headers(SUPABASE_KEY, session?.access_token),
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message || body?.hint || `${table} update failed: ${response.status}`);
  }
  return response.json();
}

async function publishActiveSiteContent(siteContent) {
  const payloads = SitePublish.buildSitePublishPayloads(siteContent, state.auth.user?.id || null);
  await patchAuthedSupabase("hero_sections", "active=eq.true", { active: false });
  await patchAuthedSupabase("site_themes", "active=eq.true", { active: false });
  await patchAuthedSupabase("site_content", "active=eq.true", { active: false });
  await insertAuthedSupabase("hero_sections", payloads.heroRow);
  await insertAuthedSupabase("site_themes", payloads.themeRow);
  await insertAuthedSupabase("site_content", payloads.contentRow);
}

async function buildImportPreviewFromFile(type, file) {
  if (!file) throw new Error("Choose a file before importing.");

  if (type === "catalog_csv") {
    const text = await file.text();
    const rows = ImportParser.parseCsvText(text);
    const parsed = ImportParser.parseCatalogRows(rows);
    return AdminImports.buildImportPreview({
      type,
      filename: file.name,
      rowsTotal: rows.length,
      processedRows: parsed.variants.length,
      errors: parsed.errors,
      products: parsed.products,
      variants: parsed.variants,
    });
  }

  if (type === "inventory_xlsx") {
    let rows = [];
    if (/\.csv$/i.test(file.name)) {
      rows = ImportParser.parseCsvText(await file.text());
    } else {
      if (!window.XLSX) throw new Error("Spreadsheet parser not loaded.");
      const workbook = window.XLSX.read(await file.arrayBuffer(), { type: "array" });
      const firstSheet = workbook.SheetNames[0];
      rows = window.XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: "" });
    }
    const parsedMaster = ImportParser.parseMasterInventoryRows(rows);
    if (parsedMaster.rows.length) {
      const stockReview = ProductCatalogManager.matchInventoryToVariants({
        inventoryRows: parsedMaster.rows,
        products: state.products,
        variants: state.variants,
        inventory: state.inventory,
      });
      return AdminImports.buildImportPreview({
        type,
        filename: file.name,
        rowsTotal: rows.length,
        processedRows: stockReview.matches.length,
        errors: parsedMaster.errors,
        inventoryRows: parsedMaster.rows,
        stockMatches: stockReview.matches,
        stockExceptions: stockReview.exceptions,
        stockSummary: ProductCatalogManager.buildStockReviewSummary(stockReview),
      });
    }

    const parsed = ImportParser.parseInventoryRows(rows);
    return AdminImports.buildImportPreview({
      type,
      filename: file.name,
      rowsTotal: rows.length,
      processedRows: parsed.rows.length,
      errors: parsed.errors,
      inventoryRows: parsed.rows,
    });
  }

  if (type === "media_pack_zip") {
    if (!window.JSZip) throw new Error("Zip parser not loaded.");
    const zip = await window.JSZip.loadAsync(await file.arrayBuffer());
    const entries = Object.values(zip.files).map((entry) => ({
      fullName: entry.name,
      length: entry.dir ? 0 : 1,
    }));
    const scan = MediaPackScanner.scanMarketingEntries(entries);
    return AdminImports.buildImportPreview({
      type,
      filename: file.name,
      rowsTotal: entries.length,
      processedRows: scan.products.length,
      errors: scan.products
        .filter((product) => product.warnings.length)
        .map((product) => ({
          row: product.code,
          code: product.warnings.join(", "),
          sku: product.displayName,
        })),
      mediaProducts: scan.products,
      mediaSummary: scan.summary,
      unassignedMedia: scan.unassigned,
    });
  }

  throw new Error("Unsupported import type");
}

async function sendOrderNotification(details) {
  const payload = EmailNotifications.buildOrderEmailPayload(details);
  const html = htmlFromIncludes(payload.subject, payload.htmlIncludes);
  return invokeAuthedFunction("send-order-email", {
    ...payload,
    eventType: details.eventType,
    html,
  });
}

async function sendApplicationNotification(details) {
  const payload = EmailNotifications.buildApplicationEmailPayload(details);
  const html = htmlFromIncludes(payload.subject, payload.htmlIncludes);
  return invokeAuthedFunction("send-application-email", {
    ...payload,
    eventType: details.eventType,
    html,
  });
}

async function fetchOptionalSupabase(table, query) {
  try {
    return await fetchSupabase(table, query);
  } catch {
    return [];
  }
}

function remoteSiteContent(heroRows, themeRows, contentRows) {
  const hero = heroRows[0] || {};
  const theme = themeRows[0] || {};
  const content = contentRows[0] || {};
  return SiteControls.sanitizeSiteContent({
    hero: {
      eyebrow: hero.eyebrow,
      title: hero.title,
      copy: hero.copy,
      backgroundImage: hero.background_image,
      primaryCta: hero.primary_cta,
      primaryRoute: hero.primary_route,
      secondaryCta: hero.secondary_cta,
      secondaryRoute: hero.secondary_route,
      electricity: hero.electricity,
    },
    theme: {
      name: theme.name,
      primary: theme.primary_color,
      primaryDark: theme.primary_dark_color,
      background: theme.background_color,
      surface: theme.surface_color,
      accent: theme.accent_color,
      text: theme.text_color,
      deep: theme.deep_color,
    },
    banner: content.reseller_banner,
  });
}

function inventoryRows() {
  return Orders.buildInventoryRows({
    products: state.products.length ? state.products : fallbackProducts,
    variants: state.variants,
    inventory: state.inventory,
  });
}

function filteredInventoryRows() {
  const search = String(state.resellerSearch || "").trim().toLowerCase();
  const rows = inventoryRows();
  if (!search) return rows;
  return rows.filter((row) =>
    [row.productName, row.productSku, row.sku, row.colour, row.size].some((value) => String(value || "").toLowerCase().includes(search)),
  );
}

function currentDraftItems() {
  return Orders.draftItems(inventoryRows(), state.resellerDraft);
}

function currentDraftSummary() {
  return Orders.draftSummary(currentDraftItems());
}

function formatRequestCode(id) {
  return `#RE-${String(id || "").replaceAll("-", "").slice(0, 6).toUpperCase()}`;
}

function latestOwnApplication() {
  if (!state.auth.user?.id) return null;
  return state.resellerApplicationsData.find((application) => application.user_id === state.auth.user.id) || null;
}

function applicationSummary() {
  return Applications.summarizeApplications(state.resellerApplicationsData);
}

function requestHistoryRecords() {
  return AdminOrders.buildAdminOrderRecords(state.orderRequests, state.orderRequestItems).map((record) => ({
    ...record,
    code: formatRequestCode(record.id),
  }));
}

async function loadCatalog() {
  try {
    const [products, variants, heroRows, themeRows, contentRows] = await Promise.all([
      fetchSupabase(
        "products",
        "select=id,sku,name,slug,category,base_price,base_currency,image_names&published=eq.true&order=sku.asc&limit=75",
      ),
      fetchSupabase(
        "product_variants",
        "select=id,product_id,sku,name,colour,size,base_price,image_name&published=eq.true&order=sku.asc&limit=500",
      ),
      fetchOptionalSupabase(
        "hero_sections",
        "select=eyebrow,title,copy,background_image,primary_cta,primary_route,secondary_cta,secondary_route,electricity&active=eq.true&order=updated_at.desc&limit=1",
      ),
      fetchOptionalSupabase(
        "site_themes",
        "select=name,primary_color,primary_dark_color,background_color,surface_color,accent_color,text_color,deep_color&active=eq.true&order=updated_at.desc&limit=1",
      ),
      fetchOptionalSupabase("site_content", "select=reseller_banner&active=eq.true&order=updated_at.desc&limit=1"),
    ]);
    state.products = products;
    state.variants = variants;
    if (heroRows.length || themeRows.length || contentRows.length) {
      state.siteContent = remoteSiteContent(heroRows, themeRows, contentRows);
    }
  } catch (error) {
    state.error = error instanceof Error ? error.message : "Unable to load catalog";
  } finally {
    state.loading = false;
    render();
  }
}

async function loadProtectedData() {
  if (!state.auth.isAuthenticated) {
    state.inventory = [];
    state.orderRequests = [];
    state.orderRequestItems = [];
    state.resellerApplicationsData = [];
    state.resellerDraft = {};
    state.inventoryError = null;
    state.historyError = null;
    state.applicationError = null;
    state.inventoryLoading = false;
    state.historyLoading = false;
    state.applicationsLoading = false;
    render();
    return;
  }

  state.inventoryLoading = state.auth.isReseller || state.auth.isAdmin;
  state.historyLoading = state.auth.isReseller || state.auth.isAdmin;
  state.applicationsLoading = true;
  state.inventoryError = null;
  state.historyError = null;
  state.applicationError = null;
  render();

  try {
    const tasks = [
      fetchAuthedSupabase(
        "reseller_applications",
        "select=id,user_id,email,full_name,company_name,phone,country,message,status,reviewed_by,reviewed_at,created_at&order=created_at.desc&limit=200",
      ),
    ];

    if (state.auth.isReseller || state.auth.isAdmin) {
      tasks.push(fetchAuthedSupabase("inventory", "select=id,variant_id,sku,stock_quantity,updated_at&order=sku.asc&limit=5000"));
      tasks.push(fetchAuthedSupabase("order_requests", "select=id,reseller_id,status,notes,admin_notes,created_at,updated_at&order=created_at.desc&limit=100"));
      tasks.push(
        fetchAuthedSupabase(
          "order_request_items",
          "select=id,order_request_id,variant_id,sku,product_name,colour,size,quantity,base_price,base_currency,created_at&order=created_at.desc&limit=1000",
        ),
      );
    }

    if (state.auth.isAdmin) {
      tasks.push(
        fetchAuthedSupabase(
          "import_jobs",
          "select=id,import_type,filename,status,rows_total,rows_processed,error_message,created_at,completed_at&order=created_at.desc&limit=25",
        ),
      );
    }

    const [applications, inventory = [], orderRequests = [], orderRequestItems = [], importJobs = []] = await Promise.all(tasks);
    state.resellerApplicationsData = applications;
    state.inventory = inventory;
    state.orderRequests = orderRequests;
    state.orderRequestItems = orderRequestItems;
    state.importJobs = importJobs;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load reseller data";
    state.inventoryError = message;
    state.historyError = message;
    state.applicationError = message;
  } finally {
    state.inventoryLoading = false;
    state.historyLoading = false;
    state.applicationsLoading = false;
    render();
  }
}

function setRoute(route, params = {}) {
  if (!ROUTES.includes(route)) return;
  const nextRoute = routeForAccess(route);
  state.route = nextRoute;
  if (params.productId) state.selectedProductId = params.productId;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setRouteNotice(type, message) {
  state.routeNotice = message ? { type, message } : null;
}

function routeForAccess(route) {
  if (Auth.canAccessRoute(route, state.auth)) {
    setRouteNotice(null, "");
    return route;
  }

  const destination = Auth.fallbackRouteForRole(state.auth.role);
  if (route !== destination) {
    setRouteNotice("error", "You need the correct account access to open that area.");
  }
  return destination;
}

function authDisplayName() {
  return state.auth.profile?.company_name || state.auth.profile?.full_name || state.auth.user?.email || "Account";
}

function buildLocalAdminAuthState() {
  if (typeof Auth.buildDevAdminAuthState === "function") return Auth.buildDevAdminAuthState();
  return Auth.normalizeAuthState({
    user: { id: "local-admin", email: "admin@ivansrun.africa" },
    profile: {
      id: "local-admin",
      email: "admin@ivansrun.africa",
      full_name: "Local Admin",
      company_name: "Ivansrun Africa",
      role: "admin",
      approved: true,
    },
  });
}

function topNav() {
  const active = (routes) => (routes.includes(state.route) ? "active" : "");
  return `
    <header class="top-nav">
      <button class="logo-link bare-button" data-route="store" aria-label="Ivansrun Africa home">${logo("blue")}</button>
      <nav class="main-nav" aria-label="Primary navigation">
        <button class="${active(["store", "product"])}" data-route="store">Catalog</button>
        <button class="${active(["apply"])}" data-route="apply">Become a Reseller</button>
        <button class="${active(["reseller", "history"])}" data-route="reseller">Reseller Portal</button>
        <button class="${active(["admin", "products", "site", "approvals", "imports", "email"])}" data-route="admin">Admin</button>
      </nav>
      <div class="nav-actions"></div>
    </header>
  `;
}

function storefront() {
  const products = storefrontProducts();
  const visibleProducts = products.slice(0, 8);
  const site = state.siteContent;
  const hero = site.hero;
  const buttonCharge = hero.electricity ? " charge-button" : "";
  const variantCounts = new Map();
  state.variants.forEach((variant) => {
    variantCounts.set(variant.product_id, (variantCounts.get(variant.product_id) || 0) + 1);
  });

  return `
    <main>
      <section class="reseller-strip">${escapeHtml(site.banner)}</section>
      <section class="hero" style="${cssUrl(hero.backgroundImage)}">
        <div class="hero-bg"></div>
        <div class="hero-blue-wash"></div>
        <div class="hero-grid">
          <div class="hero-content">
            <span class="eyebrow">${escapeHtml(hero.eyebrow)}</span>
            <h1>${escapeHtml(hero.title)}</h1>
            <p>${escapeHtml(hero.copy)}</p>
            <div class="hero-actions">
              ${ctaMarkup(hero.primaryCta, hero.primaryRoute, `button primary${buttonCharge}`)}
              ${ctaMarkup(hero.secondaryCta, hero.secondaryRoute, `button ghost${buttonCharge} subdued`)}
            </div>
            <div class="hero-meta" aria-label="Ivansrun Africa catalog summary">
              <span>75 product lines</span>
              <span>3,735 SKUs</span>
              <span>Wholesale access after approval</span>
            </div>
          </div>
        </div>
      </section>
      <section class="catalog-section" id="catalog">
        <aside class="filters">
          <h2>Filters</h2>
          <label class="search-field"><span>Search</span><input name="catalog-search" value="${escapeHtml(state.catalogSearch)}" placeholder="Search models" /></label>
          ${filterGroup("Category", ["Running Shoes", "Road Racing", "Trail Performance"], state.catalogCategories, "catalog-category")}
          <div>
            <p class="filter-title">Size</p>
            <div class="size-grid">${["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45"].map((size) => `<button class="${state.catalogSizes.includes(size) ? "selected" : ""}" data-action="catalog-size" data-size="${size}">${size}</button>`).join("")}</div>
          </div>
          <div>
            <p class="filter-title">Price Range</p>
            <input name="catalog-price" type="range" min="0" max="80" value="${state.catalogMaxPrice}" />
            <div class="range-labels"><span>$0</span><span>$${state.catalogMaxPrice}</span></div>
          </div>
        </aside>
        <div class="catalog-content">
          <div class="section-header">
            <div>
              <span class="eyebrow dark">Catalog</span>
              <h2>${state.loading ? "Loading products" : `${products.length} Ivansrun Africa products`}</h2>
              <p class="section-note">Public browsing shows product information and pricing. Approved resellers see live warehouse quantities.</p>
            </div>
            <select name="catalog-sort" aria-label="Sort catalog">
              <option value="sku" ${state.catalogSort === "sku" ? "selected" : ""}>SKU order</option>
              <option value="price-low" ${state.catalogSort === "price-low" ? "selected" : ""}>Price: Low to High</option>
              <option value="name" ${state.catalogSort === "name" ? "selected" : ""}>Name</option>
            </select>
          </div>
          ${state.error ? `<p class="notice error">Catalog data could not load: ${escapeHtml(state.error)}</p>` : ""}
          <div class="product-grid">
            ${visibleProducts.map((product) => productCard(product, variantCounts.get(product.id))).join("")}
          </div>
          ${pager(`Showing ${products.length ? `1-${Math.min(8, products.length)}` : "0"} of ${products.length} products`)}
        </div>
      </section>
      <section class="lab-section">
        <div class="lab-panel"><span>75</span><p>Imported product lines</p></div>
        <div>
          <span class="eyebrow dark">Africa wholesale workflow</span>
          <h2>Browse publicly. Order through approval.</h2>
          <p>Customers can inspect the Ivansrun Africa product range without seeing warehouse quantities. Approved resellers get access to exact stock and order requests.</p>
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
  const detail = ProductDetailModel.buildProductDetailModel({
    product,
    variants,
    catalogProducts: catalogProducts(),
    supabaseUrl: SUPABASE_URL,
  });
  const imageName = detail.gallery[0]?.imageName || (Array.isArray(product.image_names) ? product.image_names[0] : "");
  return `
    <main class="detail-page">
      <button class="text-link" data-route="store">Back to catalog</button>
      <section class="detail-grid">
        <div>
          ${productVisual(product.name, imageName)}
          ${
            detail.gallery.length
              ? `<div class="detail-gallery-strip">${detail.gallery
                  .map(
                    (image) => `
                      <button class="gallery-thumb">
                        <img src="${escapeHtml(image.imageUrl)}" alt="${escapeHtml(product.name)}" loading="lazy" />
                      </button>`,
                  )
                  .join("")}</div>`
              : ""
          }
        </div>
        <div class="detail-copy">
          <span class="eyebrow dark">${escapeHtml(product.sku || "Ivansrun Africa")}</span>
          <h1>${escapeHtml(product.name || "IRUNSVAN Running Shoe")}</h1>
          <img class="detail-brand-mark" src="public/brand/Irunsvan_Blue-removebg-preview.svg" alt="Ivansrun Africa" />
          <p class="detail-price">${money(product.base_price)}</p>
          <p class="section-note">Public buyers can browse product information and pricing. Exact stock is reserved for approved Ivansrun Africa reseller accounts.</p>
          ${selectorGroup("Colours", detail.colours.length ? detail.colours : ["Bright Orange", "Ocean Blue", "Elegant Black", "Cloud White"])}
          ${selectorGroup("Sizes", detail.sizes.length ? detail.sizes : ["38", "39", "40", "41", "42", "43"])}
          <div class="detail-actions">
            <button class="button primary" data-route="apply">Apply for Reseller Access</button>
            <button class="button secondary" data-route="reseller">Reseller Portal</button>
          </div>
          <div class="detail-note">Exact availability and order requests unlock after admin approval.</div>
        </div>
      </section>
      ${
        detail.relatedProducts.length
          ? `
            <section class="related-products">
              <div class="section-header">
                <div>
                  <span class="eyebrow dark">Related Products</span>
                  <h2>More from this range</h2>
                </div>
              </div>
              <div class="product-grid">
                ${detail.relatedProducts.map((related) => productCard(related, variantsFor(related.id).length)).join("")}
              </div>
            </section>
          `
          : ""
      }
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

function filterGroup(title, options, selectedValues = [], actionPrefix = "") {
  return `
    <div>
      <p class="filter-title">${escapeHtml(title)}</p>
      <div class="filter-options">
        ${options
          .map(
            (option, index) => `
              <label>
                <input type="checkbox" ${selectedValues.includes(option) ? "checked" : ""} data-action="${escapeHtml(actionPrefix)}" data-value="${escapeHtml(option)}" />
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
  const existingApplication = latestOwnApplication();
  const needsPassword = !state.auth.isAuthenticated;
  const statusNotice = existingApplication
    ? `<p class="notice ${existingApplication.status === "approved" ? "success" : existingApplication.status === "rejected" ? "error" : ""}">Current application status: ${escapeHtml(existingApplication.status)}.</p>`
    : "";
  return `
    <main class="form-page">
      <section class="form-hero">
        <span class="eyebrow dark">Ivansrun Africa reseller access</span>
        <h1>Apply to view live stock and request bulk orders.</h1>
        <p>Submit your business details for Africa wholesale access. Approval is required before exact inventory is visible.</p>
      </section>
      <section class="form-grid">
        <form class="workflow-form" data-form="application">
          ${statusNotice}
          ${state.applicationError ? `<p class="notice error">${escapeHtml(state.applicationError)}</p>` : ""}
          ${inputField("Company Name", "company_name", existingApplication?.company_name || state.auth.profile?.company_name || "TOV Sports Distribution")}
          ${inputField("Full Name", "full_name", existingApplication?.full_name || state.auth.profile?.full_name || "Your name")}
          ${inputField("Email", "email", existingApplication?.email || state.auth.user?.email || "buyer@example.com", "email")}
          ${needsPassword ? inputField("Password", "password", "Create a password", "password") : ""}
          ${inputField("Phone", "phone", existingApplication?.phone || "+26770000000")}
          ${inputField("Country", "country", existingApplication?.country || "Botswana")}
          <label><span>Notes</span><textarea name="message" placeholder="Tell us what you want to buy and where you resell.">${escapeHtml(existingApplication?.message || "")}</textarea></label>
          <button class="button primary full" ${state.applicationSubmitPending ? "disabled" : ""}>${state.applicationSubmitPending ? "Submitting..." : "Submit Application"}</button>
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
  const notice = state.routeNotice
    ? `<p class="notice ${escapeHtml(state.routeNotice.type)}">${escapeHtml(state.routeNotice.message)}</p>`
    : "";
  const authError = state.authError ? `<p class="notice error">${escapeHtml(state.authError)}</p>` : "";
  const helper =
    state.auth.isPending && state.auth.isAuthenticated
      ? `<p class="notice">Your reseller application is still pending approval. You can update your application details below.</p>`
      : "";
  return `
    <main class="form-page narrow">
      <section class="form-hero">
        <span class="eyebrow dark">Account Login</span>
        <h1>Sign in to continue.</h1>
        <p>Approved resellers use this entry for stock and order requests. Admin users continue to operations tools.</p>
      </section>
      <form class="workflow-form" data-form="login">
        ${notice}
        ${helper}
        ${authError}
        ${inputField("Email", "email", "name@example.com", "email")}
        ${inputField("Password", "password", "Password", "password")}
        <button class="button primary full" ${state.loginPending ? "disabled" : ""}>${state.loginPending ? "Signing In..." : "Continue"}</button>
        <button type="button" class="button secondary full" data-action="dev-admin-login">Use Local Admin</button>
        <div class="split-actions">
          <button type="button" class="text-link" data-route="apply">Need reseller access?</button>
          <button type="button" class="text-link" data-route="admin">Admin area</button>
        </div>
        ${state.loginSubmitted && state.auth.isAuthenticated ? `<p class="notice success">Signed in as ${escapeHtml(authDisplayName())}.</p>` : ""}
      </form>
    </main>
  `;
}

function inputField(label, name, placeholder, type = "text") {
  return `<label><span>${escapeHtml(label)}</span><input name="${escapeHtml(name)}" type="${type}" placeholder="${escapeHtml(placeholder)}" /></label>`;
}

function controlInput(label, name, value, type = "text") {
  return `<label><span>${escapeHtml(label)}</span><input name="${escapeHtml(name)}" type="${type}" value="${escapeHtml(value)}" /></label>`;
}

function controlTextarea(label, name, value) {
  return `<label><span>${escapeHtml(label)}</span><textarea name="${escapeHtml(name)}">${escapeHtml(value)}</textarea></label>`;
}

function colorInput(label, name, value) {
  return `<label class="color-control"><span>${escapeHtml(label)}</span><input name="${escapeHtml(name)}" type="color" value="${escapeHtml(value)}" /></label>`;
}

function processStep(number, title, copy) {
  return `<div class="process-step"><strong>${number}</strong><div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(copy)}</p></div></div>`;
}

function resellerPortal() {
  const rows = filteredInventoryRows();
  const orderItems = currentDraftItems();
  const summary = currentDraftSummary();
  return `
    <main class="portal-page">
      <section class="portal-header">
        <div>
          <span class="eyebrow dark">Ivansrun Africa reseller portal</span>
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
        ["Available SKUs", String(state.variants.length || rows.length), "Imported variants"],
        ["Inventory Rows", String(state.inventory.length || rows.length), "Exact stock"],
        ["Current Request", money(summary.subtotal), "USD"],
      ])}
      <section class="reseller-grid">
        <div class="inventory-panel">
          <div class="panel-toolbar">
            <h2>Live Inventory</h2>
            <div class="toolbar-actions">
              <label class="compact-search"><span>Search</span><input name="reseller-search" value="${escapeHtml(state.resellerSearch)}" placeholder="Search SKU or product" /></label>
            </div>
          </div>
          ${state.inventoryError ? `<p class="notice error">${escapeHtml(state.inventoryError)}</p>` : ""}
          <div class="table-wrap">
            <table>
              <thead><tr><th>Product</th><th>SKU</th><th>Colour</th><th>Size</th><th>Price</th><th>Exact Stock</th><th>Request Qty</th><th>Add</th></tr></thead>
              <tbody>
                ${
                  state.inventoryLoading
                    ? `<tr><td colspan="8">Loading inventory...</td></tr>`
                    : rows.length
                      ? rows
                          .map(
                            (row) => `
                    <tr>
                      <td><div class="table-product">${productVisual(row.productName, row.imageName)}<strong>${escapeHtml(row.productName)}</strong></div></td>
                      <td class="mono">${escapeHtml(row.sku)}</td>
                      <td>${escapeHtml(row.colour)}</td>
                      <td>${escapeHtml(row.size)}</td>
                      <td class="price">${money(row.price)}</td>
                      <td><span class="${row.stockQuantity <= 5 ? "stock-badge low" : "stock-badge"}">${row.stockQuantity} units</span></td>
                      <td><input class="qty-input" type="number" min="0" max="${row.stockQuantity}" value="${state.resellerDraft[row.variantId] || ""}" data-qty-input="${escapeHtml(row.variantId)}" /></td>
                      <td><button class="button mini" data-action="add-order-item" data-variant-id="${escapeHtml(row.variantId)}">Add</button></td>
                    </tr>
                  `,
                          )
                          .join("")
                      : `<tr><td colspan="8">No inventory lines match this search.</td></tr>`
                }
              </tbody>
            </table>
          </div>
          ${pager(`Showing ${rows.length ? `1-${rows.length}` : "0"} of ${rows.length} SKUs`)}
        </div>
        <aside class="order-sidebar">
          <div class="sidebar-head"><h2>Order Request</h2><p>${state.orderSubmitted ? "Submitted" : "Draft request"}</p></div>
          <div class="order-items">
            ${
              orderItems.length
                ? orderItems
                    .map(
                      (item) => `
                <div class="order-item">
                  ${productVisual(item.productName, item.imageName)}
                  <div>
                    <div class="order-title-row"><strong>${escapeHtml(item.productName)}</strong><button data-action="remove-order-item" data-variant-id="${escapeHtml(item.variantId)}" aria-label="Remove ${escapeHtml(item.sku)}">Remove</button></div>
                    <p class="mono">SKU: ${escapeHtml(item.sku)}</p>
                    <p>${escapeHtml(item.colour)} / Size ${escapeHtml(item.size)}</p>
                    <div class="line-total"><span>${item.requestedQuantity} x ${money(item.price)}</span><strong>${money(item.lineTotal)}</strong></div>
                  </div>
                </div>
              `,
                    )
                    .join("")
                : `<p class="notice">Add live inventory lines to build this order request.</p>`
            }
          </div>
          <form class="order-summary" data-form="order">
            ${summaryRow("Items", String(summary.itemCount))}
            ${summaryRow("Total units", String(summary.totalUnits))}
            ${summaryRow("Subtotal", money(summary.subtotal))}
            ${summaryRow("Est. shipping", "TBD", false, true)}
            ${summaryRow("Total", money(summary.subtotal), true)}
            <textarea name="order_notes" placeholder="Notes for admin" aria-label="Notes for admin">${escapeHtml(state.resellerNotes)}</textarea>
            <button class="button primary full" ${state.orderSubmitPending || !summary.itemCount ? "disabled" : ""}>${state.orderSubmitPending ? "Submitting..." : "Submit Order Request"}</button>
            ${
              state.orderSubmitted
                ? `<p class="notice success">Order request submitted. Admin review is now required before confirmation.</p>`
                : `<p class="notice">Order requests are reviewed before confirmation. Stock is not reserved until approved.</p>`
            }
          </form>
        </aside>
      </section>
      ${footer(true)}
    </main>
  `;
}

function requestHistory() {
  const records = requestHistoryRecords();
  return `
    <main class="portal-page">
      <section class="portal-header">
        <div>
          <span class="eyebrow dark">Ivansrun Africa requests</span>
          <h1>Request History</h1>
          <p>Track order requests from draft through admin approval.</p>
        </div>
        <button class="button secondary" data-route="reseller">Back to Inventory</button>
      </section>
      <section class="inventory-panel">
        ${state.historyError ? `<p class="notice error">${escapeHtml(state.historyError)}</p>` : ""}
        <div class="table-wrap">
          <table>
            <thead><tr><th>Request</th><th>Status</th><th>Items</th><th>Quantity</th><th>Total</th><th>Notes</th></tr></thead>
            <tbody>
              ${
                state.historyLoading
                  ? `<tr><td colspan="6">Loading request history...</td></tr>`
                  : records.length
                    ? records
                        .map(
                          (record) => `
                        <tr>
                          <td>${escapeHtml(record.code)}</td>
                          <td>${statusPill(record.status)}</td>
                          <td>${escapeHtml(`${record.totalItems} SKUs`)}</td>
                          <td>${escapeHtml(`${record.totalUnits} units`)}</td>
                          <td>${money(record.subtotal)}</td>
                          <td>${escapeHtml(record.adminNotes || record.notes || "—")}</td>
                        </tr>`,
                        )
                        .join("")
                    : `<tr><td colspan="6">No requests submitted yet.</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </section>
      ${footer(true)}
    </main>
  `;
}

function adminDashboard() {
  const products = catalogProducts();
  const orderRecords = requestHistoryRecords();
  const applicationCounts = applicationSummary();
  return `
    <main class="admin-layout">
      ${adminSidebar("admin")}
      <section class="admin-main">
        <header class="admin-topbar">
          <div><h1>Ivansrun Africa Operations</h1><p>System overview and controls for catalog, stock, reseller access, and orders.</p></div>
          <button class="icon-button" data-route="email">Alerts</button>
        </header>
        ${metricGrid([
          ["Pending Apps", String(applicationCounts.pending), "Awaiting review"],
          ["Submitted Requests", String(AdminOrders.countRequestsByStatus(orderRecords, ["submitted"])), "Order pipeline"],
          ["Total Products", String(products.length || 75), "Imported catalog"],
          ["Inventory Rows", String(state.inventory.length || 0), "Imported stock"],
        ])}
        <section class="admin-panels">
          ${adminTable(
            "Reseller Applications",
            ["Company", "Country", "Status", "Actions"],
            state.resellerApplicationsData.map((application) => [application.company_name, application.country || "—", application.status, "Review"]),
          )}
          ${adminTable(
            "Order Requests",
            ["Order #", "Items / Qty", "Status", "Action"],
            orderRecords.map((record) => [
              record.code,
              `${record.totalItems} SKUs / ${record.totalUnits} units`,
              record.status,
              "Review",
            ]),
          )}
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

function adminSiteControls() {
  const site = state.siteContent;
  const hero = site.hero;
  const theme = site.theme;
  return `
    <main class="admin-layout">
      ${adminSidebar("site")}
      <section class="admin-main">
        <header class="admin-topbar">
          <div><h1>Site Controls</h1><p>Edit the public hero, reseller banner, and seasonal colors from one place.</p></div>
          <button class="icon-button" data-route="store">View Site</button>
        </header>
        ${state.siteSaved ? `<p class="notice success">Site controls published to Supabase. The public site now reads the active hero, theme, and banner from the database.</p>` : ""}
        ${state.siteSaveError ? `<p class="notice error">${escapeHtml(state.siteSaveError)}</p>` : ""}
        <section class="site-control-grid">
          <form class="site-control-form" data-form="site-controls">
            <div class="control-section">
              <h2>Hero</h2>
              ${controlInput("Eyebrow", "hero_eyebrow", hero.eyebrow)}
              ${controlInput("Headline", "hero_title", hero.title)}
              ${controlTextarea("Subtitle", "hero_copy", hero.copy)}
              ${controlInput("Background Image Path", "hero_background_image", hero.backgroundImage)}
              <div class="two-fields">
                ${controlInput("Primary Button", "hero_primary_cta", hero.primaryCta)}
                ${controlInput("Primary Route", "hero_primary_route", hero.primaryRoute)}
              </div>
              <div class="two-fields">
                ${controlInput("Secondary Button", "hero_secondary_cta", hero.secondaryCta)}
                ${controlInput("Secondary Route", "hero_secondary_route", hero.secondaryRoute)}
              </div>
              <label class="toggle-row"><input name="hero_electricity" type="checkbox" ${hero.electricity ? "checked" : ""} /><span>Show button electricity</span></label>
            </div>
            <div class="control-section">
              <h2>Theme</h2>
              ${controlInput("Theme Name", "theme_name", theme.name)}
              <div class="color-grid">
                ${colorInput("Primary", "theme_primary", theme.primary)}
                ${colorInput("Primary Dark", "theme_primary_dark", theme.primaryDark)}
                ${colorInput("Background", "theme_background", theme.background)}
                ${colorInput("Surface", "theme_surface", theme.surface)}
                ${colorInput("Electric Accent", "theme_accent", theme.accent)}
                ${colorInput("Deep Header", "theme_deep", theme.deep)}
              </div>
              ${controlTextarea("Reseller Banner", "site_banner", site.banner)}
            </div>
            <button class="button primary full" type="submit" ${state.siteSavePending ? "disabled" : ""}>${state.siteSavePending ? "Publishing..." : "Publish Site Controls"}</button>
          </form>
          <aside class="site-preview" style="${cssUrl(hero.backgroundImage)}">
            <div class="site-preview-bg"></div>
            <div class="site-preview-content">
              <span>${escapeHtml(hero.eyebrow)}</span>
              <h2>${escapeHtml(hero.title)}</h2>
              <p>${escapeHtml(hero.copy)}</p>
              <div class="hero-actions">
                <button class="button primary${hero.electricity ? " charge-button" : ""}">${escapeHtml(hero.primaryCta)} <span class="button-mark" aria-hidden="true">&nearr;</span></button>
                <button class="button ghost${hero.electricity ? " charge-button subdued" : ""}">${escapeHtml(hero.secondaryCta)} <span class="button-mark" aria-hidden="true">&rarr;</span></button>
              </div>
            </div>
          </aside>
        </section>
      </section>
    </main>
  `;
}

function adminProducts() {
  const rows = inventoryRows();
  const stockByProductId = rows.reduce((map, row) => {
    const current = map.get(row.productId) || { total: 0, colours: new Set(), sizes: new Set() };
    current.total += row.stockQuantity;
    if (row.colour) current.colours.add(row.colour);
    if (row.size) current.sizes.add(row.size);
    map.set(row.productId, current);
    return map;
  }, new Map());
  const products = catalogProducts();
  return `
    <main class="admin-layout">
      ${adminSidebar("products")}
      <section class="admin-main">
        <header class="admin-topbar">
          <div><h1>Products</h1><p>Add products, check models, and confirm colors, sizes, images, and prices before stock uploads.</p></div>
          <button class="icon-button" data-action="toggle-product-form">${state.productFormOpen ? "Close" : "Add Product"}</button>
        </header>
        ${state.productFormSaved ? `<p class="notice success">Product added locally with generated color and size variants.</p>` : ""}
        ${state.productFormError ? `<p class="notice error">${escapeHtml(state.productFormError)}</p>` : ""}
        ${state.productFormOpen ? productForm() : ""}
        <section class="product-overview">
          <div class="panel-toolbar"><h2>Product Setup</h2><span>${products.length} products</span></div>
          <div class="overview-list">
            ${products
              .map((product) => {
                const stock = stockByProductId.get(product.id) || { total: 0, colours: new Set(), sizes: new Set() };
                return `<div class="overview-row">
                  <strong>${escapeHtml(product.sku)}</strong>
                  <span>${escapeHtml(product.name)}</span>
                  <span>${escapeHtml(product.category || "Uncategorized")}</span>
                  <span>${escapeHtml(`${stock.total} units`)}</span>
                  <span>${escapeHtml(`${stock.colours.size} colors / ${stock.sizes.size} sizes`)}</span>
                </div>`;
              })
              .join("")}
          </div>
          <p class="import-note">Products define what exists. Inventory uploads only update stock against these products and generated variants.</p>
        </section>
      </section>
    </main>
  `;
}

function productForm() {
  const imageOptions = ProductEditor.buildImageOptions(state.productImageDrafts);
  const colorRows = Array.from({ length: 6 }, (_, index) => productColorRow(index, imageOptions));
  return `
    <form class="workflow-form product-form" data-form="product">
      <div class="two-fields">
        ${inputField("Model Code", "model_code", "2503")}
        ${inputField("Product Name", "name", "IRUNSVAN 2503 Shadow Wing PRO+")}
      </div>
      <div class="two-fields">
        ${inputField("Category", "category", "Running Shoes")}
        ${inputField("Price USD", "price", "38", "number")}
      </div>
      <label><span>Product Images</span><input name="image_files" type="file" accept="image/*" multiple /></label>
      ${
        imageOptions.length
          ? `<div class="image-draft-grid">${imageOptions
              .map((image) => `<div><span>${escapeHtml(image.label)}</span></div>`)
              .join("")}</div>`
          : `<p class="import-note">Choose images from your computer or phone. The file names will be attached to the product draft.</p>`
      }
      <div class="color-editor">
        <div class="color-editor-head">
          <span>Inventory color</span>
          <span>Display color</span>
          <span>Code</span>
          <span>Image</span>
        </div>
        ${colorRows.join("")}
      </div>
      ${controlTextarea("Sizes", "sizes", "38, 39, 40, 41, 42, 43, 44, 45")}
      <button class="button primary full" type="submit">Create Product Draft</button>
    </form>
  `;
}

function productColorRow(index, imageOptions) {
  return `
    <div class="color-editor-row" data-product-colour-row>
      <input name="colour_original_${index}" placeholder="珍珠白" />
      <input name="colour_display_${index}" placeholder="Pearl White" />
      <input name="colour_code_${index}" placeholder="002" />
      <select name="colour_image_${index}">
        <option value="">No image</option>
        ${imageOptions.map((image) => `<option value="${escapeHtml(image.name)}">${escapeHtml(image.label)}</option>`).join("")}
      </select>
    </div>
  `;
}

function adminApprovals() {
  const orderRecords = requestHistoryRecords();
  return `
    <main class="admin-layout">
      ${adminSidebar("approvals")}
      <section class="admin-main">
        <header class="admin-topbar"><div><h1>Approvals</h1><p>Review reseller applications and order requests before access or stock confirmation.</p></div></header>
        <section class="admin-panels">
          <div class="admin-card">
            <div class="panel-toolbar"><h2>Reseller Applications</h2><span>${state.resellerApplicationsData.length} applications</span></div>
            <div class="approval-stack">
              ${
                state.resellerApplicationsData.length
                  ? state.resellerApplicationsData
                      .map(
                        (application) => `
                      <article class="approval-item">
                        <div>
                          <strong>${escapeHtml(application.company_name)}</strong>
                          <p>${escapeHtml(`${application.full_name} • ${application.email}`)}</p>
                          <p>${escapeHtml(`${application.country || "Country not provided"}${application.phone ? ` • ${application.phone}` : ""}`)}</p>
                          <p>${escapeHtml(application.message || "No reseller notes provided.")}</p>
                        </div>
                        <div class="approval-actions">
                          ${statusPill(application.status)}
                          <button class="button mini" data-action="application-status" data-application-id="${escapeHtml(application.id)}" data-user-id="${escapeHtml(application.user_id)}" data-status="approved">Approve</button>
                          <button class="button mini secondary" data-action="application-status" data-application-id="${escapeHtml(application.id)}" data-user-id="${escapeHtml(application.user_id)}" data-status="rejected">Reject</button>
                        </div>
                      </article>
                    `,
                      )
                      .join("")
                  : `<p class="notice">No reseller applications available yet.</p>`
              }
            </div>
          </div>
          <div class="admin-card">
            <div class="panel-toolbar"><h2>Order Requests</h2><span>${orderRecords.length} requests</span></div>
            <div class="approval-stack">
              ${
                orderRecords.length
                  ? orderRecords
                      .map(
                        (record) => `
                      <article class="approval-item">
                        <div>
                          <strong>${escapeHtml(record.code)}</strong>
                          <p>${escapeHtml(`${record.totalItems} SKUs / ${record.totalUnits} units / ${money(record.subtotal)}`)}</p>
                          <p>${escapeHtml(record.notes || "No reseller notes provided.")}</p>
                          ${record.adminNotes ? `<p>${escapeHtml(`Admin note: ${record.adminNotes}`)}</p>` : ""}
                        </div>
                        <div class="approval-actions">
                          ${statusPill(record.status)}
                          <button class="button mini" data-action="order-status" data-order-id="${escapeHtml(record.id)}" data-status="approved">Approve</button>
                          <button class="button mini secondary" data-action="order-status" data-order-id="${escapeHtml(record.id)}" data-status="rejected">Reject</button>
                          <button class="button mini secondary" data-action="order-status" data-order-id="${escapeHtml(record.id)}" data-status="fulfilled">Fulfill</button>
                        </div>
                      </article>
                    `,
                      )
                      .join("")
                  : `<p class="notice">No order requests available yet.</p>`
              }
            </div>
          </div>
        </section>
      </section>
    </main>
  `;
}

function adminImports() {
  const preview = state.importPreview;
  return `
    <main class="admin-layout">
      ${adminSidebar("imports")}
      <section class="admin-main">
        <header class="admin-topbar"><div><h1>Inventory</h1><p>Upload the master inventory file, review matched stock changes, then publish availability for resellers.</p></div></header>
        <section class="import-panel">
          <div class="upload-grid">
            ${uploadBox("Upload Master Inventory", "Updates exact stock by matching model, color, and size against products already set up.", "inventory_xlsx", ".xlsx,.xls,.csv")}
            ${uploadBox("Scan Media Pack", "Finds product folders and images so products can be reviewed and added later.", "media_pack_zip", ".zip")}
          </div>
          ${state.importError ? `<p class="notice error">${escapeHtml(state.importError)}</p>` : ""}
          ${
            preview
              ? `
                <div class="import-preview">
                  <div class="import-preview-head">
                    <strong>${escapeHtml(preview.filename)}</strong>
                    <span>${escapeHtml(`${preview.type} • ${preview.processedRows}/${preview.rowsTotal} rows ready`)}</span>
                  </div>
                  <div class="import-preview-grid">
                    <div><strong>${preview.products?.length || 0}</strong><span>Products</span></div>
                    <div><strong>${preview.variants?.length || 0}</strong><span>Variants</span></div>
                    <div><strong>${preview.inventoryRows?.length || 0}</strong><span>Inventory rows</span></div>
                    <div><strong>${(preview.errors?.length || 0) + (preview.stockExceptions?.length || 0)}</strong><span>Issues</span></div>
                  </div>
                  ${preview.type === "media_pack_zip" ? mediaPackPreviewDetails(preview) : ""}
                  ${preview.stockSummary ? stockReviewDetails(preview) : ""}
                  ${
                    preview.errors.length
                      ? `<div class="import-errors">${preview.errors
                          .slice(0, 8)
                          .map((error) => `<p>${escapeHtml(`${error.code} on row ${error.row}${error.sku ? ` (${error.sku})` : ""}`)}</p>`)
                          .join("")}</div>`
                      : ""
                  }
                  ${
                    preview.type === "media_pack_zip"
                      ? `<p class="import-note">Media pack scanning is review-only for now. The next step is creating draft products from approved rows.</p>`
                      : `<button class="button primary" data-action="commit-import" ${state.importPending ? "disabled" : ""}>${state.importPending ? "Committing..." : "Commit Import"}</button>`
                  }
                </div>
              `
              : `<div class="import-status">Upload the master inventory file to see matched stock changes before publishing.</div>`
          }
          ${
            state.importJobs.length
              ? `
                <div class="import-history">
                  <div class="panel-toolbar"><h2>Recent Import Jobs</h2><span>${state.importJobs.length} jobs</span></div>
                  <div class="overview-list">
                    ${state.importJobs
                      .map(
                        (job) => `<div class="overview-row"><strong>${escapeHtml(job.import_type)}</strong><span>${escapeHtml(job.filename)}</span><span>${escapeHtml(job.status)}</span></div>`,
                      )
                      .join("")}
                  </div>
                </div>
              `
              : ""
          }
        </section>
        <section class="timeline-panel">
          ${processStep("1", "Scan media", "Admin uploads the Marketing zip and reviews detected products.")}
          ${processStep("2", "Prepare catalog", "Admin fixes names, categories, prices, colors, sizes, and images.")}
          ${processStep("3", "Update stock", "Master inventory files update quantities against approved variants.")}
        </section>
      </section>
    </main>
  `;
}

function mediaPackPreviewDetails(preview) {
  const summary = preview.mediaSummary || {};
  const products = preview.mediaProducts || [];
  return `
    <div class="import-preview-grid media-preview-grid">
      <div><strong>${summary.productsDetected || 0}</strong><span>Detected</span></div>
      <div><strong>${summary.readyToCreate || 0}</strong><span>Ready</span></div>
      <div><strong>${summary.needsReview || 0}</strong><span>Needs review</span></div>
      <div><strong>${summary.videosFound || 0}</strong><span>Videos</span></div>
      <div><strong>${summary.skuImageSetsFound || 0}</strong><span>SKU image sets</span></div>
      <div><strong>${preview.unassignedMedia?.length || 0}</strong><span>Unassigned</span></div>
    </div>
    <div class="media-product-list">
      ${products
        .slice(0, 10)
        .map(
          (product) => `
            <article class="media-product-row">
              <div>
                <strong>${escapeHtml(product.displayName)}</strong>
                <span>${escapeHtml(`${product.code} - ${product.productType}`)}</span>
              </div>
              <div class="media-product-counts">
                <span>${product.media.skuImages.length} SKU</span>
                <span>${product.media.whiteBackgroundImages.length} white</span>
                <span>${product.media.galleryImages.length} gallery</span>
                <span>${product.media.detailImages.length} detail</span>
                <span>${product.media.videos.length} video</span>
              </div>
              <p>${escapeHtml(product.recommendedMainImage || "No primary image found")}</p>
              <em>${escapeHtml(product.warnings.length ? product.warnings.join(", ") : "ready")}</em>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function stockReviewDetails(preview) {
  const summary = preview.stockSummary || {};
  const matches = preview.stockMatches || [];
  const exceptions = preview.stockExceptions || [];
  return `
    <div class="import-preview-grid media-preview-grid">
      <div><strong>${summary.matchedRows || 0}</strong><span>Matched</span></div>
      <div><strong>${summary.stockChanged || 0}</strong><span>Changed</span></div>
      <div><strong>${summary.zeroStock || 0}</strong><span>Zero stock</span></div>
      <div><strong>${summary.exceptionRows || 0}</strong><span>Needs review</span></div>
      <div><strong>${summary.totalNextStock || 0}</strong><span>Total units</span></div>
    </div>
    <div class="media-product-list">
      ${matches
        .slice(0, 8)
        .map(
          (match) => `
            <article class="media-product-row">
              <div>
                <strong>${escapeHtml(match.productName)}</strong>
                <span>${escapeHtml(`${match.modelCode} - ${match.variantSku}`)}</span>
              </div>
              <div class="media-product-counts">
                <span>${escapeHtml(match.colour)}</span>
                <span>Size ${escapeHtml(match.size)}</span>
              </div>
              <p>${escapeHtml(`${match.previousStock} -> ${match.nextStock} units`)}</p>
              <em>${match.changed ? "changed" : "same"}</em>
            </article>
          `,
        )
        .join("")}
      ${exceptions
        .slice(0, 8)
        .map(
          (exception) => `
            <article class="media-product-row">
              <div>
                <strong>${escapeHtml(exception.code)}</strong>
                <span>${escapeHtml(exception.sourceSku || "No SKU")}</span>
              </div>
              <div class="media-product-counts">
                <span>Model ${escapeHtml(exception.modelCode || "")}</span>
                <span>${escapeHtml(exception.originalColour || "")}</span>
                <span>${escapeHtml(exception.size || "")}</span>
              </div>
              <p>Fix the product, color, or size setup before this row can update stock.</p>
              <em>needs review</em>
            </article>
          `,
        )
        .join("")}
    </div>
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
      ${logo("blue")}<span class="admin-chip">Africa Ops</span>
      <nav>
        ${adminLink("Dashboard", "admin", activeRoute)}
        ${adminLink("Products", "products", activeRoute)}
        ${adminLink("Inventory", "imports", activeRoute)}
        ${adminLink("Orders", "approvals", activeRoute)}
        ${adminLink("Site Controls", "site", activeRoute)}
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

function uploadBox(title, copy, importType, accept) {
  return `<label class="upload-box"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(copy)}</span><input type="file" data-import-type="${escapeHtml(importType)}" accept="${escapeHtml(accept || "")}" /></label>`;
}

function emailCard(title, copy) {
  return `<article class="email-card"><span>Email</span><h2>${escapeHtml(title)}</h2><p>${escapeHtml(copy)}</p><button class="button secondary">View Template</button></article>`;
}

function infoPage(route) {
  const pages = {
    about: ["About Ivansrun Africa", "High-performance footwear built around a reseller-ready operating model.", "Ivansrun Africa combines public product discovery with private wholesale inventory workflows for approved business buyers."],
    contact: ["Contact", "Reach the Ivansrun Africa team for product, reseller, and order questions.", "Use the reseller application for wholesale access. General support requests are handled by the Ivansrun Africa operations team."],
    terms: ["Terms", "Clear operating terms for browsing, reseller requests, approval, and order confirmation.", "Order requests are not final purchases until reviewed and confirmed by admin."],
    privacy: ["Privacy", "Customer, reseller, and admin data is handled through protected account and inventory workflows.", "Public visitors can browse products without an account. Exact stock and order workflows require approved access."],
  };
  const [title, subtitle, copy] = pages[route] || pages.about;
  return `
    <main class="info-page">
      <section>
        <span class="eyebrow dark">Ivansrun Africa</span>
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
      <div>${logo("blue")}<p>High-performance athletic footwear for Africa's reseller-ready inventory workflows.</p></div>
      <div><strong>Resources</strong><button data-route="store">Catalog</button><button data-route="apply">Reseller Terms</button><button data-route="contact">Support</button></div>
      <div><strong>Operations</strong><button data-route="history">Order Requests</button><button data-route="imports">Inventory Imports</button><button data-route="privacy">Privacy Policy</button></div>
      <p class="copyright">Copyright 2026 Ivansrun Africa High-Performance Footwear.</p>
    </footer>
  `;
}

function routeView() {
  const activeRoute = routeForAccess(state.route);
  if (activeRoute !== state.route) {
    state.route = activeRoute;
  }
  const views = {
    store: storefront,
    product: productDetail,
    apply: resellerApplication,
    login: loginPage,
    reseller: resellerPortal,
    history: requestHistory,
    admin: adminDashboard,
    products: adminProducts,
    site: adminSiteControls,
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

  document.querySelectorAll("[data-action='logout']").forEach((button) => {
    button.addEventListener("click", async () => {
      await handleLogout();
    });
  });

  document.querySelectorAll("[data-action='dev-admin-login']").forEach((button) => {
    button.addEventListener("click", async () => {
      await handleDevAdminLogin();
    });
  });

  document.querySelectorAll("[data-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formName = form.getAttribute("data-form");
      if (formName === "application") await handleApplicationSubmit(form);
      if (formName === "order") await handleOrderSubmit(form);
      if (formName === "login") await handleLogin(form);
      if (formName === "site-controls") await saveSiteControls(form);
      if (formName === "product") handleProductSubmit(form);
      render();
    });
  });

  document.querySelectorAll("[data-action='toggle-product-form']").forEach((button) => {
    button.addEventListener("click", () => {
      state.productFormOpen = !state.productFormOpen;
      state.productFormError = null;
      state.productFormSaved = false;
      render();
    });
  });

  document.querySelectorAll("[name='image_files']").forEach((input) => {
    input.addEventListener("change", () => {
      state.productImageDrafts = [...(input.files || [])].map((file) => ({ name: file.name }));
      render();
    });
  });

  document.querySelectorAll("[name='reseller-search']").forEach((input) => {
    input.addEventListener("input", () => {
      state.resellerSearch = input.value;
      render();
    });
  });

  document.querySelectorAll("[name='order_notes']").forEach((input) => {
    input.addEventListener("input", () => {
      state.resellerNotes = input.value;
    });
  });

  document.querySelectorAll("[data-qty-input]").forEach((input) => {
    input.addEventListener("input", () => {
      const variantId = input.getAttribute("data-qty-input");
      syncDraftQuantity(variantId, input.value);
    });
  });

  document.querySelectorAll("[data-action='add-order-item']").forEach((button) => {
    button.addEventListener("click", () => {
      const variantId = button.getAttribute("data-variant-id");
      const input = document.querySelector(`[data-qty-input="${variantId}"]`);
      syncDraftQuantity(variantId, input?.value);
    });
  });

  document.querySelectorAll("[data-action='remove-order-item']").forEach((button) => {
    button.addEventListener("click", () => {
      const variantId = button.getAttribute("data-variant-id");
      syncDraftQuantity(variantId, 0);
    });
  });

  document.querySelectorAll("[data-action='order-status']").forEach((button) => {
    button.addEventListener("click", async () => {
      const orderId = button.getAttribute("data-order-id");
      const status = button.getAttribute("data-status");
      await handleOrderStatusUpdate(orderId, status);
    });
  });

  document.querySelectorAll("[data-action='application-status']").forEach((button) => {
    button.addEventListener("click", async () => {
      const applicationId = button.getAttribute("data-application-id");
      const userId = button.getAttribute("data-user-id");
      const status = button.getAttribute("data-status");
      await handleApplicationStatusUpdate(applicationId, userId, status);
    });
  });

  document.querySelectorAll("[data-import-type]").forEach((input) => {
    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      const type = input.getAttribute("data-import-type");
      if (file && type) {
        await handleImportFile(type, file);
      }
    });
  });

  document.querySelectorAll("[data-action='commit-import']").forEach((button) => {
    button.addEventListener("click", async () => {
      await handleImportCommit();
    });
  });

  document.querySelectorAll("[name='catalog-search']").forEach((input) => {
    input.addEventListener("input", () => {
      state.catalogSearch = input.value;
      render();
    });
  });

  document.querySelectorAll("[name='catalog-sort']").forEach((select) => {
    select.addEventListener("change", () => {
      state.catalogSort = select.value;
      render();
    });
  });

  document.querySelectorAll("[name='catalog-price']").forEach((input) => {
    input.addEventListener("input", () => {
      state.catalogMaxPrice = Number(input.value);
      render();
    });
  });

  document.querySelectorAll("[data-action='catalog-category']").forEach((input) => {
    input.addEventListener("change", () => {
      const value = input.getAttribute("data-value");
      const next = new Set(state.catalogCategories);
      if (input.checked) next.add(value);
      else next.delete(value);
      state.catalogCategories = [...next];
      render();
    });
  });

  document.querySelectorAll("[data-action='catalog-size']").forEach((button) => {
    button.addEventListener("click", () => {
      const size = button.getAttribute("data-size");
      const next = new Set(state.catalogSizes);
      if (next.has(size)) next.delete(size);
      else next.add(size);
      state.catalogSizes = [...next];
      render();
    });
  });
}

function syncDraftQuantity(variantId, quantity) {
  const row = inventoryRows().find((entry) => entry.variantId === variantId);
  if (!row) return;
  state.resellerDraft = Orders.updateDraftQuantity(state.resellerDraft, row, quantity);
  state.orderSubmitted = false;
  render();
}

async function handleLogin(form) {
  const data = new FormData(form);
  state.loginPending = true;
  state.loginSubmitted = false;
  state.authError = null;
  render();

  try {
    await SupabaseClient.signInWithPassword({
      url: SUPABASE_URL,
      key: SUPABASE_KEY,
      email: String(data.get("email") || "").trim(),
      password: String(data.get("password") || ""),
    });
    const restored = await SupabaseClient.restoreAuthState({ url: SUPABASE_URL, key: SUPABASE_KEY });
    state.auth = Auth.normalizeAuthState(restored);
    state.loginSubmitted = true;
    state.routeNotice = null;
    await loadProtectedData();
    setRoute(Auth.fallbackRouteForRole(state.auth.role));
  } catch (error) {
    state.auth = Auth.normalizeAuthState();
    state.authError = error instanceof Error ? error.message : "Unable to sign in";
  } finally {
    state.loginPending = false;
  }
}

async function handleLogout() {
  await SupabaseClient.signOut();
  state.auth = Auth.normalizeAuthState();
  state.authError = null;
  state.loginSubmitted = false;
  state.resellerDraft = {};
  state.resellerNotes = "";
  state.orderSubmitted = false;
  setRouteNotice(null, "");
  setRoute("store");
}

async function handleDevAdminLogin() {
  state.auth = buildLocalAdminAuthState();
  state.authError = null;
  state.loginSubmitted = true;
  state.routeNotice = null;
  setRoute("admin");
  await loadProtectedData();
}

async function handleOrderSubmit(form) {
  state.orderSubmitPending = true;
  state.orderSubmitted = false;
  state.inventoryError = null;
  state.historyError = null;
  state.resellerNotes = String(new FormData(form).get("order_notes") || "");
  render();

  try {
    const payload = Orders.buildOrderPayload({
      auth: state.auth,
      items: currentDraftItems(),
      notes: state.resellerNotes,
    });
    const [createdRequest] = await insertAuthedSupabase("order_requests", payload.orderRequest);
    const itemsPayload = payload.orderItems.map((item) => ({ ...item, order_request_id: createdRequest.id }));
    await insertAuthedSupabase("order_request_items", itemsPayload);
    state.resellerDraft = {};
    state.resellerNotes = "";
    state.orderSubmitted = true;
    await loadProtectedData();
    sendOrderNotification({
      eventType: "order_submitted",
      adminEmails: [],
      orderCode: formatRequestCode(createdRequest.id),
      resellerCompany: state.auth.profile?.company_name || "Ivansrun reseller",
      resellerEmail: state.auth.user?.email || "",
      totalSkus: payload.orderItems.length,
      totalUnits: payload.orderItems.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: payload.orderItems.reduce((sum, item) => sum + Number(item.base_price || 0) * item.quantity, 0),
      notes: payload.orderRequest.notes || "",
    }).catch(() => {});
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit order request";
    state.inventoryError = message;
    state.historyError = message;
  } finally {
    state.orderSubmitPending = false;
  }
}

async function handleApplicationSubmit(form) {
  state.applicationSubmitPending = true;
  state.applicationSubmitted = false;
  state.applicationError = null;
  render();

  try {
    const data = new FormData(form);
    let authState = state.auth;

    if (!authState.isAuthenticated) {
      const email = String(data.get("email") || "").trim();
      const password = String(data.get("password") || "");
      await SupabaseClient.signUpWithPassword({
        url: SUPABASE_URL,
        key: SUPABASE_KEY,
        email,
        password,
        metadata: { full_name: String(data.get("full_name") || "").trim() },
      });
      if (!SupabaseClient.readStoredSession()?.access_token) {
        await SupabaseClient.signInWithPassword({
          url: SUPABASE_URL,
          key: SUPABASE_KEY,
          email,
          password,
        });
      }
      const restored = await SupabaseClient.restoreAuthState({ url: SUPABASE_URL, key: SUPABASE_KEY });
      authState = Auth.normalizeAuthState(restored);
      state.auth = authState;
    }

    const payload = Applications.buildApplicationPayload({
      userId: authState.user?.id,
      email: data.get("email") || authState.user?.email,
      fullName: data.get("full_name") || authState.profile?.full_name,
      companyName: data.get("company_name") || authState.profile?.company_name,
      phone: data.get("phone"),
      country: data.get("country"),
      message: data.get("message"),
    });
    await insertAuthedSupabase("reseller_applications", payload);
    state.applicationSubmitted = true;
    await loadProtectedData();
    sendApplicationNotification({
      eventType: "application_submitted",
      adminEmails: [],
      companyName: payload.company_name,
      fullName: payload.full_name,
      email: payload.email,
      country: payload.country || "",
      message: payload.message || "",
    }).catch(() => {});
  } catch (error) {
    state.applicationError = error instanceof Error ? error.message : "Unable to submit reseller application";
  } finally {
    state.applicationSubmitPending = false;
  }
}

async function handleOrderStatusUpdate(orderId, status) {
  try {
    const patch = AdminOrders.buildOrderStatusPatch(status, `Updated from admin dashboard on ${new Date().toLocaleString()}`);
    await patchAuthedSupabase("order_requests", `id=eq.${encodeURIComponent(orderId)}`, patch);
    const orderRequest = state.orderRequests.find((request) => request.id === orderId);
    if (orderRequest?.reseller_id) {
      const [profile] = await fetchAuthedSupabase(
        "profiles",
        `select=id,email,company_name&id=eq.${encodeURIComponent(orderRequest.reseller_id)}&limit=1`,
      );
      sendOrderNotification({
        eventType: `order_${status}`,
        adminEmails: [profile?.email].filter(Boolean),
        orderCode: formatRequestCode(orderId),
        resellerCompany: profile?.company_name || "Ivansrun reseller",
        resellerEmail: profile?.email || "",
        totalSkus: 0,
        totalUnits: 0,
        subtotal: 0,
        notes: patch.admin_notes || "",
      }).catch(() => {});
    }
    await loadProtectedData();
  } catch (error) {
    state.historyError = error instanceof Error ? error.message : "Unable to update order status";
    render();
  }
}

async function handleApplicationStatusUpdate(applicationId, userId, status) {
  try {
    const application = state.resellerApplicationsData.find((entry) => entry.id === applicationId);
    const update = Applications.buildApplicationApprovalUpdate({
      status,
      adminUserId: state.auth.user?.id,
    });
    await patchAuthedSupabase("reseller_applications", `id=eq.${encodeURIComponent(applicationId)}`, {
      ...update.applicationPatch,
      reviewed_at: new Date().toISOString(),
    });
    await patchAuthedSupabase("profiles", `id=eq.${encodeURIComponent(userId)}`, update.profilePatch);
    if (application?.email) {
      sendApplicationNotification({
        eventType: `application_${status}`,
        adminEmails: [application.email],
        companyName: application.company_name,
        fullName: application.full_name,
        email: application.email,
        country: application.country || "",
        message: application.message || "",
      }).catch(() => {});
    }
    await loadProtectedData();
  } catch (error) {
    state.applicationError = error instanceof Error ? error.message : "Unable to update reseller application";
    render();
  }
}

async function saveSiteControls(form) {
  const data = new FormData(form);
  state.siteSavePending = true;
  state.siteSaved = false;
  state.siteSaveError = null;
  state.siteContent = SiteControls.sanitizeSiteContent({
    hero: {
      eyebrow: data.get("hero_eyebrow"),
      title: data.get("hero_title"),
      copy: data.get("hero_copy"),
      backgroundImage: data.get("hero_background_image"),
      primaryCta: data.get("hero_primary_cta"),
      primaryRoute: data.get("hero_primary_route"),
      secondaryCta: data.get("hero_secondary_cta"),
      secondaryRoute: data.get("hero_secondary_route"),
      electricity: Boolean(form.elements.namedItem("hero_electricity")?.checked),
    },
    theme: {
      name: data.get("theme_name"),
      primary: data.get("theme_primary"),
      primaryDark: data.get("theme_primary_dark"),
      background: data.get("theme_background"),
      surface: data.get("theme_surface"),
      accent: data.get("theme_accent"),
      deep: data.get("theme_deep"),
    },
    banner: data.get("site_banner"),
  });
  localStorage.setItem(SITE_CONTENT_STORAGE_KEY, JSON.stringify(state.siteContent));
  render();

  try {
    await publishActiveSiteContent(state.siteContent);
    state.siteSaved = true;
  } catch (error) {
    state.siteSaveError = error instanceof Error ? error.message : "Unable to publish site controls";
  } finally {
    state.siteSavePending = false;
  }
}

function handleProductSubmit(form) {
  state.productFormError = null;
  state.productFormSaved = false;

  try {
    const data = new FormData(form);
    const colourRows = Array.from({ length: 6 }, (_, index) => ({
      original: data.get(`colour_original_${index}`),
      display: data.get(`colour_display_${index}`),
      code: data.get(`colour_code_${index}`),
      image: data.get(`colour_image_${index}`),
    }));
    const imageNames = ProductEditor.buildImageOptions(state.productImageDrafts).map((image) => image.name);
    const editorInput = ProductEditor.buildProductInputFromEditor({
      fields: {
        model_code: data.get("model_code"),
        name: data.get("name"),
        category: data.get("category"),
        price: data.get("price"),
        sizes: data.get("sizes"),
        product_type: "shoe",
      },
      colourRows,
      imageNames,
    });
    const product = ProductCatalogManager.buildProductDraft(editorInput);
    const productId = `local-${product.sku.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const productRow = {
      ...product,
      id: productId,
      published: true,
    };
    const variantRows = ProductCatalogManager.generateProductVariants(productRow).map((variant, index) => ({
      ...variant,
      id: `${productId}-variant-${index + 1}`,
      published: true,
    }));

    state.products = [...state.products.filter((item) => item.sku !== productRow.sku), productRow];
    state.variants = [...state.variants.filter((item) => item.product_id !== productId), ...variantRows];
    state.productFormOpen = false;
    state.productFormSaved = true;
    state.productImageDrafts = [];
  } catch (error) {
    state.productFormError = error instanceof Error ? error.message : "Unable to create product";
  }
}

async function handleImportFile(type, file) {
  state.importError = null;
  state.importPreview = null;
  render();

  try {
    state.importPreview = await buildImportPreviewFromFile(type, file);
  } catch (error) {
    state.importError = error instanceof Error ? error.message : "Unable to parse import file";
  } finally {
    render();
  }
}

async function handleImportCommit() {
  if (!state.importPreview) return;
  state.importPending = true;
  state.importError = null;
  render();

  let importJobId = null;
  try {
    const [job] = await insertAuthedSupabase(
      "import_jobs",
      AdminImports.buildImportJobStart({
        type: state.importPreview.type,
        filename: state.importPreview.filename,
        createdBy: state.auth.user?.id,
        rowsTotal: state.importPreview.rowsTotal,
      }),
    );
    importJobId = job.id;

    if (state.importPreview.type === "catalog_csv") {
      const productRows = await upsertAuthedSupabase("products", state.importPreview.products, "sku");
      const productIdsBySku = new Map(productRows.map((row) => [row.sku, row.id]));
      const variantPayload = state.importPreview.variants
        .filter((variant) => productIdsBySku.has(variant.product_sku))
        .map((variant) => ({
          product_id: productIdsBySku.get(variant.product_sku),
          sku: variant.sku,
          name: variant.name,
          colour: variant.colour,
          size: variant.size,
          base_price: variant.base_price,
          base_currency: variant.base_currency,
          image_name: variant.image_name,
          published: true,
        }));
      await upsertAuthedSupabase("product_variants", variantPayload, "sku");
    }

    if (state.importPreview.type === "inventory_xlsx") {
      if (state.importPreview.stockMatches?.length) {
        const inventoryPayload = state.importPreview.stockMatches.map((match) => ({
          variant_id: match.variantId,
          sku: match.variantSku,
          style_code: match.modelCode,
          stock_quantity: match.nextStock,
          source: match.sourceSku ? `master_inventory:${match.sourceSku}` : "master_inventory",
        }));
        await upsertAuthedSupabase("inventory", inventoryPayload, "sku");
      } else {
      const skus = state.importPreview.inventoryRows.map((row) => row.sku);
      const variantRows = skus.length
        ? await fetchAuthedSupabase(
            "product_variants",
            `select=id,sku&sku=in.(${skus.map((sku) => `"${sku.replaceAll('"', "")}"`).join(",")})&limit=${skus.length}`,
          )
        : [];
      const variantIdsBySku = new Map(variantRows.map((row) => [row.sku, row.id]));
      const inventoryPayload = state.importPreview.inventoryRows
        .filter((row) => variantIdsBySku.has(row.sku))
        .map((row) => ({
          variant_id: variantIdsBySku.get(row.sku),
          sku: row.sku,
          style_code: row.style_code,
          stock_quantity: row.stock_quantity,
          source: row.source,
        }));
      await upsertAuthedSupabase("inventory", inventoryPayload, "sku");
      }
    }

    if (importJobId) {
      await patchAuthedSupabase(
        "import_jobs",
        `id=eq.${encodeURIComponent(importJobId)}`,
        AdminImports.buildImportJobFinish({
          processedRows: state.importPreview.processedRows,
          errorMessage: state.importPreview.errors.length ? `${state.importPreview.errors.length} row issues reported in preview.` : "",
        }),
      );
    }

    state.importPreview = null;
    await loadCatalog();
    await loadProtectedData();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to commit import";
    state.importError = message;
    if (importJobId) {
      await patchAuthedSupabase(
        "import_jobs",
        `id=eq.${encodeURIComponent(importJobId)}`,
        AdminImports.buildImportJobFinish({
          processedRows: 0,
          errorMessage: message,
        }),
      ).catch(() => {});
    }
  } finally {
    state.importPending = false;
    render();
  }
}

function applyRevealMotion() {
  const targets = document.querySelectorAll(
    ".hero-content, .section-header, .lab-section > *, .detail-grid > *, .form-hero, .workflow-form, .process-panel, .metric-card, .inventory-panel, .order-sidebar, .admin-card, .import-panel, .product-overview, .timeline-panel, .email-card, .info-page section",
  );

  targets.forEach((target) => target.classList.add("reveal"));

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
    targets.forEach((target) => target.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
  );

  targets.forEach((target) => observer.observe(target));
}

function render() {
  SiteControls.applySiteTheme(state.siteContent.theme, document.documentElement);
  document.getElementById("app").innerHTML = topNav() + routeView();
  bindEvents();
  applyRevealMotion();
}

async function initAuth() {
  if (LOGIN_BYPASS_ENABLED) {
    state.auth = buildLocalAdminAuthState();
    state.authError = null;
    state.authLoading = false;
    await loadProtectedData();
    render();
    return;
  }

  try {
    const restored = await SupabaseClient.restoreAuthState({ url: SUPABASE_URL, key: SUPABASE_KEY });
    state.auth = Auth.normalizeAuthState(restored);
    state.authError = null;
    await loadProtectedData();
  } catch (error) {
    state.auth = Auth.normalizeAuthState();
    state.authError = error instanceof Error ? error.message : "Unable to restore account session";
  } finally {
    state.authLoading = false;
    render();
  }
}

render();
loadCatalog();
initAuth();
