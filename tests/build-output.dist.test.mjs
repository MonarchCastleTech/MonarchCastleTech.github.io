import assert from "node:assert/strict";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = path.join(root, "dist");

test("build output includes canonical site files", () => {
  assert.equal(fs.existsSync(path.join(dist, "CNAME")), true);
  assert.equal(fs.readFileSync(path.join(dist, "CNAME"), "utf8").trim(), "monarchcastle.tech");
  assert.equal(fs.existsSync(path.join(dist, ".nojekyll")), true);
  assert.equal(fs.existsSync(path.join(dist, "index.html")), true);
});

test("build output includes full dashboard subpaths", () => {
  for (const [slug, dataFile] of [["bnti", "bnti_data.json"], ["wti", "wti_data.json"], ["mena", "mena_data.json"]]) {
    assert.equal(fs.existsSync(path.join(dist, slug, "index.html")), true, `${slug}/index.html exists`);
    assert.equal(fs.existsSync(path.join(dist, slug, dataFile)), true, `${slug}/${dataFile} exists`);
  }
});

test("root homepage links to canonical dashboard paths", () => {
  const html = fs.readFileSync(path.join(dist, "index.html"), "utf8");
  assert.match(html, /href="\/bnti\/"/);
  assert.match(html, /href="\/wti\/"/);
  assert.match(html, /href="\/mena\/"/);
  assert.doesNotMatch(html, /sdcofa\.github\.io\/border-neighbor-threat-index/);
});

test("root homepage is built from the original MCTech theme", () => {
  const html = fs.readFileSync(path.join(dist, "index.html"), "utf8");

  assert.match(html, /mct-styles\.css/);
  assert.match(html, /mct-app\.js/);
  assert.match(html, /BNTI . Border Neighbor Threat Index/);
  assert.match(html, /The same instrument, carried to the region: the MENA Threat Index/);
  assert.match(html, /MONARCH&nbsp;<b>CASTLE<\/b>/);
  assert.doesNotMatch(html, /\/styles\/site\.css/);
  assert.doesNotMatch(html, /\/scripts\/live-panels\.js/);
  assert.doesNotMatch(html, /class="live-card"/);

  assert.equal(fs.existsSync(path.join(dist, "mct-styles.css")), true);
  assert.equal(fs.existsSync(path.join(dist, "mct-app.js")), true);
  assert.equal(fs.existsSync(path.join(dist, "assets", "mc-mark.png")), true);
});

test("root homepage adds MCT logo and SDCofA division without replacing theme shell", () => {
  const html = fs.readFileSync(path.join(dist, "index.html"), "utf8");

  assert.match(html, /<img class="mark" src="assets\/products\/logo\.png" alt="" \/>/);
  assert.match(html, /<section class="division reveal" aria-labelledby="div-sdcofa">/);
  assert.match(html, /<h3 class="div-title" id="div-sdcofa">SDCofA<\/h3>/);
  assert.match(html, /href="\/sdcofa\/"/);
  assert.match(html, /src="assets\/products\/sdcofa-logo-dark\.png"/);
  assert.equal(fs.existsSync(path.join(dist, "assets", "products", "logo.png")), true);
  assert.equal(fs.existsSync(path.join(dist, "assets", "products", "sdcofa-logo-dark.png")), true);
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
