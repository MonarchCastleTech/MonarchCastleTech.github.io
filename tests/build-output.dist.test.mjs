import assert from "node:assert/strict";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = path.join(root, "dist");
const routes = JSON.parse(fs.readFileSync(path.join(root, "site.routes.json"), "utf8"));

test("build output uses the edge-terminated public domain without a Pages CNAME", () => {
  assert.equal(fs.existsSync(path.join(dist, "CNAME")), false);
  assert.equal(fs.existsSync(path.join(dist, ".nojekyll")), true);
});

test("build output publishes autonomous discovery surfaces", () => {
  for (const relativePath of ["insights/feed.xml", "sitemap.xml", "robots.txt", "llms.txt", "llms-full.txt", ".well-known/api-catalog", ".well-known/ard.json"]) {
    assert.equal(fs.existsSync(path.join(dist, relativePath)), true, `${relativePath} exists`);
  }
  assert.match(fs.readFileSync(path.join(dist, "insights", "feed.xml"), "utf8"), /<rss version="2\.0">/);
  assert.match(fs.readFileSync(path.join(dist, "sitemap.xml"), "utf8"), /\/insights\//);
  assert.match(fs.readFileSync(path.join(dist, "robots.txt"), "utf8"), /Content-Signal: ai-train=yes, search=yes, ai-input=yes/);
  assert.match(fs.readFileSync(path.join(dist, "robots.txt"), "utf8"), /Agentmap: https:\/\/monarchcastle\.com\/\.well-known\/ard\.json/);
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

test("build output includes full dashboard subpaths under SDCofA", () => {
  for (const [slug, dataFile] of [["bnti", "bnti_data.json"], ["wti", "wti_data.json"], ["mena", "mena_data.json"]]) {
    assert.equal(fs.existsSync(path.join(dist, "sdcofa", slug, "index.html")), true, `sdcofa/${slug}/index.html exists`);
    assert.equal(fs.existsSync(path.join(dist, "sdcofa", slug, dataFile)), true, `sdcofa/${slug}/${dataFile} exists`);
  }
});

test("agent discovery surfaces are published for OAuth and A2A scanners", () => {
  const authMd = fs.readFileSync(path.join(dist, "auth.md"), "utf8");
  assert.match(authMd, /^# auth\.md/m);
  assert.match(authMd, /agent_auth:/);
  const oauthAs = JSON.parse(fs.readFileSync(path.join(dist, ".well-known", "oauth-authorization-server"), "utf8"));
  assert.equal(oauthAs.issuer, "https://monarchcastle.com");
  assert.ok(Array.isArray(oauthAs.grant_types_supported));
  assert.ok(oauthAs.token_endpoint);
  assert.ok(oauthAs.jwks_uri);
  const prm = JSON.parse(fs.readFileSync(path.join(dist, ".well-known", "oauth-protected-resource"), "utf8"));
  assert.deepEqual(prm.authorization_servers, ["https://monarchcastle.com"]);
  assert.ok(Array.isArray(prm.scopes_supported) && prm.scopes_supported.length > 0);
  assert.equal(prm.resource_documentation, "https://monarchcastle.com/auth.md");
  assert.ok(fs.existsSync(path.join(dist, ".well-known", "jwks.json")));
  const card = JSON.parse(fs.readFileSync(path.join(dist, ".well-known", "agent-card.json"), "utf8"));
  assert.equal(card.url, "https://monarchcastle.com/");
  assert.ok(card.provider.organizationName);
  assert.ok(card.version);
  assert.ok(Array.isArray(card.supportedInterfaces) && card.supportedInterfaces.length > 0);
});

test("root homepage follows the governed shell and links to canonical dashboard paths", () => {
  const html = fs.readFileSync(path.join(dist, "index.html"), "utf8");
  assert.match(html, /href="\/sdcofa\/bnti\/"/);

  assert.match(html, /href="\/sdcofa\/wti\/"/);
  assert.match(html, /href="\/sdcofa\/mena\/"/);
  assert.match(html, /href="\/styles\/site\.css"/);
  assert.match(html, /See disruption before it reaches your operation/);
  assert.match(html, /Every current public product stays open/);
  assert.match(html, /href="\/platform\/"/);
  assert.match(html, /src="\/assets\/products\/bnti-hero\.png"/);
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
    "assets/products/bnti-hero.png",
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
  const allowedPrefix = "sdcofa/(?:bnti|wti|mena)";
  const rootRelativeLeakPattern = new RegExp(`(?:href|src)=["']\\/(?!${allowedPrefix}(?:\\/|$))|fetch\\(\\s*["']\\/(?!${allowedPrefix}(?:\\/|$))|url\\(\\s*["']?\\/(?!${allowedPrefix}(?:\\/|$))`, "i");

  for (const slug of ["bnti", "wti", "mena"]) {
    const html = fs.readFileSync(path.join(dist, "sdcofa", slug, "index.html"), "utf8");
    assert.doesNotMatch(html, redirectPattern, `sdcofa/${slug}/index.html has no redirect shim`);
    assert.doesNotMatch(html, rootRelativeLeakPattern, `sdcofa/${slug}/index.html has no root-relative leak`);
  }
});
