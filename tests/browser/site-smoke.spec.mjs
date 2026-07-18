import { expect, test } from "@playwright/test";

const baseURL = process.env.BASE_URL ?? "http://127.0.0.1:4173";
const narrativeRoutes = [
  "/",
  "/products/",
  "/datasets/",
  "/solutions/",
  "/insights/",
  "/methodology/",
  "/developers/",
  "/trust/",
  "/company/"
];
const dashboardExpectations = {
  "/bnti/": { text: /Border Neighbor Threat Index/i, selector: "#map-svg" },
  "/wti/": { text: /World Threat Index/i, selector: "#world-map" },
  "/mena/": { text: /MENA Threat Index/i, selector: "text=Regional threat map" }
};

for (const route of [...narrativeRoutes, ...Object.keys(dashboardExpectations), "/tools/", "/mcp/", "/sdcofa/"]) {
  test(`${route} loads`, async ({ page }) => {
    const response = await page.goto(`${baseURL}${route}`, { waitUntil: "domcontentloaded" });
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator("body")).toBeVisible();

    if (narrativeRoutes.includes(route)) {
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("main#main-content")).toBeVisible();
      await expect(page.locator(".next-action")).toBeVisible();
      await expect(page.locator("nav[aria-label='Primary']")).toBeVisible();
    }

    const dashboard = dashboardExpectations[route];
    if (dashboard) {
      expect(new URL(page.url()).pathname).toBe(route);
      await expect(page.getByText(dashboard.text).first()).toBeVisible();
      await expect(page.locator(dashboard.selector).first()).toBeVisible();
    }
  });
}

test("keyboard navigation exposes the skip link and visible focus", async ({ page }) => {
  await page.goto(`${baseURL}/`);
  await page.keyboard.press("Tab");
  await expect(page.locator(".skip-link")).toBeFocused();
  await expect(page.locator(".skip-link")).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

test("desktop and mobile layouts do not overflow", async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto(`${baseURL}/products/`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBeFalsy();
  }
});

for (const colorScheme of ["light", "dark"]) {
  test(`homepage renders in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto(`${baseURL}/`);
    await expect(page.locator("body")).toBeVisible();
    const background = await page.locator("body").evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(background).not.toBe("rgba(0, 0, 0, 0)");
  });
}

test("homepage exposes canonical dashboard links", async ({ page }) => {
  await page.goto(`${baseURL}/`);
  for (const route of Object.keys(dashboardExpectations)) {
    await expect(page.locator(`a[href="${route}"]`).first()).toBeVisible();
  }
});
