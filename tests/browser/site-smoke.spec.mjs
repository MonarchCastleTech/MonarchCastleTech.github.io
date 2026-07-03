import { expect, test } from "@playwright/test";

const baseURL = process.env.BASE_URL ?? "http://127.0.0.1:4173";
const dashboardExpectations = {
  "/bnti/": {
    path: "/bnti/",
    text: /Border Neighbor Threat Index/i,
    selector: "#map-svg"
  },
  "/wti/": {
    path: "/wti/",
    text: /World Threat Index/i,
    selector: "#world-map"
  },
  "/mena/": {
    path: "/mena/",
    text: /MENA Threat Index/i,
    selector: "text=Regional threat map"
  }
};

for (const route of ["/", "/bnti/", "/wti/", "/mena/", "/tools/", "/mcp/", "/sdcofa/"]) {
  test(`${route} loads`, async ({ page }) => {
    const response = await page.goto(`${baseURL}${route}`, { waitUntil: "domcontentloaded" });
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator("body")).toBeVisible();

    const dashboard = dashboardExpectations[route];
    if (dashboard) {
      expect(new URL(page.url()).pathname).toBe(dashboard.path);
      await expect(page.getByText(dashboard.text).first()).toBeVisible();
      await expect(page.locator(dashboard.selector).first()).toBeVisible();
    }
  });
}

test("homepage exposes canonical dashboard links", async ({ page }) => {
  await page.goto(`${baseURL}/`);
  await expect(page.locator('a[href="/bnti/"]').first()).toBeVisible();
  await expect(page.locator('a[href="/wti/"]').first()).toBeVisible();
  await expect(page.locator('a[href="/mena/"]').first()).toBeVisible();
});
