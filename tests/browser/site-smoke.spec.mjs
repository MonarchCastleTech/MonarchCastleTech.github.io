import { expect, test } from "@playwright/test";

const baseURL = process.env.BASE_URL ?? "http://127.0.0.1:4173";

for (const route of ["/", "/bnti/", "/wti/", "/mena/", "/tools/", "/mcp/", "/sdcofa/"]) {
  test(`${route} loads`, async ({ page }) => {
    const response = await page.goto(`${baseURL}${route}`, { waitUntil: "domcontentloaded" });
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator("body")).toBeVisible();
  });
}

test("homepage exposes canonical dashboard links", async ({ page }) => {
  await page.goto(`${baseURL}/`);
  await expect(page.locator('a[href="/bnti/"]').first()).toBeVisible();
  await expect(page.locator('a[href="/wti/"]').first()).toBeVisible();
  await expect(page.locator('a[href="/mena/"]').first()).toBeVisible();
});
