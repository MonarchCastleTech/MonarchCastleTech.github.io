import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function makeTempRoot(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function writeFile(root, relativePath, content) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

function copyBuildScripts(root) {
  fs.mkdirSync(path.join(root, "scripts", "lib"), { recursive: true });
  fs.copyFileSync(path.join(repoRoot, "scripts", "build-site.mjs"), path.join(root, "scripts", "build-site.mjs"));
  fs.copyFileSync(path.join(repoRoot, "scripts", "lib", "static-rewrite.mjs"), path.join(root, "scripts", "lib", "static-rewrite.mjs"));
}

function baseProject(root, assets = []) {
  copyBuildScripts(root);
  writeFile(root, "site.routes.json", JSON.stringify({
    canonicalDomain: "example.com",
    sitePages: [{
      slug: "home",
      path: "/",
      output: "index.html",
      title: "Evidence-led decision intelligence",
      description: "A transparent public portfolio of governed decision-intelligence products."
    }],
    localPages: [],
    dashboardMounts: [],
    assets
  }, null, 2));
  writeFile(root, "public/CNAME", "example.com\n");
  writeFile(root, "src/content/site.json", JSON.stringify({
    brand: {
      masterbrand: "Example Company",
      positioning: "Decision intelligence grounded in transparent data.",
      pillars: ["Strategy", "Data", "Intelligence", "Forecasting"],
      productEndorsement: "Part of Example Company",
      endorsedAnalyticalUnit: { name: "Example Unit", relationship: "endorsed analytical unit" }
    },
    forecastEvaluation: { status: "template-not-evaluated" },
    products: []
  }));
  writeFile(root, "src/content/editorial.json", JSON.stringify({
    contactUrl: "https://github.com/example",
    securityUrl: "https://github.com/example/security/policy",
    licenseUrl: "https://github.com/example/blob/main/LICENSE",
    citationUrl: "https://github.com/example/blob/main/CITATION.cff",
    governanceUrl: "https://github.com/example/governance",
    capabilities: ["Strategy", "Data", "Intelligence", "Forecasting"].map((name) => ({
      name,
      summary: `${name} capability summary.`
    })),
    insights: []
  }));
  writeFile(root, "src/styles/site.css", "body{}");
  writeFile(root, "src/scripts/site.js", "");
}

function runBuild(root) {
  return spawnSync(process.execPath, ["scripts/build-site.mjs"], {
    cwd: root,
    encoding: "utf8"
  });
}

test("build fails when a declared local asset source is missing", () => {
  const root = makeTempRoot("build-site-test-");
  baseProject(root, [{ fromLocal: "src/assets/missing", to: "assets/missing" }]);

  const result = runBuild(root);

  assert.notEqual(result.status, 0, `build unexpectedly succeeded\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  assert.match(result.stderr, /Missing declared asset source/i);
  fs.rmSync(root, { recursive: true, force: true });
});

test("build is self-contained and does not require the deleted theme cache", () => {
  const root = makeTempRoot("build-site-self-contained-");
  baseProject(root, [{ fromLocal: "src/assets/products", to: "assets/products" }]);
  writeFile(root, "src/assets/products/logo.png", "fake image bytes");

  const result = runBuild(root);

  assert.equal(result.status, 0, `build failed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  assert.equal(fs.existsSync(path.join(root, ".cache", "upstreams", "theme")), false);
  assert.equal(fs.existsSync(path.join(root, "dist", "index.html")), true);
  assert.equal(fs.readFileSync(path.join(root, "dist", "assets", "products", "logo.png"), "utf8"), "fake image bytes");
  fs.rmSync(root, { recursive: true, force: true });
});

test("every generated narrative route has one h1, unique metadata, canonical URL, and landmarks", () => {
  const routes = JSON.parse(fs.readFileSync(path.join(repoRoot, "site.routes.json"), "utf8"));
  const seenTitles = new Set();
  const seenDescriptions = new Set();

  for (const route of routes.sitePages) {
    const html = fs.readFileSync(path.join(repoRoot, "dist", route.output), "utf8");
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1, `${route.path} has one h1`);
    assert.match(html, /<header\b/);
    assert.match(html, /<nav\b[^>]+aria-label="Primary"/);
    assert.match(html, /<main\b[^>]+id="main-content"/);
    assert.match(html, /<footer\b/);
    assert.match(html, /class="skip-link"/);
    if (route.slug === "home") {
      assert.match(html, /class="company-close"/);
    } else {
      assert.match(html, /class="next-action"/);
    }
    assert.match(html, new RegExp(`<link rel="canonical" href="https://${routes.canonicalDomain}${route.path}"`));

    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
    assert.ok(title && !seenTitles.has(title), `${route.path} title is unique`);
    assert.ok(description && !seenDescriptions.has(description), `${route.path} description is unique`);
    seenTitles.add(title);
    seenDescriptions.add(description);
  }
});
