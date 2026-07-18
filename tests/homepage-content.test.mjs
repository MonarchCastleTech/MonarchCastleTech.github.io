import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const governanceRoot = path.resolve(root, "..", "..", "company-governance");
const site = JSON.parse(fs.readFileSync(path.join(root, "src", "content", "site.json"), "utf8"));
const indexHtml = fs.readFileSync(path.join(root, "dist", "index.html"), "utf8");
const registryPath = path.join(governanceRoot, "portfolio", "products.json");

const projectedFields = [
  "id",
  "name",
  "family",
  "lifecycle",
  "regions",
  "methodologyUrl",
  "updateFrequency",
  "logo",
  "canonicalUrl",
  "owner",
  "forecastEvidenceStatus",
  "endorsementLabel"
];

test("site content is an exact governed projection of every public registry product", (t) => {
  if (!fs.existsSync(registryPath)) return t.skip("cross-repository governance checkout is not available");
  const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
  const publicRegistryProducts = registry.products.filter(({ publicUrl, lifecycle }) => publicUrl && lifecycle !== "retired");
  assert.deepEqual(site.products.map(({ id }) => id), publicRegistryProducts.map(({ id }) => id));
  assert.equal(new Set(site.products.map(({ id }) => id)).size, site.products.length);
  assert.equal(new Set(site.products.map(({ canonicalUrl }) => canonicalUrl)).size, site.products.length);

  for (const product of site.products) {
    assert.deepEqual(Object.keys(product).sort(), projectedFields.sort());
    const source = publicRegistryProducts.find(({ id }) => id === product.id);
    assert.equal(product.name, source.name);
    assert.equal(product.family, source.family);
    assert.equal(product.lifecycle, source.lifecycle);
    assert.equal(product.methodologyUrl, source.methodologyUrl);
    assert.equal(product.updateFrequency, source.updateFrequency);
    assert.equal(product.canonicalUrl, source.publicUrl);
    assert.equal(product.owner, source.ownerOrg);
    assert.equal(product.forecastEvidenceStatus, source.evidenceStatus);
    assert.match(product.endorsementLabel, /Monarch Castle Technologies/);
  }
});

test("flagship cards are owner-scoped and the endorsed SDCofA family is still represented", () => {
  const flagship = site.products.filter(({ owner }) => owner === "MonarchCastleTech");
  const endorsed = site.products.filter(({ owner }) => owner === "SDCofA");
  assert.equal(flagship.length, 8);
  assert.equal(endorsed.length, 3);

  for (const product of flagship) {
    assert.match(indexHtml, new RegExp(`data-product-id="${product.id}"`));
  }
  assert.match(indexHtml, /SDCofA/);
  assert.match(indexHtml, /endorsed analytical unit/i);
  for (const path of ["/bnti/", "/wti/", "/mena/"]) {
    assert.match(indexHtml, new RegExp(`href="${path}"`));
  }
});

test("every public product uses its real, locally available brand mark", () => {
  const expectedLogoPaths = [
    "/assets/products/cloudy-shiny-logo.png",
    "/assets/products/econmap-logo.png",
    "/assets/products/esgmap-logo.png",
    "/assets/products/macrointel-logo.png",
    "/assets/products/milcodec-logo.png",
    "/assets/products/nuclear-logo.png",
    "/assets/products/prepturk-logo.png",
    "/assets/products/supplychain-logo.png",
    "/assets/products/bnti-icon.png",
    "/assets/approved/mena-threat-index.png",
    "/assets/approved/world-threat-index.png"
  ];

  assert.deepEqual(site.products.map((product) => product.logo.publicPath), expectedLogoPaths);
  assert.ok(site.products.every((product) => product.logo.kind === "approved-image"));
  for (const product of site.products) {
    assert.equal(fs.existsSync(path.join(root, "src", product.logo.sourcePath)), true, `${product.name} logo exists`);
    assert.match(product.logo.alt, /logo|mark/i);
  }
});

test("generated public pages never expose internal workflow or registry language", () => {
  const forbidden = /review[- ]required|logo-review-required|github-metadata-verified|forecastEvidenceStatus|lifecycleStatus|approval ticket|(?:governance|approved|public) registry|registry state|implementation state|release state/i;
  for (const route of [
    "index.html",
    "products/index.html",
    "datasets/index.html",
    "solutions/index.html",
    "insights/index.html",
    "methodology/index.html",
    "developers/index.html",
    "trust/index.html",
    "company/index.html"
  ]) {
    const html = fs.readFileSync(path.join(root, "dist", route), "utf8");
    assert.doesNotMatch(html, forbidden, `${route} contains only end-user copy`);
  }
});

test("homepage follows the approved flagship narrative and keeps the four capabilities", () => {
  const sectionClasses = [
    "mission-hero",
    "operating-thesis",
    "featured-systems",
    "intelligence-catalogue",
    "sdcofa-band",
    "evidence-chain",
    "company-close"
  ];
  const offsets = sectionClasses.map((className) => indexHtml.indexOf(`class="${className}`));
  assert.ok(offsets.every((offset) => offset >= 0), "all flagship sections exist");
  assert.deepEqual(offsets, [...offsets].sort((a, b) => a - b));
  assert.deepEqual(site.brand.pillars, ["Strategy", "Data", "Intelligence", "Forecasting"]);
  for (const pillar of site.brand.pillars) assert.match(indexHtml, new RegExp(`>${pillar}<`));
});

test("public shell uses the focused flagship navigation and product action", () => {
  for (const label of ["Home", "Products", "Forecasting", "Methodology", "Company"]) {
    assert.match(indexHtml, new RegExp(`>${label}<`));
  }
  assert.match(indexHtml, /class="header-action" href="\/products\/">Explore products</);
});

test("homepage exposes trust links without unsupported performance claims", () => {
  for (const path of ["/methodology/", "/trust/", "/company/", "/products/"]) {
    assert.match(indexHtml, new RegExp(`href="${path}"`));
  }
  assert.doesNotMatch(indexHtml, /\b(?:best|leading|most accurate|AI-powered)\b/i);
  assert.doesNotMatch(indexHtml, /\b\d+[,.]?\d*\+?\s+(?:customers|countries|forecasts|signals|datasets)\b/i);
});
