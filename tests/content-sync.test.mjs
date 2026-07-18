import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const syncScript = path.join(repoRoot, "scripts", "sync-content.mjs");

function writeJson(root, relativePath, value) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "content-sync-"));
  const governance = path.join(root, "governance");
  const output = path.join(root, "site.json");
  const assetOutput = path.join(root, "approved");
  const logoBytes = Buffer.from("approved logo fixture");
  const logoHash = crypto.createHash("sha256").update(logoBytes).digest("hex");
  const logoSource = path.join(governance, "assets", "logos", "alpha.png");
  fs.mkdirSync(path.dirname(logoSource), { recursive: true });
  fs.writeFileSync(logoSource, logoBytes);

  writeJson(governance, "portfolio/products.json", {
    products: [
      {
        id: "alpha",
        name: "Alpha",
        ownerOrg: "MonarchCastleTech",
        repository: "MonarchCastleTech/alpha",
        family: "financial-intelligence",
        lifecycle: "production",
        description: "Alpha public product.",
        topics: ["financial-intelligence"],
        publicUrl: "https://example.test/alpha/",
        logo: "assets/logos/alpha.png",
        methodologyUrl: "https://example.test/alpha/methodology",
        updateFrequency: "daily",
        forecastCapability: "review-required",
        evidenceStatus: "source-verified"
      },
      {
        id: "endorsed",
        name: "Endorsed",
        ownerOrg: "SDCofA",
        repository: "SDCofA/endorsed",
        family: "threat-intelligence",
        lifecycle: "review-required",
        description: "Endorsed analytical product.",
        topics: ["threat-intelligence"],
        publicUrl: "https://example.test/endorsed/",
        logo: null,
        methodologyUrl: "https://example.test/endorsed/methodology",
        updateFrequency: "review-required",
        forecastCapability: "review-required",
        evidenceStatus: "review-required"
      }
    ]
  });
  writeJson(governance, "portfolio/brand.json", {
    brand: {
      masterbrand: "Monarch Castle Technologies",
      endorsedAnalyticalUnit: { name: "SDCofA", relationship: "endorsed analytical unit" },
      pillars: ["Strategy", "Data", "Intelligence", "Forecasting"],
      positioning: "Decision intelligence grounded in transparent data and calibrated forecasting.",
      productEndorsement: "Part of Monarch Castle Technologies"
    }
  });
  writeJson(governance, "portfolio/logo-inventory.json", {
    logos: [{
      id: "alpha-logo",
      productId: "alpha",
      path: "assets/logos/alpha.png",
      scope: "product-specific",
      sourcePath: "fixture",
      sha256: logoHash,
      provenance: "Fixture."
    }]
  });
  writeJson(governance, "claims/claims-register.json", { claims: [] });
  writeJson(governance, "forecasting/benchmark-manifest.json", { status: "template-not-evaluated" });

  return { root, governance, output, assetOutput };
}

function run({ governance, output, assetOutput }, extraArgs = []) {
  return spawnSync(process.execPath, [
    syncScript,
    "--governance-root", governance,
    "--output", output,
    "--asset-output", assetOutput,
    ...extraArgs
  ], { encoding: "utf8" });
}

test("sync creates a deterministic full projection with owner views and approved marks", () => {
  const paths = fixture();
  const result = run(paths);
  assert.equal(result.status, 0, result.stderr);

  const site = JSON.parse(fs.readFileSync(paths.output, "utf8"));
  assert.deepEqual(site.products.map(({ id }) => id), ["alpha", "endorsed"]);
  assert.deepEqual(site.ownerViews.MonarchCastleTech, ["alpha"]);
  assert.deepEqual(site.ownerViews.SDCofA, ["endorsed"]);
  assert.equal(site.products[0].logo.kind, "approved-image");
  assert.deepEqual(site.products[1].logo, {
    kind: "governed-text",
    label: "Endorsed",
    status: "review-required"
  });
  assert.equal(fs.existsSync(path.join(paths.assetOutput, "alpha.png")), true);

  const check = run(paths, ["--check"]);
  assert.equal(check.status, 0, check.stderr);
  fs.rmSync(paths.root, { recursive: true, force: true });
});

test("sync fails closed on missing fields, duplicates, unapproved logos, and source drift", async (t) => {
  await t.test("missing required field", () => {
    const paths = fixture();
    const source = JSON.parse(fs.readFileSync(path.join(paths.governance, "portfolio", "products.json"), "utf8"));
    delete source.products[0].updateFrequency;
    writeJson(paths.governance, "portfolio/products.json", source);
    const result = run(paths);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /updateFrequency/);
    fs.rmSync(paths.root, { recursive: true, force: true });
  });

  await t.test("duplicate ID or URL", () => {
    const paths = fixture();
    const source = JSON.parse(fs.readFileSync(path.join(paths.governance, "portfolio", "products.json"), "utf8"));
    source.products.push({ ...source.products[0] });
    writeJson(paths.governance, "portfolio/products.json", source);
    const result = run(paths);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /duplicate/i);
    fs.rmSync(paths.root, { recursive: true, force: true });
  });

  await t.test("unapproved image", () => {
    const paths = fixture();
    const inventory = JSON.parse(fs.readFileSync(path.join(paths.governance, "portfolio", "logo-inventory.json"), "utf8"));
    inventory.logos = [];
    writeJson(paths.governance, "portfolio/logo-inventory.json", inventory);
    const result = run(paths);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /not approved/i);
    fs.rmSync(paths.root, { recursive: true, force: true });
  });

  await t.test("source drift", () => {
    const paths = fixture();
    assert.equal(run(paths).status, 0);
    const source = JSON.parse(fs.readFileSync(path.join(paths.governance, "portfolio", "products.json"), "utf8"));
    source.products[0].name = "Changed Alpha";
    writeJson(paths.governance, "portfolio/products.json", source);
    const result = run(paths, ["--check"]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /drift/i);
    fs.rmSync(paths.root, { recursive: true, force: true });
  });
});
