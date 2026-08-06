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

  await page.getByRole("banner").getByRole("button", { name: "Enter", exact: true }).click();
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

test("mobile menu exposes real destinations", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Mobile navigation belongs to the mobile project.");
  const runtimeErrors = captureRuntimeErrors(page);
  await page.goto("/");
  await page.getByRole("button", { name: /Open Site Menu menu/i }).click();
  const drawer = page.locator(".mobile-nav-drawer.open");
  await expect(drawer).toBeVisible();
  await expect(drawer.locator("[data-route='product-flyers']")).toBeVisible();
  await expect(drawer.locator("[data-route='find-reseller']")).toBeVisible();
  await expect(drawer.locator("[data-route='login']")).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});

test("reseller SKU search keeps a multi-digit query together", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "The protected search flow runs once in the desktop project.");
  test.skip(!process.env.E2E_RESELLER_EMAIL || !process.env.E2E_RESELLER_PASSWORD, "Set reseller E2E credentials to run the protected search test.");
  const runtimeErrors = captureRuntimeErrors(page);
  await page.goto("/");
  await page.getByRole("banner").getByRole("button", { name: "Enter", exact: true }).click();
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
