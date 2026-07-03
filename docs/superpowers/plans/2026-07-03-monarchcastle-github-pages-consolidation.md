# Monarch Castle GitHub Pages Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a GitHub Pages-hosted `monarchcastle.tech` site with a merged Monarch Castle homepage and full dashboards served at `/bnti/`, `/wti/`, and `/mena/`.

**Architecture:** Create one static-site repository that builds a `dist/` artifact for GitHub Pages. The root site is authored locally from Monarch Castle content and assets, while dashboard subpaths are synced from the existing public GitHub repositories, copied into route folders, and rewritten so root-relative assets work under subpaths.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Node.js scripts using built-in modules only for the build pipeline, Node's built-in test runner, optional Playwright browser smoke tests, GitHub Actions, GitHub Pages.

## Global Constraints

- Host the canonical site on GitHub Pages.
- Use `monarchcastle.tech` as the canonical custom domain.
- Serve full dashboards directly under `/bnti/`, `/wti/`, and `/mena/`; do not make those paths redirects.
- Preserve the existing GitHub-hosted operating model and avoid paid hosting.
- Include `CNAME` containing exactly `monarchcastle.tech` in the published artifact.
- Do not rebuild dashboard data pipelines in this version.
- Configure DNS with GitHub Pages apex `A` records and `www` CNAME after GitHub Pages is configured.
- Keep source dashboard repositories as upstream inputs: `SDCofA/border-neighbor-threat-index`, `SDCofA/world-threat-index`, and `SDCofA/mena-threat-index`.
- Keep the merged homepage grounded in the theme/live sections from `akgularda/monarch-castle-technologies` and the product/logo catalog from `monarchcastletech/monarchcastletech.github.io`.

---

## Scope Check

This is one static-site consolidation project. It contains content, dashboard mounting, deployment, and DNS handoff, but all work feeds one independently testable deliverable: `monarchcastle.tech` served from a single GitHub Pages artifact.

## File Structure

- `package.json`: npm scripts for test, sync, build, verify, and preview.
- `.gitignore`: excludes generated build artifacts and upstream caches.
- `.nojekyll`: disables Jekyll processing for copied dashboard assets.
- `site.routes.json`: route contract for upstream dashboard mounts and local pages.
- `public/CNAME`: canonical GitHub Pages custom domain.
- `src/content/site.json`: homepage/product/nav content used by tests and rendering.
- `src/pages/index.html`: merged Monarch Castle root page.
- `src/pages/tools.html`: local tools page from Monarch Castle Technologies.
- `src/pages/mcp.html`: local MCP catalog page.
- `src/pages/sdcofa.html`: local SDCofA landing page.
- `src/styles/site.css`: shared corporate visual system.
- `src/scripts/live-panels.js`: live homepage panels that read dashboard JSON from subpaths.
- `scripts/lib/static-rewrite.mjs`: pure functions for rewriting copied static dashboards.
- `scripts/sync-upstreams.mjs`: clones or refreshes public upstream repositories into `.cache/upstreams`.
- `scripts/build-site.mjs`: builds `dist/` from local pages, assets, and upstream dashboards.
- `scripts/verify-dist.mjs`: verifies route files, CNAME, links, and dashboard data paths.
- `.github/workflows/pages.yml`: GitHub Pages deployment workflow.
- `tests/*.test.mjs`: Node unit test suite for route contract, rewrite logic, content requirements, and workflow configuration.
- `tests/*.dist.test.mjs`: Node built-artifact test suite that expects `dist/` to exist.
- `tests/browser/site-smoke.spec.mjs`: optional Playwright smoke checks against a local preview server.
- `docs/deployment/github-pages-dns.md`: registrar and GitHub Pages settings handoff.

---

### Task 1: Static Project Scaffold And Route Contract

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `.nojekyll`
- Create: `public/CNAME`
- Create: `site.routes.json`
- Create: `tests/route-contract.test.mjs`

**Interfaces:**
- Produces: `site.routes.json` with `localPages`, `dashboardMounts`, and `assets` arrays.
- Produces: npm scripts `test`, `sync`, `build`, `verify`, and `preview`.
- Consumes: no earlier task output.

- [ ] **Step 1: Write the failing route-contract test**

Create `tests/route-contract.test.mjs`:

```javascript
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
  assert.equal(pages.home.path, "/");
  assert.equal(pages.tools.path, "/tools/");
  assert.equal(pages.mcp.path, "/mcp/");
  assert.equal(pages.sdcofa.path, "/sdcofa/");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
node --test tests/route-contract.test.mjs
```

Expected: FAIL with `ENOENT` for `site.routes.json` or `public/CNAME`.

- [ ] **Step 3: Create the scaffold files**

Create `package.json`:

```json
{
  "name": "monarchcastle-tech",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test tests/*.test.mjs",
    "test:dist": "node --test tests/*.dist.test.mjs",
    "sync": "node scripts/sync-upstreams.mjs",
    "build": "node scripts/build-site.mjs",
    "verify": "npm run sync && npm run build && npm test && npm run test:dist && node scripts/verify-dist.mjs",
    "preview": "npx serve dist -l 4173"
  },
  "engines": {
    "node": ">=20"
  }
}
```

Create `.gitignore`:

```gitignore
dist/
.cache/
node_modules/
playwright-report/
test-results/
npm-debug.log*
```

Create `.nojekyll` as an empty file.

Create `public/CNAME`:

```text
monarchcastle.tech
```

Create `site.routes.json`:

```json
{
  "canonicalDomain": "monarchcastle.tech",
  "upstreams": {
    "theme": "https://github.com/akgularda/monarch-castle-technologies.git",
    "products": "https://github.com/monarchcastletech/monarchcastletech.github.io.git",
    "bnti": "https://github.com/SDCofA/border-neighbor-threat-index.git",
    "wti": "https://github.com/SDCofA/world-threat-index.git",
    "mena": "https://github.com/SDCofA/mena-threat-index.git"
  },
  "localPages": [
    { "slug": "home", "path": "/", "source": "src/pages/index.html", "output": "index.html" },
    { "slug": "tools", "path": "/tools/", "source": "src/pages/tools.html", "output": "tools/index.html" },
    { "slug": "mcp", "path": "/mcp/", "source": "src/pages/mcp.html", "output": "mcp/index.html" },
    { "slug": "sdcofa", "path": "/sdcofa/", "source": "src/pages/sdcofa.html", "output": "sdcofa/index.html" }
  ],
  "dashboardMounts": [
    {
      "slug": "bnti",
      "label": "Border Neighbor Threat Index",
      "path": "/bnti/",
      "repoKey": "bnti",
      "dataFile": "bnti_data.json"
    },
    {
      "slug": "wti",
      "label": "World Threat Index",
      "path": "/wti/",
      "repoKey": "wti",
      "dataFile": "wti_data.json"
    },
    {
      "slug": "mena",
      "label": "MENA Threat Index",
      "path": "/mena/",
      "repoKey": "mena",
      "dataFile": "mena_data.json"
    }
  ],
  "assets": [
    { "fromRepo": "products", "from": "assets", "to": "assets/products" },
    { "fromRepo": "theme", "from": "assets", "to": "assets/theme" }
  ]
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:

```bash
npm test
```

Expected: PASS for three route-contract tests.

- [ ] **Step 5: Commit**

```bash
git add package.json .gitignore .nojekyll public/CNAME site.routes.json tests/route-contract.test.mjs
git commit -m "chore: scaffold Monarch Castle static site"
```

---

### Task 2: Dashboard Rewrite Library

**Files:**
- Create: `scripts/lib/static-rewrite.mjs`
- Create: `tests/static-rewrite.test.mjs`

**Interfaces:**
- Consumes: mount objects from `site.routes.json`, specifically `slug` and `path`.
- Produces: `rewriteStaticContent(content: string, mountPath: string): string`.
- Produces: `shouldCopyStaticFile(relativePath: string): boolean`.

- [ ] **Step 1: Write failing rewrite tests**

Create `tests/static-rewrite.test.mjs`:

```javascript
import assert from "node:assert/strict";
import test from "node:test";
import { rewriteStaticContent, shouldCopyStaticFile } from "../scripts/lib/static-rewrite.mjs";

test("rewrites root-relative HTML assets into the dashboard mount path", () => {
  const html = '<link href="/css/app.css"><script src="/js/core.js"></script><img src="/assets/logo.png">';
  const rewritten = rewriteStaticContent(html, "/bnti/");
  assert.equal(rewritten, '<link href="/bnti/css/app.css"><script src="/bnti/js/core.js"></script><img src="/bnti/assets/logo.png">');
});

test("keeps external URLs and already-mounted paths unchanged", () => {
  const html = '<a href="https://github.com/SDCofA/border-neighbor-threat-index">Repo</a><a href="/bnti/methodology.pdf">Method</a>';
  assert.equal(rewriteStaticContent(html, "/bnti/"), html);
});

test("rewrites CSS url references that start at site root", () => {
  const css = 'body{background:url("/assets/bg.png")} .seal{background:url(/icon.png)}';
  assert.equal(rewriteStaticContent(css, "/wti/"), 'body{background:url("/wti/assets/bg.png")} .seal{background:url(/wti/icon.png)}');
});

test("copies web assets and dashboard data, skips source-control and Python pipeline files", () => {
  assert.equal(shouldCopyStaticFile("index.html"), true);
  assert.equal(shouldCopyStaticFile("css/app.css"), true);
  assert.equal(shouldCopyStaticFile("bnti_data.json"), true);
  assert.equal(shouldCopyStaticFile("methodology.pdf"), true);
  assert.equal(shouldCopyStaticFile(".git/config"), false);
  assert.equal(shouldCopyStaticFile(".github/workflows/update.yml"), false);
  assert.equal(shouldCopyStaticFile("borderneighboursthreatindex.py"), false);
  assert.equal(shouldCopyStaticFile("requirements.txt"), false);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm test
```

Expected: FAIL with `Cannot find module '../scripts/lib/static-rewrite.mjs'`.

- [ ] **Step 3: Implement the rewrite library**

Create `scripts/lib/static-rewrite.mjs`:

```javascript
const TEXT_EXTENSIONS = new Set([".html", ".css", ".js", ".json", ".webmanifest", ".svg", ".txt", ".md"]);
const STATIC_EXTENSIONS = new Set([
  ".html", ".css", ".js", ".json", ".csv", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg",
  ".ico", ".pdf", ".txt", ".webmanifest", ".woff", ".woff2", ".ttf", ".map"
]);
const SKIP_PREFIXES = [".git/", ".github/", ".agent/", "__pycache__/", "docs/", "PythontoExcelandPowerBI/"];
const SKIP_EXTENSIONS = new Set([".py", ".tex", ".xlsx", ".bib"]);
const SKIP_FILENAMES = new Set(["requirements.txt", ".gitignore"]);

export function extensionOf(relativePath) {
  const index = relativePath.lastIndexOf(".");
  return index === -1 ? "" : relativePath.slice(index).toLowerCase();
}

export function isTextAsset(relativePath) {
  return TEXT_EXTENSIONS.has(extensionOf(relativePath));
}

export function shouldCopyStaticFile(relativePath) {
  const normalized = relativePath.replaceAll("\\\\", "/");
  if (SKIP_PREFIXES.some((prefix) => normalized === prefix.slice(0, -1) || normalized.startsWith(prefix))) {
    return false;
  }
  const filename = normalized.split("/").pop();
  if (SKIP_FILENAMES.has(filename)) return false;
  const ext = extensionOf(normalized);
  if (SKIP_EXTENSIONS.has(ext)) return false;
  return STATIC_EXTENSIONS.has(ext);
}

export function rewriteStaticContent(content, mountPath) {
  const cleanMount = mountPath.endsWith("/") ? mountPath.slice(0, -1) : mountPath;
  const rewritePath = (rawPath) => {
    if (!rawPath.startsWith("/")) return rawPath;
    if (rawPath.startsWith(`${cleanMount}/`)) return rawPath;
    if (/^\\/\\//.test(rawPath)) return rawPath;
    return `${cleanMount}${rawPath}`;
  };

  return content
    .replace(/(href|src)=("|')\\/(?!\\/)([^"']+)/g, (_match, attr, quote, rest) => `${attr}=${quote}${rewritePath(`/${rest}`)}`)
    .replace(/url\\(("?)\\/(?!\\/)([^)"']+)\\1\\)/g, (_match, quote, rest) => `url(${quote}${rewritePath(`/${rest}`)}${quote})`);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:

```bash
npm test
```

Expected: PASS for route-contract and static-rewrite tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/static-rewrite.mjs tests/static-rewrite.test.mjs
git commit -m "test: add dashboard path rewrite contract"
```

---

### Task 3: Upstream Sync And Build Pipeline

**Files:**
- Create: `scripts/sync-upstreams.mjs`
- Create: `scripts/build-site.mjs`
- Create: `scripts/verify-dist.mjs`
- Create: `src/pages/index.html`
- Create: `src/pages/tools.html`
- Create: `src/pages/mcp.html`
- Create: `src/pages/sdcofa.html`
- Create: `src/styles/site.css`
- Create: `src/scripts/live-panels.js`
- Create: `tests/build-output.dist.test.mjs`

**Interfaces:**
- Consumes: `site.routes.json`.
- Consumes: `rewriteStaticContent`, `isTextAsset`, and `shouldCopyStaticFile` from `scripts/lib/static-rewrite.mjs`.
- Produces: `dist/` with `index.html`, `tools/index.html`, `mcp/index.html`, `sdcofa/index.html`, `bnti/index.html`, `wti/index.html`, `mena/index.html`, dashboard data files, `.nojekyll`, and `CNAME`.

- [ ] **Step 1: Write failing build-output tests**

Create `tests/build-output.dist.test.mjs`:

```javascript
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = new URL("..", import.meta.url).pathname;
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
  assert.match(html, /href="\\/bnti\\/"/);
  assert.match(html, /href="\\/wti\\/"/);
  assert.match(html, /href="\\/mena\\/"/);
  assert.doesNotMatch(html, /sdcofa\\.github\\.io\\/border-neighbor-threat-index/);
});
```

- [ ] **Step 2: Run tests to verify build test fails**

Run:

```bash
npm run test:dist
```

Expected: FAIL because `dist/CNAME` and page files do not exist.

- [ ] **Step 3: Create minimal local pages**

Create `src/pages/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Monarch Castle Technologies</title>
    <meta name="description" content="Sovereign decision intelligence and public operating instruments from Monarch Castle Technologies.">
    <link rel="stylesheet" href="/styles/site.css">
    <script defer src="/scripts/live-panels.js"></script>
  </head>
  <body>
    <header class="site-header">
      <a class="brand" href="/" aria-label="Monarch Castle Technologies home">
        <img src="/assets/products/logo.png" alt="">
        <span>MONARCH CASTLE</span>
      </a>
      <nav aria-label="Primary">
        <a href="/bnti/">BNTI</a>
        <a href="/wti/">WTI</a>
        <a href="/mena/">MENA</a>
        <a href="/tools/">Tools</a>
        <a href="/mcp/">MCP</a>
        <a href="/sdcofa/">SDCofA</a>
      </nav>
    </header>
    <main>
      <section class="hero">
        <p class="eyebrow">Sovereign decision intelligence · Ankara</p>
        <h1>Intelligence for institutions that cannot afford to be surprised.</h1>
        <p>Monarch Castle turns open, public, messy signal into defensible operating surfaces: scored by fixed doctrine, carrying provenance, and published as instruments you can inspect.</p>
        <div class="actions">
          <a class="button primary" href="/bnti/">Open BNTI</a>
          <a class="button" href="/wti/">Open WTI</a>
          <a class="button" href="/mena/">Open MENA</a>
        </div>
      </section>
      <section class="live-grid" aria-label="Live instruments">
        <article class="live-card" data-live-panel="bnti" data-data-url="/bnti/bnti_data.json">
          <p>BNTI · Border Neighbor Threat Index</p>
          <strong data-value>Loading</strong>
          <span data-status>Reading public snapshot</span>
          <a href="/bnti/">Open full dashboard</a>
        </article>
        <article class="live-card" data-live-panel="wti" data-data-url="/wti/wti_data.json">
          <p>WTI · World Threat Index</p>
          <strong data-value>Loading</strong>
          <span data-status>Reading public snapshot</span>
          <a href="/wti/">Open full dashboard</a>
        </article>
        <article class="live-card" data-live-panel="mena" data-data-url="/mena/mena_data.json">
          <p>MENA · Threat Index</p>
          <strong data-value>Loading</strong>
          <span data-status>Reading public snapshot</span>
          <a href="/mena/">Open full dashboard</a>
        </article>
      </section>
      <section class="section">
        <p class="eyebrow">The Keep</p>
        <h2>One engine underneath every instrument.</h2>
        <div class="process-grid">
          <article><span>01</span><h3>Collect</h3><p>Open-source feeds, filings, public records, and disclosures enter with source context preserved.</p></article>
          <article><span>02</span><h3>Classify</h3><p>Signals are shaped into stable categories before any score is calculated.</p></article>
          <article><span>03</span><h3>Score</h3><p>Fixed arithmetic turns classified signal into repeatable numbers.</p></article>
          <article><span>04</span><h3>Publish</h3><p>Dashboards publish only when the snapshot passes validation.</p></article>
        </div>
      </section>
      <section class="section">
        <p class="eyebrow">Product lines</p>
        <h2>Focused tools for high-friction decisions.</h2>
        <div class="product-grid">
          <article><h3>Defense Intelligence</h3><p>BNTI, WTI, MENA, and preparedness instruments for contested operating environments.</p></article>
          <article><h3>Financial Intelligence</h3><p>Market weather, macro exposure, and supply-chain context for directional risk work.</p></article>
          <article><h3>Sustainability Intelligence</h3><p>Spatial public-data tools for energy, carbon, environment, and ESG incident assessment.</p></article>
          <article><h3>Agent Distribution</h3><p>MCP-ready catalogs that make public tools discoverable to agent workflows.</p></article>
        </div>
      </section>
    </main>
    <footer>
      <span>Monarch Castle Technologies · Ankara</span>
      <a href="/sdcofa/">Strategic Data Company of Ankara</a>
    </footer>
  </body>
</html>
```

Create `src/pages/tools.html`, `src/pages/mcp.html`, and `src/pages/sdcofa.html` using the same header/nav/footer structure, with page-specific `<main>` content:

```html
<section class="hero compact">
  <p class="eyebrow">Free intelligence tool bench</p>
  <h1>Calculators for repeatable risk thinking.</h1>
  <p>Browser-only deterministic tools for country risk, supply-chain exposure, ESG incident severity, market weather, and source reliability.</p>
</section>
```

```html
<section class="hero compact">
  <p class="eyebrow">MCP-ready distribution</p>
  <h1>Tool packs that agents can discover before servers exist.</h1>
  <p>Static catalog records and starter server specifications for Monarch Castle tools.</p>
</section>
```

```html
<section class="hero compact">
  <p class="eyebrow">Institutional data subsidiary</p>
  <h1>Strategic Data Company of Ankara.</h1>
  <p>SDCofA publishes standing open-source threat indices with traceable inputs, fixed scoring doctrine, and scheduled refresh cycles.</p>
  <div class="actions">
    <a class="button primary" href="/bnti/">BNTI</a>
    <a class="button" href="/wti/">WTI</a>
    <a class="button" href="/mena/">MENA</a>
  </div>
</section>
```

Create `src/styles/site.css`:

```css
:root {
  color-scheme: dark;
  --ink: #f3efe4;
  --muted: #b8b3a7;
  --line: rgba(243, 239, 228, 0.18);
  --panel: rgba(15, 28, 42, 0.78);
  --navy: #071522;
  --gold: #d7b46a;
  --green: #77d39a;
}

* { box-sizing: border-box; }
html { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: var(--navy); color: var(--ink); }
body { margin: 0; min-height: 100vh; background: radial-gradient(circle at 70% 10%, rgba(215, 180, 106, 0.16), transparent 34rem), linear-gradient(135deg, #071522, #111717 60%, #141006); }
a { color: inherit; }
.site-header, footer { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem clamp(1rem, 4vw, 4rem); border-bottom: 1px solid var(--line); }
footer { border-top: 1px solid var(--line); border-bottom: 0; color: var(--muted); }
.brand { display: inline-flex; align-items: center; gap: 0.75rem; text-decoration: none; font-weight: 800; letter-spacing: 0.08em; }
.brand img { width: 2.5rem; height: 2.5rem; object-fit: contain; }
nav { display: flex; gap: 1rem; flex-wrap: wrap; color: var(--muted); }
nav a, footer a { text-decoration: none; }
main { width: min(1180px, calc(100% - 2rem)); margin: 0 auto; }
.hero { min-height: 72vh; display: grid; align-content: center; gap: 1.5rem; padding: clamp(3rem, 8vw, 7rem) 0; }
.hero.compact { min-height: auto; padding-bottom: 3rem; }
.eyebrow { margin: 0; color: var(--gold); text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.8rem; }
h1, h2, h3, p { margin-top: 0; }
h1 { max-width: 840px; font-size: clamp(2.5rem, 7vw, 5.8rem); line-height: 0.95; letter-spacing: 0; }
h2 { font-size: clamp(2rem, 4vw, 3.5rem); line-height: 1; }
.hero p:not(.eyebrow) { max-width: 720px; color: var(--muted); font-size: 1.15rem; line-height: 1.7; }
.actions, .live-grid, .process-grid, .product-grid { display: grid; gap: 1rem; }
.actions { grid-template-columns: repeat(auto-fit, minmax(9rem, max-content)); }
.button { display: inline-flex; align-items: center; justify-content: center; min-height: 2.75rem; padding: 0 1rem; border: 1px solid var(--line); border-radius: 0.25rem; text-decoration: none; color: var(--ink); }
.button.primary { background: var(--gold); color: #10100c; border-color: var(--gold); font-weight: 800; }
.live-grid, .process-grid, .product-grid { grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); }
.live-card, .process-grid article, .product-grid article { border: 1px solid var(--line); border-radius: 0.5rem; padding: 1.25rem; background: var(--panel); }
.live-card strong { display: block; font-size: 2.5rem; line-height: 1; margin: 0.7rem 0; }
.live-card span { color: var(--green); display: block; min-height: 1.4rem; }
.live-card a { display: inline-block; margin-top: 1rem; color: var(--gold); text-decoration: none; }
.section { padding: clamp(3rem, 7vw, 6rem) 0; border-top: 1px solid var(--line); }
.process-grid span { color: var(--gold); font-weight: 800; }
.process-grid p, .product-grid p { color: var(--muted); line-height: 1.65; }
@media (max-width: 760px) {
  .site-header, footer { align-items: flex-start; flex-direction: column; }
  h1 { font-size: clamp(2.4rem, 16vw, 4.5rem); }
}
```

Create `src/scripts/live-panels.js`:

```javascript
function readIndexValue(data) {
  return data.composite_index ?? data.composite ?? data.mainIndex ?? data.index ?? data.score ?? null;
}

function readStatus(data) {
  return data.status ?? data.statusLabel ?? data.tier ?? data.classification ?? "LIVE";
}

async function hydratePanel(panel) {
  const url = panel.dataset.dataUrl;
  const valueNode = panel.querySelector("[data-value]");
  const statusNode = panel.querySelector("[data-status]");
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const value = readIndexValue(data);
    valueNode.textContent = value == null ? "Live" : `${Number(value).toFixed(1)} /10`;
    statusNode.textContent = readStatus(data);
  } catch {
    valueNode.textContent = "Open";
    statusNode.textContent = "Dashboard available";
  }
}

document.querySelectorAll("[data-live-panel]").forEach((panel) => {
  hydratePanel(panel);
});
```

- [ ] **Step 4: Implement upstream sync**

Create `scripts/sync-upstreams.mjs`:

```javascript
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const routes = JSON.parse(fs.readFileSync(path.join(root, "site.routes.json"), "utf8"));
const cacheRoot = path.join(root, ".cache", "upstreams");

function run(command, args, cwd = root) {
  const result = spawnSync(command, args, { cwd, stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed`);
}

fs.mkdirSync(cacheRoot, { recursive: true });

for (const [key, url] of Object.entries(routes.upstreams)) {
  const target = path.join(cacheRoot, key);
  if (!fs.existsSync(path.join(target, ".git"))) {
    run("git", ["clone", "--depth", "1", url, target]);
  } else {
    run("git", ["fetch", "--depth", "1", "origin", "main"], target);
    run("git", ["checkout", "FETCH_HEAD"], target);
  }
}
```

- [ ] **Step 5: Implement build and verification scripts**

Create `scripts/build-site.mjs`:

```javascript
import fs from "node:fs";
import path from "node:path";
import { isTextAsset, rewriteStaticContent, shouldCopyStaticFile } from "./lib/static-rewrite.mjs";

const root = process.cwd();
const routes = JSON.parse(fs.readFileSync(path.join(root, "site.routes.json"), "utf8"));
const dist = path.join(root, "dist");
const cacheRoot = path.join(root, ".cache", "upstreams");

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function copyFile(source, target) {
  ensureDir(target);
  fs.copyFileSync(source, target);
}

function copyDirectory(sourceRoot, targetRoot, transformText) {
  for (const entry of fs.readdirSync(sourceRoot, { withFileTypes: true })) {
    const source = path.join(sourceRoot, entry.name);
    const target = path.join(targetRoot, entry.name);
    if (entry.isDirectory()) {
      copyDirectory(source, target, transformText);
      continue;
    }
    const relative = path.relative(sourceRoot, source).replaceAll("\\\\", "/");
    if (!shouldCopyStaticFile(relative)) continue;
    ensureDir(target);
    if (isTextAsset(relative)) {
      fs.writeFileSync(target, transformText(fs.readFileSync(source, "utf8"), relative));
    } else {
      fs.copyFileSync(source, target);
    }
  }
}

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
copyFile(path.join(root, "public", "CNAME"), path.join(dist, "CNAME"));
copyFile(path.join(root, ".nojekyll"), path.join(dist, ".nojekyll"));

for (const page of routes.localPages) {
  copyFile(path.join(root, page.source), path.join(dist, page.output));
}

fs.cpSync(path.join(root, "src", "styles"), path.join(dist, "styles"), { recursive: true });
fs.cpSync(path.join(root, "src", "scripts"), path.join(dist, "scripts"), { recursive: true });

for (const asset of routes.assets) {
  const source = path.join(cacheRoot, asset.fromRepo, asset.from);
  if (fs.existsSync(source)) {
    fs.cpSync(source, path.join(dist, asset.to), { recursive: true });
  }
}

for (const mount of routes.dashboardMounts) {
  const upstreamRoot = path.join(cacheRoot, mount.repoKey);
  const targetRoot = path.join(dist, mount.slug);
  if (!fs.existsSync(upstreamRoot)) {
    throw new Error(`Missing upstream checkout for ${mount.repoKey}; run npm run sync`);
  }
  copyDirectory(upstreamRoot, targetRoot, (content) => rewriteStaticContent(content, mount.path));
}
```

Create `scripts/verify-dist.mjs`:

```javascript
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const routes = JSON.parse(fs.readFileSync(path.join(root, "site.routes.json"), "utf8"));
const dist = path.join(root, "dist");

assert.equal(fs.readFileSync(path.join(dist, "CNAME"), "utf8").trim(), "monarchcastle.tech");

for (const page of routes.localPages) {
  assert.equal(fs.existsSync(path.join(dist, page.output)), true, `${page.output} exists`);
}

for (const mount of routes.dashboardMounts) {
  assert.equal(fs.existsSync(path.join(dist, mount.slug, "index.html")), true, `${mount.slug}/index.html exists`);
  assert.equal(fs.existsSync(path.join(dist, mount.slug, mount.dataFile)), true, `${mount.slug}/${mount.dataFile} exists`);
  const html = fs.readFileSync(path.join(dist, mount.slug, "index.html"), "utf8");
  assert.equal(html.includes('href="/css/'), false, `${mount.slug} has no root css href`);
  assert.equal(html.includes('src="/js/'), false, `${mount.slug} has no root js src`);
}

console.log("dist verification passed");
```

- [ ] **Step 6: Run sync, build, and tests**

Run:

```bash
npm run sync
npm run build
npm test
npm run test:dist
node scripts/verify-dist.mjs
```

Expected: upstream repositories clone into `.cache/upstreams`; all Node tests pass; `dist verification passed`.

- [ ] **Step 7: Commit**

```bash
git add scripts src tests package.json site.routes.json
git commit -m "feat: build consolidated GitHub Pages artifact"
```

---

### Task 4: Homepage Content Polish And Canonical Internal Links

**Files:**
- Create: `src/content/site.json`
- Modify: `src/pages/index.html`
- Modify: `src/pages/tools.html`
- Modify: `src/pages/mcp.html`
- Modify: `src/pages/sdcofa.html`
- Modify: `src/styles/site.css`
- Create: `tests/homepage-content.test.mjs`

**Interfaces:**
- Consumes: canonical paths from `site.routes.json`.
- Produces: root page content that merges the approved source-site roles.

- [ ] **Step 1: Write failing content tests**

Create `tests/homepage-content.test.mjs`:

```javascript
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const html = fs.readFileSync(new URL("../src/pages/index.html", import.meta.url), "utf8");

test("homepage keeps sovereign decision intelligence theme", () => {
  assert.match(html, /Sovereign decision intelligence/);
  assert.match(html, /The Keep/);
  assert.match(html, /defensible operating surfaces/);
});

test("homepage exposes products and live instruments at canonical paths", () => {
  for (const path of ["/bnti/", "/wti/", "/mena/", "/tools/", "/mcp/", "/sdcofa/"]) {
    assert.match(html, new RegExp(`href="${path}"`));
  }
  for (const label of ["BNTI", "WTI", "MENA", "Defense Intelligence", "Financial Intelligence", "Sustainability Intelligence"]) {
    assert.match(html, new RegExp(label));
  }
});

test("homepage does not make GitHub Pages dashboard URLs primary navigation", () => {
  assert.doesNotMatch(html, /href="https:\\/\\/sdcofa\\.github\\.io\\/border-neighbor-threat-index\\//);
  assert.doesNotMatch(html, /href="https:\\/\\/sdcofa\\.github\\.io\\/world-threat-index\\//);
  assert.doesNotMatch(html, /href="https:\\/\\/sdcofa\\.github\\.io\\/mena-threat-index\\//);
});
```

- [ ] **Step 2: Run tests to capture current failures**

Run:

```bash
npm test
```

Expected: FAIL only for missing copy or canonical product labels that are absent from the initial page.

- [ ] **Step 3: Add structured content source**

Create `src/content/site.json`:

```json
{
  "brand": "Monarch Castle Technologies",
  "domain": "monarchcastle.tech",
  "thesis": "Sovereign decision intelligence for institutions that cannot afford to be surprised.",
  "engine": "The Keep",
  "instruments": [
    {
      "label": "BNTI",
      "name": "Border Neighbor Threat Index",
      "division": "Defense Intelligence",
      "path": "/bnti/",
      "data": "/bnti/bnti_data.json",
      "description": "Türkiye border-neighbor threat posture across seven land neighbors."
    },
    {
      "label": "WTI",
      "name": "World Threat Index",
      "division": "Defense Intelligence",
      "path": "/wti/",
      "data": "/wti/wti_data.json",
      "description": "Global geopolitical pressure readings across countries and blocs."
    },
    {
      "label": "MENA",
      "name": "MENA Threat Index",
      "division": "Defense Intelligence",
      "path": "/mena/",
      "data": "/mena/mena_data.json",
      "description": "Regional risk assessment for the Middle East and North Africa."
    }
  ],
  "productLines": [
    "Defense Intelligence",
    "Financial Intelligence",
    "Supply Chain Intelligence",
    "Sustainability Intelligence",
    "Energy Intelligence",
    "Agent Distribution"
  ]
}
```

- [ ] **Step 4: Polish local pages against the structured content**

Update `src/pages/index.html` so it contains the exact labels from `src/content/site.json`, links only to canonical subpaths for public dashboards, and retains repository/source links only in body copy or footer text.

Update `src/pages/tools.html` so it includes these five tools as visible sections:

```text
Country Risk Score Calculator
Supply Chain Exposure Calculator
ESG Incident Severity Calculator
Market Weather Checklist
OSINT Source Reliability Scorer
```

Update `src/pages/mcp.html` so it includes these MCP catalog entries:

```text
mct.risk_calculators
mct.sdcofa_almanac_bridge
mct.static_publisher
```

Update `src/pages/sdcofa.html` so it describes SDCofA and links to `/bnti/`, `/wti/`, and `/mena/` as first-class routes.

- [ ] **Step 5: Run verification**

Run:

```bash
npm run sync
npm run build
npm test
node scripts/verify-dist.mjs
```

Expected: all tests pass; `dist/index.html` has canonical links; no dashboard primary CTA points to `sdcofa.github.io`.

- [ ] **Step 6: Commit**

```bash
git add src/content src/pages src/styles tests/homepage-content.test.mjs
git commit -m "feat: merge Monarch Castle homepage content"
```

---

### Task 5: GitHub Pages Deployment Workflow

**Files:**
- Create: `.github/workflows/pages.yml`
- Create: `docs/deployment/github-pages-dns.md`
- Create: `tests/workflow-config.test.mjs`

**Interfaces:**
- Consumes: `npm run sync`, `npm run build`, and `node scripts/verify-dist.mjs`.
- Produces: GitHub Pages deployment artifact from `dist/`.

- [ ] **Step 1: Write failing workflow test**

Create `tests/workflow-config.test.mjs`:

```javascript
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const workflowPath = new URL("../.github/workflows/pages.yml", import.meta.url);

test("GitHub Pages workflow builds and deploys dist artifact", () => {
  const workflow = fs.readFileSync(workflowPath, "utf8");
  assert.match(workflow, /actions\\/configure-pages@/);
  assert.match(workflow, /npm run sync/);
  assert.match(workflow, /npm run build/);
  assert.match(workflow, /node scripts\\/verify-dist\\.mjs/);
  assert.match(workflow, /actions\\/upload-pages-artifact@/);
  assert.match(workflow, /actions\\/deploy-pages@/);
  assert.match(workflow, /path: dist/);
});
```

- [ ] **Step 2: Run tests to verify workflow file is missing**

Run:

```bash
npm test
```

Expected: FAIL with `ENOENT` for `.github/workflows/pages.yml`.

- [ ] **Step 3: Create the GitHub Pages workflow**

Create `.github/workflows/pages.yml`:

```yaml
name: Deploy Monarch Castle site

on:
  push:
    branches: [main, master]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Configure Pages
        uses: actions/configure-pages@v5
      - name: Sync upstream static sites
        run: npm run sync
      - name: Build site
        run: npm run build
      - name: Run unit tests
        run: npm test
      - name: Run built-artifact tests
        run: npm run test:dist
      - name: Verify dist
        run: node scripts/verify-dist.mjs
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 4: Create DNS handoff documentation**

Create `docs/deployment/github-pages-dns.md`:

```markdown
# monarchcastle.tech GitHub Pages DNS Handoff

Canonical host: `monarchcastle.tech`

GitHub Pages repository: `monarchcastletech.github.io` unless implementation chooses a different repository with admin access.

## GitHub Settings

1. Open repository Settings.
2. Go to Pages.
3. Set Source to GitHub Actions.
4. Set Custom domain to `monarchcastle.tech`.
5. Wait for DNS check to pass.
6. Enable Enforce HTTPS when GitHub allows it.

## Registrar DNS Records

Remove default parking records that conflict with the apex or `www`.

Create these apex `A` records:

| Type | Host | Value |
| --- | --- | --- |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |

Optional IPv6 records:

| Type | Host | Value |
| --- | --- | --- |
| AAAA | @ | 2606:50c0:8000::153 |
| AAAA | @ | 2606:50c0:8001::153 |
| AAAA | @ | 2606:50c0:8002::153 |
| AAAA | @ | 2606:50c0:8003::153 |

Create the `www` record:

| Type | Host | Value |
| --- | --- | --- |
| CNAME | www | monarchcastletech.github.io |

Do not create wildcard records for `*.monarchcastle.tech`.

## Verification Commands

```powershell
Resolve-DnsName monarchcastle.tech -Type A
Resolve-DnsName www.monarchcastle.tech -Type CNAME
```

Expected apex `A` answers are the four GitHub Pages IP addresses above. Expected `www` CNAME target is `monarchcastletech.github.io`.
```

- [ ] **Step 5: Run verification**

Run:

```bash
npm test
npm run sync
npm run build
npm run test:dist
node scripts/verify-dist.mjs
```

Expected: all tests pass and deployment workflow test sees the Pages actions.

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/pages.yml docs/deployment/github-pages-dns.md tests/workflow-config.test.mjs
git commit -m "ci: deploy Monarch Castle site to GitHub Pages"
```

---

### Task 6: Browser Smoke Verification And Repository Handoff

**Files:**
- Create: `tests/browser/site-smoke.spec.mjs`
- Modify: `package.json`
- Create: `docs/deployment/repository-handoff.md`

**Interfaces:**
- Consumes: built `dist/` and preview server.
- Produces: browser-level confidence that the root and dashboard subpaths are loadable.

- [ ] **Step 1: Add browser smoke test script**

Modify `package.json` scripts to include:

```json
{
  "scripts": {
    "browser:test": "playwright test tests/browser/site-smoke.spec.mjs"
  }
}
```

Install dev tools:

```bash
npm install --save-dev @playwright/test serve
npx playwright install chromium
```

- [ ] **Step 2: Write browser smoke tests**

Create `tests/browser/site-smoke.spec.mjs`:

```javascript
import { expect, test } from "@playwright/test";

const baseURL = process.env.BASE_URL ?? "http://127.0.0.1:4173";

for (const route of ["/", "/bnti/", "/wti/", "/mena/", "/tools/", "/mcp/", "/sdcofa/"]) {
  test(`${route} loads`, async ({ page }) => {
    const response = await page.goto(`${baseURL}${route}`, { waitUntil: "domcontentloaded" });
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator("body")).toBeVisible();
  });
}

test("homepage exposes canonical dashboard links", async ({ page }) => {
  await page.goto(`${baseURL}/`);
  await expect(page.locator('a[href="/bnti/"]').first()).toBeVisible();
  await expect(page.locator('a[href="/wti/"]').first()).toBeVisible();
  await expect(page.locator('a[href="/mena/"]').first()).toBeVisible();
});
```

- [ ] **Step 3: Run local preview and browser tests**

In terminal A:

```bash
npm run sync
npm run build
npm run preview
```

In terminal B:

```bash
$env:BASE_URL="http://127.0.0.1:4173"
npm run browser:test
```

Expected: all route load tests pass. If a dashboard is visually blank, inspect browser console and fix asset rewrite or copied-file allowlist in `scripts/lib/static-rewrite.mjs`.

- [ ] **Step 4: Create repository handoff document**

Create `docs/deployment/repository-handoff.md`:

```markdown
# Repository Handoff

## Preferred Repository

Use `monarchcastletech/monarchcastletech.github.io` as the canonical GitHub Pages repository when admin access is available.

## Setup Commands

```powershell
git remote add origin https://github.com/monarchcastletech/monarchcastletech.github.io.git
git branch -M main
git push -u origin main
```

If that repository already contains the old site, pull it first, preserve unrelated history, and merge this project as the new root site. Do not overwrite remote history with a force push.

## Pages Settings

Set Pages source to GitHub Actions and custom domain to `monarchcastle.tech`.

## Required Secret State

No runtime secrets are required for the consolidated static site. Dashboard source repositories keep their own data-refresh secrets and workflows.
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json tests/browser/site-smoke.spec.mjs docs/deployment/repository-handoff.md
git commit -m "test: add browser smoke verification"
```

---

### Task 7: Final Deployment Verification

**Files:**
- Modify: `docs/deployment/github-pages-dns.md` if the chosen repository owner differs from `monarchcastletech`.

**Interfaces:**
- Consumes: completed implementation, GitHub remote, Pages workflow, and registrar DNS access.
- Produces: live `https://monarchcastle.tech/` with functional dashboard subpaths.

- [ ] **Step 1: Verify clean local state**

Run:

```bash
git status --short --branch
npm run verify
```

Expected: working tree is clean except intentional untracked local caches; `npm run verify` passes.

- [ ] **Step 2: Push to the canonical GitHub Pages repository**

Run the handoff command for the selected repository. For the preferred repository:

```bash
git remote add origin https://github.com/monarchcastletech/monarchcastletech.github.io.git
git branch -M main
git push -u origin main
```

Expected: push succeeds without force.

- [ ] **Step 3: Configure GitHub Pages**

In GitHub repository settings:

```text
Settings -> Pages -> Source: GitHub Actions
Settings -> Pages -> Custom domain: monarchcastle.tech
```

Expected: GitHub accepts the custom domain and the Pages workflow deploys.

- [ ] **Step 4: Configure registrar DNS**

Use the records in `docs/deployment/github-pages-dns.md`:

```text
A @ 185.199.108.153
A @ 185.199.109.153
A @ 185.199.110.153
A @ 185.199.111.153
CNAME www monarchcastletech.github.io
```

Expected: registrar saves the records. Remove parking/default records that conflict with `@` or `www`.

- [ ] **Step 5: Verify DNS and HTTPS after propagation**

Run:

```powershell
Resolve-DnsName monarchcastle.tech -Type A
Resolve-DnsName www.monarchcastle.tech -Type CNAME
```

Expected: apex returns GitHub Pages IP addresses; `www` returns `monarchcastletech.github.io`.

Open these URLs:

```text
https://monarchcastle.tech/
https://monarchcastle.tech/bnti/
https://monarchcastle.tech/wti/
https://monarchcastle.tech/mena/
```

Expected: each page loads from `monarchcastle.tech`, dashboard routes show the full dashboard surfaces, and browser devtools show no missing local CSS/JS/data assets for the mounted pages.

- [ ] **Step 6: Commit final doc adjustment if repository owner changed**

```bash
git add docs/deployment/github-pages-dns.md
git commit -m "docs: finalize Pages DNS handoff"
```

Run this step only if `docs/deployment/github-pages-dns.md` changed because the selected Pages owner was not `monarchcastletech`.
