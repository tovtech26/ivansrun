const { test, expect } = require("@playwright/test");

const admin = { id: "00000000-0000-4000-8000-000000000001", email: "admin@example.com", full_name: "Admin User", company_name: "Irunsvan Africa", phone: "", role: "admin" };
const reseller = { id: "00000000-0000-4000-8000-000000000002", email: "buyer@example.com", full_name: "Buyer", company_name: "Buyer Co", phone: "+267000000", role: "reseller" };
const pending = { id: "00000000-0000-4000-8000-000000000003", email: "pending@example.com", full_name: "Pending Buyer", company_name: "Pending Co", phone: "", role: "pending_reseller" };
const product = { id: "10000000-0000-4000-8000-000000000001", sku: "IRUNSVAN-005", model_code: "005", product_type: "shoe", name: "IRUNSVAN 005 Running Shoe", slug: "irunsvan-005", description: "Test product", short_description: "Test product", category: "Running", image_names: ["/public/product-images/SKUs/005/005-1.jpg"], published: true };
const variant = { id: "20000000-0000-4000-8000-000000000001", product_id: product.id, sku: "202300500138", name: product.name, colour: "Blue", original_colour: "Blue", color_code: "BLU", size: "38", image_name: product.image_names[0], published: true };
const submittedOrder = { id: "30000000-0000-4000-8000-000000000001", reseller_id: reseller.id, status: "submitted", notes: "New order", admin_notes: null, created_at: "2026-08-01T10:00:00Z", updated_at: "2026-08-01T10:00:00Z" };
const rejectedOrder = { id: "30000000-0000-4000-8000-000000000002", reseller_id: reseller.id, status: "rejected", notes: "Closed order", admin_notes: "Unavailable", rejection_reason: "Unavailable", rejected_at: "2026-08-02T10:00:00Z", created_at: "2026-08-02T10:00:00Z", updated_at: "2026-08-02T10:00:00Z" };

async function mockAdminSupabase(page) {
  let currentPrice = 36;
  await page.addInitScript(({ userId }) => {
    localStorage.setItem("irunsvan_auth_session", JSON.stringify({ access_token: "mock-admin-token", refresh_token: "", expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: userId } }));
  }, { userId: admin.id });

  await page.route("https://llicocwonbokahpbireg.supabase.co/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const json = (body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

    if (path === "/auth/v1/user") return json({ id: admin.id, email: admin.email, user_metadata: {} });
    if (path.includes("/functions/v1/")) return json({ ok: true });
    if (path === "/rest/v1/profiles") return json(url.searchParams.has("id") ? [admin] : [admin, reseller, pending]);
    if (["/rest/v1/products", "/rest/v1/reseller_products"].includes(path)) return json([product]);
    if (["/rest/v1/product_variants", "/rest/v1/reseller_product_variants"].includes(path)) return json([variant]);
    if (path === "/rest/v1/product_colour_mappings") return json([{ id: "40000000-0000-4000-8000-000000000001", product_id: product.id, model_code: "005", original_colour: "Blue", colour: "Blue", color_code: "BLU", image_name: product.image_names[0], published: true }]);
    if (path === "/rest/v1/inventory") return json([{ id: "50000000-0000-4000-8000-000000000001", variant_id: variant.id, sku: variant.sku, style_code: "23005", stock_quantity: 20, updated_at: "2026-08-01T10:00:00Z" }]);
    if (path === "/rest/v1/order_requests") return json([submittedOrder, rejectedOrder]);
    if (path === "/rest/v1/order_request_items") return json([
      { id: "60000000-0000-4000-8000-000000000001", order_request_id: submittedOrder.id, variant_id: variant.id, sku: variant.sku, product_name: product.name, colour: "Blue", size: "38", quantity: 5, base_price: currentPrice, base_currency: "USD", created_at: submittedOrder.created_at },
      { id: "60000000-0000-4000-8000-000000000002", order_request_id: rejectedOrder.id, variant_id: variant.id, sku: variant.sku, product_name: product.name, colour: "Blue", size: "38", quantity: 2, base_price: currentPrice, base_currency: "USD", created_at: rejectedOrder.created_at },
    ]);
    if (path === "/rest/v1/reseller_applications") return json([
      { id: "70000000-0000-4000-8000-000000000001", user_id: pending.id, email: pending.email, full_name: pending.full_name, company_name: pending.company_name, phone: "", country: "Botswana", message: "Apply", status: "pending", created_at: "2026-08-03T10:00:00Z" },
      { id: "70000000-0000-4000-8000-000000000002", user_id: reseller.id, email: reseller.email, full_name: reseller.full_name, company_name: reseller.company_name, phone: reseller.phone, country: "Botswana", message: "Approved", status: "approved", reviewed_at: "2026-08-02T10:00:00Z", created_at: "2026-08-01T10:00:00Z" },
    ]);
    if (path === "/rest/v1/homepage_flyers") return json([{ id: "80000000-0000-4000-8000-000000000001", title: "Irunsvan Africa", image_path: "/Flyer Templates/Flyer Template.jpg", sort_order: 0, published: true, created_at: "2026-08-01T10:00:00Z" }]);
    if (path === "/rest/v1/blog_posts") return json([]);
    if (path === "/rest/v1/public_product_flyers") return json([]);
    if (path === "/rest/v1/public_product_flyer_images") return json([]);
    if (path === "/rest/v1/reseller_directory") return json([]);
    if (path === "/rest/v1/admin_invites") return json([]);
    if (path === "/rest/v1/import_jobs") return json([]);
    if (path === "/rest/v1/hero_sections") return json([{ eyebrow: "Irunsvan Africa", title: "Performance footwear for Africa.", copy: "Public range", background_image: "/Flyer Templates/Flyer Template.jpg", primary_cta: "View Products", primary_route: "product-flyers", secondary_cta: "Apply", secondary_route: "apply", electricity: true }]);
    if (path === "/rest/v1/site_themes") return json([]);
    if (path === "/rest/v1/site_content") return json([{ reseller_banner: "Reseller access", about_heading: "About Irunsvan Africa", about_body: "About content" }]);
    if (path === "/rest/v1/rpc/get_authorized_product_prices") return json([{ id: product.id, base_price: currentPrice, base_currency: "USD" }]);
    if (path === "/rest/v1/rpc/get_authorized_variant_prices") return json([{ id: variant.id, base_price: currentPrice, base_currency: "USD" }]);
    if (path === "/rest/v1/rpc/update_product_price") {
      currentPrice = Number(request.postDataJSON().p_base_price);
      return json({ ...product, base_price: currentPrice, base_currency: "USD" });
    }
    if (path.startsWith("/rest/v1/rpc/")) return json({});
    return json([]);
  });
}

async function openAdmin(page, route = "admin") {
  await page.goto(`/#/${route}`);
  await expect(page.locator(".admin-main")).toBeVisible();
}

test.beforeEach(async ({ page }) => mockAdminSupabase(page));

test("orders include review and closed records with working CSV export", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "Desktop workflow test.");
  await openAdmin(page, "requests");
  await page.getByRole("button", { name: /Open All Orders/ }).click();
  await expect(page.getByRole("heading", { name: "All Orders", exact: true })).toBeVisible();
  await expect(page.getByText("Rejected", { exact: true })).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  expect((await downloadPromise).suggestedFilename()).toBe("irunsvan-orders.csv");
  await page.locator("[data-route='order']").first().click();
  await expect(page.getByRole("heading", { name: "Items" })).toBeVisible();
});

test("team, resellers, and application review are separated", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "Desktop workflow test.");
  await openAdmin(page, "team");
  await expect(page.getByRole("heading", { name: "Team", exact: true })).toBeVisible();
  await expect(page.getByText(pending.company_name)).toHaveCount(0);
  await openAdmin(page, "resellers");
  await expect(page.getByText(pending.company_name)).toBeVisible();
  await openAdmin(page, "applications");
  await expect(page.getByText("1 pending", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Approve" })).toHaveCount(1);
});

test("price save reports success and persists through refresh", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "Desktop workflow test.");
  await openAdmin(page, "products");
  const input = page.locator("[data-product-price-editor] input").first();
  await expect(input).toHaveValue("36");
  await input.fill("41.25");
  await page.getByRole("button", { name: "Save Price" }).first().click();
  await expect(page.getByText(/Product price saved/i)).toBeVisible();
  await page.reload();
  await expect(page.locator("[data-product-price-editor] input").first()).toHaveValue("41.25");
});

test("site controls show unsaved feedback and all content sections", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "Desktop workflow test.");
  await openAdmin(page, "site");
  for (const label of ["Product Flyers", "Homepage Flyers", "News", "Brand Ambassadors", "About", "Hero & Theme"]) await expect(page.getByRole("button", { name: new RegExp(label) })).toBeVisible();
  await page.getByRole("button", { name: /Brand Ambassadors/ }).click();
  await expect(page.locator("form[data-form='brand-ambassador']")).toBeVisible();
  await page.getByRole("button", { name: /Homepage Flyers/ }).click();
  await page.locator("form[data-form='homepage-flyer'] input[name='flyer_title']").fill("Edited title");
  await expect(page.locator("[data-site-unsaved]")).toBeVisible();
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: /News/ }).click();
  await expect(page.locator("form[data-form='homepage-flyer']")).toBeVisible();
});

test("P0 admin routes do not create document-level mobile clipping", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Mobile responsive test.");
  for (const route of ["products", "site", "requests-all", "applications", "team", "resellers", "imports"]) {
    await openAdmin(page, route);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (overflow > 2) {
      const offenders = await page.evaluate(() =>
        [...document.querySelectorAll("body *")]
          .filter((element) => !element.closest(".mobile-nav-drawer"))
          .map((element) => ({
            element: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}${[...element.classList].map((name) => `.${name}`).join("")}`,
            left: Math.round(element.getBoundingClientRect().left),
            right: Math.round(element.getBoundingClientRect().right),
            width: Math.round(element.getBoundingClientRect().width),
            scrollWidth: element.scrollWidth,
            text: String(element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 80),
          }))
          .filter(({ left, right }) => left < -2 || right > document.documentElement.clientWidth + 2)
          .slice(0, 20),
      );
      console.info(`${route} overflow diagnostics`, offenders);
    }
    expect(overflow, `${route} must stay inside the viewport`).toBeLessThanOrEqual(2);
  }
});
