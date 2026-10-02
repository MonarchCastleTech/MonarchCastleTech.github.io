import fs from "node:fs";
import { test, expect } from "@playwright/test";

const products = JSON.parse(fs.readFileSync(new URL("../../src/content/site.json", import.meta.url), "utf8")).products;
const preview = process.env.PRODUCT_PREVIEW_BASE_URL;
test.skip(!preview, "Mount the locally built product repos and set PRODUCT_PREVIEW_BASE_URL.");

for (const product of products) {
  for (const width of [390, 1280]) {
    test(`${product.name}: collection navigation at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      const url = new URL(new URL(product.canonicalUrl).pathname, preview);
      await page.goto(url.toString(), { waitUntil: "domcontentloaded" });
      const shell = page.locator(".monarch-shell");
      await expect(shell).toHaveCount(1);
      await expect(shell).toBeVisible();
      await expect(shell).toHaveCSS("background-color", "rgb(11, 23, 38)");
      const box = await shell.boundingBox();
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.height).toBeCloseTo(56, 0);
      expect(box.width).toBeLessThanOrEqual(width);
      if (product.id === "macrointel") {
        await page.getByRole("button", { name: "Got it", exact: true }).click();
      }
      if (width < 900) {
        await shell.locator("summary").click();
        await expect(shell.locator("details")).toHaveAttribute("open", "");
        await expect(shell.locator("details nav a")).toHaveCount(6);
        await expect(shell.locator("details").getByRole("link", { name: "Open The Keep" })).toBeVisible();
      } else {
        await expect(shell.locator(":scope > nav a")).toHaveCount(6);
        await expect(shell.locator(":scope > nav").getByRole("link", { name: "Methodology" })).toBeVisible();
      }
      const localFonts = await page.evaluate(async () => {
        await document.fonts.load('600 12px "IBM Plex Sans"');
        return document.fonts.check('600 12px "IBM Plex Sans"');
      });
      expect(localFonts).toBe(true);
    });
  }
}
