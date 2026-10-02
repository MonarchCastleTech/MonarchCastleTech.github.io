import { expect, test } from "@playwright/test";
import fs from "node:fs";

const baseURL = process.env.BASE_URL ?? "http://127.0.0.1:4173";
const bntiSnapshot = JSON.parse(fs.readFileSync(new URL("../../dist/sdcofa/bnti/bnti_data.json", import.meta.url), "utf8"));
const narrativeRoutes = [
  "/",
  "/products/",
  "/platform/",
  "/impact/",
  "/pricing/",
  "/pilot/",
  "/datasets/",
  "/solutions/",
  "/insights/",
  "/methodology/",
  "/developers/",
  "/trust/",
  "/company/"
];
const dashboardExpectations = {
  "/sdcofa/bnti/": { text: /Border Neighbor Threat Index/i, selector: bntiSnapshot.meta.withdrawn ? "#main-content [role='alert']" : "#map-svg" },
  "/sdcofa/wti/": { text: /World Threat Index/i, selector: "#world-map" },
  "/sdcofa/mena/": { text: /MENA Threat Index/i, selector: "text=Regional threat map" }
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

test("the real MCT masterbrand logo is visible in the public masthead", async ({ page }) => {
  await page.goto(`${baseURL}/`);
  const logo = page.locator(".brand-logo");
  await expect(logo).toBeVisible();
  const state = await logo.evaluate((image) => ({
    complete: image.complete,
    naturalWidth: image.naturalWidth,
    naturalHeight: image.naturalHeight,
    width: image.getBoundingClientRect().width,
    height: image.getBoundingClientRect().height
  }));
  expect(state.complete).toBeTruthy();
  expect(state.naturalWidth).toBeGreaterThan(0);
  expect(state.naturalHeight).toBeGreaterThan(0);
  expect(state.width).toBeGreaterThanOrEqual(36);
  expect(state.height).toBeGreaterThanOrEqual(36);
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
  expect(await logos.count()).toBe(24);

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

test("flagship palette resolves to the approved paper and charcoal identity", async ({ page }) => {
  await page.goto(`${baseURL}/`);
  const palette = await page.locator("html").evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      paper: style.getPropertyValue("--paper").trim(),
      dark: style.getPropertyValue("--dark").trim(),
      ink: style.getPropertyValue("--ink").trim()
    };
  });
  expect(palette).toEqual({ paper: "#F2F3F0", dark: "#111613", ink: "#151816" });
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

test("The Keep preview loads three source-linked public indices", async ({ page }) => {
  await page.goto(`${baseURL}/platform/`);
  await expect(page.getByText("All feeds connected")).toBeVisible();
  const values = await page.locator("#metric-bnti, #metric-wti, #metric-mena").allTextContents();
  expect(values).toHaveLength(3);
  await expect(page.locator("#metric-bnti")).toHaveText(bntiSnapshot.meta.withdrawn ? "—" : Number(bntiSnapshot.meta.main_index).toFixed(2));
  for (const id of ["wti", "mena"]) await expect(page.locator(`#metric-${id}`)).toHaveText(/^\d+\.\d{2}$/);
  if (bntiSnapshot.meta.withdrawn) await expect(page.locator("#status-bnti")).toContainText("WITHHELD");
  expect(await page.locator("#exposure-list tr").count()).toBeGreaterThan(100);
  await expect(page.locator("#signal-list li")).toHaveCount(12);
});

test("Keep filters, watchlist and export retain public provenance", async ({ page }) => {
  await page.goto(`${baseURL}/platform/`);
  await expect(page.getByText("All feeds connected")).toBeVisible();
  await page.locator("#keep-source").selectOption("wti");
  await page.locator("#keep-search").fill("Türkiye");
  await expect(page.locator("#exposure-list tr")).toHaveCount(1);
  const pin = page.locator(".watchlist-pin");
  await pin.click();
  await expect(pin).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.getByText("All feeds connected")).toBeVisible();
  await page.locator("#keep-watchlist").check();
  await expect(page.locator("#exposure-list tr")).toHaveCount(1);
  const downloaded = page.waitForEvent("download");
  await page.locator("#keep-export").click();
  const file = await (await downloaded).path();
  const exported = JSON.parse(fs.readFileSync(file, "utf8"));
  expect(exported.records).toHaveLength(1);
  expect(exported.records[0]).toMatchObject({ product: "wti", name: "Türkiye", source: "/sdcofa/wti/wti_data.json" });
  expect(exported.records[0].updated).toBeTruthy();
});

test("atlas country controls remain usable with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${baseURL}/`);
  await expect(page.locator("#atlas-country option")).toHaveCount(195);
  await page.locator("#atlas-country").selectOption("JP");
  await expect(page.locator("#atlas-country option:checked")).toHaveText("Japan");
  await expect(page.locator("#country-score")).toHaveText(/^\d+\.\d{2}$/);
  await expect(page.locator(".world-scene")).toHaveClass(/is-3d/);
  await expect(page.locator(".hero-scene-canvas")).toBeVisible();
});

test("mobile navigation and a static map remain usable without WebGL", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (name, ...args) {
      return name.startsWith("webgl") ? null : original.call(this, name, ...args);
    };
  });
  await page.goto(`${baseURL}/`);
  await expect(page.locator("#atlas-country option")).toHaveCount(195);
  await page.locator("#atlas-country").selectOption("JP");
  await expect(page.locator("#country-score")).toHaveText(/^\d+\.\d{2}$/);
  await expect(page.locator(".atlas-fallback")).toBeVisible();
  await page.locator(".mobile-nav summary").click();
  await expect(page.getByRole("navigation", { name: "Mobile", exact: true }).getByRole("link", { name: "Data", exact: true })).toBeVisible();
});

test("one unavailable feed preserves the other sources and truthful exports", async ({ page }) => {
  await page.route("**/sdcofa/mena/mena_data.json", route => route.fulfill({ status: 503, body: "Unavailable" }));
  await page.goto(`${baseURL}/platform/`);
  await expect(page.locator("#feed-state")).toHaveText("2/3 feeds available");
  await expect(page.locator("#metric-mena")).toHaveText("—");
  await expect(page.locator("#status-mena")).toContainText("Unavailable");
  await expect(page.locator("#metric-wti")).toHaveText(/^\d+\.\d{2}$/);
  await page.locator("#keep-source").selectOption("mena");
  await expect(page.locator("#exposure-list")).toContainText("No country records");
  const downloaded = page.waitForEvent("download");
  await page.locator("#keep-export").click();
  const exported = JSON.parse(fs.readFileSync(await (await downloaded).path(), "utf8"));
  expect(exported.records).toEqual([]);
});
