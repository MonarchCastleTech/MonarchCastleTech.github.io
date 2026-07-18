import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const routes = JSON.parse(fs.readFileSync(new URL("../site.routes.json", import.meta.url), "utf8"));
const requiredNarrativePaths = [
  "/products/",
  "/datasets/",
  "/solutions/",
  "/insights/",
  "/methodology/",
  "/developers/",
  "/trust/",
  "/company/"
];

test("canonical domain and CNAME stay fixed", () => {
  const cname = fs.readFileSync(new URL("../public/CNAME", import.meta.url), "utf8").trim();
  assert.equal(routes.canonicalDomain, "monarchcastle.tech");
  assert.equal(cname, "monarchcastle.tech");
});

test("the existing route manifest declares the homepage and all eight narrative routes", () => {
  assert.ok(Array.isArray(routes.sitePages));
  assert.deepEqual(
    routes.sitePages.filter(({ path }) => path !== "/").map(({ path }) => path),
    requiredNarrativePaths
  );

  for (const page of routes.sitePages) {
    assert.match(page.slug, /^[a-z][a-z0-9-]*$/);
    assert.match(page.output, /(?:^|\/)index\.html$/);
    assert.ok(page.title.length >= 10, `${page.slug} has a useful title`);
    assert.ok(page.description.length >= 40, `${page.slug} has a useful description`);
  }

  assert.equal(new Set(routes.sitePages.map(({ path }) => path)).size, routes.sitePages.length);
  assert.equal(new Set(routes.sitePages.map(({ title }) => title)).size, routes.sitePages.length);
  assert.equal(new Set(routes.sitePages.map(({ description }) => description)).size, routes.sitePages.length);
});

test("the flagship shell is self-contained and no longer depends on the unavailable theme", () => {
  assert.equal(routes.upstreams.theme, undefined);
  assert.equal(routes.themeHomepage, undefined);
  assert.ok(routes.assets.some((asset) => asset.fromLocal === "src/assets/products" && asset.to === "assets/products"));
  assert.ok(routes.assets.some((asset) => asset.fromLocal === "src/assets/approved" && asset.to === "assets/approved"));
});

test("full dashboards remain mounted at their canonical subpaths", () => {
  const mounts = Object.fromEntries(routes.dashboardMounts.map((route) => [route.slug, route]));
  assert.deepEqual(Object.keys(mounts).sort(), ["bnti", "mena", "wti"]);
  assert.equal(mounts.bnti.path, "/bnti/");
  assert.equal(mounts.wti.path, "/wti/");
  assert.equal(mounts.mena.path, "/mena/");
  assert.equal(mounts.bnti.dataFile, "bnti_data.json");
  assert.equal(mounts.wti.dataFile, "wti_data.json");
  assert.equal(mounts.mena.dataFile, "mena_data.json");
});

test("supporting local pages retain their canonical paths", () => {
  const pages = Object.fromEntries(routes.localPages.map((page) => [page.slug, page]));
  assert.equal(pages.tools.path, "/tools/");
  assert.equal(pages.mcp.path, "/mcp/");
  assert.equal(pages.sdcofa.path, "/sdcofa/");
});
