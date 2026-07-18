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
const registry = JSON.parse(fs.readFileSync(path.join(governanceRoot, "portfolio", "products.json"), "utf8"));
const logoInventory = JSON.parse(fs.readFileSync(path.join(governanceRoot, "portfolio", "logo-inventory.json"), "utf8"));

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

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

test("site content is an exact governed projection of every public registry product", () => {
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

test("only inventory-approved image marks are emitted; all other products fail closed to text", () => {
  const approvedByProduct = new Map(logoInventory.logos.map((logo) => [logo.productId, logo]));

  for (const product of site.products) {
    const approved = approvedByProduct.get(product.id);
    if (!approved) {
      assert.deepEqual(product.logo, {
        kind: "governed-text",
        label: product.name,
        status: "review-required"
      });
      continue;
    }

    assert.equal(product.logo.kind, "approved-image");
    assert.equal(product.logo.sha256, approved.sha256);
    assert.equal(sha256(path.join(root, "src", product.logo.sourcePath)), approved.sha256);
  }
});

test("homepage follows the approved editorial order and exposes the four governed pillars", () => {
  const sectionIds = [
    "positioning",
    "capabilities",
    "portfolio",
    "datasets-methods",
    "forecast-evaluation",
    "trust-provenance",
    "insights",
    "company-contact"
  ];
  const offsets = sectionIds.map((id) => indexHtml.indexOf(`id="${id}"`));
  assert.ok(offsets.every((offset) => offset >= 0), "all editorial sections exist");
  assert.deepEqual(offsets, [...offsets].sort((a, b) => a - b));
  assert.deepEqual(site.brand.pillars, ["Strategy", "Data", "Intelligence", "Forecasting"]);
  for (const pillar of site.brand.pillars) assert.match(indexHtml, new RegExp(`>${pillar}<`));
});

test("homepage exposes trust links and an explicit non-evidenced forecast state", () => {
  for (const path of ["/methodology/", "/trust/", "/company/", "/products/"]) {
    assert.match(indexHtml, new RegExp(`href="${path}"`));
  }
  assert.match(indexHtml, /not yet evidenced/i);
  assert.doesNotMatch(indexHtml, /\b(?:best|leading|most accurate|AI-powered)\b/i);
  assert.doesNotMatch(indexHtml, /\b\d+[,.]?\d*\+?\s+(?:customers|countries|forecasts|signals|datasets)\b/i);
});
