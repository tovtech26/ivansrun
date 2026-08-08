const { test, expect } = require("@playwright/test");

function captureRuntimeErrors(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

test("public navigation, directory, login, and legal pages work", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "Desktop navigation belongs to the desktop project.");
  const runtimeErrors = captureRuntimeErrors(page);
  await page.goto("/");

  await expect(page.locator("#app")).not.toBeEmpty();
  await expect(page.locator("body")).not.toContainText("Ivansrun Africa");
  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();

  const primaryNav = page.getByRole("navigation", { name: "Primary navigation" });
  await primaryNav.getByRole("button", { name: "Products", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Products", exact: true })).toBeVisible();

  await primaryNav.getByRole("button", { name: "Stockists", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Buy through an approved Irunsvan partner/i })).toBeVisible();

  await page.getByRole("banner").getByRole("button", { name: "Login", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Sign in to continue." })).toBeVisible();
  await expect(page.locator("form[data-form='login'] input[name='email']")).toBeVisible();
  await expect(page.locator("form[data-form='login'] input[name='password']")).toHaveAttribute("type", "password");
  await page.getByRole("banner").getByRole("button", { name: "Irunsvan Africa home" }).click();

  for (const [route, heading] of [
    ["contact", "Contact"],
    ["terms", "Terms"],
    ["privacy", "Privacy"],
  ]) {
    await page.locator(`[data-route='${route}']`).first().click();
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
  }

  expect(runtimeErrors).toEqual([]);
});

test("published brand ambassador cards open usable public profiles", async ({ page }) => {
  const ambassador = {
    id: "90000000-0000-4000-8000-000000000001",
    name: "Mpho Kgatlana",
    slug: "mpho-kgatlana",
    role_title: "Performance Athlete",
    country: "Botswana",
    city: "Gaborone",
    short_bio: "A relentless competitor shaping the next generation of African movement.",
    full_bio: "Mpho trains with purpose and represents the Irunsvan standard wherever Africa moves.",
    image_path: "content/ambassadors/mpho-kgatlana.jpg",
    cta_label: "Meet Mpho",
    link_url: "",
    instagram_url: "https://instagram.com/mpho",
    display_order: 1,
    featured: true,
    published: true,
    published_at: "2026-08-01T10:00:00Z",
    created_at: "2026-08-01T10:00:00Z",
    updated_at: "2026-08-01T10:00:00Z",
  };
  const runtimeErrors = captureRuntimeErrors(page);
  await page.route("https://llicocwonbokahpbireg.supabase.co/rest/v1/brand_ambassadors**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([ambassador]) });
  });

  await page.goto("/");
  await expect(page.locator("#brand-ambassadors")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mpho Kgatlana", exact: true })).toBeVisible();
  await expect(page.getByText("Performance Athlete / Gaborone, Botswana", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: /Meet Mpho/ }).click();
  await expect(page).toHaveURL(/#\/ambassador\/mpho-kgatlana$/);
  await expect(page.getByRole("heading", { name: "Mpho Kgatlana", exact: true })).toBeVisible();
  await expect(page.getByText(ambassador.full_bio, { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Follow on Instagram/ })).toHaveAttribute("href", ambassador.instagram_url);

  await page.getByRole("button", { name: "Back to Brand Ambassadors" }).click();
  await expect(page).toHaveURL(/#\/store$/);
  await expect(page.locator("#brand-ambassadors")).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});

test("homepage collection cards mirror the published product flyers", async ({ page }) => {
  const flyers = [
    {
      id: "80000000-0000-4000-8000-000000000001",
      title: "IRUNSVAN HEAT 1.0",
      slug: "irunsvan-heat-1-0",
      product_class: "Everyday Trainer",
      short_description: "A daily trainer built for easy movement.",
      main_image_path: "content/products/heat-1-main.jpg",
      display_order: 1,
      published: true,
    },
    {
      id: "80000000-0000-4000-8000-000000000002",
      title: "IRUNSVAN MOTION PRO",
      slug: "irunsvan-motion-pro",
      product_class: "Performance Trainer",
      short_description: "A responsive performance trainer.",
      main_image_path: "content/products/motion-pro-main.jpg",
      display_order: 2,
      published: true,
    },
    {
      id: "80000000-0000-4000-8000-000000000003",
      title: "IRUNSVAN STREET 01",
      slug: "irunsvan-street-01",
      product_class: "Everyday Trainer",
      short_description: "Everyday comfort for city movement.",
      main_image_path: "content/products/street-01-main.jpg",
      display_order: 3,
      published: true,
    },
  ];
  const flyerImages = flyers.map((flyer, index) => ({
    id: `70000000-0000-4000-8000-00000000000${index + 1}`,
    flyer_id: flyer.id,
    image_path: `content/products/flyer-cover-${index + 1}.jpg`,
    image_name: `${flyer.title} cover`,
    display_order: 1,
    is_cover: true,
  }));
  const runtimeErrors = captureRuntimeErrors(page);

  await page.route("https://llicocwonbokahpbireg.supabase.co/rest/v1/public_product_flyers**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(flyers) });
  });
  await page.route("https://llicocwonbokahpbireg.supabase.co/rest/v1/public_product_flyer_images**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(flyerImages) });
  });

  await page.goto("/");
  const cards = page.locator(".campaign-product-card");
  await expect(cards).toHaveCount(3);
  await expect(cards.locator("h3")).toHaveText(flyers.map((flyer) => flyer.title));
  await expect(cards.nth(0).locator("img")).toHaveAttribute("src", /flyer-cover-1\.jpg$/);

  await cards.nth(0).getByRole("button", { name: `View ${flyers[0].title}` }).click();
  await expect(page).toHaveURL(/#\/product-flyer\/irunsvan-heat-1-0$/);
  await expect(page.getByRole("heading", { name: flyers[0].title, exact: true })).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});

test("mobile menu exposes real destinations", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Mobile navigation belongs to the mobile project.");
  const runtimeErrors = captureRuntimeErrors(page);
  await page.goto("/");
  await page.getByRole("button", { name: /Open Site Menu menu/i }).click();
  const drawer = page.locator(".mobile-nav-drawer.open");
  await expect(drawer).toBeVisible();
  await expect(drawer.locator("[data-route='product-flyers']").first()).toBeVisible();
  await expect(drawer.locator("[data-route='find-reseller']")).toBeVisible();
  await expect(drawer.locator("[data-route='login']")).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});

test("reseller SKU search keeps a multi-digit query together", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "The protected search flow runs once in the desktop project.");
  test.skip(!process.env.E2E_RESELLER_EMAIL || !process.env.E2E_RESELLER_PASSWORD, "Set reseller E2E credentials to run the protected search test.");
  const runtimeErrors = captureRuntimeErrors(page);
  await page.goto("/");
  await page.getByRole("banner").getByRole("button", { name: "Login", exact: true }).click();
  await page.locator("form[data-form='login'] input[name='email']").fill(process.env.E2E_RESELLER_EMAIL);
  await page.locator("form[data-form='login'] input[name='password']").fill(process.env.E2E_RESELLER_PASSWORD);
  await page.locator("form[data-form='login'] button:not([type]), form[data-form='login'] button[type='submit']").first().click();

  const search = page.locator("[name='reseller-search']");
  await expect(search).toBeVisible();
  await search.fill("254");
  await expect(search).toHaveValue("254");
  await expect(page.locator("#reseller-search-suggestions")).toBeVisible();
  await search.press("ArrowDown");
  await search.press("Enter");
  await expect(page.locator(".reseller-detail-page")).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});
