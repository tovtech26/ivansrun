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
const ProductPersistence = window.IvansrunProductPersistence;
const ProductImages = window.IvansrunProductImages;
const StorefrontCatalog = window.IvansrunStorefrontCatalog;
const EmailNotifications = window.IvansrunEmailNotifications;
const ProductDetailModel = window.IvansrunProductDetail;
const MobileNavigation = window.IvansrunMobileNavigation;
const InventoryWorkflow = window.IvansrunInventoryWorkflow;
const CatalogData = window.IvansrunCatalogData;
const SITE_CONTENT_STORAGE_KEY = "ivansrun_site_content";
const LOGIN_BYPASS_ENABLED =
  typeof window !== "undefined" && ["localhost", "127.0.0.1", ""].includes(window.location.hostname);

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
  productFormWarning: null,
  productFormSaveMessage: null,
  productImageDrafts: [],
  emailTemplatePreview: null,
  mobileNavOpen: false,
  catalogFiltersOpen: false,
  navigationDepth: 0,
  importError: null,
  importPreview: null,
  resellerSearch: "",
  resellerNotes: "",
  resellerDraft: {},
  catalogSearch: "",
  catalogCategories: [],
  catalogSizes: [],
  catalogPage: 1,
  catalogMaxPrice: 80,
  catalogSort: "sku",
  siteContent: SiteControls.sanitizeSiteContent(readStoredSiteContent()),
  auth: LOGIN_BYPASS_ENABLED ? buildLocalAdminAuthState() : Auth.normalizeAuthState(),
};

const CATALOG_PAGE_SIZE = 8;

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
  return [...state.products].sort((a, b) => {
    return skuRank(a.sku) - skuRank(b.sku) || String(a.name).localeCompare(String(b.name));
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

function pagedStorefrontProducts() {
  const products = storefrontProducts();
  const totalPages = Math.max(1, Math.ceil(products.length / CATALOG_PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, state.catalogPage), totalPages);
  const start = (currentPage - 1) * CATALOG_PAGE_SIZE;
  return {
    products: products.slice(start, start + CATALOG_PAGE_SIZE),
    totalProducts: products.length,
    currentPage,
    totalPages,
    startIndex: products.length ? start + 1 : 0,
    endIndex: products.length ? Math.min(start + CATALOG_PAGE_SIZE, products.length) : 0,
  };
}

function catalogCategoryOptions() {
  return [...new Set(catalogProducts().map((product) => String(product.category || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function catalogSizeOptions() {
  return [...new Set(state.variants.map((variant) => String(variant.size || "").trim()).filter(Boolean))].sort((a, b) => Number(a) - Number(b) || a.localeCompare(b));
}

function variantsFor(productId) {
  return state.variants.filter((variant) => variant.product_id === productId);
}

function selectedProduct() {
  const products = catalogProducts();
  return products.find((product) => product.id === state.selectedProductId) || products[0] || null;
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
  const safeLabel = escapeHtml(label || "Product");
  const safeImageName = escapeHtml(imageName);
  const shortLabel = escapeHtml(String(label || "Product").replace("IRUNSVAN ", ""));
  const imageUrl = ProductImages.resolveProductImageUrl(imageName, SUPABASE_URL);
  const visualBody = imageUrl
    ? `<img class="product-photo" src="${escapeHtml(imageUrl)}" alt="${safeLabel}" loading="lazy" />`
    : `<div class="missing-product-image"><span>No image uploaded</span>${shortLabel ? `<small>${shortLabel}</small>` : ""}</div>`;
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

async function uploadProductImage(record) {
  const session = SupabaseClient.readStoredSession();
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${ProductPersistence.PRODUCT_IMAGE_BUCKET}/${record.storagePath}`, {
    method: "POST",
    headers: {
      ...SupabaseClient.headers(SUPABASE_KEY, session?.access_token),
      "Content-Type": record.contentType,
      "Cache-Control": "3600",
    },
    body: record.file,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message || body?.error || `image upload failed: ${response.status}`);
  }
  return response.json().catch(() => ({ path: record.storagePath }));
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
      const publishPlan = InventoryWorkflow.buildInventoryPublishPlan({
        inventory: state.inventory,
        stockMatches: stockReview.matches,
        source: "master_inventory",
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
        publishPlan,
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
    products: state.products,
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
    const [productRows, variantRows, heroRows, themeRows, contentRows] = await Promise.all([
      fetchOptionalSupabase("products", CatalogData.productSelectQuery()),
      fetchOptionalSupabase("product_variants", CatalogData.variantSelectQuery()),
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
    const fallback = CatalogData.fallbackCatalog();
    const catalogRows =
      productRows.length || variantRows.length
        ? CatalogData.normalizeCatalogRows({ products: productRows, variants: variantRows })
        : CatalogData.normalizeCatalogRows(fallback);
    state.products = catalogRows.products;
    state.variants = catalogRows.variants;
    state.inventory = [];
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

  const hasStoredSession = Boolean(SupabaseClient.readStoredSession()?.access_token);
  if (LOGIN_BYPASS_ENABLED && !hasStoredSession) {
    state.inventory = [];
    state.orderRequests = [];
    state.orderRequestItems = [];
    state.resellerApplicationsData = [];
    state.importJobs = [];
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
      [
        "applications",
        fetchAuthedSupabase(
        "reseller_applications",
        "select=id,user_id,email,full_name,company_name,phone,country,message,status,reviewed_by,reviewed_at,created_at&order=created_at.desc&limit=200",
        ),
      ],
    ];

    if (state.auth.isReseller || state.auth.isAdmin) {
      tasks.push(
        ["products", fetchAuthedSupabase(CatalogData.protectedProductSource(), CatalogData.protectedProductSelectQuery())],
        ["variants", fetchAuthedSupabase(CatalogData.protectedVariantSource(), CatalogData.protectedVariantSelectQuery())],
        ["inventory", fetchAuthedSupabase("inventory", "select=id,variant_id,sku,stock_quantity,updated_at&order=sku.asc&limit=5000")],
        ["orderRequests", fetchAuthedSupabase("order_requests", "select=id,reseller_id,status,notes,admin_notes,created_at,updated_at&order=created_at.desc&limit=100")],
        [
          "orderRequestItems",
          fetchAuthedSupabase(
          "order_request_items",
          "select=id,order_request_id,variant_id,sku,product_name,colour,size,quantity,base_price,base_currency,created_at&order=created_at.desc&limit=1000",
          ),
        ],
      );
    }

    if (state.auth.isAdmin) {
      tasks.push(
        [
          "importJobs",
          fetchAuthedSupabase(
          "import_jobs",
          "select=id,import_type,filename,status,rows_total,rows_processed,error_message,created_at,completed_at&order=created_at.desc&limit=25",
          ),
        ],
      );
    }

    const settled = await Promise.all(tasks.map(([, task]) => task));
    const data = Object.fromEntries(tasks.map(([name], index) => [name, settled[index]]));
    if (data.products || data.variants) {
      const fallback = CatalogData.fallbackCatalog();
      const catalogRows =
        (data.products || []).length || (data.variants || []).length
          ? CatalogData.normalizeCatalogRows({ products: data.products || state.products, variants: data.variants || state.variants })
          : CatalogData.normalizeCatalogRows(fallback.products.length ? fallback : { products: state.products, variants: state.variants });
      state.products = catalogRows.products;
      state.variants = catalogRows.variants;
    }
    state.resellerApplicationsData = data.applications || [];
    state.inventory = data.inventory || [];
    state.orderRequests = data.orderRequests || [];
    state.orderRequestItems = data.orderRequestItems || [];
    state.importJobs = data.importJobs || [];
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

function setRoute(route, params = {}, options = {}) {
  if (!ROUTES.includes(route)) return;
  const nextRoute = routeForAccess(route);
  state.route = nextRoute;
  if (params.productId) state.selectedProductId = params.productId;
  state.mobileNavOpen = false;
  state.catalogFiltersOpen = false;
  if (options.writeHistory !== false) {
    const historyState = { route: nextRoute, productId: state.selectedProductId || null };
    const url = MobileNavigation.buildRouteUrl(nextRoute, historyState);
    if (options.replaceHistory) {
      window.history.replaceState(historyState, "", url);
    } else {
      window.history.pushState(historyState, "", url);
      state.navigationDepth += 1;
    }
  }
  render();
  if (options.scroll !== false) window.scrollTo({ top: 0, behavior: "smooth" });
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
  const publicNavItems = [
    ["Catalog", "store", ["store", "product"]],
    ["Become a Reseller", "apply", ["apply"]],
    ["Reseller Portal", "reseller", ["reseller", "history"]],
    ["Admin", "admin", ["admin", "products", "site", "approvals", "imports", "email"]],
  ];
  const drawerItems = mobileDrawerItems();
  const drawerLabel = mobileDrawerLabel();
  const homeRoute = currentPortalHomeRoute();
  const desktopItems = isAdminRoute() || isResellerRoute() ? drawerItems : publicNavItems;
  return `
    <header class="${isAdminRoute() || isResellerRoute() ? "top-nav portal-top-nav" : "top-nav"}">
      <button class="logo-link bare-button" data-route="${homeRoute}" aria-label="${escapeHtml(mobileAreaLabel())} home">${logo("blue")}</button>
      <span class="mobile-area-label">${escapeHtml(mobileAreaLabel())}</span>
      <nav class="main-nav" aria-label="Primary navigation">
        ${desktopItems.map(([label, route, routes]) => `<button class="${active(routes)}" data-route="${route}">${label}</button>`).join("")}
      </nav>
      <button class="mobile-menu-button" data-action="toggle-mobile-nav" aria-label="${state.mobileNavOpen ? "Close menu" : `Open ${drawerLabel} menu`}" aria-expanded="${state.mobileNavOpen ? "true" : "false"}"><span class="menu-dots" aria-hidden="true"><i></i><i></i><i></i><i></i></span></button>
      <div class="nav-actions"></div>
    </header>
    <div class="${state.mobileNavOpen ? "mobile-nav-backdrop open" : "mobile-nav-backdrop"}" data-action="close-mobile-nav"></div>
    <aside class="${state.mobileNavOpen ? "mobile-nav-drawer open" : "mobile-nav-drawer"}" aria-label="${drawerLabel} navigation">
      <div class="mobile-drawer-head"><strong>${escapeHtml(drawerLabel)}</strong><button class="bare-button" data-action="close-mobile-nav">Close</button></div>
      <nav>
        ${drawerItems.map(([label, route, routes]) => `<button class="${active(routes)}" data-route="${route}">${label}</button>`).join("")}
      </nav>
    </aside>
    ${mobileContextBar()}
  `;
}

function currentPortalHomeRoute() {
  if (isAdminRoute()) return "admin";
  if (isResellerRoute()) return "reseller";
  return "store";
}

function mobileAreaLabel() {
  if (isAdminRoute()) return "Admin";
  if (isResellerRoute()) return "Reseller";
  return "Ivansrun Africa";
}

function isAdminRoute(route = state.route) {
  return ["admin", "products", "site", "approvals", "imports", "email"].includes(route);
}

function isResellerRoute(route = state.route) {
  return ["reseller", "history"].includes(route);
}

function mobileDrawerLabel() {
  if (isAdminRoute()) return "Admin Menu";
  if (isResellerRoute()) return "Reseller Menu";
  return "Site Menu";
}

function mobileDrawerItems() {
  if (isAdminRoute()) {
    return [
      ["Dashboard", "admin", ["admin"]],
      ["Products", "products", ["products"]],
      ["Inventory Uploads", "imports", ["imports"]],
      ["Orders & Applications", "approvals", ["approvals"]],
      ["Site Controls", "site", ["site"]],
      ["View Public Site", "store", ["store", "product"]],
    ];
  }
  if (isResellerRoute()) {
    return [
      ["Shop", "reseller", ["reseller"]],
      ["Request History", "history", ["history"]],
      ["Public Catalog", "store", ["store", "product"]],
      ["Become a Reseller", "apply", ["apply"]],
    ];
  }
  return [
    ["Catalog", "store", ["store", "product"]],
    ["Become a Reseller", "apply", ["apply"]],
    ["Reseller Portal", "reseller", ["reseller", "history"]],
    ["Admin", "admin", ["admin", "products", "site", "approvals", "imports", "email"]],
  ];
}

function mobileContextBar() {
  const target = MobileNavigation.backTargetForRoute(state.route);
  if (!target) return "";
  const labels = {
    product: "Catalog",
    history: "Inventory",
    products: "Admin",
    site: "Admin",
    approvals: "Admin",
    imports: "Admin",
    email: "Admin",
    admin: "Catalog",
    reseller: "Catalog",
    apply: "Catalog",
    login: "Catalog",
    about: "Catalog",
    contact: "Catalog",
    terms: "Catalog",
    privacy: "Catalog",
  };
  return `<div class="mobile-context-bar"><button data-action="go-back">&larr; Back to ${escapeHtml(labels[state.route] || "previous")}</button></div>`;
}

function storefront() {
  const pageData = pagedStorefrontProducts();
  const products = storefrontProducts();
  const visibleProducts = pageData.products;
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
              <span>${products.length} product lines</span>
              <span>3,735 SKUs</span>
              <span>Wholesale access after approval</span>
            </div>
          </div>
        </div>
      </section>
      <section class="catalog-section" id="catalog">
        ${catalogFilters("desktop")}
        <div class="catalog-content">
          <div class="section-header">
            <div>
              <span class="eyebrow dark">Catalog</span>
              <h2>${state.loading ? "Loading products" : `${products.length} Ivansrun Africa products`}</h2>
              <p class="section-note">Public browsing shows product information. Approved resellers see wholesale pricing, ordering, and live warehouse quantities.</p>
            </div>
            <select name="catalog-sort" aria-label="Sort catalog">
              <option value="sku" ${state.catalogSort === "sku" ? "selected" : ""}>SKU order</option>
              <option value="name" ${state.catalogSort === "name" ? "selected" : ""}>Name</option>
            </select>
          </div>
          <div class="mobile-catalog-toolbar">
            <label class="compact-search"><span>Search</span><input name="catalog-search" value="${escapeHtml(state.catalogSearch)}" placeholder="Search models" /></label>
            <button class="button secondary" data-action="open-catalog-filters">Filters${activeFilterCount() ? ` (${activeFilterCount()})` : ""}</button>
          </div>
          ${state.error ? `<p class="notice error">Catalog data could not load: ${escapeHtml(state.error)}</p>` : ""}
          <div class="product-grid">
            ${
              visibleProducts.length
                ? visibleProducts.map((product) => productCard(product, variantCounts.get(product.id))).join("")
                : `<div class="empty-state catalog-empty"><h3>No products loaded yet</h3><p>Send the new model file and we will load the catalog from that source.</p></div>`
            }
          </div>
          ${catalogPager(pageData)}
        </div>
      </section>
      <div class="${state.catalogFiltersOpen ? "filter-sheet-backdrop open" : "filter-sheet-backdrop"}" data-action="close-catalog-filters"></div>
      <aside class="${state.catalogFiltersOpen ? "filter-sheet open" : "filter-sheet"}" aria-label="Catalog filters">
        <div class="filter-sheet-head">
          <strong>Filters</strong>
          <button class="icon-button" data-action="close-catalog-filters">Close</button>
        </div>
        ${catalogFilters("mobile")}
        <div class="filter-sheet-actions">
          <button class="button secondary" data-action="clear-catalog-filters">Clear</button>
          <button class="button primary" data-action="close-catalog-filters">Apply Filters</button>
        </div>
      </aside>
      <section class="lab-section">
        <div class="lab-panel"><span>${products.length}</span><p>Imported product lines</p></div>
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

function activeFilterCount() {
  return state.catalogCategories.length + state.catalogSizes.length;
}

function catalogFilters(mode = "desktop") {
  const categories = catalogCategoryOptions();
  const sizes = catalogSizeOptions();
  return `
    <aside class="${mode === "mobile" ? "filters filter-sheet-body" : "filters"}">
      ${mode === "desktop" ? "<h2>Filters</h2>" : ""}
      <label class="search-field"><span>Search</span><input name="catalog-search" value="${escapeHtml(state.catalogSearch)}" placeholder="Search models" /></label>
      ${categories.length ? filterGroup("Category", categories, state.catalogCategories, "catalog-category") : ""}
      ${
        sizes.length
          ? `<div>
              <p class="filter-title">Size</p>
              <div class="size-grid">${sizes.map((size) => `<button class="${state.catalogSizes.includes(size) ? "selected" : ""}" data-action="catalog-size" data-size="${size}">${size}</button>`).join("")}</div>
            </div>`
          : ""
      }
    </aside>
  `;
}

function productCard(product, variantCount) {
  const productName = escapeHtml(product.name || "Product");
  const category = escapeHtml(product.category || "Uncategorized");
  const imageName = Array.isArray(product.image_names) ? product.image_names[0] : "";
  const variantLabel = variantCount ? `${variantCount} variants` : "Variants available";
  const colours = [...new Set(variantsFor(product.id).map((variant) => String(variant.colour || "").trim()).filter(Boolean))].slice(0, 4);
  return `
    <article class="product-card">
      ${productVisual(product.name, imageName)}
      <div class="product-card-body">
        <div>
          <h3>${productName}</h3>
          <p>${category}</p>
          ${colours.length ? `<div class="swatches">${colours.map((colour) => `<span class="swatch neutral" title="${escapeHtml(colour)}"></span>`).join("")}</div>` : ""}
        </div>
        <div class="price-stack">
          <strong>Reseller access</strong>
          <small>${variantLabel}</small>
        </div>
      </div>
      <button class="card-action" data-route="product" data-product-id="${escapeHtml(product.id)}">View details</button>
    </article>
  `;
}

function productDetail() {
  const product = selectedProduct();
  if (!product) {
    return `
      <main class="detail-page">
        <button class="text-link" data-route="store">Back to catalog</button>
        <section class="empty-state">
          <h1>No product selected</h1>
          <p>Load the new model file first, then product details will appear here.</p>
        </section>
        ${footer(true)}
      </main>
    `;
  }
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
          <h1>${escapeHtml(product.name || "Product")}</h1>
          <img class="detail-brand-mark" src="public/brand/Irunsvan_Blue-removebg-preview.svg" alt="Ivansrun Africa" />
          <p class="section-note">Public buyers can browse product information. Pricing, exact stock, and ordering are reserved for approved Ivansrun Africa reseller accounts.</p>
          ${detail.colours.length ? selectorGroup("Colours", detail.colours) : ""}
          ${detail.sizes.length ? selectorGroup("Sizes", detail.sizes) : ""}
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
          ${inputField("Company Name", "company_name", existingApplication?.company_name || state.auth.profile?.company_name || "")}
          ${inputField("Full Name", "full_name", existingApplication?.full_name || state.auth.profile?.full_name || "")}
          ${inputField("Email", "email", existingApplication?.email || state.auth.user?.email || "", "email")}
          ${needsPassword ? inputField("Password", "password", "Create a password", "password") : ""}
          ${inputField("Phone", "phone", existingApplication?.phone || "")}
          ${inputField("Country", "country", existingApplication?.country || "")}
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
          <h1>Wholesale Shop</h1>
          <p>Choose products, select colour and size options, then submit an order request for admin review.</p>
        </div>
        <div class="portal-actions">
          <button class="button secondary" data-route="history">Request History</button>
          <div class="protected-pill">Approved reseller access</div>
        </div>
      </section>
      ${metricGrid([
        ["Total Products", String(state.products.length), "Active lines"],
        ["Available Options", String(state.variants.length || rows.length), "Colours and sizes"],
        ["Order Mode", "Request", "Approval based"],
        ["Current Request", money(summary.subtotal), "USD"],
      ])}
      ${portalQuickNav(summary)}
      <section class="reseller-grid">
        <div class="inventory-panel reseller-shop-panel" id="portal-shop">
          <div class="panel-toolbar">
            <h2>Shop Products</h2>
            <div class="toolbar-actions">
              <label class="compact-search"><span>Search</span><input name="reseller-search" value="${escapeHtml(state.resellerSearch)}" placeholder="Search products, colours, sizes" /></label>
            </div>
          </div>
          ${state.inventoryError ? `<p class="notice error">${escapeHtml(state.inventoryError)}</p>` : ""}
          <div class="reseller-product-grid">
            ${
              state.inventoryLoading
                ? `<p class="notice">Loading products...</p>`
                : rows.length
                  ? resellerProductCards(rows)
                  : `<p class="notice">No products match this search.</p>`
            }
          </div>
          ${pager(`Showing ${rows.length ? `1-${rows.length}` : "0"} of ${rows.length} options`)}
        </div>
        <aside class="order-sidebar" id="portal-order">
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
                : `<p class="notice">Add products to build this order request.</p>`
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

function portalQuickNav(summary) {
  return `
    <nav class="portal-quick-nav" aria-label="Reseller portal shortcuts">
      <a href="#portal-shop">Shop</a>
      <a href="#portal-order">Draft <span>${escapeHtml(String(summary.itemCount))}</span></a>
      <button data-route="history">History</button>
    </nav>
  `;
}

function resellerProductCards(rows) {
  const groups = rows.reduce((map, row) => {
    const key = row.productId || row.productSku || row.productName;
    const group = map.get(key) || {
      productName: row.productName,
      category: row.category,
      imageName: row.imageName,
      price: row.price,
      rows: [],
    };
    group.rows.push(row);
    group.price = Math.min(Number(group.price || row.price || 0), Number(row.price || group.price || 0));
    if (!group.imageName && row.imageName) group.imageName = row.imageName;
    map.set(key, group);
    return map;
  }, new Map());

  return [...groups.values()].map(resellerProductCard).join("");
}

function availabilityLabel(stockQuantity) {
  const quantity = Number(stockQuantity || 0);
  if (quantity <= 0) return { label: "Sold out", className: "sold-out" };
  if (quantity <= 5) return { label: "Low availability", className: "low" };
  return { label: "Available", className: "" };
}

function resellerProductCard(group) {
  const optionCount = group.rows.length;
  return `
    <article class="reseller-product-card">
      ${productVisual(group.productName, group.imageName)}
      <div class="reseller-product-copy">
        <div class="reseller-product-head">
          <div>
            <p>${escapeHtml(group.category || "Wholesale product")}</p>
            <h3>${escapeHtml(group.productName)}</h3>
          </div>
          <strong>${money(group.price)}</strong>
        </div>
        <div class="variant-picker" aria-label="${escapeHtml(group.productName)} options">
          ${group.rows.map(resellerVariantOption).join("")}
        </div>
        <p class="reseller-product-note">${optionCount} ${optionCount === 1 ? "option" : "options"} available for order request.</p>
      </div>
    </article>
  `;
}

function resellerVariantOption(row) {
  const availability = availabilityLabel(row.stockQuantity);
  const disabled = row.stockQuantity <= 0;
  return `
    <div class="variant-option" data-inventory-line>
      <div>
        <strong>${escapeHtml([row.colour, row.size ? `Size ${row.size}` : ""].filter(Boolean).join(" / ") || row.productName)}</strong>
        <span class="availability ${availability.className}">${availability.label}</span>
      </div>
      <div class="variant-option-actions">
        <input class="qty-input" aria-label="Quantity for ${escapeHtml(row.colour)} size ${escapeHtml(row.size)}" type="number" min="0" max="${row.stockQuantity}" value="${state.resellerDraft[row.variantId] || ""}" data-qty-input="${escapeHtml(row.variantId)}" ${disabled ? "disabled" : ""} />
        <button class="button mini" data-action="add-order-item" data-variant-id="${escapeHtml(row.variantId)}" ${disabled ? "disabled" : ""}>Add</button>
      </div>
    </div>
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
        <button class="button secondary" data-route="reseller">Back to Shop</button>
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
          ["Total Products", String(products.length), "Imported catalog"],
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
          <div class="panel-toolbar"><h2>Product / Inventory Overview</h2><span>${state.variants.length} SKUs</span></div>
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
        ${state.productFormSaved ? `<p class="notice success">${escapeHtml(state.productFormSaveMessage || "Product saved with generated color and size variants.")}</p>` : ""}
        ${state.productFormWarning ? `<p class="notice warning">${escapeHtml(state.productFormWarning)}</p>` : ""}
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
        ${inputField("Model Code", "model_code", "")}
        ${inputField("Product Name", "name", "")}
      </div>
      <div class="two-fields">
        ${inputField("Product Type", "product_type", "shoe")}
        ${inputField("Category", "category", "")}
        ${inputField("Price USD", "price", "", "number")}
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
      ${controlTextarea("Sizes", "sizes", "")}
      <button class="button primary full" type="submit">Save Product</button>
    </form>
  `;
}

function productColorRow(index, imageOptions) {
  return `
    <div class="color-editor-row" data-product-colour-row>
      <input name="colour_original_${index}" placeholder="" />
      <input name="colour_display_${index}" placeholder="" />
      <input name="colour_code_${index}" placeholder="" />
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
      <div><strong>${preview.publishPlan?.summary?.trackedRowsReset || 0}</strong><span>Reset first</span></div>
      <div><strong>${preview.publishPlan?.summary?.absentRowsZeroed || 0}</strong><span>Absent to zero</span></div>
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
      ${(preview.publishPlan?.absentRows || [])
        .slice(0, 8)
        .map(
          (row) => `
            <article class="media-product-row">
              <div>
                <strong>${escapeHtml(row.sku)}</strong>
                <span>Missing from latest file</span>
              </div>
              <div class="media-product-counts">
                <span>${escapeHtml(`${row.previousStock} -> 0 units`)}</span>
              </div>
              <p>Will reset to zero when published.</p>
              <em>absent</em>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function emailCenter() {
  const preview = emailTemplatePreview();
  return `
    <main class="admin-layout">
      ${adminSidebar("email")}
      <section class="admin-main">
        <header class="admin-topbar"><div><h1>Email Center</h1><p>Manage operational emails for applications, order requests, approvals, and imports.</p></div></header>
        <section class="email-grid">
          ${emailCard("order", "New order request", "Admin receives order summary, reseller details, item count, and total.")}
          ${emailCard("application", "Application submitted", "Admin receives company, contact, country, and business notes.")}
          ${emailCard("approval", "Approval notice", "Reseller receives account approval and login instructions.")}
          ${emailCard("import", "Import warning", "Admin receives skipped SKU report after a catalog or stock import.")}
        </section>
        ${preview}
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

function emailTemplatePreview() {
  if (!state.emailTemplatePreview) return "";
  const templates = {
    order: {
      title: "New order request",
      subject: "New order request #RE-64AC70BB from Reseller Company",
      lines: ["Order code", "Reseller company and email", "SKU count and total units", "Estimated subtotal", "Reseller notes"],
    },
    application: {
      title: "Application submitted",
      subject: "New reseller application from Company Name",
      lines: ["Company name", "Contact name and email", "Country and phone", "Business notes"],
    },
    approval: {
      title: "Approval notice",
      subject: "Your Ivansrun Africa reseller account was approved",
      lines: ["Approval status", "Login instructions", "Portal link", "Next steps for order requests"],
    },
    import: {
      title: "Import warning",
      subject: "Ivansrun Africa import completed with warnings",
      lines: ["Import filename", "Processed rows", "Skipped rows", "Rows needing review"],
    },
  };
  const template = templates[state.emailTemplatePreview] || templates.order;
  return `
    <section class="admin-card email-template-preview">
      <div class="admin-card-head">
        <h2>${escapeHtml(template.title)} Template</h2>
        <button data-action="close-email-template">Close</button>
      </div>
      <p><strong>Subject:</strong> ${escapeHtml(template.subject)}</p>
      <ul>${template.lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
    </section>
  `;
}

function emailCard(template, title, copy) {
  return `<article class="email-card"><span>Email</span><h2>${escapeHtml(title)}</h2><p>${escapeHtml(copy)}</p><button class="button secondary" data-action="preview-email-template" data-template="${escapeHtml(template)}">View Template</button></article>`;
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
      <div><button disabled>Prev</button><button class="active">1</button></div>
    </div>
  `;
}

function catalogPager({ startIndex, endIndex, totalProducts, currentPage, totalPages }) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  return `
    <div class="pager">
      <span>${escapeHtml(`Showing ${startIndex ? `${startIndex}-${endIndex}` : "0"} of ${totalProducts} products`)}</span>
      <div>
        <button data-action="catalog-page" data-page="${currentPage - 1}" ${currentPage <= 1 ? "disabled" : ""}>Prev</button>
        ${pages
          .map(
            (page) => `<button data-action="catalog-page" data-page="${page}" class="${page === currentPage ? "active" : ""}">${page}</button>`,
          )
          .join("")}
        <button data-action="catalog-page" data-page="${currentPage + 1}" ${currentPage >= totalPages ? "disabled" : ""}>Next</button>
      </div>
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

  document.querySelectorAll("[data-action='toggle-mobile-nav']").forEach((button) => {
    button.addEventListener("click", () => {
      state.mobileNavOpen = !state.mobileNavOpen;
      render();
    });
  });

  document.querySelectorAll("[data-action='close-mobile-nav']").forEach((button) => {
    button.addEventListener("click", () => {
      state.mobileNavOpen = false;
      render();
    });
  });

  document.querySelectorAll("[data-action='go-back']").forEach((button) => {
    button.addEventListener("click", () => {
      goBack();
    });
  });

  document.querySelectorAll("[data-action='open-catalog-filters']").forEach((button) => {
    button.addEventListener("click", () => {
      state.catalogFiltersOpen = true;
      render();
    });
  });

  document.querySelectorAll("[data-action='close-catalog-filters']").forEach((button) => {
    button.addEventListener("click", () => {
      state.catalogFiltersOpen = false;
      render();
    });
  });

  document.querySelectorAll("[data-action='clear-catalog-filters']").forEach((button) => {
    button.addEventListener("click", () => {
      state.catalogSearch = "";
      state.catalogCategories = [];
      state.catalogSizes = [];
      state.catalogPage = 1;
      state.catalogMaxPrice = 80;
      render();
    });
  });

  document.querySelectorAll("[data-action='preview-email-template']").forEach((button) => {
    button.addEventListener("click", () => {
      state.emailTemplatePreview = button.getAttribute("data-template") || "order";
      render();
    });
  });

  document.querySelectorAll("[data-action='close-email-template']").forEach((button) => {
    button.addEventListener("click", () => {
      state.emailTemplatePreview = null;
      render();
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
      if (formName === "product") await handleProductSubmit(form);
      render();
    });
  });

  document.querySelectorAll("[data-action='toggle-product-form']").forEach((button) => {
    button.addEventListener("click", () => {
      state.productFormOpen = !state.productFormOpen;
      state.productFormError = null;
      state.productFormWarning = null;
      state.productFormSaved = false;
      state.productFormSaveMessage = null;
      render();
    });
  });

  document.querySelectorAll("[name='image_files']").forEach((input) => {
    input.addEventListener("change", () => {
      state.productImageDrafts = [...(input.files || [])].map((file) => ({ name: file.name, file }));
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
      const input = button.closest("[data-inventory-line]")?.querySelector(`[data-qty-input="${variantId}"]`) || document.querySelector(`[data-qty-input="${variantId}"]`);
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
      state.catalogPage = 1;
      render();
    });
  });

  document.querySelectorAll("[name='catalog-sort']").forEach((select) => {
    select.addEventListener("change", () => {
      state.catalogSort = select.value;
      state.catalogPage = 1;
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
      state.catalogPage = 1;
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
      state.catalogPage = 1;
      render();
    });
  });

  document.querySelectorAll("[data-action='catalog-page']").forEach((button) => {
    button.addEventListener("click", () => {
      const nextPage = Number(button.getAttribute("data-page"));
      if (!Number.isFinite(nextPage) || button.disabled) return;
      state.catalogPage = nextPage;
      render();
    });
  });
}

function goBack() {
  const target = MobileNavigation.backTargetForRoute(state.route);
  if (!target) return;
  if (state.navigationDepth > 0) {
    window.history.back();
    return;
  }
  setRoute(target.route, target, { writeHistory: false });
}

function syncRouteFromLocation(options = {}) {
  const parsed = MobileNavigation.parseRouteUrl(window.location.hash);
  if (!parsed) return;
  const nextRoute = routeForAccess(parsed.route);
  state.route = nextRoute;
  if (parsed.productId) state.selectedProductId = parsed.productId;
  state.mobileNavOpen = false;
  state.catalogFiltersOpen = false;
  if (options.replaceHistory !== false) {
    window.history.replaceState({ route: nextRoute, productId: state.selectedProductId || null }, "", MobileNavigation.buildRouteUrl(nextRoute, { productId: state.selectedProductId }));
  }
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
    const orderRequest = state.orderRequests.find((request) => request.id === orderId);
    if (status === "approved" && orderRequest?.status !== "approved") {
      const adjustments = AdminOrders.buildApprovalInventoryAdjustments({
        orderId,
        items: state.orderRequestItems,
        inventory: state.inventory,
      });
      for (const adjustment of adjustments) {
        await patchAuthedSupabase("inventory", `id=eq.${encodeURIComponent(adjustment.id)}`, {
          stock_quantity: adjustment.nextStock,
          source: "order_approval",
        });
      }
    }
    const patch = AdminOrders.buildOrderStatusPatch(status, `Updated from admin dashboard on ${new Date().toLocaleString()}`);
    await patchAuthedSupabase("order_requests", `id=eq.${encodeURIComponent(orderId)}`, patch);
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

function collectProductColourRows(data) {
  return Array.from({ length: 6 }, (_, index) => ({
    original: data.get(`colour_original_${index}`),
    display: data.get(`colour_display_${index}`),
    code: data.get(`colour_code_${index}`),
    image: data.get(`colour_image_${index}`),
  }));
}

function applySavedProductToState(product, variants) {
  const variantSkus = new Set(variants.map((variant) => variant.sku));
  state.products = [...state.products.filter((item) => item.sku !== product.sku), product];
  state.variants = [
    ...state.variants.filter((item) => item.product_id !== product.id && !variantSkus.has(item.sku)),
    ...variants,
  ];
}

function productInputFromFormData(data, colourRows, imageNames) {
  return ProductEditor.buildProductInputFromEditor({
    fields: {
      model_code: data.get("model_code"),
      name: data.get("name"),
      category: data.get("category"),
      price: data.get("price"),
      sizes: data.get("sizes"),
      product_type: data.get("product_type"),
    },
    colourRows,
    imageNames,
  });
}

async function handleProductSubmit(form) {
  state.productFormError = null;
  state.productFormWarning = null;
  state.productFormSaved = false;
  state.productFormSaveMessage = null;

  try {
    const data = new FormData(form);
    const colourRows = collectProductColourRows(data);
    const imageNames = ProductEditor.buildImageOptions(state.productImageDrafts).map((image) => image.name);
    const initialProduct = ProductCatalogManager.buildProductDraft(productInputFromFormData(data, colourRows, imageNames));
    const imageFiles = state.productImageDrafts.map((item) => item.file).filter(Boolean);
    const imageRecords = ProductPersistence.buildStoredImageRecords({
      productSku: initialProduct.sku,
      files: imageFiles,
      uniquePrefix: new Date().toISOString().replace(/\D/g, ""),
    });
    const storagePathByName = new Map(imageRecords.map((record) => [record.originalName, record.storagePath]));
    const storedImageNames = imageNames.map((name) => storagePathByName.get(name) || name);
    const storedColourRows = colourRows.map((row) => ({
      ...row,
      image: storagePathByName.get(String(row.image || "")) || row.image,
    }));
    const product = {
      ...ProductCatalogManager.buildProductDraft(productInputFromFormData(data, storedColourRows, storedImageNames)),
      published: true,
    };
    for (const record of imageRecords) {
      await uploadProductImage(record);
    }
    const [savedProductRow] = await upsertAuthedSupabase("products", ProductPersistence.buildProductUpsertPayload(product), "sku");
    if (!savedProductRow?.id) throw new Error("Supabase saved the product but did not return its id.");
    const savedProduct = {
      ...product,
      ...savedProductRow,
      colours: product.colours,
      sizes: product.sizes,
      published: true,
    };
    const variantDrafts = ProductCatalogManager.generateProductVariants(savedProduct).map((variant) => ({ ...variant, published: true }));
    const savedVariantRows = await upsertAuthedSupabase(
      "product_variants",
      ProductPersistence.buildVariantUpsertPayloads(variantDrafts, savedProduct.id),
      "sku",
    );
    if (!savedVariantRows.length || savedVariantRows.some((variant) => !variant.id)) {
      throw new Error("Supabase saved the product but did not return generated variant ids.");
    }
    await upsertAuthedSupabase(
      "inventory",
      ProductPersistence.buildZeroInventoryPayloads(savedVariantRows.map((variant) => ({ ...variant, product_sku: savedProduct.sku }))),
      "sku",
    );
    applySavedProductToState(savedProduct, savedVariantRows);
    state.inventory = InventoryWorkflow.applyInventoryPublishPlan(
      state.inventory,
      InventoryWorkflow.buildInventoryPublishPlan({
        inventory: state.inventory,
        stockMatches: savedVariantRows.map((variant) => ({
          variantId: variant.id,
          variantSku: variant.sku,
          modelCode: savedProduct.model_code,
          nextStock: 0,
        })),
        source: "manual_product_setup",
      }),
    );
    state.productFormSaveMessage = "Product saved with images, colors, sizes, generated variants, and zero starting stock.";

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
      if (state.importPreview.publishPlan?.rows?.length) {
        const inventoryPayload = state.importPreview.publishPlan.rows.map((row) => ({
          id: row.id,
          variant_id: row.variant_id,
          sku: row.sku,
          style_code: row.style_code,
          stock_quantity: row.stock_quantity,
          source: row.source,
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

window.addEventListener("popstate", (event) => {
  const routeState = event.state || MobileNavigation.parseRouteUrl(window.location.hash);
  if (!routeState?.route || !ROUTES.includes(routeState.route)) return;
  state.navigationDepth = Math.max(0, state.navigationDepth - 1);
  state.route = routeForAccess(routeState.route);
  if (routeState.productId) state.selectedProductId = routeState.productId;
  state.mobileNavOpen = false;
  state.catalogFiltersOpen = false;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

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

async function initializeApp() {
  syncRouteFromLocation();
  render();
  await loadCatalog();
  await initAuth();
}

initializeApp();
