const { test, expect } = require("@playwright/test");

async function loginAsAdmin(page) {
  await page.goto("/#/admin-login");
  await page.locator("form[data-form='login'] input[name='email']").fill(process.env.E2E_ADMIN_EMAIL);
  await page.locator("form[data-form='login'] input[name='password']").fill(process.env.E2E_ADMIN_PASSWORD);
  await page.locator("form[data-form='login'] button:not([type]), form[data-form='login'] button[type='submit']").first().click();
  await expect(page.getByRole("heading", { name: "Irunsvan Africa Operations" })).toBeVisible();
}

test.describe("authenticated admin P0 workflows", () => {
  test.skip(!process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD, "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run admin production tests.");

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("all orders are reviewable and CSV export downloads", async ({ page }) => {
    await page.locator("[data-route='requests']").first().click();
    await page.getByRole("button", { name: /Open All Orders/i }).click();
    await expect(page.getByRole("heading", { name: "All Orders", exact: true })).toBeVisible();
    await expect(page.locator("tbody tr").first()).toBeVisible();
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export CSV" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("irunsvan-orders.csv");
    await page.locator("[data-route='order']").first().click();
    await expect(page.getByRole("heading", { name: /#RE-/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Items" })).toBeVisible();
  });

  test("resellers and internal team are separate", async ({ page }) => {
    await page.locator("[data-route='team']").first().click();
    await expect(page.getByRole("heading", { name: "Team", exact: true })).toBeVisible();
    await expect(page.getByText("Stockists & Reseller Accounts")).toHaveCount(0);
    await page.locator("[data-route='resellers']").first().click();
    await expect(page.getByRole("heading", { name: "Resellers", exact: true })).toBeVisible();
    await expect(page.getByText("Stockists & Reseller Accounts")).toBeVisible();
    await page.locator("[data-route='applications']").first().click();
    await expect(page.getByRole("heading", { name: "Applications", exact: true })).toBeVisible();
  });

  test("saving a product price persists after refresh", async ({ page }) => {
    await page.locator("[data-route='products']").first().click();
    const editor = page.locator("[data-product-price-editor]").filter({ has: page.locator("input[value]:not([value=''])") }).first();
    await expect(editor).toBeVisible();
    const value = await editor.locator("input").inputValue();
    await editor.getByRole("button", { name: "Save Price" }).click();
    await expect(page.getByText(/Product price saved/i)).toBeVisible();
    await page.reload();
    await expect(page.locator("[data-product-price-editor] input").first()).toBeVisible();
    await expect.poll(async () => page.locator("[data-product-price-editor] input").evaluateAll((inputs, expected) => inputs.some((input) => input.value === expected), value)).toBe(true);
  });

  test("site controls expose all editable homepage sections", async ({ page }) => {
    await page.locator("[data-route='site']").first().click();
    for (const label of ["Product Flyers", "Homepage Flyers", "News", "Brand Ambassadors", "About", "Hero & Theme"]) {
      await expect(page.getByRole("button", { name: new RegExp(label) })).toBeVisible();
    }
    await page.getByRole("button", { name: /Homepage Flyers/ }).click();
    await expect(page.locator("form[data-form='homepage-flyer']")).toBeVisible();
    await page.getByRole("button", { name: /Hero & Theme/ }).click();
    await expect(page.locator("form[data-form='site-controls']")).toBeVisible();
  });

  test("mobile admin pages stay within the viewport", async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.includes("mobile"), "Responsive assertion runs in the mobile project.");
    for (const route of ["products", "site", "requests-all", "applications", "team", "resellers", "imports"]) {
      await page.goto(`/#/${route}`);
      await expect(page.locator(".admin-main")).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${route} should not create document-level horizontal clipping`).toBeLessThanOrEqual(2);
    }
  });
});
