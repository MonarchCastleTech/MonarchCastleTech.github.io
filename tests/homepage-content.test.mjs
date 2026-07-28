import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const governanceRoot = path.resolve(root, "..", "..", "company-governance");
const site = JSON.parse(fs.readFileSync(path.join(root, "src", "content", "site.json"), "utf8"));
const indexHtml = fs.readFileSync(path.join(root, "dist", "index.html"), "utf8");
const productsHtml = fs.readFileSync(path.join(root, "dist", "products", "index.html"), "utf8");
const siteCss = fs.readFileSync(path.join(root, "src", "styles", "site.css"), "utf8");
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
  assert.equal(flagship.length, 9);
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

test("products page exposes Monarch Castle Technologies and SDCofA as visibly separate owner groups", () => {
  assert.match(productsHtml, /class="owner-portfolio-section owner-portfolio-section--flagship"/);
  assert.match(productsHtml, /<p class="eyebrow">Product owner<\/p>\s*<h2 id="flagship-heading">Monarch Castle Technologies<\/h2>/);
  assert.match(productsHtml, /class="sdcofa-band owner-portfolio-section owner-portfolio-section--endorsed"/);
  assert.match(productsHtml, /<p class="eyebrow">Endorsed analytical unit<\/p>\s*<h2 id="endorsed-heading">SDCofA<\/h2>/);
});

test("product logos use approved dark assets without runtime color filters", () => {
  assert.doesNotMatch(indexHtml, /data-logo-tone=/);
  assert.doesNotMatch(productsHtml, /data-logo-tone=/);
  assert.doesNotMatch(siteCss, /\[data-logo-tone=/);
  assert.doesNotMatch(siteCss, /filter:\s*[^;]*(?:brightness|saturate|contrast)\(/);
  assert.doesNotMatch(siteCss, /\.featured-system-mark\s*\{[^}]*radial-gradient/s);
  assert.match(siteCss, /\.product-mark\s*\{[^}]*background:\s*transparent;/s);

  const expectedDarkLogoHashes = {
    "cloudy-shiny-logo.png": "570096f66a606d8a861e585a7fa7ec7ae530d0218f2fcf295d2879f9433b1444",
    "econmap-logo.png": "629613546a1c014085ce4f8a668a0e0a2f3600858c08442d055098e3cb476db1",
    "esgmap-logo.png": "52129544e21310234b24bff1d98ceb9270dddf83aaaeab11f714aa29145bf37f",
    "macrointel-logo.png": "79e875086ad5f496c042f693a443df5d7dc58d330271e07e233af79e75fbe295",
    "milcodec-logo.png": "9dfeaad8d391b9d0dc6a2d76e049d47e578f17000b7469575a8e5cb7ba7a54f5",
    "nuclear-logo.png": "5822e425d9b32e58c132737f52d83d6b1f583d51c46dba4f8c103db9b05b9d85",
    "prepturk-logo.png": "5e3e3ce1b2573f8c166cf6227574f46c0f8cfbcc396a39ffa55dd5d2ccb53e3e",
    "supplychain-logo.png": "35dd5ba80c2768aec9942e1af64910871328bf24d55a04afbfba1c0f8146e01b"
  };

  for (const [name, expected] of Object.entries(expectedDarkLogoHashes)) {
    const bytes = fs.readFileSync(path.join(root, "src", "assets", "products", name));
    assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"), expected);
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
    "/assets/products/superlig-forecast-logo.png",
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

test("homepage publishes the Süper Lig Forecast as a daily public product", () => {
  const forecast = site.products.find(({ id }) => id === "superlig-forecast");
  assert.ok(forecast);
  assert.equal(
    forecast.canonicalUrl,
    "https://monarchcastletech.github.io/superlig-forecast/",
  );
  assert.equal(forecast.updateFrequency, "daily");
  assert.match(indexHtml, /data-product-id="superlig-forecast"/);
  assert.match(
    indexHtml,
    /Five million simulated seasons turn current matches, squads, transfers, and market values into transparent title and table probabilities\./,
  );
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
  assert.match(indexHtml, /<img class="brand-logo" src="\/assets\/products\/logo\.png" alt="" \/>/);
  assert.match(indexHtml, /<link rel="icon" type="image\/png" href="\/assets\/products\/logo\.png" \/>/);
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
