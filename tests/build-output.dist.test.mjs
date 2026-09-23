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
  for (const relativePath of ["insights/feed.xml", "sitemap.xml", "robots.txt", "llms.txt", "llms-full.txt", ".well-known/api-catalog", ".well-known/ard.json", ".well-known/ai-catalog.json", "site.webmanifest", "ai.txt", "agents.txt", "humans.txt", "404.html"]) {
    assert.equal(fs.existsSync(path.join(dist, relativePath)), true, `${relativePath} exists`);
  }
  assert.match(fs.readFileSync(path.join(dist, "insights", "feed.xml"), "utf8"), /<rss version="2\.0">/);
  const sitemap = fs.readFileSync(path.join(dist, "sitemap.xml"), "utf8");
  assert.match(sitemap, /\/insights\//);
  assert.match(sitemap, /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
  assert.match(sitemap, /<changefreq>/);
  assert.match(sitemap, /<priority>/);
  assert.match(fs.readFileSync(path.join(dist, "robots.txt"), "utf8"), /Content-Signal: ai-train=yes, search=yes, ai-input=yes/);
  assert.match(fs.readFileSync(path.join(dist, "robots.txt"), "utf8"), /Agentmap: https:\/\/monarchcastle\.com\/\.well-known\/ard\.json/);
  const apiCatalog = JSON.parse(fs.readFileSync(path.join(dist, ".well-known", "api-catalog"), "utf8"));
  const linkset = apiCatalog.linkset?.[0];
  const serviceDesc = linkset?.["service-desc"];
  assert.ok(Array.isArray(serviceDesc) && serviceDesc.length >= 4, "api-catalog lists discovery services");
  const serviceHrefs = serviceDesc.map((entry) => entry.href);
  assert.ok(serviceHrefs.includes("https://monarchcastle.com/api/bnti"), "api-catalog lists BNTI API");
  assert.ok(serviceHrefs.includes("https://monarchcastle.com/api/wti"), "api-catalog lists WTI API");
  assert.ok(serviceHrefs.includes("https://monarchcastle.com/api/mena"), "api-catalog lists MENA API");
  const aiCatalog = JSON.parse(fs.readFileSync(path.join(dist, ".well-known", "ai-catalog.json"), "utf8"));
  assert.ok(Array.isArray(aiCatalog.entries) && aiCatalog.entries.length >= 4, "ai-catalog lists API/MCP/FAQ entries");
  const aiUrls = aiCatalog.entries.map((entry) => entry.url);
  assert.ok(aiUrls.includes("https://monarchcastle.com/api"), "ai-catalog lists REST API");
  assert.ok(aiUrls.includes("https://monarchcastle.com/mcp"), "ai-catalog lists MCP endpoint");
  const llms = fs.readFileSync(path.join(dist, "llms.txt"), "utf8");
  assert.match(llms, /GET https:\/\/monarchcastle\.com\/api\/bnti/);
  assert.match(llms, /API index: GET https:\/\/monarchcastle\.com\/api/);
  assert.match(llms, /## FAQ/);
  assert.match(llms, /## Quick facts/);
});

test("build output includes every governed narrative route", () => {
  for (const route of routes.sitePages) {
    const target = path.join(dist, route.output);
    assert.equal(fs.existsSync(target), true, `${route.path} exists`);
    const html = fs.readFileSync(target, "utf8");
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1, `${route.path} has exactly one h1`);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://${routes.canonicalDomain}${route.path}"`));
    assert.match(html, /<meta name="robots" content="index, follow/);
    assert.match(html, /<meta property="og:title"/);
    assert.match(html, /<meta property="og:description"/);
    assert.match(html, /<meta property="og:url"/);
    assert.match(html, /<meta property="og:image"/);
    assert.match(html, /application\/ld\+json/);
    assert.match(html, /BreadcrumbList/);
    assert.match(html, /rel="manifest" href="\/site\.webmanifest"/);
  }
});

test("homepage publishes GEO definitions, FAQ markup, and FAQPage JSON-LD", () => {
  const html = fs.readFileSync(path.join(dist, "index.html"), "utf8");
  assert.match(html, /id="answers"/);
  assert.match(html, /class="entity-definitions"/);
  assert.match(html, /Border Neighbor Threat Index \(BNTI\)/);
  assert.match(html, /Frequently asked questions/);
  assert.match(html, /<details><summary>/);
  assert.match(html, /"@type":"FAQPage"/);
  assert.match(html, /What is Monarch Castle Technologies\?/);
  assert.match(html, /How can an application read the standing indices\?/);
  assert.match(html, /"@type":"SoftwareApplication"/);
  assert.match(html, /"@type":"Dataset"/);
  assert.match(html, /rel="preload" as="image"/);
  assert.match(html, /rel="agent"/);
  const llmsFull = fs.readFileSync(path.join(dist, "llms-full.txt"), "utf8");
  assert.match(llmsFull, /## Entity definitions/);
  assert.match(llmsFull, /## FAQ/);
  assert.match(llmsFull, /## Glossary/);
  const llms = fs.readFileSync(path.join(dist, "llms.txt"), "utf8");
  assert.match(llms, /## Glossary/);
});

test("narrative routes publish per-page FAQ blocks and typed JSON-LD", () => {
  const expected = {
    "products/index.html": [/"@type":"ItemList"/, /id="faq"/, /"@type":"FAQPage"/],
    "platform/index.html": [/"@type":"SoftwareApplication"/, /id="faq"/],
    "pricing/index.html": [/"@type":"OfferCatalog"/, /id="faq"/],
    "methodology/index.html": [/"@type":"Article"/, /id="faq"/],
    "datasets/index.html": [/"@type":"Dataset"/, /id="faq"/],
    "company/index.html": [/"@type":"AboutPage"/, /id="faq"/],
    "developers/index.html": [/"@type":"FAQPage"/, /id="faq"/]
  };
  for (const [route, patterns] of Object.entries(expected)) {
    const html = fs.readFileSync(path.join(dist, route), "utf8");
    for (const pattern of patterns) assert.match(html, pattern, `${route} matches ${pattern}`);
  }
});

test("custom 404 recovery page exists with machine-readable links", () => {
  const html = fs.readFileSync(path.join(dist, "404.html"), "utf8");
  assert.match(html, /name="robots" content="noindex/);
  assert.match(html, /href="\/llms\.txt"/);
  assert.match(html, /href="\/api"/);
  assert.match(html, /"@type":"WebPage"/);
});

test("local pages publish full SEO heads with canonical, OG, and WebPage JSON-LD", () => {
  for (const route of routes.localPages) {
    const html = fs.readFileSync(path.join(dist, route.output), "utf8");
    assert.match(html, new RegExp(`<link rel="canonical" href="https://${routes.canonicalDomain}${route.path}"`));
    assert.match(html, /<meta name="robots" content="index, follow/);
    assert.match(html, /<meta property="og:title"/);
    assert.match(html, /<meta property="og:url"/);
    assert.match(html, /application\/ld\+json/);
    assert.match(html, /"WebPage"/);
    assert.match(html, /rel="manifest" href="\/site\.webmanifest"/);
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
  assert.ok(oauthAs.agent_auth && typeof oauthAs.agent_auth === "object");
  assert.equal(oauthAs.agent_auth.skill, "https://monarchcastle.com/auth.md");
  assert.equal(oauthAs.agent_auth.register_uri, "https://monarchcastle.com/auth.md");
  assert.equal(oauthAs.agent_auth.claim_uri, "https://monarchcastle.com/auth.md");
  assert.ok(Array.isArray(oauthAs.agent_auth.identity_types_supported) && oauthAs.agent_auth.identity_types_supported.length > 0);
  assert.ok(oauthAs.agent_auth.anonymous && Array.isArray(oauthAs.agent_auth.anonymous.credential_types_supported) && oauthAs.agent_auth.anonymous.credential_types_supported.length > 0);
  assert.equal(oauthAs.agent_auth.anonymous.claim_uri, "https://monarchcastle.com/auth.md");
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
  for (const iface of card.supportedInterfaces) {
    assert.ok(typeof iface.url === "string" && iface.url.startsWith("https://"), `interface url present: ${iface.protocol}`);
    assert.ok(iface.transport, `interface transport present: ${iface.protocol}`);
  }
});

test("root homepage follows the governed shell and links to canonical dashboard paths", () => {
  const html = fs.readFileSync(path.join(dist, "index.html"), "utf8");
  assert.match(html, /href="\/sdcofa\/bnti\/"/);

  assert.match(html, /href="\/sdcofa\/wti\/"/);
  assert.match(html, /href="\/sdcofa\/mena\/"/);
  assert.match(html, /href="\/styles\/site\.css"/);
  assert.match(html, /Know how global change reaches your business/);
  assert.match(html, /Public instruments remain open/);
  assert.match(html, /href="\/platform\/"/);
  assert.match(html, /src="\/assets\/brand\/exposure-field\.svg"/);
  assert.match(html, /href="\/styles\/identity\.css"/);
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
    "assets/brand/exposure-field.svg",
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
