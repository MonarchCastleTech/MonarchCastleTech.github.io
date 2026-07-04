import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const routes = JSON.parse(fs.readFileSync(new URL("../site.routes.json", import.meta.url), "utf8"));

test("canonical domain is monarchcastle.tech", () => {
  const cname = fs.readFileSync(new URL("../public/CNAME", import.meta.url), "utf8").trim();
  assert.equal(cname, "monarchcastle.tech");
});

test("full dashboards are mounted at canonical subpaths", () => {
  const mounts = Object.fromEntries(routes.dashboardMounts.map((route) => [route.slug, route]));
  assert.deepEqual(Object.keys(mounts).sort(), ["bnti", "mena", "wti"]);
  assert.equal(mounts.bnti.path, "/bnti/");
  assert.equal(mounts.wti.path, "/wti/");
  assert.equal(mounts.mena.path, "/mena/");
  assert.equal(mounts.bnti.dataFile, "bnti_data.json");
  assert.equal(mounts.wti.dataFile, "wti_data.json");
  assert.equal(mounts.mena.dataFile, "mena_data.json");
});

test("supporting local pages use canonical paths", () => {
  const pages = Object.fromEntries(routes.localPages.map((page) => [page.slug, page]));
  assert.equal(pages.tools.path, "/tools/");
  assert.equal(pages.mcp.path, "/mcp/");
  assert.equal(pages.sdcofa.path, "/sdcofa/");
});

test("root homepage is sourced from the original MCTech theme upstream", () => {
  assert.deepEqual(routes.themeHomepage, {
    repoKey: "theme",
    index: "index.html",
    stylesheet: "mct-styles.css",
    script: "mct-app.js",
    assets: "assets"
  });
});

test("product assets are vendored locally instead of sourced from the canonical repo", () => {
  assert.equal(routes.upstreams.products, undefined);
  assert.ok(routes.assets.some((asset) => asset.fromLocal === "src/assets/products" && asset.to === "assets/products"));
});
