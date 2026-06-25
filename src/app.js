const SUPABASE_URL = "https://llicocwonbokahpbireg.supabase.co";
const SUPABASE_KEY = "sb_publishable_6V8LkQ_EwGCeYqtdqxcpqg_RcaqSINj";

const ROUTES = [
  "store",
  "story",
  "product",
  "product-flyers",
  "product-flyer",
  "find-reseller",
  "apply",
  "signup",
  "login",
  "admin-login",
  "account",
  "reseller",
  "reseller-product",
  "request-confirmation",
  "history",
  "current-orders",
  "expected-orders",
  "fulfillment",
  "order",
  "admin",
  "team",
  "requests",
  "requests-review",
  "requests-payment",
  "requests-supplier",
  "requests-completed",
  "applications",
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

const SiteControls = window.IrunsvanSiteControls;
const Auth = window.IrunsvanAuth;
const SupabaseClient = window.IrunsvanSupabaseClient;
const Orders = window.IrunsvanResellerOrders;
const AdminOrders = window.IrunsvanAdminOrders;
const Applications = window.IrunsvanResellerApplications;
const SitePublish = window.IrunsvanSitePublish;
const ImportParser = window.IrunsvanImportParser;
const AdminImports = window.IrunsvanAdminImports;
const ProductEditor = window.IrunsvanProductEditor;
const ProductCatalogManager = window.IrunsvanProductCatalogManager;
const ProductPersistence = window.IrunsvanProductPersistence;
const CatalogSeedBuilder = window.IrunsvanCatalogSeedBuilder;
const ProductImages = window.IrunsvanProductImages;
const StorefrontCatalog = window.IrunsvanStorefrontCatalog;
const EmailNotifications = window.IrunsvanEmailNotifications;
const ProductDetailModel = window.IrunsvanProductDetail;
const MobileNavigation = window.IrunsvanMobileNavigation;
const InventoryWorkflow = window.IrunsvanInventoryWorkflow;
const CatalogData = window.IrunsvanCatalogData;
const OperationsProducts = window.IrunsvanOperationsProducts;
const WebsiteContent = window.IrunsvanWebsiteContent;
const OrderExport = window.IrunsvanOrderExport;
const SITE_CONTENT_STORAGE_KEY = "irunsvan_site_content";
const SERVER_MONITOR_ENABLED =
  typeof window !== "undefined" &&
  (["localhost", "127.0.0.1", ""].includes(window.location.hostname) ||
    new URLSearchParams(window.location.search).get("monitor") === "servers");
const IMPORT_LIBRARY_URLS = {
  xlsx: "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js",
  jszip: "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js",
};
const importLibraryLoads = {};

function readStoredSiteContent() {
  try {
    return JSON.parse(localStorage.getItem(SITE_CONTENT_STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

function readInitialRouteState() {
  return MobileNavigation.parseRouteUrl(window.location.hash) || { route: "store", productId: null, orderId: null, storySlug: null, flyerSlug: null };
}

function hasPendingOAuthCallback() {
  const search = new URLSearchParams(window.location.search);
  const hash = String(window.location.hash || "");
  return (
    search.has("oauth") ||
    search.has("code") ||
    search.has("error_code") ||
    search.has("error") ||
    search.has("error_description") ||
    hash.includes("access_token=") ||
    hash.includes("error=")
  );
}

function hasStoredAuthSession() {
  return Boolean(SupabaseClient.readStoredSession()?.access_token);
}

const initialRouteState = readInitialRouteState();

const state = {
  route: initialRouteState.route,
  selectedProductId: initialRouteState.productId,
  selectedOrderId: initialRouteState.orderId || null,
  selectedStorySlug: initialRouteState.storySlug || null,
  selectedProductFlyerSlug: initialRouteState.flyerSlug || null,
  products: [],
  variants: [],
  homepageFlyers: WebsiteContent.normalizeFlyers([]),
  homeFlyerIndex: 0,
  blogPosts: [],
  publicProductFlyers: [],
  resellerDirectory: [],
  colourMappings: [],
  inventory: [],
  orderRequests: [],
  orderRequestItems: [],
  resellerApplicationsData: [],
  importJobs: [],
  staffProfiles: [],
  adminInvites: [],
  loading: true,
  authLoading: true,
  authBootstrapPending: hasPendingOAuthCallback() || hasStoredAuthSession(),
  inventoryLoading: false,
  historyLoading: false,
  applicationsLoading: false,
  homepageContentLoading: false,
  error: null,
  authError: null,
  inventoryError: null,
  historyError: null,
  applicationError: null,
  homepageContentError: null,
  routeNotice: null,
  applicationSubmitted: false,
  orderSubmitted: false,
  orderConfirmation: null,
  loginSubmitted: false,
  loginPending: false,
  passwordRecoveryOpen: false,
  passwordRecoveryPending: false,
  passwordRecoverySent: false,
  passwordRecoveryError: null,
  passwordResetMode: false,
  signupConfirmationEmail: null,
  orderSubmitPending: false,
  applicationSubmitPending: false,
  siteSavePending: false,
  flyerSavePending: false,
  storySavePending: false,
  publicProductFlyerSavePending: false,
  publicProductFlyerEditingId: null,
  siteControlSection: "product-flyers",
  aboutSavePending: false,
  importPending: false,
  stockResetPending: false,
  accountProfileSavePending: false,
  accountProfileSaved: false,
  accountProfileError: null,
  accountPasswordSavePending: false,
  accountPasswordSaved: false,
  accountPasswordError: null,
  teamSavePending: false,
  teamSaved: false,
  teamError: null,
  siteSaved: false,
  siteSaveError: null,
  colourReviewPending: false,
  colourReviewSaved: false,
  colourReviewError: null,
  productFormOpen: false,
  productFormError: null,
  productFormSaved: false,
  productFormWarning: null,
  productFormSaveMessage: null,
  productPriceSaved: false,
  productPriceError: null,
  productImageDrafts: [],
  emailTemplatePreview: null,
  adminInviteToken: null,
  adminInviteDetails: null,
  adminInviteLookupPending: false,
  adminInviteClaimPending: false,
  adminInviteError: null,
  adminInviteCreatedLink: null,
  adminInviteCreatedEmail: null,
  teamInviteCreatePending: false,
  teamInviteError: null,
  adminContentError: null,
  mobileNavOpen: false,
  catalogFiltersOpen: false,
  navigationDepth: 0,
  importError: null,
  stockResetError: null,
  stockResetSaved: false,
  importPreview: null,
  resellerSearch: "",
  resellerNotes: "",
  resellerDraft: {},
  resellerQuickOrderProductId: null,
  resellerColourSelection: {},
  catalogImageSelection: {},
  catalogSearch: "",
  catalogCategories: [],
  catalogSizes: [],
  catalogPage: 1,
  catalogMaxPrice: 80,
  catalogSort: "sku",
  siteContent: SiteControls.sanitizeSiteContent(readStoredSiteContent()),
  auth: Auth.normalizeAuthState(),
};

const CATALOG_PAGE_SIZE = 8;
const SITE_CONTROL_SECTIONS = [
  ["product-flyers", "Product Flyers"],
  ["homepage-flyers", "Homepage Flyers"],
  ["stories", "Stories"],
  ["about", "About"],
  ["hero-theme", "Hero & Theme"],
];

function money(value) {
  if (value === null || value === undefined || value === "") return "Price TBC";
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? `$${amount.toFixed(2)}` : "Price TBC";
}

function priceBadge(price) {
  const value = price && typeof price === "object" && "priced" in price ? price.amount : price;
  const currency = price && typeof price === "object" ? price.currency : "USD";
  const state = OperationsProducts.priceState(value, currency);
  return `<span class="status-badge ${state.tone === "danger" ? "danger" : "good"}">${escapeHtml(state.label)}</span>`;
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

function mergeAuthorizedPrices(rows = [], priceRows = []) {
  const pricesById = new Map((priceRows || []).map((row) => [row.id, row]));
  return rows.map((row) => {
    const price = pricesById.get(row.id);
    if (!price) return row;
    return {
      ...row,
      base_price: price.base_price,
      base_currency: price.base_currency || row.base_currency || "USD",
    };
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

function resolveContentImageUrl(path) {
  const value = String(path || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value) || value.startsWith("/")) return value;
  return `${SUPABASE_URL}/storage/v1/object/public/${WebsiteContent.CONTENT_IMAGE_BUCKET}/${value.split("/").map((part) => encodeURIComponent(part)).join("/")}`;
}

function ctaMarkup(label, route, classes) {
  const safeLabel = escapeHtml(label);
  const safeRoute = String(route || "").trim();
  if (safeRoute === "catalog" || safeRoute === "products") {
    return `<button class="${classes}" data-route="product-flyers">${safeLabel} <span class="button-mark" aria-hidden="true">&nearr;</span></button>`;
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
  return `<img class="brand-logo" src="${src}" alt="Irunsvan Africa" />`;
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

function uniqueImageNames(values = []) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

function selectedCarouselImage(key, imageNames = []) {
  if (!imageNames.length) return "";
  const index = Number(state.catalogImageSelection[key] || 0);
  return imageNames[((index % imageNames.length) + imageNames.length) % imageNames.length] || imageNames[0];
}

function productCardImages(product) {
  return uniqueImageNames([
    ...(Array.isArray(product.image_names) ? product.image_names : []),
    ...variantsFor(product.id).map((variant) => variant.image_name),
  ]);
}

function productVisualCarousel({ key, label, imageNames = [] }) {
  const selectedImage = selectedCarouselImage(key, imageNames);
  const selectedIndex = Math.max(0, imageNames.indexOf(selectedImage));
  const hasMultiple = imageNames.length > 1;
  return `
    <div class="product-card-gallery" data-gallery-key="${escapeHtml(key)}">
      ${productVisual(label, selectedImage)}
      ${
        hasMultiple
          ? `
            <button class="gallery-arrow previous" type="button" data-action="catalog-image-step" data-gallery-key="${escapeHtml(key)}" data-direction="-1" aria-label="Previous image for ${escapeHtml(label)}">&lsaquo;</button>
            <button class="gallery-arrow next" type="button" data-action="catalog-image-step" data-gallery-key="${escapeHtml(key)}" data-direction="1" aria-label="Next image for ${escapeHtml(label)}">&rsaquo;</button>
            <span class="gallery-count">${escapeHtml(`${selectedIndex + 1}/${imageNames.length}`)}</span>
          `
          : ""
      }
    </div>
  `;
}

const SUPABASE_REST_PAGE_SIZE = 1000;

function pagedSupabaseQuery(query, limit, offset) {
  const params = new URLSearchParams(query);
  params.set("limit", String(limit));
  if (offset > 0) params.set("offset", String(offset));
  else params.delete("offset");
  return params.toString();
}

async function fetchSupabaseRows(label, table, query, headers) {
  const params = new URLSearchParams(query);
  const requestedLimit = Number(params.get("limit") || SUPABASE_REST_PAGE_SIZE);
  const totalLimit = Number.isFinite(requestedLimit) && requestedLimit > 0 ? requestedLimit : SUPABASE_REST_PAGE_SIZE;
  const pageSize = Math.min(totalLimit, SUPABASE_REST_PAGE_SIZE);
  const rows = [];

  while (rows.length < totalLimit) {
    const pageQuery = pagedSupabaseQuery(query, Math.min(pageSize, totalLimit - rows.length), rows.length);
    const response = await monitoredFetch(`${label}:${table}`, `${SUPABASE_URL}/rest/v1/${table}?${pageQuery}`, { headers });
    if (!response.ok) throw await buildResponseError(`${table} fetch failed`, response);
    const pageRows = await response.json();
    if (!Array.isArray(pageRows)) return pageRows;
    rows.push(...pageRows);
    if (pageRows.length < pageSize) break;
  }

  return rows;
}

async function fetchSupabase(table, query) {
  return fetchSupabaseRows("public", table, query, {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
  });
}

async function fetchAuthedSupabase(table, query) {
  const session = SupabaseClient.readStoredSession();
  return fetchSupabaseRows("authed", table, query, SupabaseClient.headers(SUPABASE_KEY, session?.access_token));
}

function requireAuthedSession() {
  const session = SupabaseClient.readStoredSession();
  if (!session?.access_token) {
    throw new Error("Sign in with a real Supabase account to use admin or reseller actions.");
  }
  return session;
}

async function insertAuthedSupabase(table, payload) {
  const session = requireAuthedSession();
  const response = await monitoredFetch(`insert:${table}`, `${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      ...SupabaseClient.headers(SUPABASE_KEY, session?.access_token),
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw await buildResponseError(`${table} insert failed`, response);
  return response.json();
}

async function upsertAuthedSupabase(table, payload, conflictColumn) {
  const session = requireAuthedSession();
  const response = await monitoredFetch(`upsert:${table}`, `${SUPABASE_URL}/rest/v1/${table}?on_conflict=${encodeURIComponent(conflictColumn)}`, {
    method: "POST",
    headers: {
      ...SupabaseClient.headers(SUPABASE_KEY, session?.access_token),
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw await buildResponseError(`${table} upsert failed`, response);
  return response.json();
}

async function updateAuthedSupabase(table, id, payload) {
  const session = requireAuthedSession();
  const response = await monitoredFetch(`update:${table}`, `${SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      ...SupabaseClient.headers(SUPABASE_KEY, session?.access_token),
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw await buildResponseError(`${table} update failed`, response);
  return response.json();
}

async function deleteAuthedSupabase(table, filters) {
  const session = requireAuthedSession();
  const response = await monitoredFetch(`delete:${table}`, `${SUPABASE_URL}/rest/v1/${table}?${filters}`, {
    method: "DELETE",
    headers: {
      ...SupabaseClient.headers(SUPABASE_KEY, session?.access_token),
      Prefer: "return=minimal",
    },
  });
  if (!response.ok) throw await buildResponseError(`${table} delete failed`, response);
  return true;
}

async function uploadProductImage(record) {
  const session = requireAuthedSession();
  const response = await monitoredFetch(
    `storage:${ProductPersistence.PRODUCT_IMAGE_BUCKET}`,
    `${SUPABASE_URL}/storage/v1/object/${ProductPersistence.PRODUCT_IMAGE_BUCKET}/${record.storagePath}`,
    {
    method: "POST",
    headers: {
      ...SupabaseClient.headers(SUPABASE_KEY, session?.access_token),
      "Content-Type": record.contentType,
      "Cache-Control": "3600",
    },
    body: record.file,
  });
  if (!response.ok) throw await buildResponseError("image upload failed", response);
  return response.json().catch(() => ({ path: record.storagePath }));
}

async function uploadContentImage(record) {
  const session = requireAuthedSession();
  const response = await monitoredFetch(
    `storage:${WebsiteContent.CONTENT_IMAGE_BUCKET}`,
    `${SUPABASE_URL}/storage/v1/object/${WebsiteContent.CONTENT_IMAGE_BUCKET}/${record.storagePath}`,
    {
      method: "POST",
      headers: {
        ...SupabaseClient.headers(SUPABASE_KEY, session?.access_token),
        "Content-Type": record.contentType,
        "Cache-Control": "3600",
      },
      body: record.file,
    },
  );
  if (!response.ok) throw await buildResponseError("content image upload failed", response);
  return response.json().catch(() => ({ path: record.storagePath }));
}

async function invokeAuthedFunction(functionName, payload) {
  const session = requireAuthedSession();
  const response = await monitoredFetch(`function:${functionName}`, `${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: "POST",
    headers: {
      ...SupabaseClient.headers(SUPABASE_KEY, session?.access_token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw await buildResponseError(`${functionName} invoke failed`, response);
  return response.json().catch(() => ({}));
}

async function invokeAuthedRpc(functionName, payload) {
  const session = requireAuthedSession();
  const response = await monitoredFetch(`rpc:${functionName}`, `${SUPABASE_URL}/rest/v1/rpc/${functionName}`, {
    method: "POST",
    headers: {
      ...SupabaseClient.headers(SUPABASE_KEY, session?.access_token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw await buildResponseError(`${functionName} invoke failed`, response);
  return response.json();
}

async function invokePublicRpc(functionName, payload) {
  const response = await monitoredFetch(`rpc:${functionName}`, `${SUPABASE_URL}/rest/v1/rpc/${functionName}`, {
    method: "POST",
    headers: {
      ...SupabaseClient.headers(SUPABASE_KEY, SUPABASE_KEY),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw await buildResponseError(`${functionName} invoke failed`, response);
  return response.json();
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
  const session = requireAuthedSession();
  const response = await monitoredFetch(`patch:${table}`, `${SUPABASE_URL}/rest/v1/${table}?${filters}`, {
    method: "PATCH",
    headers: {
      ...SupabaseClient.headers(SUPABASE_KEY, session?.access_token),
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw await buildResponseError(`${table} update failed`, response);
  return response.json();
}

async function patchAuthedSupabaseMinimal(table, filters, payload) {
  const session = requireAuthedSession();
  const response = await monitoredFetch(`patch:${table}`, `${SUPABASE_URL}/rest/v1/${table}?${filters}`, {
    method: "PATCH",
    headers: {
      ...SupabaseClient.headers(SUPABASE_KEY, session?.access_token),
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw await buildResponseError(`${table} update failed`, response);
  return true;
}

async function responseBodySnippet(response) {
  const body = await response.clone().text().catch(() => "");
  return String(body || "").replace(/\s+/g, " ").trim().slice(0, 400);
}

async function buildResponseError(prefix, response) {
  const snippet = await responseBodySnippet(response);
  return new Error(snippet ? `${prefix}: ${response.status} ${snippet}` : `${prefix}: ${response.status}`);
}

function readableAdminInviteError(error, fallback = "Unable to claim admin invite") {
  const raw = error instanceof Error ? error.message : String(error || fallback);
  const jsonStart = raw.indexOf("{");
  const jsonEnd = raw.lastIndexOf("}");
  if (jsonStart >= 0 && jsonEnd > jsonStart) {
    try {
      const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
      if (parsed?.message) return String(parsed.message);
    } catch {
      // Fall back to targeted plain-language matches below.
    }
  }
  if (/different email address/i.test(raw)) return "This invite was sent to a different email address.";
  if (/already been used/i.test(raw)) return "This admin invite link has already been used.";
  if (/has expired/i.test(raw)) return "This admin invite link has expired.";
  if (/has been revoked/i.test(raw)) return "This admin invite link has been revoked.";
  if (/invalid/i.test(raw) && /invite/i.test(raw)) return "This admin invite link is invalid or has already been used.";
  return raw || fallback;
}

function readablePublicProductFlyerDatabaseError(error, fallback = "Unable to save public product flyer") {
  const raw = error instanceof Error ? error.message : String(error || fallback);
  if (/public_product_flyers/i.test(raw) && /404|could not find|not found|schema cache/i.test(raw)) {
    return "Public product flyer edits cannot save yet because Supabase is missing the public_product_flyers table. Apply supabase/sql/020_public_product_flyers.sql, then refresh and try again.";
  }
  return raw || fallback;
}

async function monitoredFetch(label, url, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  const startedAt = Date.now();
  if (SERVER_MONITOR_ENABLED) {
    console.info("[server-monitor]", "request", { label, method, url });
  }

  try {
    const response = await fetch(url, options);
    if (SERVER_MONITOR_ENABLED) {
      const durationMs = Date.now() - startedAt;
      console.info("[server-monitor]", "response", { label, method, url, status: response.status, durationMs });
      if (!response.ok) {
        const body = await response.clone().text().catch(() => "");
        console.info("[server-monitor]", "failure", {
          label,
          method,
          url,
          status: response.status,
          body: String(body || "").slice(0, 400),
        });
      }
    }
    return response;
  } catch (error) {
    if (SERVER_MONITOR_ENABLED) {
      const durationMs = Date.now() - startedAt;
      console.info("[server-monitor]", "network-error", {
        label,
        method,
        url,
        durationMs,
        message: error instanceof Error ? error.message : String(error),
      });
    }
    throw error;
  }
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

function loadExternalScript(key, src, globalName) {
  if (window[globalName]) return Promise.resolve();
  if (importLibraryLoads[key]) return importLibraryLoads[key];
  importLibraryLoads[key] = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      delete importLibraryLoads[key];
      reject(new Error(`${globalName} could not be loaded.`));
    };
    document.head.appendChild(script);
  });
  return importLibraryLoads[key];
}

async function ensureImportLibraries(type, fileName = "") {
  const needsSpreadsheet = (type === "inventory_xlsx" && !/\.csv$/i.test(fileName)) || type === "order_xlsx";
  if (needsSpreadsheet) {
    await loadExternalScript("xlsx", IMPORT_LIBRARY_URLS.xlsx, "XLSX");
  }
  if (type === "media_pack_zip") {
    await loadExternalScript("jszip", IMPORT_LIBRARY_URLS.jszip, "JSZip");
  }
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
      if (!state.variants.length) {
        const seed = CatalogSeedBuilder.buildCatalogSeed({
          inventoryRows: parsedMaster.rows,
          selectedModelCodes: state.products.map((product) => product.model_code),
          selectedProducts: state.products,
          imageLibrary: selectedProductImageLibrary(),
        });
        return AdminImports.buildImportPreview({
          type: "catalog_seed_inventory",
          filename: file.name,
          rowsTotal: rows.length,
          processedRows: seed.variants.length,
          errors: [
            ...parsedMaster.errors,
            ...seed.warnings.map((warning) => ({
              row: warning.model_code,
              code: warning.code,
              sku: warning.original_colour,
            })),
          ],
          products: seed.products,
          variants: seed.variants,
          colourMappings: seed.colourMappings,
          inventoryRows: seed.inventorySeedRows,
          seedSummary: seed.summary,
        });
      }

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

async function fetchOptionalSupabaseResult(table, query) {
  try {
    return { ok: true, rows: await fetchSupabase(table, query) };
  } catch (error) {
    return { ok: false, rows: [], error };
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
    about: {
      heading: content.about_heading,
      body: content.about_body,
    },
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
  const rows = Orders.availableInventoryRows(inventoryRows());
  if (!search) return rows;
  return rows.filter((row) =>
    [row.productName, row.productSku, row.sku, row.colour, row.size].some((value) => String(value || "").toLowerCase().includes(search)),
  );
}

function adminProductModels() {
  return OperationsProducts.buildAdminProductModels({
    products: catalogProducts(),
    inventoryRows: inventoryRows(),
  });
}

function currentDraftItems() {
  return Orders.draftItems(inventoryRows(), state.resellerDraft);
}

function currentDraftSummary() {
  return Orders.buildDraftSummaryLabel(Orders.draftSummary(currentDraftItems()));
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

function roleLabel(role = state.auth.role) {
  switch (role) {
    case "admin":
      return "Admin";
    case "reseller":
      return "Approved Reseller";
    case "pending_reseller":
      return "Pending Reseller";
    default:
      return "Guest";
  }
}

function currentUserCountry() {
  return latestOwnApplication()?.country || "Not set";
}

function buildAdminInviteUrl(token) {
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set("invite", token);
  return url.toString();
}

async function hashInviteToken(token) {
  const bytes = new TextEncoder().encode(String(token || ""));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function consumeAdminInviteHint() {
  const url = new URL(window.location.href);
  const token = url.searchParams.get("invite");
  return token ? token.trim() : null;
}

function currentPortalMode() {
  if (isAdminRoute() || (state.route === "account" && state.auth.isAdmin)) return "admin";
  if (isResellerRoute() || (state.route === "account" && state.auth.isAuthenticated)) return "reseller";
  return "public";
}

function requestHistoryRecords() {
  return AdminOrders.buildAdminOrderRecords(state.orderRequests, state.orderRequestItems).map((record) => ({
    ...record,
    code: formatRequestCode(record.id),
  }));
}

function visibleRequestHistoryRecords() {
  if (state.auth.isAdmin) return requestHistoryRecords();
  const userId = state.auth.user?.id;
  if (!userId) return [];
  const allowedOrderIds = new Set(
    state.orderRequests.filter((request) => !request.reseller_id || request.reseller_id === userId).map((request) => request.id),
  );
  return requestHistoryRecords().filter((record) => allowedOrderIds.has(record.id));
}

function visibleOrderBuckets() {
  return AdminOrders.buildClientOrderBuckets(visibleRequestHistoryRecords());
}

function orderRecordById(orderId) {
  return requestHistoryRecords().find((record) => record.id === orderId) || null;
}

function orderItemsFor(orderId) {
  return state.orderRequestItems.filter((item) => item.order_request_id === orderId);
}

function selectedOrderRecord() {
  if (!state.selectedOrderId) return null;
  const record = orderRecordById(state.selectedOrderId);
  if (!record) return null;
  if (state.auth.isAdmin) return record;
  return visibleRequestHistoryRecords().some((entry) => entry.id === record.id) ? record : null;
}

function visibleOrderRecords() {
  return state.auth.isAdmin ? requestHistoryRecords() : visibleRequestHistoryRecords();
}

function orderCompanyFor(record) {
  const request = state.orderRequests.find((entry) => entry.id === record?.id);
  if (!request?.reseller_id) return state.auth.profile?.company_name || state.auth.user?.email || "Reseller account";
  const profile = profileForUserId(request.reseller_id);
  return profile?.company_name || profile?.email || "Reseller account";
}

function orderStatusTimeline(record) {
  const normalizedStatus = record?.normalizedStatus || AdminOrders.normalizeOrderStatus(record?.status);
  const steps = [
    ["submitted", "Request Submitted", record?.createdAt],
    ["awaiting_payment", "Awaiting Payment", record?.approvedAt],
    ["paid", "Payment Received", record?.paidAt],
    ["submitted_to_supplier", "Sent to Supplier", record?.supplierSubmittedAt],
    ["processing", "Processing", record?.processingAt],
    ["shipped", "Shipped", record?.shippedAt],
    ["fulfilled", "Fulfilled", record?.fulfilledAt],
  ];
  const order = ["submitted", "awaiting_payment", "paid", "submitted_to_supplier", "processing", "shipped", "fulfilled"];
  const activeIndex = Math.max(0, order.indexOf(normalizedStatus));
  return steps.map(([status, label, value]) => ({
    status,
    label,
    value,
    complete:
      normalizedStatus === "fulfilled"
        ? true
        : normalizedStatus === "cancelled" || normalizedStatus === "rejected"
          ? status === "submitted"
          : order.indexOf(status) <= activeIndex,
  }));
}

function latestRequestForCurrentUser() {
  const requests = state.auth.isAdmin
    ? state.orderRequests
    : state.orderRequests.filter((request) => request.reseller_id === state.auth.user?.id);
  return [...requests].sort((left, right) => new Date(right.created_at || 0) - new Date(left.created_at || 0))[0] || null;
}

function requestConfirmationData() {
  if (state.orderConfirmation) return state.orderConfirmation;
  const request = latestRequestForCurrentUser();
  if (!request) return null;
  const record = requestHistoryRecords().find((entry) => entry.id === request.id);
  const items = state.orderRequestItems.filter((item) => item.order_request_id === request.id);
  return {
    id: request.id,
    code: formatRequestCode(request.id),
    status: request.status || "submitted",
    totalItems: record?.totalItems || items.length,
    totalUnits: record?.totalUnits || items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    subtotal: record?.subtotal || items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.base_price || 0), 0),
    notes: request.notes || "",
    items,
  };
}

async function loadCatalog() {
  try {
    state.homepageContentLoading = true;
    state.homepageContentError = null;
    const [productRows, variantRows, heroRows, themeRows, contentRows, directoryRows, flyerRows, blogRows, productFlyerRows] = await Promise.all([
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
      fetchOptionalSupabase("site_content", "select=reseller_banner,about_heading,about_body&active=eq.true&order=updated_at.desc&limit=1"),
      fetchOptionalSupabase("reseller_directory", "select=id,company_name,country,phone,email,full_name&order=country.asc,company_name.asc&limit=200"),
      fetchOptionalSupabase("homepage_flyers", "select=id,title,image_path,sort_order,published,created_at&published=eq.true&order=sort_order.asc,created_at.desc&limit=20"),
      fetchOptionalSupabase("blog_posts", "select=id,title,slug,cover_image_path,summary,body,published,published_at,created_at&published=eq.true&order=published_at.desc,created_at.desc&limit=20"),
      fetchOptionalSupabaseResult("public_product_flyers", "select=id,title,slug,product_class,short_description,story,main_image_path,secondary_image_path,display_order,published,created_at,updated_at&published=eq.true&order=display_order.asc,created_at.desc&limit=100"),
    ]);
    const fallback = CatalogData.fallbackCatalog();
    const catalogRows =
      productRows.length || variantRows.length
        ? CatalogData.normalizeCatalogRows({ products: productRows, variants: variantRows })
        : CatalogData.normalizeCatalogRows(fallback);
    state.products = catalogRows.products;
    state.variants = catalogRows.variants;
    state.inventory = [];
    state.resellerDirectory = Array.isArray(directoryRows) ? directoryRows : [];
    state.homepageFlyers = WebsiteContent.normalizeFlyers(flyerRows);
    state.blogPosts = WebsiteContent.normalizeStories(blogRows);
    state.publicProductFlyers = productFlyerRows.ok
      ? WebsiteContent.mergeProductFlyersWithDefaults(productFlyerRows.rows)
      : WebsiteContent.mergeProductFlyersWithDefaults([]);
    if (heroRows.length || themeRows.length || contentRows.length) {
      state.siteContent = remoteSiteContent(heroRows, themeRows, contentRows);
    }
  } catch (error) {
    state.error = error instanceof Error ? error.message : "Unable to load catalog";
    state.homepageContentError = error instanceof Error ? error.message : "Unable to load homepage content";
  } finally {
    state.loading = false;
    state.homepageContentLoading = false;
    render();
  }
}

async function loadProtectedData() {
  if (!state.auth.isAuthenticated) {
    state.homepageFlyers = WebsiteContent.normalizeFlyers(state.homepageFlyers);
    state.blogPosts = WebsiteContent.normalizeStories(state.blogPosts);
    state.publicProductFlyers = WebsiteContent.mergeProductFlyersWithDefaults(state.publicProductFlyers);
    state.inventory = [];
    state.orderRequests = [];
    state.orderRequestItems = [];
    state.resellerApplicationsData = [];
    state.colourMappings = [];
    state.staffProfiles = [];
    state.adminInvites = [];
    state.resellerDraft = {};
    state.orderConfirmation = null;
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
  if (state.auth.isAdmin) state.adminContentError = null;
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
        ["productPrices", fetchAuthedSupabase(CatalogData.protectedProductPriceSource(), CatalogData.protectedProductPriceSelectQuery())],
        ["variantPrices", fetchAuthedSupabase(CatalogData.protectedVariantPriceSource(), CatalogData.protectedVariantPriceSelectQuery())],
        ["colourMappings", fetchAuthedSupabase(CatalogData.protectedColourMappingSource(), CatalogData.protectedColourMappingSelectQuery())],
        ["inventory", fetchAuthedSupabase("inventory", "select=id,variant_id,sku,style_code,stock_quantity,updated_at&order=sku.asc&limit=5000")],
        [
          "orderRequests",
          fetchAuthedSupabase(
            "order_requests",
            "select=id,reseller_id,status,notes,admin_notes,created_at,updated_at&order=created_at.desc&limit=100",
          ),
        ],
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
        ["profiles", fetchAuthedSupabase("profiles", "select=id,email,full_name,company_name,phone,role&order=role.asc,email.asc&limit=200")],
        ["adminInvites", fetchAuthedSupabase("admin_invites", "select=id,email,status,note,created_by,claimed_by,created_at,expires_at,used_at,revoked_at&order=created_at.desc&limit=200")],
        ["homepageFlyers", fetchAuthedSupabase("homepage_flyers", "select=id,title,image_path,sort_order,published,created_at,updated_at&order=sort_order.asc,created_at.desc&limit=200")],
        ["blogPosts", fetchAuthedSupabase("blog_posts", "select=id,title,slug,cover_image_path,summary,body,published,published_at,created_at,updated_at&order=created_at.desc&limit=200")],
        [
          "publicProductFlyers",
          fetchAuthedSupabase("public_product_flyers", "select=id,title,slug,product_class,short_description,story,main_image_path,secondary_image_path,display_order,published,created_at,updated_at&order=display_order.asc,created_at.desc&limit=200"),
        ],
        [
          "importJobs",
          fetchAuthedSupabase(
          "import_jobs",
          "select=id,import_type,filename,status,rows_total,rows_processed,error_message,created_at,completed_at&order=created_at.desc&limit=25",
          ),
        ],
      );
    }

    const settled = await Promise.allSettled(tasks.map(([, task]) => task));
    const data = {};
    const failures = [];
    tasks.forEach(([name], index) => {
      const result = settled[index];
      if (result.status === "fulfilled") {
        data[name] = result.value;
        return;
      }
      if (name === "publicProductFlyers") {
        state.adminContentError = readablePublicProductFlyerDatabaseError(result.reason, "Unable to load public product flyers");
      }
      failures.push(`${name}: ${result.reason instanceof Error ? result.reason.message : "request failed"}`);
    });
    if (data.products || data.variants) {
      const fallback = CatalogData.fallbackCatalog();
      const pricedProducts = mergeAuthorizedPrices(data.products || state.products, data.productPrices || []);
      const pricedVariants = mergeAuthorizedPrices(data.variants || state.variants, data.variantPrices || []);
      const catalogRows =
        (data.products || []).length || (data.variants || []).length
          ? CatalogData.normalizeCatalogRows({ products: pricedProducts, variants: pricedVariants })
          : CatalogData.normalizeCatalogRows(fallback.products.length ? fallback : { products: state.products, variants: state.variants });
      state.products = catalogRows.products;
      state.variants = catalogRows.variants;
    }
    state.resellerApplicationsData = data.applications || [];
    state.colourMappings = data.colourMappings || [];
    state.inventory = data.inventory || [];
    state.orderRequests = data.orderRequests || [];
    state.orderRequestItems = data.orderRequestItems || [];
    state.importJobs = data.importJobs || [];
    state.staffProfiles = data.profiles || [];
    state.adminInvites = data.adminInvites || [];
    if (state.auth.isAdmin) {
      const adminFlyerRows = Array.isArray(data.homepageFlyers) ? data.homepageFlyers : [];
      const adminBlogRows = Array.isArray(data.blogPosts) ? data.blogPosts : [];
      const adminProductFlyerRows = Array.isArray(data.publicProductFlyers) ? data.publicProductFlyers : [];
      state.homepageFlyers = adminFlyerRows.length ? WebsiteContent.normalizeFlyers(adminFlyerRows, { includeUnpublished: true }) : [];
      state.blogPosts = WebsiteContent.normalizeStories(adminBlogRows, { includeUnpublished: true });
      state.publicProductFlyers = WebsiteContent.mergeProductFlyersWithDefaults(adminProductFlyerRows, { includeUnpublished: true });
    }
    if (failures.length) {
      const message = `Some protected data could not load: ${failures.join("; ")}`;
      state.inventoryError = message;
      state.historyError = message;
      state.applicationError = message;
    }
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
  if (Object.prototype.hasOwnProperty.call(params, "orderId")) state.selectedOrderId = params.orderId || null;
  else if (nextRoute !== "order") state.selectedOrderId = null;
  state.selectedStorySlug = params.storySlug || null;
  state.selectedProductFlyerSlug = params.flyerSlug || null;
  state.mobileNavOpen = false;
  state.catalogFiltersOpen = false;
  if (options.writeHistory !== false) {
    const historyState = {
      route: nextRoute,
      productId: state.selectedProductId || null,
      orderId: state.selectedOrderId || null,
      storySlug: state.selectedStorySlug || null,
      flyerSlug: state.selectedProductFlyerSlug || null,
    };
    const url = `${window.location.pathname}${MobileNavigation.buildRouteUrl(nextRoute, historyState)}`;
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
  if (route === "approvals") return routeForAccess("requests");
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

function authProfileError(authState) {
  if (!authState?.isAuthenticated) return null;
  if (!authState.profile) {
    return "Your account signed in, but the Irunsvan profile record is missing. Contact admin support to finish account setup.";
  }
  return null;
}

function isAdminLoginRoute(route = state.route) {
  return route === "admin-login";
}

function loginPageContent(route = state.route) {
  if (isAdminLoginRoute(route)) {
    return {
      eyebrow: "Admin Login",
      title: "Sign in to operations.",
      copy: "Only approved admin accounts can open product controls, inventory uploads, and reseller approvals.",
      submitLabel: "Continue to Admin",
      linkOne: ["Back to reseller login", "login"],
      linkTwo: ["Back to public site", "store"],
    };
  }
  return {
    eyebrow: "Account Login",
    title: "Sign in to continue.",
    copy: "Use your email and password to continue. New buyers can create a reseller account without Google.",
    submitLabel: "Continue",
    linkOne: ["Create account", "signup"],
    linkTwo: ["Admin Login", "admin-login"],
  };
}

function publicNavItems() {
  return [
    ["Products", "product-flyers", ["product-flyers", "product-flyer"]],
    ["Stockists", "find-reseller", ["find-reseller"]],
  ];
}

function topNav() {
  const active = (routes) => (routes.includes(state.route) ? "active" : "");
  const publicItems = publicNavItems();
  const resellerNavItems = state.auth.isPending
    ? [
        ["Application", "apply", ["apply"]],
        ["Account", "account", ["account"]],
        ["Public Products", "product-flyers", ["product-flyers", "product-flyer"]],
      ]
    : [
        ["Request Products", "reseller", ["reseller", "reseller-product"]],
        ["My Orders", "history", ["history", "request-confirmation", "current-orders", "expected-orders", "fulfillment", "order"]],
        ["Account", "account", ["account"]],
        ["Public Products", "product-flyers", ["product-flyers", "product-flyer"]],
      ];
  const drawerItems = mobileDrawerItems();
  const drawerLabel = mobileDrawerLabel();
  const homeRoute = currentPortalHomeRoute();
  const portalMode = currentPortalMode();
  const desktopItems = portalMode === "public" ? publicItems : portalMode === "reseller" ? resellerNavItems : [];
  const navActions = state.auth.isAuthenticated
    ? `
      <div class="account-chip">
        <span>${escapeHtml(authDisplayName())}</span>
        <small>${escapeHtml(roleLabel())}</small>
      </div>
      <button data-route="account">Account</button>
      <button data-action="logout">Logout</button>
    `
    : portalMode === "public"
      ? `
        <button class="nav-utility" data-route="login">Enter</button>
        <button class="nav-cta" data-route="apply">Join Network</button>
      `
      : `<button data-route="login">Login</button>`;
  return `
    <header class="${portalMode !== "public" ? "top-nav portal-top-nav" : "top-nav public-top-nav"}">
      <button class="logo-link bare-button" data-route="${homeRoute}" aria-label="${escapeHtml(mobileAreaLabel())} home">${logo("blue")}</button>
      <span class="mobile-area-label">${escapeHtml(mobileAreaLabel())}</span>
      <nav class="main-nav" aria-label="Primary navigation">
        ${desktopItems.map(([label, route, routes]) => `<button class="${active(routes)}" data-route="${route}">${label}</button>`).join("")}
      </nav>
      <button class="mobile-menu-button" data-action="toggle-mobile-nav" aria-label="${state.mobileNavOpen ? "Close menu" : `Open ${drawerLabel} menu`}" aria-expanded="${state.mobileNavOpen ? "true" : "false"}"><span class="menu-dots" aria-hidden="true"><i></i><i></i><i></i><i></i></span></button>
      <div class="nav-actions">${navActions}</div>
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
  if (isAdminRoute() || (state.route === "account" && state.auth.isAdmin)) return "admin";
  if (isResellerRoute()) return "reseller";
  if (state.route === "account") return Auth.fallbackRouteForRole(state.auth.role);
  return "store";
}

function mobileAreaLabel() {
  if (isAdminRoute() || (state.route === "account" && state.auth.isAdmin)) return "Admin";
  if (isResellerRoute() || (state.route === "account" && state.auth.isAuthenticated)) return "Reseller";
  return "Irunsvan Africa";
}

function isAdminRoute(route = state.route) {
  return ["admin", "team", "requests", "requests-review", "requests-payment", "requests-supplier", "requests-completed", "applications", "products", "site", "approvals", "imports", "email"].includes(route);
}

function isResellerRoute(route = state.route) {
  return ["reseller", "reseller-product", "request-confirmation", "history", "current-orders", "expected-orders", "fulfillment", "order"].includes(route);
}

function mobileDrawerLabel() {
  if (isAdminRoute()) return "Admin Menu";
  if (isResellerRoute()) return "Reseller Menu";
  return "Site Menu";
}

function mobileDrawerItems() {
  if (currentPortalMode() === "admin") {
    return [
      ["Dashboard", "admin", ["admin"]],
      ["Requests", "requests", ["requests", "requests-review", "requests-payment", "requests-supplier", "requests-completed"]],
      ["Applications", "applications", ["applications"]],
      ["Team", "team", ["team"]],
      ["Products", "products", ["products"]],
      ["Inventory Uploads", "imports", ["imports"]],
      ["Site Controls", "site", ["site"]],
      ["Account", "account", ["account"]],
      ["View Public Site", "store", ["store", "story"]],
    ];
  }
  if (currentPortalMode() === "reseller") {
    if (state.auth.isPending) {
      return [
        ["Application", "apply", ["apply"]],
        ["Account", "account", ["account"]],
        ["Public Catalog", "store", ["store", "product"]],
      ];
    }
      return [
        ["Request Products", "reseller", ["reseller", "reseller-product"]],
        ["Product", "reseller-product", ["reseller-product"]],
        ["My Orders", "history", ["history", "request-confirmation", "current-orders", "expected-orders", "fulfillment", "order"]],
        ["Account", "account", ["account"]],
        ["Public Products", "product-flyers", ["product-flyers", "product-flyer"]],
        ["Become a Reseller", "apply", ["apply"]],
    ];
  }
  if (state.auth.isAuthenticated) {
    if (state.auth.isAdmin) {
      return [
        ...publicNavItems(),
        ["Account", "account", ["account"]],
        ["Back to Admin", "admin", ["admin"]],
      ];
    }
    if (state.auth.isPending) {
      return [
        ...publicNavItems(),
        ["Application", "apply", ["apply"]],
        ["Account", "account", ["account"]],
      ];
    }
    return [
      ...publicNavItems(),
      ["Request Products", "reseller", ["reseller"]],
      ["My Orders", "history", ["history", "request-confirmation", "current-orders", "expected-orders", "fulfillment", "order"]],
      ["Account", "account", ["account"]],
    ];
  }
  return [
    ...publicNavItems(),
    ["Join Network", "apply", ["apply"]],
    ["Enter", "login", ["login", "admin-login"]],
  ];
}

function mobileContextBar() {
  const target = MobileNavigation.backTargetForRoute(state.route);
  if (!target) return "";
  const labels = {
    story: "Home",
    product: "Catalog",
    "product-flyers": "Home",
    "product-flyer": "Products",
    "reseller-product": "Shop",
    history: "Inventory",
    "current-orders": "My Orders",
    "expected-orders": "My Orders",
    fulfillment: "My Orders",
    order: "My Orders",
    products: "Admin",
    site: "Admin",
    requests: "Admin",
    "requests-review": "Orders",
    "requests-payment": "Orders",
    "requests-supplier": "Orders",
    "requests-completed": "Orders",
    applications: "Admin",
    approvals: "Admin",
    imports: "Admin",
    email: "Admin",
    admin: "Catalog",
    reseller: "Catalog",
    "find-reseller": "Catalog",
    apply: "Catalog",
    login: "Catalog",
    "admin-login": "Catalog",
    about: "Catalog",
    contact: "Catalog",
    terms: "Catalog",
    privacy: "Catalog",
  };
  return `<div class="mobile-context-bar"><button data-action="go-back">&larr; Back to ${escapeHtml(labels[state.route] || "previous")}</button></div>`;
}

function publicHomePage() {
  return `
    <main class="public-home">
      ${homeBokehBackdrop()}
      <div class="public-home-shell">
        <div class="public-home-stack">
          ${flyerCarousel(state.homepageFlyers)}
          ${storyCarousel(state.blogPosts)}
          ${aboutSection(state.siteContent.about)}
        </div>
      </div>
      ${footer()}
    </main>
  `;
}

function homeBokehBackdrop() {
  const colors = ["#ff5f6d", "#ff9f43", "#ffe66d", "#74e39b", "#61d2ff", "#8e7bff"];
  const dots = Array.from({ length: 28 }, (_, index) => {
    const left = (index * 7.9) % 100;
    const top = (index * 11.7) % 100;
    const size = 3 + (index % 5) * 1.8;
    const blur = 0.5 + (index % 4) * 0.6;
    const opacity = 0.07 + (index % 6) * 0.015;
    const color = colors[index % colors.length];
    const driftX = (index % 2 === 0 ? 1 : -1) * (6 + (index % 5) * 2);
    const driftY = (index % 3 === 0 ? -1 : 1) * (4 + (index % 4) * 1.5);
    return `<span class="home-bokeh-dot home-bokeh-dot-${index % 4}" style="left:${left}%;top:${top}%;width:${size}px;height:${size}px;background:${color};opacity:${opacity};filter:blur(${blur}px);--dot-drift-x:${driftX}px;--dot-drift-y:${driftY}px;--dot-delay:${index * 180}ms;"></span>`;
  }).join("");

  return `
    <div class="home-bokeh-background" aria-hidden="true">
      <div class="home-bokeh-glow home-bokeh-glow-a"></div>
      <div class="home-bokeh-glow home-bokeh-glow-b"></div>
      <div class="home-bokeh-glow home-bokeh-glow-c"></div>
      <div class="home-bokeh-field">
        ${dots}
      </div>
    </div>
  `;
}

function flyerCarousel(flyers) {
  const items = WebsiteContent.normalizeFlyers(flyers);
  const selectedIndex = ((Number(state.homeFlyerIndex || 0) % items.length) + items.length) % items.length;
  const selected = items[selectedIndex];
  const heroTitle = String(selected.title || "Blue Motion Protocol")
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .trim()
    .toUpperCase();
  return `
    <section class="home-flyer-carousel" aria-label="Irunsvan Africa flyers">
      <div class="home-flyer-panel campaign-surface-shadow">
        <div class="home-flyer-stage">
          <div class="home-flyer-copy">
            <span class="campaign-eyebrow">IRUNSVAN AFRICA</span>
            <div class="campaign-meta" aria-label="Campaign metadata">
              <span>NEW SEASON</span>
              <span>${escapeHtml(`EDITION ${selectedIndex + 1}/${items.length}`)}</span>
              <span>PERFORMANCE FOOTWEAR</span>
            </div>
            <h1>${escapeHtml(heroTitle || "BLUE MOTION PROTOCOL")}</h1>
            <p>
              Technical footwear stories, campaign drops, and reseller-ready movement built for the
              continent.
            </p>
            <div class="campaign-actions">
              <button class="button primary" data-route="find-reseller">Find Stockists <span class="button-mark" aria-hidden="true">&rarr;</span></button>
              <button class="button ghost home-ghost-button" data-route="product-flyers">View Products <span class="button-mark" aria-hidden="true">&nearr;</span></button>
            </div>
          </div>
          <div class="home-flyer-media">
            <div class="home-flyer-frame">
              <img src="${escapeHtml(resolveContentImageUrl(selected.imagePath))}" alt="${escapeHtml(selected.title)}" loading="eager" onerror="this.onerror=null;this.src='Flyer Templates/Flyer Template.jpg';" />
              <div class="home-flyer-overlay">
                <span>Featured</span>
                <strong>${escapeHtml(selected.title || "Irunsvan Campaign")}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
      ${
        state.homepageContentError
          ? `<p class="notice error home-content-notice">${escapeHtml(state.homepageContentError)}</p>`
          : state.homepageContentLoading
            ? `<p class="notice home-content-notice">Loading homepage content...</p>`
            : ""
      }
      ${
        items.length > 1
          ? `<div class="home-carousel-controls"><button type="button" data-action="home-flyer-step" data-direction="-1">Previous</button><span>${escapeHtml(`${selectedIndex + 1}/${items.length}`)}</span><button type="button" data-action="home-flyer-step" data-direction="1">Next</button></div>`
          : ""
      }
    </section>
  `;
}

function storyCard(story, index) {
  const coverImage = resolveContentImageUrl(story.coverImagePath || "");
  const publishedLabel = story.publishedAt ? new Date(story.publishedAt).toLocaleDateString() : "Latest";
  return `
    <article class="story-card campaign-surface-shadow${index === 0 ? " story-card-featured" : ""}">
      ${
        coverImage
          ? `<img src="${escapeHtml(coverImage)}" alt="${escapeHtml(story.title)}" loading="lazy" />`
          : `<div class="story-card-image story-card-image-placeholder">${logo("blue")}</div>`
      }
      <div class="story-card-body">
        <span class="story-card-tag">${index === 0 ? "Featured Story" : "Story"}</span>
        <p class="story-meta">${escapeHtml(publishedLabel)}</p>
        <h3>${escapeHtml(story.title)}</h3>
        <p>${escapeHtml(story.summary || "Read the latest Irunsvan Africa campaign dispatch.")}</p>
        <button type="button" class="button secondary story-card-action" data-route="story" data-story-slug="${escapeHtml(story.slug)}">Read story</button>
      </div>
    </article>
  `;
}

function storyCarousel(stories) {
  const items = WebsiteContent.normalizeStories(stories).slice(0, 6);
  return `
    <section class="home-stories">
      <div class="home-section-heading">
        <span class="campaign-eyebrow">LATEST FROM IRUNSVAN</span>
        <h2>Field Records</h2>
        <p>Editorial notes, product signals, and performance updates from Irunsvan Africa.</p>
      </div>
      ${
        items.length
          ? `<div class="story-strip">${items.map((story, index) => storyCard(story, index)).join("")}</div>`
          : `<div class="content-empty-state"><p>No stories are published yet.</p></div>`
      }
    </section>
  `;
}

function aboutSection(about = WebsiteContent.DEFAULT_ABOUT_CONTENT) {
  const heading = String(about?.heading || "ENGINEERED FOR THE CONTINENT").toUpperCase();
  const body = about?.body || WebsiteContent.DEFAULT_ABOUT_CONTENT.body;
  return `
    <section class="home-about">
      <div class="home-section-heading">
        <span class="campaign-eyebrow">ABOUT IRUNSVAN</span>
        <h2>${escapeHtml(heading)}</h2>
      </div>
      <div class="home-about-layout">
        <div class="home-about-copy campaign-surface-shadow">
          <p>${escapeHtml(body)}</p>
          ${
            state.siteContent.banner
              ? `<p class="home-about-banner">${escapeHtml(state.siteContent.banner)}</p>`
              : ""
          }
          <div class="home-about-points" aria-label="Irunsvan core pillars">
            <span>01 // SURFACE ADAPTABILITY</span>
            <span>02 // RHYTHM ENGINEERING</span>
            <span>03 // CONTINENTAL TESTING</span>
          </div>
        </div>
        <aside class="home-about-aside">
          <div class="telemetry-card campaign-surface-shadow">
            <span class="campaign-eyebrow">BRAND FOCUS</span>
            <div class="telemetry-grid">
              <span>CHANNEL</span>
              <strong>RESELLER NETWORK</strong>
              <span>OUTPUT</span>
              <strong>TECHNICAL FOOTWEAR</strong>
              <span>FIELD</span>
              <strong>AFRICA</strong>
            </div>
          </div>
        </aside>
      </div>
    </section>
  `;
}

function selectedStory() {
  const items = WebsiteContent.normalizeStories(state.blogPosts);
  if (!items.length) return null;
  if (state.selectedStorySlug) {
    return items.find((story) => story.slug === state.selectedStorySlug) || null;
  }
  return items[0];
}

function publicProductFlyerItems(options = {}) {
  return WebsiteContent.normalizeProductFlyers(state.publicProductFlyers, options);
}

function selectedProductFlyer() {
  const items = publicProductFlyerItems();
  if (!items.length) return null;
  if (state.selectedProductFlyerSlug) {
    return items.find((flyer) => flyer.slug === state.selectedProductFlyerSlug) || null;
  }
  return items[0];
}

function productFlyerCard(flyer) {
  const imageUrl = resolveContentImageUrl(flyer.mainImagePath || "");
  return `
    <article class="product-flyer-card">
      <div class="product-flyer-image">
        ${
          imageUrl
            ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(flyer.title)}" loading="lazy" />`
            : `<div class="product-flyer-placeholder">${logo("blue")}</div>`
        }
      </div>
      <div class="product-flyer-copy">
        <p>${escapeHtml(flyer.productClass)}</p>
        <h2>${escapeHtml(flyer.title)}</h2>
        <span>${escapeHtml(flyer.shortDescription || "Irunsvan Africa public product flyer.")}</span>
        <button type="button" class="button secondary" data-route="product-flyer" data-flyer-slug="${escapeHtml(flyer.slug)}">View shoe</button>
      </div>
    </article>
  `;
}

function productFlyerCategoryDescription(productClass) {
  switch (productClass) {
    case "Everyday Trainer":
      return "Daily movement shoes for public discovery, easy styling, and regular training.";
    case "Performance Trainer":
      return "Training-focused shoes for faster sessions, stronger support, and more technical runs.";
    case "Race Day Performance":
      return "Top-end public performance stories for race-day intent and premium speed.";
    default:
      return "Public product flyers from Irunsvan Africa.";
  }
}

function productFlyerCategorySection(group) {
  return `
    <section class="product-flyer-category">
      <div class="product-flyer-category-head">
        <h2>${escapeHtml(group.productClass)}</h2>
        <p>${escapeHtml(productFlyerCategoryDescription(group.productClass))}</p>
      </div>
      <div class="product-flyer-grid">${group.items.map(productFlyerCard).join("")}</div>
    </section>
  `;
}

function productFlyersPage() {
  const flyers = publicProductFlyerItems();
  const groups = WebsiteContent.groupProductFlyersByClass(flyers);
  return `
    <main class="public-home product-flyers-page">
      ${homeBokehBackdrop()}
      <div class="public-home-shell">
        <div class="public-home-stack product-flyers-stack">
          <section class="product-flyer-intro">
            <span class="campaign-eyebrow">IRUNSVAN PRODUCTS</span>
            <h1>Products</h1>
            <p>Public product flyers from Irunsvan Africa. These pages are for display and product storytelling only.</p>
          </section>
          ${
            groups.length
              ? groups.map(productFlyerCategorySection).join("")
              : `<section class="content-empty-state"><p>No public product flyers are published yet.</p></section>`
          }
        </div>
      </div>
      ${footer()}
    </main>
  `;
}

function productFlyerDetailPage() {
  const flyer = selectedProductFlyer();
  if (!flyer) {
    return `
      <main class="public-home product-flyers-page">
        ${homeBokehBackdrop()}
        <div class="public-home-shell">
          <section class="content-empty-state"><p>This product flyer is not published yet.</p></section>
        </div>
        ${footer()}
      </main>
    `;
  }
  const mainImage = resolveContentImageUrl(flyer.mainImagePath || "");
  const secondaryImage = resolveContentImageUrl(flyer.secondaryImagePath || "");
  return `
    <main class="public-home product-flyer-detail-page">
      ${homeBokehBackdrop()}
      <div class="public-home-shell">
        <div class="public-home-stack product-flyers-stack">
          <button type="button" class="text-link product-flyer-back" data-route="product-flyers">Back to product flyers</button>
          <article class="product-flyer-detail campaign-surface-shadow">
            <div class="product-flyer-detail-media">
              ${
                mainImage
                  ? `<img src="${escapeHtml(mainImage)}" alt="${escapeHtml(flyer.title)}" loading="eager" />`
                  : `<div class="product-flyer-placeholder">${logo("blue")}</div>`
              }
              ${
                secondaryImage
                  ? `<img src="${escapeHtml(secondaryImage)}" alt="${escapeHtml(`${flyer.title} detail`)}" loading="lazy" />`
                  : ""
              }
            </div>
            <div class="product-flyer-detail-copy">
              <p>${escapeHtml(flyer.productClass)}</p>
              <h1>${escapeHtml(flyer.title)}</h1>
              ${flyer.shortDescription ? `<strong>${escapeHtml(flyer.shortDescription)}</strong>` : ""}
              ${flyer.story ? `<div class="product-flyer-story">${escapeHtml(flyer.story).replaceAll("\n", "<br />")}</div>` : ""}
            </div>
          </article>
        </div>
      </div>
      ${footer()}
    </main>
  `;
}

function storyDetailPage() {
  const story = selectedStory();
  if (!story) {
    return `
      <main class="story-page campaign-story-page">
        <button class="text-link" data-route="store">Back to home</button>
        <section class="content-empty-state">
          <h1>Story not found</h1>
          <p>The requested story is not available yet.</p>
        </section>
        ${footer(true)}
      </main>
    `;
  }
  const coverImage = resolveContentImageUrl(story.coverImagePath || "");
  const body = String(story.body || "")
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");
  return `
    <main class="story-page campaign-story-page">
      <button class="text-link story-back-link" data-route="store">Back to home</button>
      <article class="story-article">
        <header class="story-header">
          <span class="campaign-eyebrow">IRUNSVAN STORY</span>
          <p class="story-meta">${escapeHtml(story.publishedAt ? new Date(story.publishedAt).toLocaleDateString() : "Latest story")}</p>
          <h1>${escapeHtml(story.title)}</h1>
          ${story.summary ? `<p class="story-summary">${escapeHtml(story.summary)}</p>` : ""}
        </header>
        ${coverImage ? `<img class="story-hero-image" src="${escapeHtml(coverImage)}" alt="${escapeHtml(story.title)}" loading="eager" />` : ""}
        <div class="story-body">${body}</div>
      </article>
      ${footer(true)}
    </main>
  `;
}

function catalogPage() {
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
            <div class="hero-meta" aria-label="Irunsvan Africa catalog summary">
              <span>${products.length} product lines</span>
              <span>3,735 SKUs</span>
              <span>Wholesale access after approval</span>
            </div>
          </div>
        </div>
      </section>
      <section class="product-catalog-shell">
        ${catalogFilters("desktop")}
        <div class="catalog-content">
          <div class="section-header">
            <div>
              <span class="eyebrow dark">Catalog</span>
              <h2>${state.loading ? "Loading products" : `${products.length} Irunsvan Africa products`}</h2>
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
          <p>Customers can inspect the Irunsvan Africa product range without seeing warehouse quantities. Approved resellers get access to exact stock and order requests.</p>
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
  const imageNames = productCardImages(product);
  const variantLabel = variantCount ? `${variantCount} variants` : "Variants available";
  const colours = [...new Set(variantsFor(product.id).map((variant) => String(variant.colour || "").trim()).filter(Boolean))].slice(0, 4);
  return `
    <article class="product-card">
      ${productVisualCarousel({ key: `public:${product.id}`, label: product.name, imageNames })}
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
          <div data-product-detail-main>
            ${productVisual(product.name, imageName)}
          </div>
          ${
            detail.gallery.length
              ? `<div class="detail-gallery-strip">${detail.gallery
                  .map(
                    (image, index) => `
                      <button class="gallery-thumb ${index === 0 ? "selected" : ""}" data-action="select-gallery-image" data-image-name="${escapeHtml(image.imageName)}" data-image-url="${escapeHtml(image.imageUrl)}" aria-label="View ${escapeHtml(product.name)} image ${index + 1}">
                        <img src="${escapeHtml(image.imageUrl)}" alt="${escapeHtml(product.name)}" loading="lazy" />
                      </button>`,
                  )
                  .join("")}</div>`
              : ""
          }
        </div>
        <div class="detail-copy">
          <span class="eyebrow dark">${escapeHtml(product.sku || "Irunsvan Africa")}</span>
          <h1>${escapeHtml(product.name || "Product")}</h1>
          <img class="detail-brand-mark" src="public/brand/Irunsvan_Blue-removebg-preview.svg" alt="Irunsvan Africa" />
          <p class="section-note">Public buyers can browse product information. Pricing, exact stock, and ordering are reserved for approved Irunsvan Africa reseller accounts.</p>
          ${detail.colours.length ? selectorGroup("Colours", detail.colours) : ""}
          ${detail.sizes.length ? selectorGroup("Sizes", detail.sizes) : ""}
          <div class="detail-actions">
            <button class="button primary" data-route="apply">Apply as a Reseller</button>
            <button class="button secondary" data-route="find-reseller">Find a Reseller</button>
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
  const confirmationNotice = state.signupConfirmationEmail
    ? `<p class="notice success">Account created for ${escapeHtml(state.signupConfirmationEmail)}. Confirm your email, then sign in to finish the reseller application.</p>`
    : "";
  const statusNotice = existingApplication
    ? `<p class="notice ${existingApplication.status === "approved" ? "success" : existingApplication.status === "rejected" ? "error" : ""}">Current application status: ${escapeHtml(existingApplication.status)}.</p>`
    : "";
  return `
    <main class="form-page">
      <section class="form-hero">
        <span class="eyebrow dark">Irunsvan Africa reseller access</span>
        <h1>Apply to view live stock and request bulk orders.</h1>
        <p>Submit your business details for Africa wholesale access. Approval is required before exact inventory is visible.</p>
      </section>
      <section class="form-grid">
        <form class="workflow-form" data-form="application">
          ${confirmationNotice}
          ${statusNotice}
          ${state.applicationError ? `<p class="notice error">${escapeHtml(state.applicationError)}</p>` : ""}
          ${inputField("Company Name", "company_name", existingApplication?.company_name || state.auth.profile?.company_name || "")}
          ${inputField("Full Name", "full_name", existingApplication?.full_name || state.auth.profile?.full_name || "")}
          ${inputField("Email", "email", existingApplication?.email || state.auth.user?.email || "", "email")}
          ${needsPassword ? inputField("Password", "password", "Create a password", "password") : ""}
          ${needsPassword ? inputField("Confirm Password", "password_confirm", "Repeat your password", "password") : ""}
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

function signupPage() {
  if (state.auth.isAuthenticated) {
    return `
      <main class="form-page narrow">
        <section class="form-hero">
          <span class="eyebrow dark">Create Account</span>
          <h1>Your account is active.</h1>
          <p>Continue to your application or account page.</p>
        </section>
        <div class="workflow-form">
          <button class="button primary full" data-route="apply">Continue Application</button>
          <button class="button secondary full" data-route="account">Account Details</button>
        </div>
      </main>
    `;
  }
  const confirmationNotice = state.signupConfirmationEmail
    ? `<p class="notice success">Account created for ${escapeHtml(state.signupConfirmationEmail)}. Confirm your email, then sign in to finish the reseller application.</p>`
    : "";
  return `
    <main class="form-page signup-page">
      <section class="form-hero">
        <span class="eyebrow dark">Create Account</span>
        <h1>Create a reseller account.</h1>
        <p>Use a normal email and password. Approval is required before prices, stock, and product requests unlock.</p>
      </section>
      <section class="form-grid auth-grid">
        <form class="workflow-form" data-form="application">
          ${confirmationNotice}
          ${state.applicationError ? `<p class="notice error">${escapeHtml(state.applicationError)}</p>` : ""}
          ${state.applicationSubmitted ? `<p class="notice success">Application submitted. You can sign in while the admin team reviews your account.</p>` : ""}
          ${inputField("Company Name", "company_name", "")}
          ${inputField("Full Name", "full_name", "")}
          ${inputField("Email", "email", "name@example.com", "email")}
          ${inputField("Password", "password", "Minimum 8 characters", "password")}
          ${inputField("Confirm Password", "password_confirm", "Repeat your password", "password")}
          ${inputField("Phone", "phone", "")}
          ${inputField("Country", "country", "")}
          <label><span>Notes</span><textarea name="message" placeholder="Tell us what you want to buy and where you resell."></textarea></label>
          <button class="button primary full" ${state.applicationSubmitPending ? "disabled" : ""}>${state.applicationSubmitPending ? "Creating Account..." : "Create Account"}</button>
          <button type="button" class="button secondary full" data-action="google-login">Continue with Google</button>
          <div class="split-actions">
            <button type="button" class="text-link" data-route="login">I already have an account</button>
            <button type="button" class="text-link" data-route="store">Back to products</button>
          </div>
        </form>
        <aside class="process-panel auth-process-panel">
          <h2>Access flow</h2>
          ${processStep("1", "Create account", "Register with email and password, or continue with Google.")}
          ${processStep("2", "Submit details", "Send business and contact details for approval.")}
          ${processStep("3", "Start buying", "Approved accounts can see stock and request products.")}
        </aside>
      </section>
    </main>
  `;
}

function loginPage() {
  const content = loginPageContent();
  const notice = state.routeNotice
    ? `<p class="notice ${escapeHtml(state.routeNotice.type)}">${escapeHtml(state.routeNotice.message)}</p>`
    : "";
  const authError = state.authError ? `<p class="notice error">${escapeHtml(state.authError)}</p>` : "";
  const recoveryError = state.passwordRecoveryError ? `<p class="notice error">${escapeHtml(state.passwordRecoveryError)}</p>` : "";
  const helper =
    state.auth.isPending && state.auth.isAuthenticated
      ? `<p class="notice">Your reseller application is still pending approval. You can update your application details below.</p>`
      : "";
  return `
    <main class="form-page narrow">
      <section class="form-hero">
        <span class="eyebrow dark">${escapeHtml(content.eyebrow)}</span>
        <h1>${escapeHtml(content.title)}</h1>
        <p>${escapeHtml(content.copy)}</p>
      </section>
      <form class="workflow-form" data-form="login">
        ${notice}
        ${helper}
        ${authError}
        ${inputField("Email", "email", "name@example.com", "email")}
        ${inputField("Password", "password", "Password", "password")}
        <button class="button primary full" ${state.loginPending ? "disabled" : ""}>${state.loginPending ? "Signing In..." : escapeHtml(content.submitLabel)}</button>
        <button type="button" class="button secondary full" data-action="google-login">Continue with Google</button>
        <button type="button" class="text-link" data-action="toggle-password-recovery">${state.passwordRecoveryOpen ? "Hide password help" : "Forgot password?"}</button>
        <div class="split-actions">
          <button type="button" class="text-link" data-route="${escapeHtml(content.linkOne[1])}">${escapeHtml(content.linkOne[0])}</button>
          <button type="button" class="text-link" data-route="${escapeHtml(content.linkTwo[1])}">${escapeHtml(content.linkTwo[0])}</button>
        </div>
        ${state.loginSubmitted && state.auth.isAuthenticated ? `<p class="notice success">Signed in as ${escapeHtml(authDisplayName())}.</p>` : ""}
      </form>
      ${
        state.passwordRecoveryOpen
          ? `
            <form class="workflow-form password-help-card" data-form="password-recovery">
              <strong>Password reset</strong>
              <p>Enter your account email and we will send a secure reset link.</p>
              ${recoveryError}
              ${state.passwordRecoverySent ? `<p class="notice success">Reset instructions sent. Open the email and follow the secure link back to this site.</p>` : ""}
              ${inputField("Account Email", "email", "name@example.com", "email")}
              <button class="button secondary full" ${state.passwordRecoveryPending ? "disabled" : ""}>${state.passwordRecoveryPending ? "Sending..." : "Send Reset Link"}</button>
            </form>
          `
          : ""
      }
    </main>
  `;
}

function resellerDirectoryByCountry() {
  return state.resellerDirectory.reduce((map, row) => {
    const country = String(row.country || "Region not published").trim() || "Region not published";
    const list = map.get(country) || [];
    list.push(row);
    map.set(country, list);
    return map;
  }, new Map());
}

function findResellerPage() {
  const grouped = [...resellerDirectoryByCountry().entries()].sort((left, right) => left[0].localeCompare(right[0]));
  const totalPartners = state.resellerDirectory.length;
  return `
    <main class="info-page">
      <section>
        <span class="eyebrow dark">Find a Reseller</span>
        <h1>Buy through an approved Irunsvan partner in your region.</h1>
        <p class="lead-copy">The public catalog shows the range. Orders are handled by approved resellers who can see live stock and submit wholesale requests.</p>
        <p>If your region is not covered yet, apply as a reseller and the operations team can review your business account.</p>
      </section>
      ${metricGrid([
        ["Buying Route", "Approved reseller", "Public shoppers do not place direct orders here"],
        ["Regional Coverage", totalPartners ? `${grouped.length} countries` : "Expanding", "New reseller partners are added by country"],
        ["Business Access", "Application required", "Wholesale stock is reserved for approved accounts"],
      ])}
      <section class="form-grid">
        <aside class="process-panel">
          <h2>Approved reseller directory</h2>
          ${
            grouped.length
              ? `<div class="directory-list">
                  ${grouped
                    .map(
                      ([country, partners]) => `
                        <article class="directory-country">
                          <strong>${escapeHtml(country)}</strong>
                          <div class="directory-cards">
                            ${partners
                              .map(
                                (partner) => `
                                  <div class="directory-card">
                                    <h3>${escapeHtml(partner.company_name || "Approved reseller")}</h3>
                                    <p>${escapeHtml(partner.full_name || "Sales contact")}</p>
                                    <p>${partner.phone ? escapeHtml(partner.phone) : "Phone available on request"}</p>
                                    <p>${escapeHtml(partner.email || "Contact available on request")}</p>
                                  </div>
                                `,
                              )
                              .join("")}
                          </div>
                        </article>
                      `,
                    )
                    .join("")}
                </div>`
              : `<p>No public reseller listings have been published yet. Use the reseller application if your region still needs a local partner.</p>`
          }
        </aside>
        <aside class="process-panel">
          <h2>How buying works</h2>
          ${processStep("1", "Browse products", "Use the public catalog to review styles, colours, and sizes.")}
          ${processStep("2", "Find your region", "Contact the approved reseller serving your country or area.")}
          ${processStep("3", "Need coverage?", "Apply as a reseller if your region still needs a local partner.")}
        </aside>
        <aside class="process-panel">
          <h2>Regional rollout</h2>
          <p>Directory listings are generated from approved reseller accounts. Admin can expand coverage country by country as the network grows.</p>
          <div class="split-actions">
            <button type="button" class="button primary" data-route="apply">Apply as a Reseller</button>
            <button type="button" class="button secondary" data-route="login">Login</button>
          </div>
        </aside>
      </section>
      ${footer(true)}
    </main>
  `;
}

function accountPage() {
  const application = latestOwnApplication();
  return `
    <main class="portal-page">
      <section class="portal-header">
        <div>
          <span class="eyebrow dark">Account & Settings</span>
          <h1>${escapeHtml(authDisplayName())}</h1>
          <p>Manage business details, security, and account access from one place.</p>
        </div>
        <div class="portal-actions">
          <div class="protected-pill">${escapeHtml(roleLabel())}</div>
          <button class="button secondary" data-action="logout">Logout</button>
        </div>
      </section>
      ${metricGrid([
        ["Account Role", roleLabel(), "Access level"],
        ["Email", state.auth.user?.email || "Not available", "Sign-in identity"],
        ["Country", currentUserCountry(), "Reseller coverage"],
        ["Application", application?.status || "No application", "Current review state"],
      ])}
      <section class="form-grid">
        <form class="workflow-form" data-form="account-profile">
          <h2>Business profile</h2>
          ${state.accountProfileError ? `<p class="notice error">${escapeHtml(state.accountProfileError)}</p>` : ""}
          ${state.accountProfileSaved ? `<p class="notice success">Account profile updated.</p>` : ""}
          ${controlInput("Full Name", "full_name", state.auth.profile?.full_name || "")}
          ${controlInput("Company Name", "company_name", state.auth.profile?.company_name || "")}
          ${controlInput("Phone", "phone", state.auth.profile?.phone || "")}
          <button class="button primary full" ${state.accountProfileSavePending ? "disabled" : ""}>${state.accountProfileSavePending ? "Saving..." : "Save Account Details"}</button>
        </form>
        <form class="workflow-form" data-form="account-password">
          <h2>Security</h2>
          ${state.passwordResetMode ? `<p class="notice success">Set a new password for this account now.</p>` : ""}
          ${state.accountPasswordError ? `<p class="notice error">${escapeHtml(state.accountPasswordError)}</p>` : ""}
          ${state.accountPasswordSaved ? `<p class="notice success">Password updated successfully.</p>` : ""}
          ${inputField("New Password", "password", "Minimum 8 characters", "password")}
          ${inputField("Confirm Password", "password_confirm", "Repeat your new password", "password")}
          <button class="button primary full" ${state.accountPasswordSavePending ? "disabled" : ""}>${state.accountPasswordSavePending ? "Updating..." : "Update Password"}</button>
        </form>
      </section>
      ${
        application
          ? `
            <section class="inventory-panel">
              <div class="panel-toolbar"><h2>Application snapshot</h2><span>${escapeHtml(application.status)}</span></div>
              <div class="overview-list">
                <div class="overview-row"><strong>Company</strong><span>${escapeHtml(application.company_name)}</span></div>
                <div class="overview-row"><strong>Country</strong><span>${escapeHtml(application.country || "Not provided")}</span></div>
                <div class="overview-row"><strong>Phone</strong><span>${escapeHtml(application.phone || "Not provided")}</span></div>
                <div class="overview-row"><strong>Notes</strong><span>${escapeHtml(application.message || "No notes supplied")}</span></div>
              </div>
            </section>
          `
          : ""
      }
      ${footer(true)}
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
  const searchActive = Boolean(String(state.resellerSearch || "").trim());
  const productGroups = Orders.visibleShopProductGroups(rows, {
    productLimit: Math.max(24, state.products.length || 21),
    optionLimit: 500,
  });
  const orderItems = currentDraftItems();
  const summary = currentDraftSummary();
  return `
    <main class="portal-page">
      <section class="portal-header">
        <div>
          <span class="eyebrow dark">Irunsvan Africa reseller portal</span>
          <h1>Wholesale shop</h1>
          <p>Browse the range, open a product, pick one color, then add sizes and quantities to a request cart.</p>
        </div>
        <div class="portal-actions">
          <button class="button secondary" data-route="history">Request History</button>
          <div class="protected-pill">Approved reseller access</div>
        </div>
      </section>
      ${metricGrid([
        ["Total Products", String(state.products.length), "Available styles"],
        ["In Stock Choices", String(rows.length), "Colours and sizes"],
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
                : productGroups.length
                  ? resellerProductCards(productGroups)
                  : `<p class="notice">${searchActive ? "No products match this search." : "No in-stock products are available for this reseller account yet."}</p>`
            }
          </div>
          ${pager(`Showing ${productGroups.length} products with ${rows.length} available SKU rows${searchActive ? " matching search" : ""}`)}
        </div>
        <aside class="order-sidebar" id="portal-order">
          <div class="sidebar-head"><h2>Request cart</h2><p>${state.orderSubmitted ? "Submitted" : `${summary.itemCount} ${summary.itemCount === 1 ? "line" : "lines"} ready`}</p></div>
          <div class="order-items">
            ${
              orderItems.length
                ? orderItems
                    .map(
                      (item) => `
                <div class="order-item">
                  ${productVisual(item.productName, item.imageName)}
                  <div>
                    <div class="order-title-row"><strong>${escapeHtml(item.productName)}</strong><button data-action="remove-order-item" data-variant-id="${escapeHtml(item.variantId)}" aria-label="Remove ${escapeHtml(item.productName)} ${escapeHtml(item.colour)} size ${escapeHtml(item.size)}">Remove</button></div>
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
                ? `<p class="notice success">Request sent. Admin review will decide whether stock is deducted.</p>`
                : `<p class="notice">Order requests are reviewed before confirmation. Stock updates only after approval.</p>`
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

function resellerProductCards(groups) {
  return groups.map(resellerProductCard).join("");
}

function availabilityLabel(stockQuantity) {
  const quantity = Number(stockQuantity || 0);
  if (quantity <= 0) return { label: "Sold out", className: "sold-out" };
  if (quantity <= 5) return { label: "Low availability", className: "low" };
  return { label: "Available", className: "" };
}

function resellerProductCard(group) {
  const price = OperationsProducts.priceState(group.price, group.currency || "USD");
  const colourGroups = resellerColourGroups(group.rows);
  const selectedColour = selectedResellerColour(group.productId, colourGroups);
  const imageNames = uniqueImageNames([...colourGroups.map((colour) => colour.imageName), group.imageName]);
  const visibleColourCount = colourGroups.length;
  const sizes = resellerAvailableSizes(group.rows);
  const selectedPairCount = group.rows.reduce((total, row) => total + Number(state.resellerDraft[row.variantId] || 0), 0);
  return `
    <article class="reseller-product-card clickable-product-card" data-action="open-reseller-product" data-product-id="${escapeHtml(group.productId)}">
      ${productVisualCarousel({ key: `reseller:${group.productId}`, label: group.productName, imageNames })}
      <div class="reseller-product-copy">
        <div class="reseller-product-head">
          <div>
            <p>${escapeHtml(group.category || "Wholesale product")}</p>
            <h3>${escapeHtml(group.productName)}</h3>
          </div>
          <strong class="${price.priced ? "" : "price-pending"}">${escapeHtml(price.priced ? price.label : "Price pending")}</strong>
        </div>
        <div class="product-facts">
          <span>${visibleColourCount} ${visibleColourCount === 1 ? "color" : "colors"}</span>
          <span>${group.optionCount} SKU rows</span>
          <span>${sizes || "Sizes vary by color"}</span>
          <span>${group.totalStock} units exact stock</span>
        </div>
        <div class="colour-strip" aria-label="${escapeHtml(group.productName)} colors">
          ${colourGroups.slice(0, 6).map((colour) => resellerColourButton(group.productId, colour, selectedColour)).join("")}
          ${colourGroups.length > 6 ? `<span class="colour-strip-more">+${colourGroups.length - 6} more</span>` : ""}
        </div>
        <div class="product-card-actions">
          <button class="button secondary full" data-route="reseller-product" data-product-id="${escapeHtml(group.productId)}">View & Order</button>
          ${selectedPairCount ? `<span>${selectedPairCount} ${selectedPairCount === 1 ? "pair" : "pairs"} in request</span>` : ""}
        </div>
        <p class="reseller-product-note">Open the product page to choose one color, then add sizes quickly.</p>
      </div>
    </article>
  `;
}

function resellerColourGroups(rows = []) {
  const groups = rows.reduce((map, row) => {
    const key = String(row.colour || "Default colour").trim() || "Default colour";
    const group = map.get(key) || {
      key,
      label: key,
      imageName: row.imageName,
      totalStock: 0,
      rows: [],
    };
    if (!group.imageName && row.imageName) group.imageName = row.imageName;
    group.totalStock += Number(row.stockQuantity || 0);
    group.rows.push(row);
    map.set(key, group);
    return map;
  }, new Map());

  return [...groups.values()].map((group) => ({
    ...group,
    rows: group.rows.sort((left, right) => Number(left.size) - Number(right.size) || String(left.size).localeCompare(String(right.size))),
  }));
}

function selectedResellerColour(productId, colourGroups = []) {
  const selected = state.resellerColourSelection[productId];
  if (selected && colourGroups.some((group) => group.key === selected)) return selected;
  return colourGroups[0]?.key || "";
}

function resellerAvailableSizes(rows = []) {
  return [...new Set(rows.map((row) => String(row.size || "").trim()).filter(Boolean))]
    .sort((left, right) => Number(left) - Number(right) || left.localeCompare(right))
    .join(", ");
}

function resellerColourButton(productId, colour, selectedColour) {
  const isSelected = colour.key === selectedColour;
  return `
    <button class="${isSelected ? "selected" : ""}" data-action="select-reseller-colour" data-product-id="${escapeHtml(productId)}" data-colour="${escapeHtml(colour.key)}" aria-pressed="${isSelected ? "true" : "false"}" title="${escapeHtml(colour.label)}">
      <span class="colour-dot" aria-hidden="true"></span>
      <span>${escapeHtml(colour.label)}</span>
    </button>
  `;
}

function resellerColourOrderCard(productId, colour, canOrder) {
  const sizes = resellerAvailableSizes(colour.rows);
  const selectedTotal = colour.rows.reduce((total, row) => total + Number(state.resellerDraft[row.variantId] || 0), 0);
  return `
    <article class="builder-colour-order-card" data-bulk-order-product="${escapeHtml(productId)}" data-colour="${escapeHtml(colour.key)}">
      <div class="builder-colour-card-head">
        <div class="builder-colour-image">${productVisual(colour.label, colour.imageName)}</div>
        <div class="builder-colour-copy">
          <strong>${escapeHtml(colour.label)}</strong>
          <span>${escapeHtml(`${colour.totalStock} units in stock`)}</span>
          <span>${escapeHtml(`Sizes ${sizes || "available"}`)}</span>
        </div>
        <div class="builder-colour-total">
          <strong>${selectedTotal}</strong>
          <span>${selectedTotal === 1 ? "pair" : "pairs"}</span>
        </div>
      </div>
      <div class="builder-size-list" aria-label="${escapeHtml(colour.label)} size quantities">
        ${colour.rows.map((row) => resellerSizeQuantityCell(row, canOrder)).join("")}
      </div>
      <div class="bulk-order-actions">
        <button class="button primary full" data-action="add-bulk-order" data-product-id="${escapeHtml(productId)}" ${canOrder ? "" : "disabled"}>Update request</button>
        <button class="button secondary full" data-action="clear-bulk-order" data-product-id="${escapeHtml(productId)}">Clear color</button>
      </div>
    </article>
  `;
}

function selectedResellerProductGroup() {
  const rows = Orders.availableInventoryRows(inventoryRows()).filter((row) => row.productId === state.selectedProductId);
  return Orders.visibleShopProductGroups(rows, { productLimit: 1, optionLimit: 500 })[0] || null;
}

function resellerProductOrderPage() {
  const group = selectedResellerProductGroup();
  const orderItems = currentDraftItems();
  const summary = currentDraftSummary();
  if (!group) {
    return `
      <main class="portal-page">
        <button class="text-link" data-route="reseller">Back to shop</button>
        <section class="empty-state">
          <h1>Product unavailable</h1>
          <p>This product is not currently available for reseller ordering.</p>
        </section>
        ${footer(true)}
      </main>
    `;
  }
  const colourGroups = resellerColourGroups(group.rows);
  const imageName = colourGroups[0]?.imageName || group.imageName;
  const price = OperationsProducts.priceState(group.price, group.currency || "USD");
  const canOrder = Boolean(group.priceKnown);
  return `
    <main class="portal-page reseller-detail-page reseller-builder-page">
      <button class="text-link" data-route="reseller">Back to shop</button>
      <section class="reseller-builder-grid">
        <aside class="builder-product-panel">
          ${productVisual(group.productName, imageName)}
          <div class="reseller-product-head">
            <div>
              <p>${escapeHtml(group.category || "Wholesale product")}</p>
              <h1>${escapeHtml(group.productName)}</h1>
            </div>
            <strong class="${price.priced ? "" : "price-pending"}">${escapeHtml(price.priced ? price.label : "Price pending")}</strong>
          </div>
          <div class="product-facts detail-facts">
            <span>${colourGroups.length} ${colourGroups.length === 1 ? "color" : "colors"}</span>
            <span>${resellerAvailableSizes(group.rows) || "Check availability"}</span>
            <span>${group.totalStock} units exact stock</span>
          </div>
        </aside>
        <section class="builder-form-panel">
          <div class="builder-section-head">
            <h2>Choose colors and sizes</h2>
            <span>${escapeHtml(`${colourGroups.length} color cards`)}</span>
          </div>
          <div class="builder-colour-order-list" aria-label="${escapeHtml(group.productName)} color size order cards">
            ${colourGroups.map((colour) => resellerColourOrderCard(group.productId, colour, canOrder)).join("")}
          </div>
          ${canOrder ? "" : `<p class="notice warning">Admin needs to set this product price before it can be added to a request.</p>`}
        </section>
        <aside class="order-sidebar reseller-detail-sidebar builder-summary-panel" id="portal-order">
          <div class="sidebar-head"><h2>Request cart</h2><p>${summary.totalUnits} ${summary.totalUnits === 1 ? "pair" : "pairs"} selected</p></div>
          <div class="order-items">
            ${
              orderItems.length
                ? orderItems
                    .map(
                      (item) => `
                <div class="order-item">
                  ${productVisual(item.productName, item.imageName)}
                  <div>
                    <div class="order-title-row"><strong>${escapeHtml(item.productName)}</strong><button data-action="remove-order-item" data-variant-id="${escapeHtml(item.variantId)}" aria-label="Remove ${escapeHtml(item.productName)} ${escapeHtml(item.colour)} size ${escapeHtml(item.size)}">Remove</button></div>
                    <p>${escapeHtml(item.colour)} / Size ${escapeHtml(item.size)}</p>
                    <div class="line-total"><span>${item.requestedQuantity} x ${money(item.price)}</span><strong>${money(item.lineTotal)}</strong></div>
                  </div>
                </div>
              `,
                    )
                    .join("")
                : `<p class="notice">Add quantities from the size grid to build this request.</p>`
            }
          </div>
          <form class="order-summary" data-form="order">
            <div class="summary-row"><span>Total pairs</span><strong>${summary.totalUnits}</strong></div>
            <div class="summary-row"><span>Subtotal</span><strong>${money(summary.subtotal)}</strong></div>
            <label><span>Notes for admin</span><textarea name="order_notes" placeholder="Optional notes for admin">${escapeHtml(state.resellerNotes)}</textarea></label>
            <button class="button primary full" ${state.orderSubmitPending || !orderItems.length ? "disabled" : ""}>Submit Order Request</button>
            <p class="notice">Stock updates after admin approval.</p>
          </form>
        </aside>
      </section>
      ${footer(true)}
    </main>
  `;
}

function resellerBulkOrderMatrix({ group, colourGroups, selectedColour, selectedRows, canOrder }) {
  const selectedGroup = colourGroups.find((entry) => entry.key === selectedColour) || colourGroups[0];
  const selectedTotal = selectedRows.reduce((total, row) => total + Number(state.resellerDraft[row.variantId] || 0), 0);
  const exactColorStock = selectedRows.reduce((total, row) => total + Number(row.stockQuantity || 0), 0);
  return `
    <div class="bulk-order-panel" data-bulk-order-product="${escapeHtml(group.productId)}">
      <div class="bulk-order-head">
        <div>
          <strong>${escapeHtml(selectedGroup?.label || "Choose colour")}</strong>
          <span>${escapeHtml(`${exactColorStock} units exact stock`)}</span>
        </div>
        <span>${selectedTotal ? `${selectedTotal} ${selectedTotal === 1 ? "pair" : "pairs"} selected` : "Enter quantities"}</span>
      </div>
      <div class="builder-size-list" aria-label="${escapeHtml(group.productName)} ${escapeHtml(selectedGroup?.label || "")} size quantities">
        ${selectedRows.map((row) => resellerSizeQuantityCell(row, canOrder)).join("")}
      </div>
      <div class="bulk-order-actions">
        <button class="button primary full" data-action="add-bulk-order" data-product-id="${escapeHtml(group.productId)}" ${canOrder ? "" : "disabled"}>Update request totals</button>
        <button class="button secondary full" data-action="clear-bulk-order" data-product-id="${escapeHtml(group.productId)}">Clear this colour</button>
      </div>
    </div>
  `;
}

function resellerSizeQuantityCell(row, productCanOrder = true) {
  const availability = availabilityLabel(row.stockQuantity);
  const disabled = row.stockQuantity <= 0 || !productCanOrder || !row.priceKnown;
  const quantity = Number(state.resellerDraft[row.variantId] || 0);
  const lineTotal = quantity * Number(row.price || 0);
  return `
    <div class="builder-size-row" data-inventory-line>
      <label>
        <span>Size ${escapeHtml(row.size || "-")}</span>
        <input class="qty-input" aria-label="Quantity for ${escapeHtml(row.colour)} size ${escapeHtml(row.size)}" type="number" min="0" max="${row.stockQuantity}" value="${state.resellerDraft[row.variantId] || ""}" data-bulk-qty-input="${escapeHtml(row.variantId)}" ${disabled ? "disabled" : ""} />
      </label>
      <span class="exact-stock">${escapeHtml(`${row.stockQuantity} in stock`)}</span>
      <span class="availability ${availability.className}">${availability.label}</span>
      <strong>${money(lineTotal)}</strong>
    </div>
  `;
}

function formatOrderDate(value) {
  if (!value) return "Date pending";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Date pending" : parsed.toLocaleDateString();
}

function orderGroupSection(title, records = [], emptyCopy, description = "") {
  return `
    <section class="admin-card">
      <div class="panel-toolbar">
        <h2>${escapeHtml(title)}</h2>
        <span>${escapeHtml(String(records.length))}</span>
      </div>
      ${description ? `<p>${escapeHtml(description)}</p>` : ""}
      <div class="approval-stack">
        ${
          records.length
            ? records
                .map(
                  (record) => `
                    <article class="approval-item request-review-item">
                      <div class="approval-item-body">
                        <div class="approval-item-head">
                          <strong>${escapeHtml(record.code)}</strong>
                          ${statusPill(record.statusMeta?.label || record.normalizedStatus || record.status)}
                        </div>
                        <div class="request-meta-line">
                          <span>${escapeHtml(formatOrderDate(record.createdAt))}</span>
                          <span>${escapeHtml(`${record.totalUnits} pairs`)}</span>
                          <span>${escapeHtml(`${record.totalItems} SKU lines`)}</span>
                        </div>
                        <div class="request-meta-line">
                          <span>Total</span>
                          <strong>${money(record.subtotal)}</strong>
                        </div>
                        <p class="request-note">${escapeHtml(record.adminNotes || record.notes || "No notes available yet.")}</p>
                      </div>
                      <div class="approval-actions">
                        <button class="button secondary" data-route="order" data-order-id="${escapeHtml(record.id)}">View Order</button>
                      </div>
                    </article>
                  `,
                )
                .join("")
            : `<p class="notice">${escapeHtml(emptyCopy)}</p>`
        }
      </div>
    </section>
  `;
}

function workspaceSubnav(title, items = [], activeRoute = state.route) {
  return `
    <aside class="workspace-subnav">
      <div class="workspace-subnav-head">
        <h2>${escapeHtml(title)}</h2>
      </div>
      <nav>
        ${items
          .map(
            ([label, route, count]) => `
              <button class="${route === activeRoute ? "active" : ""}" data-route="${escapeHtml(route)}">
                <span>${escapeHtml(label)}</span>
                ${typeof count === "number" ? `<strong>${escapeHtml(String(count))}</strong>` : ""}
              </button>
            `,
          )
          .join("")}
      </nav>
    </aside>
  `;
}

function workspaceShell({ title, copy, backRoute, subnavTitle, subnavItems, content }) {
  return `
    <main class="portal-page">
      <section class="portal-header">
        <div>
          <h1>${escapeHtml(title)}</h1>
          <p>${escapeHtml(copy)}</p>
        </div>
        ${backRoute ? `<button class="button secondary" data-route="${escapeHtml(backRoute)}">Back</button>` : ""}
      </section>
      <section class="workspace-shell">
        ${workspaceSubnav(subnavTitle, subnavItems)}
        <div class="workspace-content">
          ${content}
        </div>
      </section>
      ${footer(true)}
    </main>
  `;
}

function resellerOrderSubnavItems() {
  const buckets = visibleOrderBuckets();
  return [
    ["Overview", "history", buckets.new.length + buckets.awaitingPayment.length + buckets.active.length + buckets.shipped.length + buckets.fulfilled.length + buckets.closed.length],
    ["Awaiting Payment", "expected-orders", buckets.awaitingPayment.length + buckets.new.length],
    ["Active", "current-orders", buckets.active.length],
    ["Fulfillment", "fulfillment", buckets.shipped.length + buckets.fulfilled.length],
  ];
}

function adminOrderSubnavItems() {
  const buckets = AdminOrders.buildClientOrderBuckets(requestHistoryRecords());
  return [
    ["Needs Review", "requests", buckets.new.length],
    ["Awaiting Payment", "requests-payment", buckets.awaitingPayment.length],
    ["Supplier", "requests-supplier", buckets.active.length],
    ["Completed", "requests-completed", buckets.shipped.length + buckets.fulfilled.length],
  ];
}

function requestHistory() {
  const buckets = visibleOrderBuckets();
  const summaryCards = [
    ["New Requests", buckets.new.length, "Requests that have been submitted and are waiting for review.", "history"],
    ["Awaiting Payment", buckets.awaitingPayment.length, "Supply has been approved and payment is still outstanding.", "expected-orders"],
    ["Active Orders", buckets.active.length, "Paid and supplier-bound orders currently moving through the workflow.", "current-orders"],
    ["Shipped", buckets.shipped.length, "Orders that have already shipped and are on the way.", "fulfillment"],
  ];
  return workspaceShell({
    title: "My Orders",
    copy: "Use the menu to move between payment, active fulfillment, and completed order history.",
    backRoute: "reseller",
    subnavTitle: "Order Menu",
    subnavItems: resellerOrderSubnavItems(),
    content: `
      ${state.historyError ? `<p class="notice error">${escapeHtml(state.historyError)}</p>` : ""}
      ${
        state.historyLoading
          ? `<section class="inventory-panel"><p class="notice">Loading order history...</p></section>`
          : `<section class="admin-panels">
              ${summaryCards
                .map(
                  ([label, value, copy, route]) => `
                    <article class="admin-card">
                      <div class="panel-toolbar"><h2>${escapeHtml(label)}</h2><span>${escapeHtml(String(value))}</span></div>
                      <p>${escapeHtml(copy)}</p>
                      <div class="approval-actions" style="padding: 0 20px 20px;">
                        <button class="button secondary" data-route="${route}">Open ${escapeHtml(label)}</button>
                      </div>
                    </article>
                  `,
                )
                .join("")}
            </section>
            ${orderGroupSection("Recent History", [...buckets.shipped, ...buckets.fulfilled, ...buckets.closed].slice(0, 6), "No completed or closed orders yet.", "Recent finished, shipped, and closed orders stay in history here.")}`
      }
    `,
  });
}

function orderStatusCollection(title, copy, records = [], emptyCopy = "No orders available.") {
  return workspaceShell({
    title,
    copy,
    backRoute: "history",
    subnavTitle: "Order Menu",
    subnavItems: resellerOrderSubnavItems(),
    content: `
      <section class="approval-stack">
        ${
          records.length
            ? records
                .map(
                  (record) => `
                    <article class="approval-item request-review-item">
                      <div class="approval-item-body">
                        <div class="approval-item-head">
                          <strong>${escapeHtml(record.code)}</strong>
                          ${statusPill(record.statusMeta?.label || record.normalizedStatus || record.status)}
                        </div>
                        <div class="request-meta-line">
                          <span>${escapeHtml(formatOrderDate(record.createdAt))}</span>
                          <span>${escapeHtml(String(record.totalItems) + " SKU lines")}</span>
                          <span>${escapeHtml(String(record.totalUnits) + " pairs")}</span>
                        </div>
                        <div class="request-meta-line">
                          <span>Total</span>
                          <strong>${money(record.subtotal)}</strong>
                        </div>
                        ${
                          record.expectedFulfillmentDate
                            ? `<div class="request-meta-line"><span>Expected fulfillment</span><strong>${escapeHtml(record.expectedFulfillmentDate)}</strong></div>`
                            : ""
                        }
                        <p class="request-note">${escapeHtml(record.adminNotes || record.notes || "No notes available.")}</p>
                      </div>
                      <div class="approval-actions">
                        <button class="button secondary" data-route="order" data-order-id="${escapeHtml(record.id)}">View Order</button>
                      </div>
                    </article>
                  `,
                )
                .join("")
            : `<p class="notice">${escapeHtml(emptyCopy)}</p>`
        }
      </section>
    `,
  });
}

function currentOrdersPage() {
  const buckets = visibleOrderBuckets();
  return orderStatusCollection(
    "Current Orders",
    "Paid orders and supplier-bound requests that are already moving through the pipeline.",
    buckets.active,
    "No current orders yet.",
  );
}

function expectedOrdersPage() {
  const buckets = visibleOrderBuckets();
  return orderStatusCollection(
    "Expected Orders",
    "Requests still waiting for review or payment before supplier fulfillment begins.",
    [...buckets.new, ...buckets.awaitingPayment],
    "No expected orders right now.",
  );
}

function fulfillmentStatusPage() {
  const buckets = visibleOrderBuckets();
  return orderStatusCollection(
    "Fulfillment Status",
    "Orders that have already shipped and orders that are now fully completed.",
    [...buckets.shipped, ...buckets.fulfilled],
    "No fulfillment updates yet.",
  );
}

function requestConfirmationPage() {
  const confirmation = requestConfirmationData();
  if (!confirmation) {
    return `
      <main class="portal-page">
        <section class="request-confirmation">
          <h1>No recent request found</h1>
          <p>Your submitted requests will appear in request history.</p>
          <div class="confirmation-actions">
            <button class="button primary" data-route="reseller">Back to shop</button>
            <button class="button secondary" data-route="history">View request history</button>
          </div>
        </section>
        ${footer(true)}
      </main>
    `;
  }
  const items = confirmation.items || [];
  return `
    <main class="portal-page">
      <section class="request-confirmation">
        <div class="confirmation-head">
          <div>
            <h1>Request submitted</h1>
            <p>${escapeHtml(confirmation.code)} is waiting for admin review.</p>
          </div>
          ${statusPill(confirmation.status || "submitted")}
        </div>
        <div class="confirmation-summary">
          <div><span>Pairs</span><strong>${escapeHtml(String(confirmation.totalUnits || 0))}</strong></div>
          <div><span>SKU lines</span><strong>${escapeHtml(String(confirmation.totalItems || items.length || 0))}</strong></div>
          <div><span>Total</span><strong>${money(confirmation.subtotal || 0)}</strong></div>
        </div>
        <div class="confirmation-lines">
          ${items.length
            ? items
                .map((item) => {
                  const quantity = Number(item.quantity || item.requestedQuantity || 0);
                  const price = Number(item.base_price || item.price || 0);
                  return `
                    <div class="confirmation-line">
                      <strong>${escapeHtml(item.product_name || item.productName || "Product")}</strong>
                      <span>${escapeHtml([item.colour, item.size ? `Size ${item.size}` : ""].filter(Boolean).join(" / ") || "Option")}</span>
                      <span>${escapeHtml(`${quantity} pairs`)}</span>
                      <strong>${money(quantity * price)}</strong>
                    </div>
                  `;
                })
                .join("")
            : `<p class="notice">Request items will appear after history refreshes.</p>`}
        </div>
        <div class="confirmation-actions">
          <button class="button primary" data-route="history">View request history</button>
          <button class="button secondary" data-route="reseller">Continue shopping</button>
        </div>
      </section>
      ${footer(true)}
    </main>
  `;
}

function adminDashboard() {
  const products = catalogProducts();
  const activeProducts = products.filter((product) => product.published);
  const orderRecords = requestHistoryRecords();
  const applicationCounts = applicationSummary();
  return `
    <main class="admin-layout">
      ${adminSidebar("admin")}
      <section class="admin-main">
        <header class="admin-topbar">
          <div><h1>Irunsvan Africa Operations</h1><p>System overview and controls for catalog, stock, reseller access, and product requests.</p></div>
          <button class="icon-button" data-route="email">Alerts</button>
        </header>
        ${metricGrid([
          ["Pending Apps", String(applicationCounts.pending), "Awaiting review"],
          ["Submitted Requests", String(AdminOrders.countRequestsByStatus(orderRecords, ["submitted"])), "Order pipeline"],
          ["Active Products", String(activeProducts.length), "Current source truth"],
          ["Inventory Rows", String(state.inventory.length || 0), "Imported stock"],
        ])}
        <section class="admin-panels">
          ${adminTable(
            "Reseller Applications",
            ["Company", "Country", "Status", "Actions"],
            state.resellerApplicationsData.map((application) => [application.company_name, application.country || "—", application.status, "Review"]),
            "applications",
          )}
          ${adminTable(
            "Product Requests",
            ["Order #", "Items / Qty", "Status", "Action"],
            orderRecords.map((record) => [
              record.code,
              `${record.totalItems} SKUs / ${record.totalUnits} units`,
              record.status,
              "Review",
            ]),
            "requests",
          )}
        </section>
        <section class="product-overview">
          <div class="panel-toolbar"><h2>Product / Inventory Overview</h2><span>${state.variants.length} SKUs</span></div>
          <div class="overview-list">
            ${activeProducts
              .map((product) => `<div class="overview-row"><strong>${escapeHtml(product.sku)}</strong><span>${escapeHtml(product.name)}</span><span>${money(product.base_price)}</span></div>`)
              .join("")}
          </div>
        </section>
      </section>
    </main>
  `;
}

function adminTeam() {
  const admins = state.staffProfiles.filter((profile) => profile.role === "admin");
  const resellers = state.staffProfiles.filter((profile) => profile.role === "reseller");
  const pending = state.staffProfiles.filter((profile) => profile.role === "pending_reseller");
  const invites = state.adminInvites || [];
  return `
    <main class="admin-layout">
      ${adminSidebar("team")}
      <section class="admin-main">
        <header class="admin-topbar">
          <div><h1>Team & Access</h1><p>Manage internal admins and review which reseller accounts already exist in the system.</p></div>
        </header>
        ${metricGrid([
          ["Admins", String(admins.length), "Operations accounts"],
          ["Approved Resellers", String(resellers.length), "Can place wholesale requests"],
          ["Pending Accounts", String(pending.length), "Need review or promotion"],
          ["Admin Invites", String(invites.filter((invite) => invite.status === "pending").length), "Private links waiting to be used"],
          ["Total Profiles", String(state.staffProfiles.length), "Stored user records"],
        ])}
        <section class="admin-panels">
          <div class="admin-card">
            <div class="panel-toolbar"><h2>Create Admin Invite</h2><span>Private link only</span></div>
            ${state.teamInviteError ? `<p class="notice error">${escapeHtml(state.teamInviteError)}</p>` : ""}
            ${state.adminInviteCreatedLink ? `<p class="notice success">Invite created for ${escapeHtml(state.adminInviteCreatedEmail || "the selected email")}.</p>` : ""}
            ${state.adminInviteCreatedLink ? `<div class="invite-link-row"><label><span>Invite Link</span><input readonly value="${escapeHtml(state.adminInviteCreatedLink)}" /></label><button type="button" class="button secondary" data-action="copy-admin-invite" data-link="${escapeHtml(state.adminInviteCreatedLink)}">Copy Invite Link</button></div>` : ""}
            <form class="workflow-form" data-form="admin-invite">
              ${inputField("Invite Email", "invite_email", "name@example.com", "email")}
              <label><span>Expires in Days</span><input name="expires_days" type="number" min="1" max="30" value="7" /></label>
              <label><span>Note</span><textarea name="invite_note" placeholder="Optional note for this invite."></textarea></label>
              <button class="button primary full" ${state.teamInviteCreatePending ? "disabled" : ""}>${state.teamInviteCreatePending ? "Creating..." : "Create Invite Link"}</button>
            </form>
          </div>
        </section>
        <section class="form-grid">
          <form class="workflow-form" data-form="team-role">
            <h2>Assign access</h2>
            <p class="form-note">To add an admin, have the person sign in or submit a reseller application first. Then enter that existing account email here and set the role to Admin.</p>
            ${state.teamError ? `<p class="notice error">${escapeHtml(state.teamError)}</p>` : ""}
            ${state.teamSaved ? `<p class="notice success">Account access updated.</p>` : ""}
            ${inputField("Existing Account Email", "email", "name@example.com", "email")}
            <label><span>Role</span>
              <select name="role">
                <option value="admin">Admin</option>
                <option value="reseller">Reseller</option>
                <option value="pending_reseller">Pending Reseller</option>
              </select>
            </label>
            <button class="button primary full" ${state.teamSavePending ? "disabled" : ""}>${state.teamSavePending ? "Saving..." : "Update Access"}</button>
          </form>
          <section class="inventory-panel">
            <div class="panel-toolbar"><h2>Current team</h2><span>${admins.length} admin accounts</span></div>
            <div class="table-wrap">
              <table>
                <thead><tr><th>Name</th><th>Email</th><th>Company</th><th>Phone</th><th>Role</th></tr></thead>
                <tbody>
                  ${
                    state.staffProfiles.length
                      ? state.staffProfiles
                          .map(
                            (profile) => `
                              <tr>
                                <td>${escapeHtml(profile.full_name || "No name")}</td>
                                <td>${escapeHtml(profile.email || "No email")}</td>
                                <td>${escapeHtml(profile.company_name || "—")}</td>
                                <td>${escapeHtml(profile.phone || "—")}</td>
                                <td>${statusPill(profile.role)}</td>
                              </tr>
                            `,
                          )
                          .join("")
                      : `<tr><td colspan="5">No staff or reseller profiles loaded yet.</td></tr>`
                  }
                </tbody>
              </table>
            </div>
            <div class="panel-toolbar" style="margin-top: 24px;"><h2>Admin Invites</h2><span>${invites.length} total</span></div>
            <div class="table-wrap">
              <table>
                <thead><tr><th>Email</th><th>Status</th><th>Expires</th><th>Actions</th></tr></thead>
                <tbody>
                  ${
                    invites.length
                      ? invites
                          .map((invite) => {
                            const inviteExpired = invite.status === "pending" && invite.expires_at && new Date(invite.expires_at).getTime() < Date.now();
                            const status = inviteExpired ? "expired" : invite.status;
                            return `
                              <tr>
                                <td>${escapeHtml(invite.email)}</td>
                                <td>${statusPill(status)}</td>
                                <td>${escapeHtml(new Date(invite.expires_at).toLocaleDateString())}</td>
                                <td>
                                  ${
                                    invite.status === "pending"
                                      ? `<button class="button mini secondary" data-action="revoke-admin-invite" data-invite-id="${escapeHtml(invite.id)}">Revoke</button>`
                                      : `<span class="form-note">${escapeHtml(invite.status === "used" ? "Already claimed" : invite.status === "revoked" ? "Revoked" : "Expired")}</span>`
                                  }
                                </td>
                              </tr>
                            `;
                          })
                          .join("")
                      : `<tr><td colspan="4">No admin invites created yet.</td></tr>`
                  }
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </section>
    </main>
  `;
}

function contentAdminItem({ title, imagePath, meta, published, actions = "" }) {
  const imageUrl = resolveContentImageUrl(imagePath || "");
  return `
    <article class="content-admin-item">
      ${
        imageUrl
          ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(title || "Content image")}" loading="lazy" />`
          : `<div class="content-admin-thumb content-admin-thumb-placeholder">${logo("blue")}</div>`
      }
      <div class="content-admin-copy">
        <strong>${escapeHtml(title || "Untitled")}</strong>
        <span>${escapeHtml(meta || (published ? "Published" : "Draft"))}</span>
      </div>
      ${actions ? `<div class="content-admin-actions">${actions}</div>` : ""}
    </article>
  `;
}

function flyerAdminList() {
  const items = Array.isArray(state.homepageFlyers) ? state.homepageFlyers : [];
  if (!items.length) return `<div class="content-empty-state"><p>No flyer images uploaded yet.</p></div>`;
  return `<div class="content-admin-list">${items.map((flyer) => contentAdminItem({ title: flyer.title, imagePath: flyer.imagePath, meta: `${flyer.sortOrder} order • ${flyer.published ? "Published" : "Draft"}`, published: flyer.published })).join("")}</div>`;
}

function storyAdminList() {
  const items = Array.isArray(state.blogPosts) ? state.blogPosts : [];
  if (!items.length) return `<div class="content-empty-state"><p>No stories saved yet.</p></div>`;
  return `<div class="content-admin-list">${items.map((story) => contentAdminItem({ title: story.title, imagePath: story.coverImagePath, meta: `${story.published ? "Published" : "Draft"}${story.publishedAt ? ` • ${new Date(story.publishedAt).toLocaleDateString()}` : ""}`, published: story.published })).join("")}</div>`;
}

function publicProductFlyerAdminList() {
  const items = Array.isArray(state.publicProductFlyers) ? state.publicProductFlyers : [];
  if (!items.length) return `<div class="content-empty-state"><p>No public product flyers saved yet.</p></div>`;
  return `<div class="content-admin-list">${items.map((flyer) => contentAdminItem({
    title: flyer.title,
    imagePath: flyer.mainImagePath,
    meta: `${flyer.productClass} - ${flyer.published ? "Published" : "Draft"}`,
    published: flyer.published,
    actions: `
      <button type="button" class="button mini" data-action="edit-public-product-flyer" data-flyer-id="${escapeHtml(flyer.id)}">Edit</button>
      <button type="button" class="button mini secondary" data-action="delete-public-product-flyer" data-flyer-id="${escapeHtml(flyer.id)}">Delete</button>
    `,
  })).join("")}</div>`;
}

function publicProductFlyerBeingEdited() {
  const id = String(state.publicProductFlyerEditingId || "").trim();
  if (!id) return null;
  return (Array.isArray(state.publicProductFlyers) ? state.publicProductFlyers : []).find((flyer) => flyer.id === id) || null;
}

function isSeededProductFlyer(flyer) {
  const slug = String(flyer?.slug || "").trim();
  return WebsiteContent.DEFAULT_PRODUCT_FLYERS.some((item) => item.slug === slug);
}

function activeSiteControlSection() {
  const key = String(state.siteControlSection || "").trim();
  return SITE_CONTROL_SECTIONS.some(([sectionKey]) => sectionKey === key) ? key : SITE_CONTROL_SECTIONS[0][0];
}

function siteControlSectionCount(key) {
  if (key === "product-flyers") return state.publicProductFlyers.length;
  if (key === "homepage-flyers") return state.homepageFlyers.length;
  if (key === "stories") return state.blogPosts.length;
  return "";
}

function siteControlsSubnav() {
  const activeKey = activeSiteControlSection();
  return `
    <aside class="workspace-subnav site-controls-subnav" aria-label="Site controls menu">
      <div class="workspace-subnav-head">
        <h2>Site Controls</h2>
      </div>
      <nav>
        ${SITE_CONTROL_SECTIONS.map(([key, label]) => {
          const count = siteControlSectionCount(key);
          return `<button type="button" class="${key === activeKey ? "active" : ""}" data-action="site-controls-section" data-section="${escapeHtml(key)}"><span>${escapeHtml(label)}</span>${count === "" ? "" : `<strong>${escapeHtml(String(count))}</strong>`}</button>`;
        }).join("")}
      </nav>
    </aside>
  `;
}

function siteHomepageFlyersPanel() {
  return `
    <div class="admin-card site-controls-card">
      <div class="panel-toolbar"><h2>Homepage Flyers</h2><span>${state.homepageFlyers.length} items</span></div>
      <form class="workflow-form" data-form="homepage-flyer">
        ${controlInput("Flyer Title", "flyer_title", "")}
        ${controlInput("Display Order", "flyer_sort_order", "0", "number")}
        <label><span>Flyer Image</span><input name="flyer_image" type="file" accept="image/*" /></label>
        <label class="toggle-row"><input name="flyer_published" type="checkbox" checked /><span>Publish now</span></label>
        <button class="button primary full" type="submit" ${state.flyerSavePending ? "disabled" : ""}>${state.flyerSavePending ? "Saving..." : "Save Flyer"}</button>
      </form>
      ${flyerAdminList()}
    </div>
  `;
}

function siteStoriesPanel() {
  return `
    <div class="admin-card site-controls-card">
      <div class="panel-toolbar"><h2>Stories</h2><span>${state.blogPosts.length} items</span></div>
      <form class="workflow-form" data-form="blog-post">
        ${controlInput("Story Title", "story_title", "")}
        <label><span>Cover Image</span><input name="story_cover_image" type="file" accept="image/*" /></label>
        ${controlTextarea("Summary", "story_summary", "")}
        ${controlTextarea("Story Body", "story_body", "")}
        <label class="toggle-row"><input name="story_published" type="checkbox" /><span>Publish now</span></label>
        <button class="button primary full" type="submit" ${state.storySavePending ? "disabled" : ""}>${state.storySavePending ? "Saving..." : "Save Story"}</button>
      </form>
      ${storyAdminList()}
    </div>
  `;
}

function siteProductFlyersPanel() {
  const productFlyerEdit = publicProductFlyerBeingEdited();
  const productFlyerFormTitle = productFlyerEdit ? "Edit Product Flyer" : "Add Product Flyer";
  const productFlyerSubmitLabel = productFlyerEdit ? "Update Product Flyer" : "Save Product Flyer";
  const productFlyerSavingLabel = productFlyerEdit ? "Updating..." : "Saving...";
  return `
    <div class="admin-card site-controls-card public-product-flyer-admin-card">
      <div class="panel-toolbar"><h2>Public Product Flyers</h2><span>${state.publicProductFlyers.length} items</span></div>
      <form class="workflow-form" data-form="public-product-flyer">
        <input type="hidden" name="product_flyer_id" value="${escapeHtml(productFlyerEdit?.id || "")}" />
        <div class="form-section-title">${escapeHtml(productFlyerFormTitle)}</div>
        ${controlInput("Product Name", "product_flyer_title", productFlyerEdit?.title || "")}
        ${controlInput("Product Class", "product_flyer_class", productFlyerEdit?.productClass || "")}
        ${controlInput("Display Order", "product_flyer_display_order", String(productFlyerEdit?.displayOrder ?? 0), "number")}
        <label><span>Main Image</span><input name="product_flyer_main_image" type="file" accept="image/*" /></label>
        ${productFlyerEdit?.mainImagePath ? `<p class="form-note">Current main photo stays unless you choose a replacement.</p>` : ""}
        <label><span>Secondary Image</span><input name="product_flyer_secondary_image" type="file" accept="image/*" /></label>
        ${productFlyerEdit?.secondaryImagePath ? `<p class="form-note">Current secondary photo stays unless you choose a replacement.</p>` : ""}
        ${controlTextarea("Short Description", "product_flyer_short_description", productFlyerEdit?.shortDescription || "")}
        ${controlTextarea("Flyer Story", "product_flyer_story", productFlyerEdit?.story || "")}
        <label class="toggle-row"><input name="product_flyer_published" type="checkbox" ${productFlyerEdit?.published ? "checked" : ""} /><span>Publish on public Products page</span></label>
        <div class="form-actions-row">
          <button class="button primary full" type="submit" ${state.publicProductFlyerSavePending ? "disabled" : ""}>${state.publicProductFlyerSavePending ? productFlyerSavingLabel : productFlyerSubmitLabel}</button>
          ${productFlyerEdit ? `<button class="button secondary full" type="button" data-action="cancel-public-product-flyer-edit">Cancel Edit</button>` : ""}
        </div>
      </form>
      ${publicProductFlyerAdminList()}
    </div>
  `;
}

function siteAboutPanel(site) {
  return `
    <div class="admin-card site-controls-card">
      <div class="panel-toolbar"><h2>About Section</h2><span>Public homepage copy</span></div>
      <form class="workflow-form" data-form="about-content">
        ${controlInput("Heading", "about_heading", site.about?.heading || "")}
        ${controlTextarea("Body", "about_body", site.about?.body || "")}
        <button class="button primary full" type="submit" ${state.aboutSavePending ? "disabled" : ""}>${state.aboutSavePending ? "Saving..." : "Save About Copy"}</button>
      </form>
    </div>
  `;
}

function siteHeroThemePanel(site, hero, theme) {
  return `
    <section class="site-control-grid site-control-grid-focused">
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
  `;
}

function siteControlsPanel(section, site, hero, theme) {
  if (section === "homepage-flyers") return siteHomepageFlyersPanel();
  if (section === "stories") return siteStoriesPanel();
  if (section === "about") return siteAboutPanel(site);
  if (section === "hero-theme") return siteHeroThemePanel(site, hero, theme);
  return siteProductFlyersPanel();
}

function adminSiteControls() {
  const site = state.siteContent;
  const hero = site.hero;
  const theme = site.theme;
  const section = activeSiteControlSection();
  return `
    <main class="admin-layout">
      ${adminSidebar("site")}
      <section class="admin-main">
        <header class="admin-topbar">
          <div><h1>Website Content</h1><p>Manage homepage flyers, stories, about copy, and the public site presentation.</p></div>
          <button class="icon-button" data-route="store">View Site</button>
        </header>
        ${state.siteSaved ? `<p class="notice success">Site controls published to Supabase. The public site now reads the active hero, theme, and banner from the database.</p>` : ""}
        ${state.siteSaveError ? `<p class="notice error">${escapeHtml(state.siteSaveError)}</p>` : ""}
        ${state.adminContentError ? `<p class="notice error">${escapeHtml(state.adminContentError)}</p>` : ""}
        <section class="site-controls-workspace">
          ${siteControlsSubnav()}
          <div class="site-controls-panel">
            ${siteControlsPanel(section, site, hero, theme)}
          </div>
        </section>
      </section>
    </main>
  `;
}

function adminProducts() {
  const colourRows = colourReviewRows();
  const productModels = adminProductModels();
  const activeProductModels = productModels.filter((model) => model.published);
  const archivedProductModels = productModels.filter((model) => !model.published);
  const summary = OperationsProducts.summarizeAdminProducts(activeProductModels);
  return `
    <main class="admin-layout">
      ${adminSidebar("products")}
      <section class="admin-main">
        <header class="admin-topbar">
          <div><h1>Products</h1><p>Manage prices, images, publishing, and exact stock by product before resellers order.</p></div>
          <button class="icon-button" data-action="toggle-product-form">${state.productFormOpen ? "Close Add Product" : "Add Product"}</button>
        </header>
        ${state.productFormSaved ? `<p class="notice success">${escapeHtml(state.productFormSaveMessage || "Product saved with generated color and size variants.")}</p>` : ""}
        ${state.colourReviewSaved ? `<p class="notice success">Colour Review saved. Product names, images, and visibility are now aligned with the linked variants.</p>` : ""}
        ${state.productFormWarning ? `<p class="notice warning">${escapeHtml(state.productFormWarning)}</p>` : ""}
        ${state.productFormError ? `<p class="notice error">${escapeHtml(state.productFormError)}</p>` : ""}
        ${state.productPriceSaved ? `<p class="notice success">Product price saved. Reseller pricing will update on the next data refresh.</p>` : ""}
        ${state.productPriceError ? `<p class="notice error">${escapeHtml(state.productPriceError)}</p>` : ""}
        ${state.colourReviewError ? `<p class="notice error">${escapeHtml(state.colourReviewError)}</p>` : ""}
        ${metricGrid([
          ["Products", String(summary.total), "Current source truth"],
          ["Total Stock", String(summary.totalUnits), "Units available"],
          ["Missing Price", String(summary.missingPrice), "Needs admin"],
          ["Archived", String(archivedProductModels.length), "Hidden from reseller view"],
        ])}
        <section class="admin-product-command">
          <div>
            <h2>Existing Products</h2>
            <p>Only current published products are shown here. Archived models stay out of the daily workflow.</p>
          </div>
          <button class="button secondary" data-action="toggle-product-form">${state.productFormOpen ? "Hide Add Product" : "Add New Product"}</button>
        </section>
        ${state.productFormOpen ? productForm() : ""}
        <section class="admin-product-board">
          <div class="panel-toolbar"><h2>Product Control Center</h2><span>${activeProductModels.length} products</span></div>
          ${state.inventoryError ? `<p class="notice error">${escapeHtml(state.inventoryError)}</p>` : ""}
          ${
            state.inventoryLoading
              ? `<p class="notice">Loading product stock and pricing...</p>`
              : activeProductModels.length
                ? `<div class="admin-product-list">${activeProductModels.map(adminProductCard).join("")}</div>`
                : `<p class="notice">No products are loaded yet. Upload a master inventory file or add the first product.</p>`
          }
          ${archivedProductModels.length ? `<p class="import-note">${escapeHtml(`${archivedProductModels.length} archived products are hidden from this view to keep the active catalog clean.`)}</p>` : ""}
          <p class="import-note">Products define what exists. Inventory uploads update stock against variants; prices and images are managed here.</p>
        </section>
        <section class="product-overview">
          <div class="panel-toolbar"><h2>Colour Review</h2><span>${colourRows.length} mappings</span></div>
          ${
            colourRows.length
              ? `
                <form class="workflow-form colour-review-form" data-form="colour-review">
                  <div class="colour-review-grid">
                    ${colourRows
                      .map(
                        (row, index) => `
                          <article class="colour-review-row">
                            <div class="colour-review-meta">
                              <strong>${escapeHtml(row.model_code)}</strong>
                              <span>${escapeHtml(row.productName)}</span>
                            </div>
                            <label><span>Original colour</span><input name="original_colour_${index}" value="${escapeHtml(row.original_colour)}" readonly /></label>
                            <label><span>Display colour</span><input name="colour_${index}" value="${escapeHtml(row.colour || row.original_colour)}" /></label>
                            <label><span>Image</span><select name="image_name_${index}">
                              <option value="">No image</option>
                              ${row.imageOptions
                                .map((image) => `<option value="${escapeHtml(image)}" ${row.image_name === image ? "selected" : ""}>${escapeHtml(image)}</option>`)
                                .join("")}
                            </select></label>
                            <label class="toggle-row"><input name="published_${index}" type="checkbox" ${row.published ? "checked" : ""} /><span>Published</span></label>
                            <input type="hidden" name="mapping_id_${index}" value="${escapeHtml(row.id)}" />
                            <input type="hidden" name="product_id_${index}" value="${escapeHtml(row.product_id)}" />
                            <input type="hidden" name="model_code_${index}" value="${escapeHtml(row.model_code)}" />
                            <input type="hidden" name="color_code_${index}" value="${escapeHtml(row.color_code || "")}" />
                          </article>
                        `,
                      )
                      .join("")}
                  </div>
                  <button class="button primary" type="submit" ${state.colourReviewPending ? "disabled" : ""}>${state.colourReviewPending ? "Saving..." : "Save Colour Review"}</button>
                </form>
              `
              : `<p class="import-note">Colour mappings appear here after a catalog seed import or once products with saved colours are loaded from Supabase.</p>`
          }
        </section>
      </section>
    </main>
  `;
}

function adminProductCard(model) {
  return `
    <article class="admin-product-card">
      ${productVisual(model.name, model.imageName)}
      <div class="admin-product-main">
        <div class="admin-product-title">
          <div>
            <p>${escapeHtml(model.category)}</p>
            <h3>${escapeHtml(model.name)}</h3>
            <span class="mono">${escapeHtml(model.sku)} - Model ${escapeHtml(model.modelCode)}</span>
          </div>
          <div class="admin-product-price">
            ${priceBadge(model.price)}
            <div class="inline-price-editor" data-product-price-editor="${escapeHtml(model.id)}">
              <input type="number" min="0" step="0.01" value="${model.price.priced ? escapeHtml(String(model.price.amount)) : ""}" aria-label="Price for ${escapeHtml(model.name)}" />
              <button class="button mini" data-action="save-product-price" data-product-id="${escapeHtml(model.id)}">Save Price</button>
            </div>
          </div>
        </div>
        <div class="admin-product-stats">
          <span><strong>${model.stockTotal}</strong> units</span>
          <span><strong>${model.optionCount}</strong> SKU rows</span>
          <span><strong>${model.colourCount}</strong> colors</span>
          <span><strong>${model.sizeCount}</strong> sizes</span>
          <span>${model.published ? "Published" : "Unpublished"}</span>
        </div>
        ${
          model.warnings.length
            ? `<div class="warning-row">${model.warnings.map((warning) => `<span>${escapeHtml(warning)}</span>`).join("")}</div>`
            : `<div class="warning-row good"><span>Ready for reseller ordering</span></div>`
        }
        ${stockMatrixPreview(model.stockMatrix)}
      </div>
    </article>
  `;
}

function stockMatrixPreview(matrix) {
  if (!matrix.rows.length) return `<p class="import-note">No stock rows are linked to this product yet.</p>`;
  const sizes = matrix.sizes;
  const totalStock = matrix.rows.reduce((total, row) => total + row.totalStock, 0);
  return `
    <details class="admin-stock-details">
      <summary><span>Sizes and stock</span><strong>${escapeHtml(String(totalStock))} units</strong></summary>
      <div class="stock-matrix-preview" style="--stock-size-count: ${escapeHtml(String(Math.max(1, sizes.length)))}">
        <div class="stock-matrix-head">
          <span>Color / Size</span>
          ${sizes.map((size) => `<span>${escapeHtml(size)}</span>`).join("")}
          <span>Total</span>
        </div>
        ${matrix.rows
          .map(
            (row) => `
              <div class="stock-matrix-row">
                <strong>${escapeHtml(row.colour)}</strong>
                ${sizes.map((size) => `<span>${escapeHtml(String(row.sizes.find((cell) => cell.size === size)?.stockQuantity || 0))}</span>`).join("")}
                <span>${escapeHtml(String(row.totalStock))}</span>
              </div>
            `,
          )
          .join("")}
      </div>
    </details>
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

function requestItemsForRecord(recordId) {
  return state.orderRequestItems.filter((item) => item.order_request_id === recordId);
}

function profileForUserId(userId) {
  return state.staffProfiles.find((profile) => profile.id === userId) || null;
}

function adminRequestItemList(record) {
  const items = requestItemsForRecord(record.id);
  if (!items.length) return `<p class="notice">No items are attached to this request.</p>`;
  return `
    <div class="request-item-list">
      ${items
        .map(
          (item) => `
            <div class="request-item-row">
              <strong>${escapeHtml(item.product_name || item.sku || "Product")}</strong>
              <span>${escapeHtml([item.colour, item.size ? `Size ${item.size}` : ""].filter(Boolean).join(" / ") || "Option not specified")}</span>
              <span>${escapeHtml(`${Number(item.quantity || 0)} pairs`)}</span>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function adminOrderActionButtons(record) {
  const actions = AdminOrders.nextAdminActions(record.status);
  if (!actions.length) return `<span class="form-note">No further workflow steps for this request.</span>`;
  return actions
    .map(
      (action) => `
        <button class="button mini${action.tone === "secondary" ? " secondary" : ""}" data-action="order-status" data-order-id="${escapeHtml(record.id)}" data-status="${escapeHtml(action.status)}">${escapeHtml(action.label)}</button>
      `,
    )
    .join("");
}

function requestImpactSummary(record) {
  const totalItems = Number(record.totalItems || 0);
  const totalUnits = Number(record.totalUnits || 0);
  return `${totalItems} ${totalItems === 1 ? "SKU line" : "SKU lines"} · ${totalUnits} ${totalUnits === 1 ? "pair" : "pairs"}`;
}

function invoiceNumberFor(record) {
  return record?.invoiceNumber || `INV-${String(record?.id || "").replaceAll("-", "").slice(-8).toUpperCase() || "PENDING"}`;
}

function orderTimelineMarkup(record) {
  return `
    <div class="request-item-list order-timeline">
      ${orderStatusTimeline(record)
        .map(
          (step) => `
            <div class="request-item-row">
              <strong>${escapeHtml(step.label)}</strong>
              <span>${escapeHtml(step.complete ? "Complete" : "Pending")}</span>
              <span>${escapeHtml(step.value ? formatOrderDate(step.value) : "Waiting")}</span>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function orderInvoicePanel(record, items) {
  return `
    <section class="admin-card">
      <div class="panel-toolbar"><h2>Invoice</h2><span>${escapeHtml(invoiceNumberFor(record))}</span></div>
      <div class="request-meta-line">
        <span>${escapeHtml(orderCompanyFor(record))}</span>
        <span>${escapeHtml(formatOrderDate(record.createdAt))}</span>
      </div>
      <div class="request-item-list">
        ${items
          .map(
            (item) => `
              <div class="request-item-row">
                <strong>${escapeHtml(item.product_name || item.sku || "Product")}</strong>
                <span>${escapeHtml([item.colour, item.size ? `Size ${item.size}` : ""].filter(Boolean).join(" / ") || "Option")}</span>
                <span>${escapeHtml(String(Number(item.quantity || 0)) + " x " + money(item.base_price || 0))}</span>
              </div>
            `,
          )
          .join("")}
      </div>
      <div class="request-meta-line">
        <span>Subtotal</span>
        <strong>${money(record.subtotal)}</strong>
      </div>
      <p class="request-note">
        ${escapeHtml(
          record.normalizedStatus === "submitted"
            ? "Awaiting admin approval before the invoice is ready for payment."
            : ["awaiting_payment", "approved"].includes(record.normalizedStatus)
              ? "Invoice is ready. Payment still needs to be confirmed."
              : "Invoice generated from the current order lines.",
        )}
      </p>
    </section>
  `;
}

function orderPaymentPanel(record) {
  const normalizedStatus = record.normalizedStatus || AdminOrders.normalizeOrderStatus(record.status);
  return `
    <section class="admin-card">
      <div class="panel-toolbar"><h2>Payment</h2><span>${escapeHtml(record.paymentReference || "No reference")}</span></div>
      <div class="request-meta-line">
        <span>Status</span>
        <strong>${escapeHtml(record.statusMeta?.clientLabel || record.statusMeta?.label || normalizedStatus)}</strong>
      </div>
      <p class="request-note">
        ${escapeHtml(
          normalizedStatus === "submitted"
            ? "Awaiting admin approval."
            : normalizedStatus === "awaiting_payment"
              ? "Awaiting payment."
              : normalizedStatus === "paid"
                ? "Payment received."
                : "Payment has already been confirmed for this order.",
        )}
      </p>
      ${
        state.auth.isAdmin && ["submitted", "awaiting_payment", "approved"].includes(normalizedStatus)
          ? `<div class="approval-actions"><button class="button mini" data-action="order-status" data-order-id="${escapeHtml(record.id)}" data-status="paid">Mark Payment Received</button></div>`
          : ""
      }
    </section>
  `;
}

function orderSupplierExportPanel(record, items) {
  const exportReady = ["paid", "submitted_to_supplier", "processing", "shipped", "fulfilled"].includes(record.normalizedStatus);
  return `
    <section class="admin-card">
      <div class="panel-toolbar"><h2>Supplier Export</h2><span>${escapeHtml(record.supplierExportedAt ? formatOrderDate(record.supplierExportedAt) : "Not exported")}</span></div>
      <p>${escapeHtml(exportReady ? "Download the supplier file in the master-style spreadsheet format." : "Supplier export unlocks once payment has been confirmed.")}</p>
      ${
        state.auth.isAdmin
          ? `<div class="approval-actions">
              <button class="button mini" data-action="download-order-xlsx" data-order-id="${escapeHtml(record.id)}" ${exportReady ? "" : "disabled"}>Download Supplier XLSX</button>
              <button class="button mini secondary" data-action="download-order-csv" data-order-id="${escapeHtml(record.id)}" ${exportReady ? "" : "disabled"}>Download CSV</button>
            </div>`
          : ""
      }
      ${
        items.length
          ? `<p class="request-note">${escapeHtml(String(items.length) + " SKU lines will be included in the supplier sheet.")}</p>`
          : `<p class="request-note">No items are attached to this order yet.</p>`
      }
    </section>
  `;
}

function orderDetailPage() {
  const record = selectedOrderRecord();
  if (!record) {
    return `
      <main class="portal-page">
        <section class="request-confirmation">
          <h1>Order not found</h1>
          <p>This order is not available in the current session.</p>
          <div class="confirmation-actions">
            <button class="button primary" data-route="${state.auth.isAdmin ? "requests" : "history"}">Back</button>
          </div>
        </section>
        ${footer(true)}
      </main>
    `;
  }
  const items = orderItemsFor(record.id);
  return `
    <main class="portal-page">
      <section class="portal-header">
        <div>
          <span class="eyebrow dark">Irunsvan Africa orders</span>
          <h1>${escapeHtml(record.code)}</h1>
          <p>${escapeHtml(orderCompanyFor(record))}</p>
        </div>
        <div class="approval-actions">
          ${statusPill(record.statusMeta?.label || record.normalizedStatus || record.status)}
          <button class="button secondary" data-route="${state.auth.isAdmin ? "requests" : "history"}">Back</button>
        </div>
      </section>
      <section class="admin-panels">
        <section class="admin-card">
          <div class="panel-toolbar"><h2>Order Overview</h2><span>${escapeHtml(formatOrderDate(record.createdAt))}</span></div>
          <div class="request-meta-line">
            <span>${escapeHtml(requestImpactSummary(record))}</span>
            <strong>${money(record.subtotal)}</strong>
          </div>
          <p class="request-note">${escapeHtml(record.adminNotes || record.notes || "No notes have been added yet.")}</p>
          ${state.auth.isAdmin ? `<div class="approval-actions">${adminOrderActionButtons(record)}</div>` : ""}
        </section>
        <section class="admin-card">
          <div class="panel-toolbar"><h2>Timeline</h2><span>${escapeHtml(record.statusMeta?.clientLabel || record.statusMeta?.label || record.status)}</span></div>
          ${orderTimelineMarkup(record)}
        </section>
        <section class="admin-card">
          <div class="panel-toolbar"><h2>Items</h2><span>${escapeHtml(String(items.length))}</span></div>
          ${adminRequestItemList(record)}
        </section>
        ${orderInvoicePanel(record, items)}
        ${orderPaymentPanel(record)}
        ${orderSupplierExportPanel(record, items)}
      </section>
      ${footer(true)}
    </main>
  `;
}

function adminRequests() {
  const buckets = AdminOrders.buildClientOrderBuckets(requestHistoryRecords());
  const summaryCards = [
    ["Needs Review", buckets.new.length, "New requests waiting for approval.", "requests"],
    ["Awaiting Payment", buckets.awaitingPayment.length, "Approved orders waiting for payment.", "requests-payment"],
    ["Supplier", buckets.active.length, "Orders moving through supplier and processing.", "requests-supplier"],
    ["Completed", buckets.shipped.length + buckets.fulfilled.length, "Shipped and fulfilled orders.", "requests-completed"],
  ];
  return `
    <main class="admin-layout">
      ${adminSidebar("requests")}
      <section class="admin-main">
        <header class="admin-topbar"><div><h1>Orders</h1><p>Use the order menu to move between review, payment, supplier handling, and completed orders.</p></div></header>
        <section class="workspace-shell admin-workspace-shell">
          ${workspaceSubnav("Order Menu", adminOrderSubnavItems())}
          <div class="workspace-content">
            <section class="admin-panels">
              ${summaryCards
                .map(
                  ([label, value, copy, route]) => `
                    <article class="admin-card">
                      <div class="panel-toolbar"><h2>${escapeHtml(label)}</h2><span>${escapeHtml(String(value))}</span></div>
                      <p>${escapeHtml(copy)}</p>
                      <div class="approval-actions" style="padding: 0 20px 20px;">
                        <button class="button secondary" data-route="${route}">Open ${escapeHtml(label)}</button>
                      </div>
                    </article>
                  `,
                )
                .join("")}
            </section>
          </div>
        </section>
      </section>
    </main>
  `;
}

function adminOrderWorkspacePage(title, copy, records = [], emptyCopy = "No orders in this section right now.") {
  return `
    <main class="admin-layout">
      ${adminSidebar("requests")}
      <section class="admin-main">
        <header class="admin-topbar"><div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(copy)}</p></div></header>
        <section class="workspace-shell admin-workspace-shell">
          ${workspaceSubnav("Order Menu", adminOrderSubnavItems())}
          <div class="workspace-content">
            <section class="approval-stack">
              ${
                records.length
                  ? records
                      .map((record) => {
                        const request = state.orderRequests.find((entry) => entry.id === record.id);
                        const reseller = profileForUserId(request?.reseller_id);
                        return `
                          <article class="approval-item request-review-item">
                            <div class="approval-item-body">
                              <div class="approval-item-head">
                                <strong>${escapeHtml(record.code)}</strong>
                                ${statusPill(record.statusMeta?.label || record.normalizedStatus || record.status)}
                              </div>
                              <div class="request-meta-line">
                                <span>${escapeHtml(reseller?.company_name || reseller?.email || "Reseller account")}</span>
                                <span>${escapeHtml(requestImpactSummary(record))}</span>
                                <span>${escapeHtml(formatOrderDate(record.createdAt))}</span>
                              </div>
                              <div class="request-meta-line">
                                <span>Request total</span>
                                <strong>${money(record.subtotal)}</strong>
                              </div>
                              ${adminRequestItemList(record)}
                              <p class="request-note">${escapeHtml(record.notes || "No reseller notes provided.")}</p>
                              ${record.adminNotes ? `<p class="request-note">${escapeHtml("Admin note: " + record.adminNotes)}</p>` : ""}
                            </div>
                            <div class="approval-actions">
                              <button class="button mini secondary" data-route="order" data-order-id="${escapeHtml(record.id)}">Open Order</button>
                              ${adminOrderActionButtons(record)}
                            </div>
                          </article>
                        `;
                      })
                      .join("")
                  : `<p class="notice">${escapeHtml(emptyCopy)}</p>`
              }
            </section>
          </div>
        </section>
      </section>
    </main>
  `;
}

function adminRequestsReviewPage() {
  const buckets = AdminOrders.buildClientOrderBuckets(requestHistoryRecords());
  return adminOrderWorkspacePage("Needs Review", "Review new requests and decide whether to supply them.", buckets.new);
}

function adminRequestsPaymentPage() {
  const buckets = AdminOrders.buildClientOrderBuckets(requestHistoryRecords());
  return adminOrderWorkspacePage("Awaiting Payment", "These orders have been approved and are waiting for payment confirmation.", buckets.awaitingPayment);
}

function adminRequestsSupplierPage() {
  const buckets = AdminOrders.buildClientOrderBuckets(requestHistoryRecords());
  return adminOrderWorkspacePage("Supplier", "These orders are paid or already moving through supplier handling and processing.", buckets.active);
}

function adminRequestsCompletedPage() {
  const buckets = AdminOrders.buildClientOrderBuckets(requestHistoryRecords());
  return adminOrderWorkspacePage("Completed", "Shipped and fulfilled orders stay here for operational lookup.", [...buckets.shipped, ...buckets.fulfilled]);
}

function adminApplications() {
  return `
    <main class="admin-layout">
      ${adminSidebar("applications")}
      <section class="admin-main">
        <header class="admin-topbar"><div><h1>Applications</h1><p>Approve reseller access after reviewing company details.</p></div></header>
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
                          <p>${escapeHtml(`${application.full_name} / ${application.email}`)}</p>
                          <p>${escapeHtml(`${application.country || "Country not provided"}${application.phone ? ` / ${application.phone}` : ""}`)}</p>
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
        </section>
      </section>
    </main>
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
                        <div class="approval-item-body">
                          <div class="approval-item-head">
                            <strong>${escapeHtml(record.code)}</strong>
                            ${statusPill(record.status)}
                          </div>
                          <div class="request-meta-line">
                            <span>${escapeHtml(requestImpactSummary(record))}</span>
                            <strong>${money(record.subtotal)}</strong>
                          </div>
                          <p class="request-note">${escapeHtml(record.notes || "No reseller notes provided.")}</p>
                          ${record.adminNotes ? `<p class="request-note">${escapeHtml(`Admin note: ${record.adminNotes}`)}</p>` : ""}
                        </div>
                        <div class="approval-actions">
                          ${adminOrderActionButtons(record)}
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
            ${uploadBox("Upload Master Inventory", "Builds the catalog from the master file or refreshes stock for products that are already set up.", "inventory_xlsx", ".xlsx,.xls,.csv")}
            ${uploadBox("Scan Media Pack", "Finds product folders and images so products can be reviewed and added later.", "media_pack_zip", ".zip")}
          </div>
          <form class="stock-reset-panel" data-form="stock-reset">
            <div>
              <span class="eyebrow dark">Stock control</span>
              <h2>Reset All Stock</h2>
              <p>Set every stock quantity to zero while keeping products, colours, sizes, prices, and images intact. Upload the master inventory file afterwards to restore current availability.</p>
              <small>${escapeHtml(`${state.inventory.length} stock rows will be reset.`)}</small>
            </div>
            <label>
              Type RESET STOCK to confirm
              <input name="stock_reset_confirmation" autocomplete="off" placeholder="RESET STOCK" ${state.stockResetPending ? "disabled" : ""} />
            </label>
            <button class="button secondary" type="submit" ${state.stockResetPending ? "disabled" : ""}>${state.stockResetPending ? "Resetting..." : "Reset stock to zero"}</button>
          </form>
          ${state.importError ? `<p class="notice error">${escapeHtml(state.importError)}</p>` : ""}
          ${state.stockResetError ? `<p class="notice error">${escapeHtml(state.stockResetError)}</p>` : ""}
          ${state.stockResetSaved ? `<p class="notice success">All stock has been reset to zero. Upload the master inventory file when you are ready to publish fresh quantities.</p>` : ""}
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
                    <div><strong>${preview.colourMappings?.length || 0}</strong><span>Colours</span></div>
                    <div><strong>${preview.inventoryRows?.length || 0}</strong><span>Inventory rows</span></div>
                    <div><strong>${(preview.errors?.length || 0) + (preview.stockExceptions?.length || 0)}</strong><span>Issues</span></div>
                  </div>
                  ${preview.type === "media_pack_zip" ? mediaPackPreviewDetails(preview) : ""}
                  ${preview.seedSummary ? catalogSeedPreviewDetails(preview) : ""}
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
                        (job) => `<div class="overview-row"><strong>${escapeHtml(job.import_type)}</strong><span>${escapeHtml(job.filename)}</span><span>${escapeHtml(importJobStatusLabel(job))}</span></div>`,
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

function importJobStatusLabel(job) {
  if (job?.status === "completed" && job?.error_message) return "completed with warnings";
  return job?.status || "unknown";
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

function catalogSeedPreviewDetails(preview) {
  const summary = preview.seedSummary || {};
  return `
    <div class="import-preview-grid media-preview-grid">
      <div><strong>${summary.matchedModels || 0}</strong><span>Matched models</span></div>
      <div><strong>${summary.variantCount || 0}</strong><span>Seed variants</span></div>
      <div><strong>${summary.colourCount || 0}</strong><span>Colour groups</span></div>
      <div><strong>${summary.skippedRows || 0}</strong><span>Skipped rows</span></div>
    </div>
    ${
      Array.isArray(summary.missingSelectedModels) && summary.missingSelectedModels.length
        ? `<div class="import-errors">${summary.missingSelectedModels
            .slice(0, 8)
            .map((modelCode) => `<p>${escapeHtml(`No inventory rows found for selected model ${modelCode}.`)}</p>`)
            .join("")}</div>`
        : ""
    }
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
        ${adminLink("Requests", "requests", activeRoute)}
        ${adminLink("Applications", "applications", activeRoute)}
        ${adminLink("Team", "team", activeRoute)}
        ${adminLink("Products", "products", activeRoute)}
        ${adminLink("Inventory", "imports", activeRoute)}
        ${adminLink("Site Controls", "site", activeRoute)}
      </nav>
    </aside>
  `;
}

function adminLink(label, route, activeRoute) {
  return `<button class="${route === activeRoute ? "active" : ""}" data-route="${route}">${escapeHtml(label)}</button>`;
}

function adminTable(title, headers, rows, route = "requests") {
  return `
    <div class="admin-card">
      <div class="admin-card-head"><h2>${escapeHtml(title)}</h2><button data-route="${escapeHtml(route)}">View all</button></div>
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
  const label = String(status || "");
  const className = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `<span class="status ${escapeHtml(className)}">${escapeHtml(label)}</span>`;
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
      subject: "Your Irunsvan Africa reseller account was approved",
      lines: ["Approval status", "Login instructions", "Portal link", "Next steps for order requests"],
    },
    import: {
      title: "Import warning",
      subject: "Irunsvan Africa import completed with warnings",
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
    about: ["About Irunsvan Africa", "High-performance footwear built around a reseller-ready operating model.", "Irunsvan Africa combines public product discovery with private wholesale inventory workflows for approved business buyers."],
    contact: ["Contact", "Reach the Irunsvan Africa team for product, reseller, and order questions.", "Use the reseller application for wholesale access. General support requests are handled by the Irunsvan Africa operations team."],
    terms: ["Terms", "Clear operating terms for browsing, reseller requests, approval, and order confirmation.", "Order requests are not final purchases until reviewed and confirmed by admin."],
    privacy: ["Privacy", "Customer, reseller, and admin data is handled through protected account and inventory workflows.", "Public visitors can browse products without an account. Exact stock and order workflows require approved access."],
  };
  const [title, subtitle, copy] = pages[route] || pages.about;
  return `
    <main class="info-page">
      <section>
        <span class="eyebrow dark">Irunsvan Africa</span>
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
  const publicMode = currentPortalMode() === "public";
  const resourceButtons = publicMode
    ? `
      <button data-route="product-flyers">Products</button>
      <button data-route="find-reseller">Stockists</button>
      <button data-route="contact">Support</button>
    `
    : `
      <button data-route="product-flyers">Products</button>
      <button data-route="find-reseller">Find a Reseller</button>
      <button data-route="contact">Support</button>
    `;
  const operationButtons = state.auth.isAuthenticated
    ? `
      <button data-route="account">Account</button>
      <button data-action="logout">Logout</button>
    `
    : publicMode
      ? `
        <button data-route="apply">Join Network</button>
        <button data-route="login">Enter</button>
        <button data-route="admin-login">Admin</button>
        <button data-route="privacy">Privacy</button>
      `
      : `
        <button data-route="apply">Apply as a Reseller</button>
        <button data-route="login">Login</button>
        <button data-route="admin-login">Admin Login</button>
        <button data-route="privacy">Privacy Policy</button>
      `;
  return `
    <footer class="${compact ? "footer compact" : "footer"}${publicMode ? " campaign-footer" : ""}">
      <div class="campaign-footer-grid">
        <div>
          ${logo("blue")}
          <p>${escapeHtml(publicMode ? "Technical footwear stories, reseller channels, and campaign records from Irunsvan Africa." : "High-performance athletic footwear for Africa's reseller-ready inventory workflows.")}</p>
        </div>
        <div><strong>${publicMode ? "Channels" : "Resources"}</strong>${resourceButtons}</div>
        <div><strong>${publicMode ? "Access" : "Operations"}</strong>${operationButtons}</div>
      </div>
      <p class="copyright">${escapeHtml(publicMode ? "IRUNSVAN AFRICA // 2026 CAMPAIGN SYSTEM" : "Copyright 2026 Irunsvan Africa High-Performance Footwear.")}</p>
    </footer>
  `;
}

function routeView() {
  const activeRoute = routeForAccess(state.route);
  if (activeRoute !== state.route) {
    state.route = activeRoute;
  }
  const views = {
    "store": publicHomePage,
    "story": storyDetailPage,
    "product": productDetail,
    "product-flyers": productFlyersPage,
    "product-flyer": productFlyerDetailPage,
    "find-reseller": findResellerPage,
    apply: resellerApplication,
    signup: signupPage,
    login: loginPage,
    "admin-login": loginPage,
    account: accountPage,
    reseller: resellerPortal,
    "reseller-product": resellerProductOrderPage,
    "request-confirmation": requestConfirmationPage,
    history: requestHistory,
    "current-orders": currentOrdersPage,
    "expected-orders": expectedOrdersPage,
    fulfillment: fulfillmentStatusPage,
    order: orderDetailPage,
    admin: adminDashboard,
    team: adminTeam,
    requests: adminRequests,
    "requests-review": adminRequestsReviewPage,
    "requests-payment": adminRequestsPaymentPage,
    "requests-supplier": adminRequestsSupplierPage,
    "requests-completed": adminRequestsCompletedPage,
    applications: adminApplications,
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
  return (views[state.route] || publicHomePage)();
}

function bindEvents() {
  document.querySelectorAll("[data-route]").forEach((button) => {
    button.addEventListener("click", () =>
      setRoute(button.getAttribute("data-route"), {
        productId: button.getAttribute("data-product-id"),
        orderId: button.getAttribute("data-order-id"),
        storySlug: button.getAttribute("data-story-slug"),
        flyerSlug: button.getAttribute("data-flyer-slug"),
      }),
    );
  });

  document.querySelectorAll("[data-action='select-gallery-image']").forEach((button) => {
    button.addEventListener("click", () => {
      const imageUrl = button.getAttribute("data-image-url") || "";
      const imageName = button.getAttribute("data-image-name") || "";
      const main = document.querySelector("[data-product-detail-main] .product-visual");
      const photo = main?.querySelector(".product-photo");
      const caption = main?.querySelector("em");
      if (!photo || !imageUrl) return;
      photo.setAttribute("src", imageUrl);
      if (caption) caption.textContent = imageName;
      document.querySelectorAll("[data-action='select-gallery-image']").forEach((thumb) => {
        thumb.classList.toggle("selected", thumb === button);
      });
    });
  });

  document.querySelectorAll("[data-action='catalog-image-step']").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const key = button.getAttribute("data-gallery-key");
      const direction = Number(button.getAttribute("data-direction") || 1);
      if (!key || !Number.isFinite(direction)) return;
      state.catalogImageSelection = {
        ...state.catalogImageSelection,
        [key]: Number(state.catalogImageSelection[key] || 0) + direction,
      };
      render();
    });
  });

  document.querySelectorAll("[data-action='home-flyer-step']").forEach((button) => {
    button.addEventListener("click", () => {
      const direction = Number(button.getAttribute("data-direction") || 1);
      if (!Number.isFinite(direction)) return;
      state.homeFlyerIndex = Number(state.homeFlyerIndex || 0) + direction;
      render();
    });
  });

  document.querySelectorAll("[data-action='logout']").forEach((button) => {
    button.addEventListener("click", async () => {
      await handleLogout();
    });
  });

  document.querySelectorAll("[data-action='google-login']").forEach((button) => {
    button.addEventListener("click", () => {
      handleGoogleLogin();
    });
  });

  document.querySelectorAll("[data-action='toggle-password-recovery']").forEach((button) => {
    button.addEventListener("click", () => {
      state.passwordRecoveryOpen = !state.passwordRecoveryOpen;
      state.passwordRecoveryError = null;
      state.passwordRecoverySent = false;
      render();
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

  document.querySelectorAll("[data-action='copy-admin-invite']").forEach((button) => {
    button.addEventListener("click", async () => {
      const link = String(button.getAttribute("data-link") || "").trim();
      if (!link) return;
      try {
        await navigator.clipboard.writeText(link);
      } catch {
        const input = document.createElement("input");
        input.value = link;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        input.remove();
      }
    });
  });

  document.querySelectorAll("[data-action='revoke-admin-invite']").forEach((button) => {
    button.addEventListener("click", async () => {
      await handleAdminInviteRevoke(button.getAttribute("data-invite-id"));
    });
  });

  document.querySelectorAll("[data-action='site-controls-section']").forEach((button) => {
    button.addEventListener("click", () => {
      state.siteControlSection = button.getAttribute("data-section") || "product-flyers";
      render();
    });
  });

  document.querySelectorAll("[data-action='edit-public-product-flyer']").forEach((button) => {
    button.addEventListener("click", async () => {
      await editPublicProductFlyer(button.getAttribute("data-flyer-id"));
    });
  });

  document.querySelectorAll("[data-action='cancel-public-product-flyer-edit']").forEach((button) => {
    button.addEventListener("click", async () => {
      await cancelPublicProductFlyerEdit();
    });
  });

  document.querySelectorAll("[data-action='delete-public-product-flyer']").forEach((button) => {
    button.addEventListener("click", async () => {
      await deletePublicProductFlyer(button.getAttribute("data-flyer-id"));
    });
  });

  document.querySelectorAll("[data-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formName = form.getAttribute("data-form");
      if (formName === "admin-invite") await handleAdminInviteCreate(form);
      if (formName === "application") await handleApplicationSubmit(form);
      if (formName === "order") await handleOrderSubmit(form);
      if (formName === "login") await handleLogin(form);
      if (formName === "password-recovery") await handlePasswordRecovery(form);
      if (formName === "account-profile") await handleAccountProfileSave(form);
      if (formName === "account-password") await handleAccountPasswordSave(form);
      if (formName === "team-role") await handleTeamRoleSave(form);
      if (formName === "homepage-flyer") await saveHomepageFlyer(form);
      if (formName === "blog-post") await saveBlogPost(form);
      if (formName === "public-product-flyer") {
        const flyerId = String(new FormData(form).get("product_flyer_id") || "").trim();
        if (flyerId) await updatePublicProductFlyer(form);
        else await savePublicProductFlyer(form);
      }
      if (formName === "about-content") await saveAboutContent(form);
      if (formName === "site-controls") await saveSiteControls(form);
      if (formName === "product") await handleProductSubmit(form);
      if (formName === "colour-review") await saveColourReview(form);
      if (formName === "stock-reset") await handleStockReset(form);
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

  document.querySelectorAll("[data-action='save-product-price']").forEach((button) => {
    button.addEventListener("click", async () => {
      const productId = button.getAttribute("data-product-id");
      const input = button.closest("[data-product-price-editor]")?.querySelector("input");
      await handleProductPriceUpdate(productId, input?.value);
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

  document.querySelectorAll("[data-action='open-reseller-product']").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("button, a, input, textarea, select")) return;
      setRoute("reseller-product", { productId: card.getAttribute("data-product-id") });
    });
  });

  document.querySelectorAll("[data-action='toggle-quick-order']").forEach((button) => {
    button.addEventListener("click", () => {
      const productId = button.getAttribute("data-product-id");
      state.resellerQuickOrderProductId = state.resellerQuickOrderProductId === productId ? null : productId;
      render();
    });
  });

  document.querySelectorAll("[data-action='select-reseller-colour']").forEach((button) => {
    button.addEventListener("click", () => {
      const productId = button.getAttribute("data-product-id");
      const colour = button.getAttribute("data-colour");
      if (productId && colour) {
        state.resellerColourSelection = {
          ...state.resellerColourSelection,
          [productId]: colour,
        };
      }
      render();
    });
  });

  document.querySelectorAll("[data-action='add-bulk-order']").forEach((button) => {
    button.addEventListener("click", () => {
      syncBulkOrderQuantities(button.closest("[data-bulk-order-product]"));
    });
  });

  document.querySelectorAll("[data-action='clear-bulk-order']").forEach((button) => {
    button.addEventListener("click", () => {
      clearBulkOrderQuantities(button.closest("[data-bulk-order-product]"));
    });
  });

  document.querySelectorAll("[data-bulk-qty-input]").forEach((input) => {
    input.addEventListener("change", () => {
      const variantId = input.getAttribute("data-bulk-qty-input");
      syncDraftQuantity(variantId, input.value);
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

  document.querySelectorAll("[data-action='download-order-xlsx']").forEach((button) => {
    button.addEventListener("click", async () => {
      const orderId = button.getAttribute("data-order-id");
      await handleOrderExport(orderId, "xlsx");
    });
  });

  document.querySelectorAll("[data-action='download-order-csv']").forEach((button) => {
    button.addEventListener("click", async () => {
      const orderId = button.getAttribute("data-order-id");
      await handleOrderExport(orderId, "csv");
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
        await ensureImportLibraries(type, file.name);
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
  state.selectedOrderId = parsed.orderId || (nextRoute === "order" ? state.selectedOrderId : null);
  state.selectedStorySlug = parsed.storySlug || null;
  state.selectedProductFlyerSlug = parsed.flyerSlug || null;
  state.mobileNavOpen = false;
  state.catalogFiltersOpen = false;
  if (options.replaceHistory !== false) {
    const cleanUrl = `${window.location.pathname}${MobileNavigation.buildRouteUrl(nextRoute, {
      productId: state.selectedProductId,
      orderId: state.selectedOrderId,
      storySlug: state.selectedStorySlug,
      flyerSlug: state.selectedProductFlyerSlug,
    })}`;
    window.history.replaceState(
      {
        route: nextRoute,
        productId: state.selectedProductId || null,
        orderId: state.selectedOrderId || null,
        storySlug: state.selectedStorySlug || null,
        flyerSlug: state.selectedProductFlyerSlug || null,
      },
      "",
      cleanUrl,
    );
  }
}

function syncDraftQuantity(variantId, quantity) {
  const row = inventoryRows().find((entry) => entry.variantId === variantId);
  if (!row) return;
  state.resellerDraft = Orders.updateDraftQuantity(state.resellerDraft, row, quantity);
  state.orderSubmitted = false;
  render();
}

function syncBulkOrderQuantities(container) {
  if (!container) return;
  const rowsByVariantId = new Map(inventoryRows().map((entry) => [entry.variantId, entry]));
  let nextDraft = { ...state.resellerDraft };
  container.querySelectorAll("[data-bulk-qty-input]").forEach((input) => {
    const variantId = input.getAttribute("data-bulk-qty-input");
    const row = rowsByVariantId.get(variantId);
    if (!row) return;
    nextDraft = Orders.updateDraftQuantity(nextDraft, row, input.value);
  });
  state.resellerDraft = nextDraft;
  state.orderSubmitted = false;
  render();
}

function clearBulkOrderQuantities(container) {
  if (!container) return;
  const nextDraft = { ...state.resellerDraft };
  container.querySelectorAll("[data-bulk-qty-input]").forEach((input) => {
    const variantId = input.getAttribute("data-bulk-qty-input");
    delete nextDraft[variantId];
  });
  state.resellerDraft = nextDraft;
  state.orderSubmitted = false;
  render();
}

async function handleLogin(form) {
  const data = new FormData(form);
  const email = String(data.get("email") || "").trim();
  const password = String(data.get("password") || "");
  const adminOnly = isAdminLoginRoute();
  state.loginPending = true;
  state.loginSubmitted = false;
  state.authError = null;
  state.signupConfirmationEmail = null;
  render();

  try {
    if (!email || !password) {
      throw new Error("Enter both your email and password.");
    }
    await SupabaseClient.signInWithPassword({
      url: SUPABASE_URL,
      key: SUPABASE_KEY,
      email,
      password,
    });
    const restored = await SupabaseClient.restoreAuthState({ url: SUPABASE_URL, key: SUPABASE_KEY });
    state.auth = Auth.normalizeAuthState(restored);
    const profileError = authProfileError(state.auth);
    if (profileError) {
      state.authError = profileError;
      setRoute(adminOnly ? "admin-login" : "login", {}, { replaceHistory: true, scroll: false });
      return;
    }
    if (adminOnly && !state.auth.isAdmin) {
      await SupabaseClient.signOut();
      state.auth = Auth.normalizeAuthState();
      state.authError = "This account does not have admin access.";
      setRoute("admin-login", {}, { replaceHistory: true, scroll: false });
      return;
    }
    state.loginSubmitted = true;
    state.routeNotice = null;
    setRoute(Auth.fallbackRouteForRole(state.auth.role), {}, { replaceHistory: true, scroll: false });
    loadProtectedDataInBackground();
  } catch (error) {
    state.auth = Auth.normalizeAuthState();
    state.authError = error instanceof Error ? error.message : "Unable to sign in";
  } finally {
    state.loginPending = false;
  }
}

function passwordRecoveryRedirectTo() {
  const url = new URL(window.location.href);
  url.searchParams.delete("code");
  url.searchParams.delete("error");
  url.searchParams.delete("error_code");
  url.searchParams.delete("error_description");
  url.searchParams.set("reset", "password");
  url.hash = "";
  return url.toString();
}

function oauthRedirectTo() {
  const url = new URL(window.location.href);
  url.searchParams.delete("code");
  url.searchParams.delete("error");
  url.searchParams.delete("error_code");
  url.searchParams.delete("error_description");
  url.searchParams.set("oauth", "google");
  if (isAdminLoginRoute()) url.searchParams.set("login", "admin");
  else url.searchParams.delete("login");
  url.hash = "";
  return url.toString();
}

async function handlePasswordRecovery(form) {
  const data = new FormData(form);
  const email = String(data.get("email") || "").trim();
  state.passwordRecoveryPending = true;
  state.passwordRecoveryError = null;
  state.passwordRecoverySent = false;
  render();

  try {
    if (!email) throw new Error("Enter the email address for this account.");
    await SupabaseClient.requestPasswordReset({
      url: SUPABASE_URL,
      key: SUPABASE_KEY,
      email,
      redirectTo: passwordRecoveryRedirectTo(),
    });
    state.passwordRecoverySent = true;
  } catch (error) {
    state.passwordRecoveryError = error instanceof Error ? error.message : "Unable to send reset link";
  } finally {
    state.passwordRecoveryPending = false;
    render();
  }
}

async function handleAccountProfileSave(form) {
  const data = new FormData(form);
  state.accountProfileSavePending = true;
  state.accountProfileSaved = false;
  state.accountProfileError = null;
  render();

  try {
    const updatedProfile = await invokeAuthedRpc("update_own_profile", {
      p_full_name: String(data.get("full_name") || "").trim(),
      p_company_name: String(data.get("company_name") || "").trim(),
      p_phone: String(data.get("phone") || "").trim(),
    });
    state.auth = Auth.normalizeAuthState({
      ...state.auth,
      profile: updatedProfile,
      role: updatedProfile.role || state.auth.role,
    });
    if (state.auth.user?.id && state.staffProfiles.length) {
      state.staffProfiles = state.staffProfiles.map((profile) => (profile.id === state.auth.user.id ? { ...profile, ...updatedProfile } : profile));
    }
    state.accountProfileSaved = true;
  } catch (error) {
    state.accountProfileError = error instanceof Error ? error.message : "Unable to save account profile";
  } finally {
    state.accountProfileSavePending = false;
    render();
  }
}

async function handleAccountPasswordSave(form) {
  const data = new FormData(form);
  const password = String(data.get("password") || "");
  const passwordConfirm = String(data.get("password_confirm") || "");
  const session = requireAuthedSession();
  state.accountPasswordSavePending = true;
  state.accountPasswordSaved = false;
  state.accountPasswordError = null;
  render();

  try {
    if (password.length < 8) throw new Error("Use at least 8 characters for the new password.");
    if (password !== passwordConfirm) throw new Error("The password confirmation does not match.");
    await SupabaseClient.updatePassword({
      url: SUPABASE_URL,
      key: SUPABASE_KEY,
      accessToken: session.access_token,
      password,
    });
    state.accountPasswordSaved = true;
    state.passwordResetMode = false;
    form.reset();
  } catch (error) {
    state.accountPasswordError = error instanceof Error ? error.message : "Unable to update password";
  } finally {
    state.accountPasswordSavePending = false;
    render();
  }
}

async function handleTeamRoleSave(form) {
  const data = new FormData(form);
  const email = String(data.get("email") || "").trim().toLowerCase();
  const role = String(data.get("role") || "").trim();
  state.teamSavePending = true;
  state.teamSaved = false;
  state.teamError = null;
  render();

  try {
    if (!email) throw new Error("Enter the existing account email.");
    if (!["admin", "reseller", "pending_reseller"].includes(role)) throw new Error("Choose a valid role.");
    const profile = state.staffProfiles.find((entry) => String(entry.email || "").trim().toLowerCase() === email);
    if (!profile?.id) throw new Error("That email does not belong to an existing account yet.");
    if (profile.id === state.auth.user?.id && role !== "admin") {
      throw new Error("Use a different admin account before removing your own admin access.");
    }
    const [updatedProfile] = await updateAuthedSupabase("profiles", profile.id, { role });
    state.staffProfiles = state.staffProfiles.map((entry) => (entry.id === updatedProfile.id ? { ...entry, ...updatedProfile } : entry));
    state.teamSaved = true;
    form.reset();
  } catch (error) {
    state.teamError = error instanceof Error ? error.message : "Unable to update account access";
  } finally {
    state.teamSavePending = false;
    render();
  }
}

async function loadAdminInviteDetails(token) {
  const inviteToken = String(token || "").trim();
  if (!inviteToken) return null;
  state.adminInviteLookupPending = true;
  state.adminInviteError = null;
  render();

  try {
    const result = await invokePublicRpc("lookup_admin_invite", { p_token: inviteToken });
    const invite = Array.isArray(result) ? result[0] : result;
    if (!invite?.email) {
      throw new Error("This admin invite link is invalid or has already been used.");
    }
    state.adminInviteDetails = invite;
    return invite;
  } catch (error) {
    state.adminInviteDetails = null;
    state.adminInviteError = error instanceof Error ? error.message : "Unable to load admin invite";
    return null;
  } finally {
    state.adminInviteLookupPending = false;
    render();
  }
}

async function handleAdminInviteCreate(form) {
  const data = new FormData(form);
  const email = String(data.get("invite_email") || "").trim().toLowerCase();
  const note = String(data.get("invite_note") || "").trim();
  const expiresDays = Number(data.get("expires_days") || 7);
  state.teamInviteCreatePending = true;
  state.teamInviteError = null;
  state.adminInviteCreatedLink = null;
  state.adminInviteCreatedEmail = null;
  render();

  try {
    if (!email) throw new Error("Enter the email address for the invite.");
    if (!Number.isFinite(expiresDays) || expiresDays < 1 || expiresDays > 30) {
      throw new Error("Choose an expiration between 1 and 30 days.");
    }
    const token = crypto.randomUUID();
    const tokenHash = await hashInviteToken(token);
    const expiresAt = new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000).toISOString();
    await insertAuthedSupabase("admin_invites", {
      email,
      token_hash: tokenHash,
      created_by: state.auth.user?.id || null,
      note: note || null,
      expires_at: expiresAt,
    });
    state.adminInviteCreatedLink = buildAdminInviteUrl(token);
    state.adminInviteCreatedEmail = email;
    form.reset();
  } catch (error) {
    state.teamInviteError = error instanceof Error ? error.message : "Unable to create admin invite";
  } finally {
    state.teamInviteCreatePending = false;
    render();
  }
}

async function handleAdminInviteRevoke(inviteId) {
  const id = String(inviteId || "").trim();
  if (!id) return;
  try {
    await patchAuthedSupabase("admin_invites", `id=eq.${encodeURIComponent(id)}`, {
      status: "revoked",
      revoked_at: new Date().toISOString(),
    });
    state.adminInvites = (state.adminInvites || []).map((invite) =>
      invite.id === id ? { ...invite, status: "revoked", revoked_at: new Date().toISOString() } : invite,
    );
    render();
  } catch (error) {
    state.teamInviteError = error instanceof Error ? error.message : "Unable to revoke invite";
    render();
  }
}

async function claimAdminInvite(token) {
  const inviteToken = String(token || "").trim();
  if (!inviteToken) return;
  state.adminInviteClaimPending = true;
  state.adminInviteError = null;
  render();

  try {
    await invokeAuthedRpc("claim_admin_invite", { p_token: inviteToken });
    const restored = await SupabaseClient.restoreAuthState({ url: SUPABASE_URL, key: SUPABASE_KEY });
    state.auth = Auth.normalizeAuthState(restored);
    state.adminInviteToken = null;
    state.adminInviteDetails = null;
    state.adminInviteLookupPending = false;
    state.adminInviteClaimPending = false;
    state.adminInviteError = null;
    setRoute("admin", {}, { replaceHistory: true, scroll: false });
    loadProtectedDataInBackground();
  } catch (error) {
    state.adminInviteError = readableAdminInviteError(error);
    state.adminInviteClaimPending = false;
    if (state.auth.isAuthenticated) {
      await SupabaseClient.signOut();
      state.auth = Auth.normalizeAuthState();
    }
    render();
  }
}

function consumeLoginRouteHint() {
  const url = new URL(window.location.href);
  const loginHint = url.searchParams.get("login");
  if (!loginHint) return null;
  url.searchParams.delete("login");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  return loginHint === "admin" ? "admin-login" : "login";
}

function consumePasswordResetHint() {
  const url = new URL(window.location.href);
  const resetHint = url.searchParams.get("reset");
  if (!resetHint) return false;
  url.searchParams.delete("reset");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  return resetHint === "password";
}

function handleGoogleLogin() {
  state.authError = null;
  state.loginPending = true;
  state.routeNotice = null;
  render();
  SupabaseClient.signInWithOAuth({
    url: SUPABASE_URL,
    provider: "google",
    redirectTo: oauthRedirectTo(),
  });
}

async function handleLogout() {
  await SupabaseClient.signOut();
  state.auth = Auth.normalizeAuthState();
  state.authError = null;
  state.loginSubmitted = false;
  state.passwordRecoveryOpen = false;
  state.passwordRecoveryPending = false;
  state.passwordRecoverySent = false;
  state.passwordRecoveryError = null;
  state.passwordResetMode = false;
  state.signupConfirmationEmail = null;
  state.accountProfileSaved = false;
  state.accountProfileError = null;
  state.accountPasswordSaved = false;
  state.accountPasswordError = null;
  state.adminInviteToken = null;
  state.adminInviteDetails = null;
  state.adminInviteLookupPending = false;
  state.adminInviteClaimPending = false;
  state.adminInviteError = null;
  state.adminInviteCreatedLink = null;
  state.adminInviteCreatedEmail = null;
  state.teamInviteCreatePending = false;
  state.teamInviteError = null;
  state.resellerDraft = {};
  state.resellerNotes = "";
  state.orderSubmitted = false;
  state.orderConfirmation = null;
  setRouteNotice(null, "");
  setRoute("store");
}

function buildOrderStockAdjustments(items) {
  return items.map((item) => {
    const requestedQuantity = Number(item.requestedQuantity || 0);
    const stockQuantity = Number(item.stockQuantity || 0);
    if (!item.inventoryId) throw new Error("This order contains a stock row that cannot be updated.");
    if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) throw new Error("Enter at least one pair before submitting an order.");
    if (requestedQuantity > stockQuantity) {
      throw new Error(`${item.productName || "This product"} ${item.colour || ""} size ${item.size || ""} only has ${stockQuantity} pairs available.`);
    }
    return {
      id: item.inventoryId,
      nextStock: Math.max(0, stockQuantity - requestedQuantity),
    };
  });
}

async function handleOrderSubmit(form) {
  state.orderSubmitPending = true;
  state.orderSubmitted = false;
  state.inventoryError = null;
  state.historyError = null;
  state.resellerNotes = String(new FormData(form).get("order_notes") || "");
  render();

  try {
    const draftItems = currentDraftItems();
    buildOrderStockAdjustments(draftItems);
    const payload = Orders.buildOrderPayload({
      auth: state.auth,
      items: draftItems,
      notes: state.resellerNotes,
    });
    const [createdRequest] = await insertAuthedSupabase("order_requests", payload.orderRequest);
    const itemsPayload = payload.orderItems.map((item) => ({ ...item, order_request_id: createdRequest.id }));
    await insertAuthedSupabase("order_request_items", itemsPayload);
    state.orderConfirmation = {
      id: createdRequest.id,
      code: formatRequestCode(createdRequest.id),
      status: createdRequest.status || "submitted",
      totalItems: payload.orderItems.length,
      totalUnits: payload.orderItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
      subtotal: payload.orderItems.reduce((sum, item) => sum + Number(item.base_price || 0) * Number(item.quantity || 0), 0),
      notes: payload.orderRequest.notes || "",
      items: payload.orderItems,
    };
    state.resellerDraft = {};
    state.resellerNotes = "";
    state.orderSubmitted = true;
    state.orderSubmitPending = false;
    setRoute("request-confirmation");
    loadProtectedDataInBackground();
    sendOrderNotification({
      eventType: "order_submitted",
      adminEmails: [],
      orderCode: formatRequestCode(createdRequest.id),
      resellerCompany: state.auth.profile?.company_name || "Irunsvan reseller",
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
  state.signupConfirmationEmail = null;
  render();

  try {
    const data = new FormData(form);
    let authState = state.auth;

    if (!authState.isAuthenticated) {
      const email = String(data.get("email") || "").trim();
      const password = String(data.get("password") || "");
      const passwordConfirm = String(data.get("password_confirm") || "");
      if (password.length < 8) throw new Error("Use at least 8 characters for your password.");
      if (password !== passwordConfirm) throw new Error("The password confirmation does not match.");
      await SupabaseClient.signUpWithPassword({
        url: SUPABASE_URL,
        key: SUPABASE_KEY,
        email,
        password,
        metadata: { full_name: String(data.get("full_name") || "").trim() },
      });
      if (!SupabaseClient.readStoredSession()?.access_token) {
        try {
          await SupabaseClient.signInWithPassword({
            url: SUPABASE_URL,
            key: SUPABASE_KEY,
            email,
            password,
          });
        } catch (error) {
          if (/confirm your email|email not confirmed/i.test(error instanceof Error ? error.message : "")) {
            state.signupConfirmationEmail = email;
            state.applicationSubmitPending = false;
            state.applicationError = null;
            render();
            return;
          }
          throw error;
        }
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
    const currentStatus = orderRequest?.status || "submitted";
    const approvalItems = state.orderRequestItems.filter((item) => item.order_request_id === orderId);
    const patch = AdminOrders.buildOrderStatusPatch(
      status,
      `Updated from admin dashboard on ${new Date().toLocaleString()}`,
      orderRequest,
    );
    const shouldAdjustInventory = status === "awaiting_payment" && currentStatus !== "awaiting_payment";
    const inventoryAdjustments = shouldAdjustInventory
      ? AdminOrders.buildApprovalInventoryAdjustments({ orderId, items: approvalItems, inventory: state.inventory })
      : [];
    await patchAuthedSupabase("order_requests", `id=eq.${encodeURIComponent(orderId)}`, patch);
    if (shouldAdjustInventory) {
      const appliedAdjustments = [];
      try {
        for (const adjustment of inventoryAdjustments) {
          await patchAuthedSupabase("inventory", `id=eq.${encodeURIComponent(adjustment.id)}`, {
            stock_quantity: adjustment.nextStock,
            source: "order_reserved",
          });
          appliedAdjustments.push(adjustment);
        }
      } catch (inventoryError) {
        for (const adjustment of appliedAdjustments.reverse()) {
          await patchAuthedSupabase("inventory", `id=eq.${encodeURIComponent(adjustment.id)}`, {
            stock_quantity: adjustment.previousStock,
            source: "order_reserve_revert",
          }).catch(() => {});
        }
        await patchAuthedSupabase("order_requests", `id=eq.${encodeURIComponent(orderId)}`, {
          status: currentStatus,
          admin_notes: orderRequest?.admin_notes || null,
        }).catch(() => {});
        throw inventoryError;
      }
    }
    if (orderRequest?.reseller_id) {
      const [profile] = await fetchAuthedSupabase(
        "profiles",
        `select=id,email,company_name&id=eq.${encodeURIComponent(orderRequest.reseller_id)}&limit=1`,
      );
      sendOrderNotification({
        eventType: `order_${status}`,
        adminEmails: [profile?.email].filter(Boolean),
        orderCode: formatRequestCode(orderId),
        resellerCompany: profile?.company_name || "Irunsvan reseller",
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

function orderExportPayload(orderId) {
  const request = state.orderRequests.find((entry) => entry.id === orderId);
  const record = orderRecordById(orderId);
  if (!request || !record) throw new Error("Order not found.");
  const profile = profileForUserId(request.reseller_id);
  return {
    order: {
      ...request,
      ...record,
    },
    items: orderItemsFor(orderId),
    inventory: state.inventory,
    variants: state.variants,
    products: state.products,
    companyName: profile?.company_name || profile?.email || "",
  };
}

async function handleOrderExport(orderId, format) {
  try {
    const payload = orderExportPayload(orderId);
    if (format === "xlsx") {
      await ensureImportLibraries("order_xlsx");
      OrderExport.downloadSupplierXlsx({
        ...payload,
        XLSX: window.XLSX,
      });
      return;
    }
    OrderExport.downloadSupplierCsv(payload);
  } catch (error) {
    state.historyError = error instanceof Error ? error.message : "Unable to export order";
    render();
  }
}

async function handleStockReset(form) {
  const confirmation = String(new FormData(form).get("stock_reset_confirmation") || "").trim();
  state.stockResetError = null;
  state.stockResetSaved = false;

  if (!state.auth.isAdmin) {
    state.stockResetError = "Only an admin account can reset stock.";
    return;
  }

  if (confirmation !== "RESET STOCK") {
    state.stockResetError = "Type RESET STOCK to confirm the stock reset.";
    return;
  }

  state.stockResetPending = true;
  render();

  try {
    await patchAuthedSupabaseMinimal("inventory", "id=not.is.null", {
      stock_quantity: 0,
      source: "manual_stock_reset",
    });
    state.inventory = state.inventory.map((row) => ({
      ...row,
      stock_quantity: 0,
      source: "manual_stock_reset",
    }));
    state.resellerDraft = {};
    state.stockResetSaved = true;
    await loadProtectedData();
  } catch (error) {
    state.stockResetError = error instanceof Error ? error.message : "Unable to reset stock";
  } finally {
    state.stockResetPending = false;
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

async function saveHomepageFlyer(form) {
  const data = new FormData(form);
  state.flyerSavePending = true;
  state.adminContentError = null;
  render();
  try {
    const file = form.elements.namedItem("flyer_image")?.files?.[0];
    if (!file) throw new Error("Choose a flyer image before saving.");
    const record = WebsiteContent.buildContentImageRecord({ folder: "flyers", file, uniquePrefix: new Date().toISOString().replace(/\D/g, "") });
    await uploadContentImage(record);
    const [saved] = await insertAuthedSupabase(
      "homepage_flyers",
      WebsiteContent.buildFlyerPayload(
        {
          title: data.get("flyer_title"),
          imagePath: record.storagePath,
          sortOrder: data.get("flyer_sort_order"),
          published: data.get("flyer_published") === "on",
        },
        state.auth.user?.id || null,
      ),
    );
    const currentFlyers = Array.isArray(state.homepageFlyers)
      ? state.homepageFlyers.filter((flyer) => flyer.id !== WebsiteContent.DEFAULT_HOME_FLYERS[0]?.id)
      : [];
    state.homepageFlyers = WebsiteContent.normalizeFlyers([...currentFlyers, saved], { includeUnpublished: true });
  } catch (error) {
    state.adminContentError = error instanceof Error ? error.message : "Unable to save flyer";
  } finally {
    state.flyerSavePending = false;
    render();
  }
}

async function saveBlogPost(form) {
  const data = new FormData(form);
  state.storySavePending = true;
  state.adminContentError = null;
  render();
  try {
    const file = form.elements.namedItem("story_cover_image")?.files?.[0];
    let coverImagePath = "";
    if (file) {
      const record = WebsiteContent.buildContentImageRecord({ folder: "stories", file, uniquePrefix: new Date().toISOString().replace(/\D/g, "") });
      await uploadContentImage(record);
      coverImagePath = record.storagePath;
    }
    const [saved] = await insertAuthedSupabase(
      "blog_posts",
      WebsiteContent.buildStoryPayload(
        {
          title: data.get("story_title"),
          coverImagePath,
          summary: data.get("story_summary"),
          body: data.get("story_body"),
          published: data.get("story_published") === "on",
        },
        state.auth.user?.id || null,
      ),
    );
    state.blogPosts = WebsiteContent.normalizeStories([saved, ...state.blogPosts], { includeUnpublished: true });
  } catch (error) {
    state.adminContentError = error instanceof Error ? error.message : "Unable to save story";
  } finally {
    state.storySavePending = false;
    render();
  }
}

async function savePublicProductFlyer(form) {
  const data = new FormData(form);
  state.publicProductFlyerSavePending = true;
  state.adminContentError = null;
  render();
  try {
    const mainFile = form.elements.namedItem("product_flyer_main_image")?.files?.[0];
    const secondaryFile = form.elements.namedItem("product_flyer_secondary_image")?.files?.[0];
    if (!mainFile) throw new Error("Choose a main product flyer image before saving.");
    const uniquePrefix = new Date().toISOString().replace(/\D/g, "");
    const mainRecord = WebsiteContent.buildContentImageRecord({ folder: "public-products", file: mainFile, uniquePrefix });
    await uploadContentImage(mainRecord);
    let secondaryImagePath = "";
    if (secondaryFile) {
      const secondaryRecord = WebsiteContent.buildContentImageRecord({ folder: "public-products", file: secondaryFile, uniquePrefix: `${uniquePrefix}-secondary` });
      await uploadContentImage(secondaryRecord);
      secondaryImagePath = secondaryRecord.storagePath;
    }
    const [saved] = await insertAuthedSupabase(
      "public_product_flyers",
      WebsiteContent.buildProductFlyerPayload(
        {
          title: data.get("product_flyer_title"),
          productClass: data.get("product_flyer_class"),
          shortDescription: data.get("product_flyer_short_description"),
          story: data.get("product_flyer_story"),
          mainImagePath: mainRecord.storagePath,
          secondaryImagePath,
          displayOrder: data.get("product_flyer_display_order"),
          published: data.get("product_flyer_published") === "on",
        },
        state.auth.user?.id || null,
      ),
    );
    state.publicProductFlyers = WebsiteContent.mergeProductFlyersWithDefaults([saved, ...state.publicProductFlyers], { includeUnpublished: true });
  } catch (error) {
    state.adminContentError = readablePublicProductFlyerDatabaseError(error, "Unable to save public product flyer");
  } finally {
    state.publicProductFlyerSavePending = false;
    render();
  }
}

async function editPublicProductFlyer(flyerId) {
  const id = String(flyerId || "").trim();
  if (!id) return;
  const flyer = (Array.isArray(state.publicProductFlyers) ? state.publicProductFlyers : []).find((item) => item.id === id);
  if (!flyer) {
    state.adminContentError = "That public product flyer could not be found.";
    render();
    return;
  }
  state.publicProductFlyerEditingId = id;
  state.adminContentError = null;
  render();
}

async function cancelPublicProductFlyerEdit() {
  state.publicProductFlyerEditingId = null;
  state.adminContentError = null;
  render();
}

async function updatePublicProductFlyer(form) {
  const data = new FormData(form);
  const id = String(data.get("product_flyer_id") || state.publicProductFlyerEditingId || "").trim();
  const currentFlyer = (Array.isArray(state.publicProductFlyers) ? state.publicProductFlyers : []).find((flyer) => flyer.id === id);
  state.publicProductFlyerSavePending = true;
  state.adminContentError = null;
  render();
  try {
    if (!id || !currentFlyer) throw new Error("Choose a public product flyer before updating.");
    const mainFile = form.elements.namedItem("product_flyer_main_image")?.files?.[0];
    const secondaryFile = form.elements.namedItem("product_flyer_secondary_image")?.files?.[0];
    const uniquePrefix = new Date().toISOString().replace(/\D/g, "");
    let mainImagePath = currentFlyer.mainImagePath || "";
    let secondaryImagePath = currentFlyer.secondaryImagePath || "";
    if (mainFile) {
      const mainRecord = WebsiteContent.buildContentImageRecord({ folder: "public-products", file: mainFile, uniquePrefix });
      await uploadContentImage(mainRecord);
      mainImagePath = mainRecord.storagePath;
    }
    if (secondaryFile) {
      const secondaryRecord = WebsiteContent.buildContentImageRecord({ folder: "public-products", file: secondaryFile, uniquePrefix: `${uniquePrefix}-secondary` });
      await uploadContentImage(secondaryRecord);
      secondaryImagePath = secondaryRecord.storagePath;
    }
    if (!mainImagePath) throw new Error("Choose a main product flyer image before updating.");
    const payloadInput = {
      title: data.get("product_flyer_title"),
      slug: currentFlyer.slug,
      productClass: data.get("product_flyer_class"),
      shortDescription: data.get("product_flyer_short_description"),
      story: data.get("product_flyer_story"),
      mainImagePath,
      secondaryImagePath,
      displayOrder: data.get("product_flyer_display_order"),
      published: data.get("product_flyer_published") === "on",
    };
    const [updated] = isSeededProductFlyer(currentFlyer) && String(currentFlyer.id || "").startsWith("fallback-public-flyer-")
      ? await upsertAuthedSupabase("public_product_flyers", WebsiteContent.buildProductFlyerPayload(payloadInput, state.auth.user?.id || null), "slug")
      : await updateAuthedSupabase("public_product_flyers", id,
          WebsiteContent.buildProductFlyerUpdatePayload(payloadInput, state.auth.user?.id || null),
        );
    state.publicProductFlyers = WebsiteContent.mergeProductFlyersWithDefaults(
      [updated, ...state.publicProductFlyers.filter((flyer) => flyer.slug !== currentFlyer.slug)],
      { includeUnpublished: true },
    );
    if (state.selectedProductFlyerSlug === currentFlyer.slug) {
      const normalizedUpdated = WebsiteContent.normalizeProductFlyers([updated], { includeUnpublished: true })[0];
      state.selectedProductFlyerSlug = normalizedUpdated?.slug || null;
    }
    state.publicProductFlyerEditingId = null;
  } catch (error) {
    state.adminContentError = readablePublicProductFlyerDatabaseError(error, "Unable to update public product flyer");
  } finally {
    state.publicProductFlyerSavePending = false;
    render();
  }
}

async function deletePublicProductFlyer(flyerId) {
  const id = String(flyerId || "").trim();
  if (!id) return;
  state.adminContentError = null;
  try {
    const currentFlyer = (Array.isArray(state.publicProductFlyers) ? state.publicProductFlyers : []).find((flyer) => flyer.id === id);
    if (currentFlyer && isSeededProductFlyer(currentFlyer)) {
      const hiddenInput = {
        title: currentFlyer.title,
        slug: currentFlyer.slug,
        productClass: currentFlyer.productClass,
        shortDescription: currentFlyer.shortDescription,
        story: currentFlyer.story,
        mainImagePath: currentFlyer.mainImagePath,
        secondaryImagePath: currentFlyer.secondaryImagePath,
        displayOrder: currentFlyer.displayOrder,
        published: false,
      };
      const [hidden] = String(currentFlyer.id || "").startsWith("fallback-public-flyer-")
        ? await upsertAuthedSupabase("public_product_flyers", WebsiteContent.buildProductFlyerPayload(hiddenInput, state.auth.user?.id || null), "slug")
        : await updateAuthedSupabase("public_product_flyers", id,
            WebsiteContent.buildProductFlyerUpdatePayload(hiddenInput, state.auth.user?.id || null),
          );
      state.publicProductFlyers = WebsiteContent.mergeProductFlyersWithDefaults(
        [hidden, ...state.publicProductFlyers.filter((flyer) => flyer.slug !== currentFlyer.slug)],
        { includeUnpublished: true },
      );
    } else {
      await deleteAuthedSupabase("public_product_flyers", `id=eq.${encodeURIComponent(id)}`);
      state.publicProductFlyers = state.publicProductFlyers.filter((flyer) => flyer.id !== id);
    }
    if (state.publicProductFlyerEditingId === id) {
      state.publicProductFlyerEditingId = null;
    }
    if (state.selectedProductFlyerSlug && !state.publicProductFlyers.some((flyer) => flyer.slug === state.selectedProductFlyerSlug)) {
      state.selectedProductFlyerSlug = null;
    }
  } catch (error) {
    state.adminContentError = readablePublicProductFlyerDatabaseError(error, "Unable to delete public product flyer");
  } finally {
    render();
  }
}

async function saveAboutContent(form) {
  const data = new FormData(form);
  state.aboutSavePending = true;
  state.adminContentError = null;
  render();
  try {
    state.siteContent = SiteControls.sanitizeSiteContent({
      ...state.siteContent,
      about: {
        heading: data.get("about_heading"),
        body: data.get("about_body"),
      },
    });
    localStorage.setItem(SITE_CONTENT_STORAGE_KEY, JSON.stringify(state.siteContent));
    await publishActiveSiteContent(state.siteContent);
    state.siteSaved = true;
  } catch (error) {
    state.adminContentError = error instanceof Error ? error.message : "Unable to save about content";
  } finally {
    state.aboutSavePending = false;
    render();
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

function applySavedInventoryToState(rows) {
  const savedRows = Array.isArray(rows) ? rows : [];
  const bySku = new Map(state.inventory.map((row) => [String(row.sku || "").trim(), row]));
  savedRows.forEach((row) => {
    const sku = String(row.sku || "").trim();
    if (!sku) return;
    bySku.set(sku, row);
  });
  state.inventory = [...bySku.values()].sort((left, right) => String(left.sku || "").localeCompare(String(right.sku || "")));
}

function applySavedColourMappingsToState(rows) {
  const savedRows = Array.isArray(rows) ? rows : [];
  const keyFor = (row) => [row.product_id, row.original_colour, row.color_code || ""].join("::");
  const byKey = new Map((state.colourMappings || []).map((row) => [keyFor(row), row]));
  savedRows.forEach((row) => {
    byKey.set(keyFor(row), row);
  });
  state.colourMappings = [...byKey.values()].sort((left, right) => String(left.model_code || "").localeCompare(String(right.model_code || "")));
}

function selectedProductImageLibrary() {
  return state.products.reduce((library, product) => {
    const modelCode = String(product.model_code || "").trim();
    if (!modelCode) return library;
    library[modelCode] = Array.isArray(product.image_names) ? product.image_names : [];
    return library;
  }, {});
}

function colourReviewRows() {
  return (state.colourMappings || [])
    .map((mapping) => {
      const product = state.products.find((entry) => entry.id === mapping.product_id) || null;
      return {
        ...mapping,
        productName: product?.name || `IRUNSVAN ${mapping.model_code}`,
        imageOptions: Array.isArray(product?.image_names) ? product.image_names : [],
      };
    })
    .sort((left, right) => {
      const modelSort = String(left.model_code || "").localeCompare(String(right.model_code || ""));
      if (modelSort) return modelSort;
      return String(left.original_colour || "").localeCompare(String(right.original_colour || ""));
    });
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

async function saveColourReview(form) {
  state.colourReviewPending = true;
  state.colourReviewSaved = false;
  state.colourReviewError = null;
  render();

  try {
    const data = new FormData(form);
    const rows = colourReviewRows().map((row, index) => ({
      id: data.get(`mapping_id_${index}`),
      product_id: data.get(`product_id_${index}`),
      model_code: data.get(`model_code_${index}`),
      original_colour: data.get(`original_colour_${index}`),
      colour: data.get(`colour_${index}`),
      color_code: data.get(`color_code_${index}`),
      image_name: data.get(`image_name_${index}`),
      published: data.get(`published_${index}`) === "on",
    }));

    const savedMappings = rows.length
      ? await upsertAuthedSupabase("product_colour_mappings", ProductPersistence.buildColourMappingUpsertPayloads(rows), "product_id,original_colour,color_code")
      : [];
    const mappingKey = (row) => [row.product_id, row.original_colour, row.color_code || ""].join("::");
    const mappingByKey = new Map(savedMappings.map((row) => [mappingKey(row), row]));

    const variantUpdates = state.variants
      .map((variant) => {
        const mapping = mappingByKey.get(mappingKey(variant));
        if (!mapping) return null;
        return {
          id: variant.id,
          product_id: variant.product_id,
          sku: variant.sku,
          name: variant.name,
          colour: mapping.colour,
          original_colour: variant.original_colour,
          color_code: variant.color_code,
          size: variant.size,
          base_price: variant.base_price,
          base_currency: variant.base_currency,
          image_name: mapping.image_name,
          published: mapping.published,
        };
      })
      .filter(Boolean);

    const savedVariants = variantUpdates.length ? await upsertAuthedSupabase("product_variants", variantUpdates, "sku") : [];
    if (savedVariants.length) {
      const variantSkus = new Set(savedVariants.map((variant) => variant.sku));
      state.variants = [
        ...state.variants.filter((variant) => !variantSkus.has(variant.sku)),
        ...savedVariants,
      ].sort((left, right) => String(left.sku || "").localeCompare(String(right.sku || "")));
    }
    applySavedColourMappingsToState(savedMappings);
    state.colourReviewSaved = true;
  } catch (error) {
    state.colourReviewError = error instanceof Error ? error.message : "Unable to save Colour Review";
  } finally {
    state.colourReviewPending = false;
  }
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
    const colourMappingPayload = ProductPersistence.buildColourMappingUpsertPayloads(
      (savedProduct.colours || []).map((colour) => ({
        product_id: savedProduct.id,
        model_code: savedProduct.model_code,
        original_colour: colour.original,
        colour: colour.name,
        color_code: colour.code,
        image_name: colour.image,
        published: true,
      })),
    );
    const savedColourMappings = colourMappingPayload.length
      ? await upsertAuthedSupabase("product_colour_mappings", colourMappingPayload, "product_id,original_colour,color_code")
      : [];
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
    applySavedColourMappingsToState(savedColourMappings);
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

async function handleProductPriceUpdate(productId, value) {
  state.productPriceSaved = false;
  state.productPriceError = null;

  try {
    const product = state.products.find((entry) => entry.id === productId);
    if (!product) throw new Error("Product not found.");
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter a product price greater than zero.");
    const [savedProduct] = await updateAuthedSupabase("products", productId, {
      base_price: amount,
      base_currency: product.base_currency || "USD",
    });
    if (!savedProduct?.id) throw new Error("Supabase did not return the updated product.");
    state.products = state.products.map((entry) =>
      entry.id === productId
        ? {
            ...entry,
            base_price: savedProduct.base_price,
            base_currency: savedProduct.base_currency || entry.base_currency || "USD",
          }
        : entry,
    );
    state.productPriceSaved = true;
  } catch (error) {
    state.productPriceError = error instanceof Error ? error.message : "Unable to save product price";
  } finally {
    render();
  }
}

async function handleImportFile(type, file) {
  state.importError = null;
  state.importPreview = null;
  state.stockResetError = null;
  state.stockResetSaved = false;
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
  state.stockResetError = null;
  state.stockResetSaved = false;
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

    if (state.importPreview.type === "catalog_seed_inventory") {
      const productRows = await upsertAuthedSupabase(
        "products",
        state.importPreview.products.map((product) => ProductPersistence.buildProductUpsertPayload(product)),
        "sku",
      );
      const productIdsBySku = new Map(productRows.map((row) => [row.sku, row.id]));

      const colourMappingPayload = state.importPreview.colourMappings
        .map((mapping) => ({
          ...mapping,
          product_id: productIdsBySku.get(`IRUNSVAN-${mapping.model_code}`),
        }))
        .filter((mapping) => mapping.product_id);
      let savedColourMappings = [];
      if (colourMappingPayload.length) {
        savedColourMappings = await upsertAuthedSupabase(
          "product_colour_mappings",
          ProductPersistence.buildColourMappingUpsertPayloads(colourMappingPayload),
          "product_id,original_colour,color_code",
        );
      }

      const variantPayload = state.importPreview.variants
        .filter((variant) => productIdsBySku.has(variant.product_sku))
        .flatMap((variant) => ProductPersistence.buildVariantUpsertPayloads([variant], productIdsBySku.get(variant.product_sku)));
      const savedVariantRows = await upsertAuthedSupabase("product_variants", variantPayload, "sku");

      const variantIdsBySku = new Map(savedVariantRows.map((row) => [row.sku, row.id]));
      const inventoryPayload = state.importPreview.inventoryRows
        .filter((row) => variantIdsBySku.has(row.sku))
        .map((row) => ({
          variant_id: variantIdsBySku.get(row.sku),
          sku: row.sku,
          style_code: row.style_code,
          stock_quantity: row.stock_quantity,
          source: row.source,
        }));
      const savedInventoryRows = inventoryPayload.length ? await upsertAuthedSupabase("inventory", inventoryPayload, "sku") : [];

      productRows.forEach((product) => {
        const productVariants = savedVariantRows.filter((variant) => variant.product_id === product.id);
        applySavedProductToState(product, productVariants);
      });
      applySavedColourMappingsToState(savedColourMappings);
      applySavedInventoryToState(savedInventoryRows);
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
    ".hero-content, .section-header, .lab-section > *, .detail-grid > *, .form-hero, .process-panel, .email-card, .info-page section",
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
  if (state.adminInviteToken) {
    document.getElementById("app").innerHTML = adminInvitePage();
  } else {
    document.getElementById("app").innerHTML = state.authBootstrapPending ? authBootstrapView() : adminPublicBar() + topNav() + routeView();
  }
  bindEvents();
  applyRevealMotion();
}

function adminInvitePage() {
  const invite = state.adminInviteDetails;
  const inviteExpired = Boolean(invite && invite.expires_at && new Date(invite.expires_at).getTime() < Date.now());
  const inviteStatus = invite?.status === "used" ? "This invite has already been used." : invite?.status === "revoked" ? "This invite has been revoked." : inviteExpired ? "This invite has expired." : null;
  const inviteCopy = invite
    ? `This invite was created for ${invite.email}. Sign in with Google using that address to claim admin access.`
    : state.adminInviteLookupPending
      ? "Checking this invite link..."
      : state.adminInviteError
        ? state.adminInviteError
        : "Open the invite link from your email to continue.";
  return `
    <main class="form-page admin-invite-page">
      <section class="form-hero admin-invite-hero">
        <span class="eyebrow dark">Admin Invite</span>
        <h1>Claim admin access</h1>
        <p>${escapeHtml(inviteCopy)}</p>
      </section>
      <section class="admin-invite-layout">
        <div class="workflow-form admin-invite-card">
          ${inviteStatus ? `<p class="notice error">${escapeHtml(inviteStatus)}</p>` : ""}
          ${state.adminInviteError && !inviteStatus ? `<p class="notice error">${escapeHtml(state.adminInviteError)}</p>` : ""}
          ${invite?.note ? `<p class="notice">${escapeHtml(invite.note)}</p>` : ""}
          <p class="form-note admin-invite-help">Only the Google account that matches the invite email can claim this admin invite.</p>
          <div class="admin-invite-actions">
            <button class="button primary full google-button" data-action="google-login" ${state.loginPending || state.adminInviteClaimPending || Boolean(inviteStatus) ? "disabled" : ""}><span class="google-mark">G</span>${state.adminInviteClaimPending ? "Claiming access..." : "Continue with Google"}</button>
            <button type="button" class="button secondary full" data-route="store">Back to Public Site</button>
          </div>
        </div>
        <aside class="process-panel admin-invite-flow">
          <h2>Invite flow</h2>
          ${processStep("1", "Open invite link", "Use the private link sent by the admin.")}
          ${processStep("2", "Sign in with Google", "Use the exact email address that received the invite.")}
          ${processStep("3", "Claim access", "The account is promoted to admin after the email matches.")}
        </aside>
      </section>
    </main>
  `;
}

function adminPublicBar() {
  if (!state.auth.isAuthenticated || currentPortalMode() !== "public") return "";
  if (state.auth.isAdmin) {
    return `
      <div class="admin-return-bar">
        <span>You are signed in as admin.</span>
        <button data-route="admin" class="admin-return button mini">Back to Admin</button>
      </div>
    `;
  }
  if (state.auth.isReseller) {
    return `
      <div class="admin-return-bar">
        <span>You are signed in as a reseller.</span>
        <button data-route="reseller" class="admin-return button mini">Go to Reseller Portal</button>
      </div>
    `;
  }
  return `
    <div class="admin-return-bar">
      <span>You are signed in.</span>
      <button data-route="${Auth.fallbackRouteForRole(state.auth.role)}" class="admin-return button mini">Go to Your Workspace</button>
    </div>
  `;
}

function authBootstrapView() {
  return `
    <main class="form-page narrow">
      <section class="form-hero">
        <span class="eyebrow dark">Loading Account</span>
        <h1>Finishing sign-in.</h1>
        <p>We are restoring your Irunsvan account access and routing you to the correct workspace.</p>
      </section>
    </main>
  `;
}

window.addEventListener("popstate", (event) => {
  const routeState = event.state || MobileNavigation.parseRouteUrl(window.location.hash);
  if (!routeState?.route || !ROUTES.includes(routeState.route)) return;
  state.navigationDepth = Math.max(0, state.navigationDepth - 1);
  state.route = routeForAccess(routeState.route);
  if (routeState.productId) state.selectedProductId = routeState.productId;
  state.selectedOrderId = routeState.orderId || (state.route === "order" ? state.selectedOrderId : null);
  state.selectedStorySlug = routeState.storySlug || null;
  state.selectedProductFlyerSlug = routeState.flyerSlug || null;
  state.mobileNavOpen = false;
  state.catalogFiltersOpen = false;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

function loadProtectedDataInBackground() {
  if (!state.auth.isAuthenticated) return;
  loadProtectedData().catch((error) => {
    const message = error instanceof Error ? error.message : "Unable to load reseller data";
    state.inventoryError = message;
    state.historyError = message;
    state.applicationError = message;
    render();
  });
}

async function initAuth({ loadProtected = true } = {}) {
  try {
    const restored = await SupabaseClient.restoreAuthState({ url: SUPABASE_URL, key: SUPABASE_KEY });
    state.auth = Auth.normalizeAuthState(restored);
    state.authError = authProfileError(state.auth);
    if (loadProtected) await loadProtectedData();
  } catch (error) {
    state.auth = Auth.normalizeAuthState();
    state.authError = error instanceof Error ? error.message : "Unable to restore account session";
  } finally {
    state.authLoading = false;
    state.authBootstrapPending = false;
    render();
  }
}

async function initializeApp() {
  const oauthResult = SupabaseClient.consumeOAuthSessionFromUrl();
  const loginRouteHint = consumeLoginRouteHint();
  const passwordResetHint = consumePasswordResetHint();
  const adminInviteToken = consumeAdminInviteHint();
  const oauthError = SupabaseClient.consumeOAuthError();
  const hasOAuthError = Boolean(oauthResult.error || oauthError);
  if (adminInviteToken) {
    state.adminInviteToken = adminInviteToken;
    loadAdminInviteDetails(adminInviteToken);
  }
  if (hasOAuthError) {
    state.route = loginRouteHint || "login";
    state.authError = oauthResult.error || oauthError;
    window.history.replaceState({}, "", `${window.location.pathname}${MobileNavigation.buildRouteUrl(state.route)}`);
  }
  render();
  const catalogLoad = loadCatalog();
  await initAuth({ loadProtected: false });
  if (hasOAuthError) state.authError = oauthResult.error || oauthError;
  if (state.adminInviteToken && state.auth.isAuthenticated) {
    await claimAdminInvite(state.adminInviteToken);
    await catalogLoad;
    return;
  }
  if (state.adminInviteToken) {
    await catalogLoad;
    return;
  }
  if ((oauthResult.session?.access_token && state.auth.isAuthenticated) || (passwordResetHint && state.auth.isAuthenticated)) {
    if (passwordResetHint) {
      state.passwordResetMode = true;
      setRoute("account", {}, { replaceHistory: true, scroll: false });
      loadProtectedDataInBackground();
      return;
    }
    if (loginRouteHint === "admin-login" && !state.auth.isAdmin) {
      await SupabaseClient.signOut();
      state.auth = Auth.normalizeAuthState();
      state.authError = "This account does not have admin access.";
      setRoute("admin-login", {}, { replaceHistory: true, scroll: false });
      return;
    }
    setRoute(Auth.fallbackRouteForRole(state.auth.role), {}, { replaceHistory: true, scroll: false });
    loadProtectedDataInBackground();
  } else {
    if (!hasOAuthError) {
      syncRouteFromLocation();
      if (loginRouteHint && !window.location.hash) {
        state.route = loginRouteHint;
      }
    }
    render();
    loadProtectedDataInBackground();
  }
  await catalogLoad;
}

initializeApp();
