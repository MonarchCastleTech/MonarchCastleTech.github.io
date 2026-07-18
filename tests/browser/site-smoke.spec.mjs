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
      if (route === "/") {
        await expect(page.locator(".company-close")).toBeVisible();
      } else {
        await expect(page.locator(".next-action")).toBeVisible();
      }
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

for (const width of [375, 552, 768, 1440]) {
  test(`homepage and products are composed at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of ["/", "/products/"]) {
      await page.goto(`${baseURL}${route}`);
      const dimensions = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      }));
      expect(dimensions.scrollWidth, `${route} should not overflow at ${width}px`).toBe(dimensions.clientWidth);
    }
  });
}

test("every public product logo loads, stays contained, and remains visible", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${baseURL}/products/`);
  const logos = page.locator(".product-mark img, .endorsed-links img");
  expect(await logos.count()).toBe(11);

  for (let index = 0; index < await logos.count(); index += 1) {
    const state = await logos.nth(index).evaluate((image) => {
      const box = image.getBoundingClientRect();
      const parentBox = image.parentElement.getBoundingClientRect();
      return {
        complete: image.complete,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        objectFit: getComputedStyle(image).objectFit,
        width: box.width,
        height: box.height,
        insideParent:
          box.left >= parentBox.left - 1 &&
          box.right <= parentBox.right + 1 &&
          box.top >= parentBox.top - 1 &&
          box.bottom <= parentBox.bottom + 1
      };
    });
    expect(state.complete).toBeTruthy();
    expect(state.naturalWidth).toBeGreaterThan(0);
    expect(state.naturalHeight).toBeGreaterThan(0);
    expect(state.objectFit).toBe("contain");
    expect(state.width).toBeGreaterThan(0);
    expect(state.height).toBeGreaterThan(0);
    expect(state.insideParent).toBeTruthy();
  }
});

test("flagship palette resolves to MCT navy, gold, and warm white", async ({ page }) => {
  await page.goto(`${baseURL}/`);
  const palette = await page.locator("html").evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      navy: style.getPropertyValue("--navy").trim(),
      gold: style.getPropertyValue("--gold").trim(),
      ink: style.getPropertyValue("--ink").trim()
    };
  });
  expect(palette).toEqual({ navy: "#071522", gold: "#d7b46a", ink: "#f3efe4" });
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
