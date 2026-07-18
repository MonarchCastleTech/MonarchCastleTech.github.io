import assert from "node:assert/strict";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = path.join(root, "dist");
const routes = JSON.parse(fs.readFileSync(path.join(root, "site.routes.json"), "utf8"));

test("build output preserves the custom-domain files", () => {
  assert.equal(fs.existsSync(path.join(dist, "CNAME")), true);
  assert.equal(fs.readFileSync(path.join(dist, "CNAME"), "utf8").trim(), "monarchcastle.tech");
  assert.equal(fs.existsSync(path.join(dist, ".nojekyll")), true);
});

test("build output includes every governed narrative route", () => {
  for (const route of routes.sitePages) {
    const target = path.join(dist, route.output);
    assert.equal(fs.existsSync(target), true, `${route.path} exists`);
    const html = fs.readFileSync(target, "utf8");
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1, `${route.path} has exactly one h1`);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://${routes.canonicalDomain}${route.path}"`));
    assert.match(html, /<meta property="og:title"/);
    assert.match(html, /<meta property="og:description"/);
    assert.match(html, /<meta property="og:url"/);
  }
});

test("build output includes full dashboard subpaths", () => {
  for (const [slug, dataFile] of [["bnti", "bnti_data.json"], ["wti", "wti_data.json"], ["mena", "mena_data.json"]]) {
    assert.equal(fs.existsSync(path.join(dist, slug, "index.html")), true, `${slug}/index.html exists`);
    assert.equal(fs.existsSync(path.join(dist, slug, dataFile)), true, `${slug}/${dataFile} exists`);
  }
});

test("root homepage follows the governed shell and links to canonical dashboard paths", () => {
  const html = fs.readFileSync(path.join(dist, "index.html"), "utf8");
  assert.match(html, /href="\/bnti\/"/);
  assert.match(html, /href="\/wti\/"/);
  assert.match(html, /href="\/mena\/"/);
  assert.match(html, /href="\/styles\/site\.css"/);
  assert.match(html, /Decision intelligence with its sources visible/);
  assert.match(html, /Built around the decision, not the dashboard/i);
  assert.doesNotMatch(html, /mct-styles\.css|mct-app\.js/);
  assert.doesNotMatch(html, /sdcofa\.github\.io\/border-neighbor-threat-index/);
});

test("every public product asset is present and legacy theme assets are not required", () => {
  for (const relativePath of [
    "assets/products/cloudy-shiny-logo.png",
    "assets/products/econmap-logo.png",
    "assets/products/esgmap-logo.png",
    "assets/products/macrointel-logo.png",
    "assets/products/milcodec-logo.png",
    "assets/products/nuclear-logo.png",
    "assets/products/prepturk-logo.png",
    "assets/products/supplychain-logo.png",
    "assets/products/bnti-icon.png",
    "assets/approved/mena-threat-index.png",
    "assets/approved/world-threat-index.png"
  ]) {
    assert.equal(fs.existsSync(path.join(dist, relativePath)), true, `${relativePath} exists`);
  }
  assert.equal(fs.existsSync(path.join(dist, "mct-styles.css")), false);
  assert.equal(fs.existsSync(path.join(dist, "mct-app.js")), false);
});

test("built narrative pages contain end-user copy only", () => {
  const forbidden = /review[- ]required|logo-review-required|github-metadata-verified|forecastEvidenceStatus|lifecycleStatus|approval ticket|(?:governance|approved|public) registry|registry state|implementation state|release state/i;
  for (const route of routes.sitePages) {
    const html = fs.readFileSync(path.join(dist, route.output), "utf8");
    assert.doesNotMatch(html, forbidden, `${route.path} contains no internal workflow language`);
  }
});

test("dashboard entrypoints do not leak root-relative paths or redirect shims", () => {
  const redirectPattern = /<meta[^>]+http-equiv=["']refresh["']|window\.location|location\.href/i;
  const rootRelativeLeakPattern = /(?:href|src)=["']\/(?!bnti(?:\/|$)|wti(?:\/|$)|mena(?:\/|$))|fetch\(\s*["']\/(?!bnti(?:\/|$)|wti(?:\/|$)|mena(?:\/|$))|url\(\s*["']?\/(?!bnti(?:\/|$)|wti(?:\/|$)|mena(?:\/|$))/i;

  for (const slug of ["bnti", "wti", "mena"]) {
    const html = fs.readFileSync(path.join(dist, slug, "index.html"), "utf8");
    assert.doesNotMatch(html, redirectPattern, `${slug}/index.html has no redirect shim`);
    assert.doesNotMatch(html, rootRelativeLeakPattern, `${slug}/index.html has no root-relative leak`);
  }
});
