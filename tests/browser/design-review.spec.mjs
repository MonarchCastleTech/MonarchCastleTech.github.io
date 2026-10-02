import { test, expect } from "@playwright/test";
import fs from "node:fs";

const output = "test-results/visual";
test("approved composition and data views at desktop and mobile widths", async ({ page }) => {
  test.setTimeout(60_000);
  fs.mkdirSync(output, { recursive: true });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  for (const width of [1440, 390, 320, 820]) {
    await page.setViewportSize({ width, height: width >= 820 ? 1000 : 844 });
    for (const [route, name] of [["/", "home"], ["/platform/", "keep"], ["/products/", "products"]]) {
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      if (route !== "/products/") await expect(page.locator("#feed-state")).toHaveText("All feeds connected");
      if (route !== "/products/") {
        const colors = await page.locator("#exposure-list td").first().evaluate(cell => {
          let parent = cell, background;
          while (parent && (!background || background === "rgba(0, 0, 0, 0)")) {
            background = getComputedStyle(parent).backgroundColor; parent = parent.parentElement;
          }
          return { foreground: getComputedStyle(cell).color, background };
        });
        const luminance = color => {
          const rgb = color.match(/[\d.]+/g).slice(0, 3).map(value => Number(value) / 255);
          return rgb.map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
            .reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
        };
        const light = luminance(colors.background), dark = luminance(colors.foreground);
        expect((Math.max(light, dark) + .05) / (Math.min(light, dark) + .05)).toBeGreaterThan(4.5);
      }
      if (route === "/") {
        await expect(page.locator(".world-scene")).toHaveClass(/is-3d/);
        await expect(page.locator("#atlas-country option")).toHaveCount(195);
        await expect(page.locator("#status-bnti")).toContainText("WITHHELD");
        await page.waitForTimeout(1600);
      }
      const size = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      expect(size[0], route + " at " + width).toBe(size[1]);
      if ([1440, 390].includes(width)) {
        await page.screenshot({ path: `${output}/${name}-${width}.jpg`, type: "jpeg", quality: 88 });
        if (name === "home") await page.screenshot({ path: `${output}/home-full-${width}.jpg`, fullPage: true, type: "jpeg", quality: 85 });
        if (name === "products") {
          await page.locator(".product-grid").first().scrollIntoViewIfNeeded();
          await page.screenshot({ path: `${output}/products-rows-${width}.jpg`, type: "jpeg", quality: 88 });
        }
      }
    }
  }
  expect(errors).toEqual([]);
});
