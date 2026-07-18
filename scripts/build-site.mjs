import fs from "node:fs";
import path from "node:path";
import { isTextAsset, rewriteStaticContent, shouldCopyStaticFile } from "./lib/static-rewrite.mjs";

const root = process.cwd();
const routes = JSON.parse(fs.readFileSync(path.join(root, "site.routes.json"), "utf8"));
const site = JSON.parse(fs.readFileSync(path.join(root, "src", "content", "site.json"), "utf8"));
const editorial = JSON.parse(fs.readFileSync(path.join(root, "src", "content", "editorial.json"), "utf8"));
const dist = path.join(root, "dist");
const cacheRoot = path.join(root, ".cache", "upstreams");
const canonicalOrigin = `https://${routes.canonicalDomain}`;
const productById = new Map(site.products.map((product) => [product.id, product]));
const flagshipProducts = (site.ownerViews?.MonarchCastleTech ?? [])
  .map((id) => productById.get(id))
  .filter(Boolean);
const endorsedProducts = (site.ownerViews?.SDCofA ?? [])
  .map((id) => productById.get(id))
  .filter(Boolean);
const dashboardPaths = {
  "border-neighbor-threat-index": "/bnti/",
  "world-threat-index": "/wti/",
  "mena-threat-index": "/mena/"
};

function ensureParent(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function copyFile(source, target) {
  ensureParent(target);
  fs.copyFileSync(source, target);
}

function copyDirectory(sourceRoot, targetRoot, transformText, baseRoot = sourceRoot) {
  for (const entry of fs.readdirSync(sourceRoot, { withFileTypes: true })) {
    const source = path.join(sourceRoot, entry.name);
    const target = path.join(targetRoot, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(source, target, transformText, baseRoot);
      continue;
    }

    const relative = path.relative(baseRoot, source).replaceAll("\\", "/");
    if (!shouldCopyStaticFile(relative)) continue;

    ensureParent(target);
    if (isTextAsset(relative)) {
      const content = fs.readFileSync(source, "utf8");
      fs.writeFileSync(target, transformText(content, relative));
    } else {
      fs.copyFileSync(source, target);
    }
  }
}

function resolveAssetSource(asset) {
  if (asset.fromLocal) {
    return { source: path.join(root, asset.fromLocal), label: asset.fromLocal };
  }
  if (asset.fromRepo && asset.from) {
    return {
      source: path.join(cacheRoot, asset.fromRepo, asset.from),
      label: `${asset.fromRepo}/${asset.from}`
    };
  }
  throw new Error(`Invalid declared asset source for ${asset.to}`);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function sentenceCase(value) {
  return String(value).replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function localOrExternalLink(url, label, className = "text-link") {
  return `<a class="${className}" href="${escapeHtml(url)}">${escapeHtml(label)}</a>`;
}

function renderMark(product) {
  if (product.logo.kind === "approved-image") {
    return `<img class="product-logo" src="${escapeHtml(product.logo.publicPath)}" alt="${escapeHtml(product.logo.alt)}" />`;
  }
  return `<span class="text-lockup" aria-label="${escapeHtml(product.logo.label)}">${escapeHtml(product.logo.label)}</span>`;
}

function renderProductCard(product) {
  return `
    <article class="product-card" data-product-id="${escapeHtml(product.id)}">
      <div class="product-mark">${renderMark(product)}</div>
      <p class="eyebrow">${escapeHtml(sentenceCase(product.family))}</p>
      <h3>${escapeHtml(product.name)}</h3>
      <p>Purpose-built intelligence for decisions that demand clear context, visible methods, and usable outputs.</p>
      <div class="card-actions">
        ${localOrExternalLink(product.canonicalUrl, "Explore system")}
        ${localOrExternalLink(product.methodologyUrl, "How it works")}
      </div>
    </article>`;
}

function renderProductGrid(products) {
  return `<div class="product-grid">${products.map(renderProductCard).join("")}</div>`;
}

function renderCapabilities() {
  return `<div class="capability-grid">${editorial.capabilities.map((capability) => `
    <article class="capability-card">
      <p class="eyebrow">Capability</p>
      <h3>${escapeHtml(capability.name)}</h3>
      <p>${escapeHtml(capability.summary)}</p>
    </article>`).join("")}</div>`;
}

function renderEndorsedFamily() {
  return `
    <div class="endorsed-panel">
      <div>
        <p class="eyebrow">Endorsed analytical unit</p>
        <h2>${escapeHtml(site.brand.endorsedAnalyticalUnit.name)}</h2>
        <p>SDCofA publishes standing open-source threat indices as the endorsed analytical unit of Monarch Castle Technologies.</p>
        <p class="endorsement">SDCofA — endorsed analytical unit of Monarch Castle Technologies</p>
      </div>
      <div class="endorsed-links">
        ${endorsedProducts.map((product) => {
          const localPath = dashboardPaths[product.id];
          return `<article>
            ${renderMark(product)}
            <h3>${escapeHtml(product.name)}</h3>
            <p>Open-source threat intelligence designed for direct exploration.</p>
            <div class="card-actions">
              ${localPath ? localOrExternalLink(localPath, "Open dashboard") : ""}
              ${localOrExternalLink(product.methodologyUrl, "Methodology")}
            </div>
          </article>`;
        }).join("")}
      </div>
    </div>`;
}

function renderInsights() {
  return `<div class="insight-grid">${editorial.insights.map((insight) => `
    <article>
      <h3>${escapeHtml(insight.title)}</h3>
      <p>${escapeHtml(insight.summary)}</p>
      ${localOrExternalLink(insight.url, "Read governed record")}
    </article>`).join("")}</div>`;
}

function pageIntro(kicker, heading, lead) {
  return `<header class="page-intro">
    <p class="eyebrow">${escapeHtml(kicker)}</p>
    <h1>${escapeHtml(heading)}</h1>
    <p class="lede">${escapeHtml(lead)}</p>
  </header>`;
}

function nextAction(href, heading, text, label) {
  return `<aside class="next-action" aria-labelledby="next-action-heading">
    <div>
      <p class="eyebrow">Next action</p>
      <h2 id="next-action-heading">${escapeHtml(heading)}</h2>
      <p>${escapeHtml(text)}</p>
    </div>
    ${localOrExternalLink(href, label, "button-link")}
  </aside>`;
}

function renderHome() {
  return `
    <section class="hero" id="positioning" aria-labelledby="home-heading">
      <div>
        <p class="eyebrow">Monarch Castle Technologies</p>
        <h1 id="home-heading">Decision intelligence with its sources visible.</h1>
        <p class="lede">${escapeHtml(site.brand.positioning)}</p>
        <div class="hero-actions">
          ${localOrExternalLink("/products/", "Explore products", "button-link")}
          ${localOrExternalLink("/methodology/", "Review methodology", "button-link button-secondary")}
        </div>
      </div>
      <aside class="evidence-note" aria-label="Evidence standard">
        <p class="eyebrow">Public evidence standard</p>
        <p>Methods, limitations, and source context stay close to every analytical claim.</p>
      </aside>
    </section>
    <section id="capabilities" aria-labelledby="capabilities-heading">
      <div class="section-heading">
        <p class="eyebrow">Capabilities</p>
        <h2 id="capabilities-heading">A governed path from question to evaluation</h2>
      </div>
      ${renderCapabilities()}
    </section>
    <section id="portfolio" aria-labelledby="portfolio-heading">
      <div class="section-heading">
        <p class="eyebrow">Portfolio</p>
        <h2 id="portfolio-heading">Public Monarch Castle Technologies products</h2>
        <p>Explore decision systems across financial, energy, defense, emergency, and threat intelligence.</p>
      </div>
      ${renderProductGrid(flagshipProducts)}
      ${renderEndorsedFamily()}
    </section>
    <section id="datasets-methods" aria-labelledby="datasets-methods-heading">
      <div class="section-heading">
        <p class="eyebrow">Datasets and methods</p>
        <h2 id="datasets-methods-heading">Trace each instrument back to its method</h2>
      </div>
      <div class="link-list">
        ${site.products.map((product) => `<article>
          <h3>${escapeHtml(product.name)}</h3>
          <p>See the public method, sources, and operating context behind this system.</p>
          ${localOrExternalLink(product.methodologyUrl, "Explore the method")}
        </article>`).join("")}
      </div>
    </section>
    <section id="forecast-evaluation" class="split-section" aria-labelledby="forecast-heading">
      <div>
        <p class="eyebrow">Forecast evaluation</p>
        <h2 id="forecast-heading">${escapeHtml(site.forecastEvaluation.evidenceLabel)}</h2>
      </div>
      <div>
        <p>The current benchmark manifest is a template, not an evaluated result. No public performance advantage is asserted.</p>
        ${localOrExternalLink("/methodology/#forecasting", "Read the evaluation gate")}
      </div>
    </section>
    <section id="trust-provenance" aria-labelledby="trust-heading">
      <div class="section-heading">
        <p class="eyebrow">Trust and provenance</p>
        <h2 id="trust-heading">Evidence before assertion</h2>
      </div>
      <div class="trust-grid">
        <article><h3>Provenance</h3><p>Product methods and source routes remain available for independent inspection.</p></article>
        <article><h3>Limitations</h3><p>Uncertainty and analytical boundaries are stated plainly instead of being converted into marketing proof.</p></article>
        <article><h3>Claims</h3><p>Only separately approved claims may be released. Comparative and superlative wording requires governed evidence.</p></article>
      </div>
      ${localOrExternalLink("/trust/", "Open the trust center")}
    </section>
    <section id="insights" aria-labelledby="insights-heading">
      <div class="section-heading">
        <p class="eyebrow">Insights</p>
        <h2 id="insights-heading">Public standards and research notes</h2>
      </div>
      ${renderInsights()}
    </section>
    <section id="company-contact" class="split-section" aria-labelledby="company-heading">
      <div>
        <p class="eyebrow">Company and contact</p>
        <h2 id="company-heading">Build decisions that can be inspected</h2>
      </div>
      <div>
        <p>Monarch Castle Technologies maintains the flagship portfolio and visibly endorses SDCofA as its analytical unit.</p>
        <div class="card-actions">
          ${localOrExternalLink("/company/", "About the company")}
          ${localOrExternalLink(editorial.contactUrl, "Contact on GitHub")}
        </div>
      </div>
    </section>
    ${nextAction("/products/", "Explore the intelligence portfolio", "Find the system designed for the decision in front of you.", "Explore products")}`;
}

function renderProducts() {
  return `${pageIntro("Products", "Intelligence systems for consequential decisions", "Explore Monarch Castle Technologies products and the SDCofA threat-intelligence family.")}
    <section aria-labelledby="flagship-heading">
      <div class="section-heading"><h2 id="flagship-heading">Monarch Castle Technologies portfolio</h2><p>Each system turns a defined information problem into a focused analytical experience.</p></div>
      ${renderProductGrid(flagshipProducts)}
    </section>
    <section aria-labelledby="endorsed-heading"><div class="visually-hidden"><h2 id="endorsed-heading">Endorsed analytical products</h2></div>${renderEndorsedFamily()}</section>
    ${nextAction("/datasets/", "See the intelligence foundations", "Continue to the public source and methodology routes behind the portfolio.", "Browse datasets and sources")}`;
}

function renderDatasets() {
  return `${pageIntro("Datasets and sources", "Source routes and analytical scope", "Explore the public methods and source records behind each system. Third-party data remains subject to its original terms.")}
    <section aria-labelledby="catalog-heading">
      <div class="section-heading"><h2 id="catalog-heading">Public source catalog</h2><p>Move directly from a product to the method that supports it.</p></div>
      <div class="table-wrap" tabindex="0" aria-label="Scrollable dataset catalog">
        <table>
          <thead><tr><th scope="col">Product</th><th scope="col">Intelligence family</th><th scope="col">Method</th></tr></thead>
          <tbody>${site.products.map((product) => `<tr>
            <th scope="row">${escapeHtml(product.name)}</th>
            <td>${escapeHtml(sentenceCase(product.family))}</td>
            <td>${localOrExternalLink(product.methodologyUrl, "Explore method")}</td>
          </tr>`).join("")}</tbody>
        </table>
      </div>
    </section>
    ${nextAction("/methodology/", "Understand the evidence rules", "Review provenance, missing-data, claims, and forecast evaluation constraints.", "Read methodology")}`;
}

function renderSolutions() {
  return `${pageIntro("Solutions", "A transparent decision-intelligence workflow", "Four connected capabilities move from a defined question to an inspectable analytical output.")}
    <section aria-labelledby="solutions-heading">
      <div class="section-heading"><h2 id="solutions-heading">Four connected capabilities</h2></div>
      ${renderCapabilities()}
    </section>
    <section class="split-section" aria-labelledby="application-heading">
      <div><p class="eyebrow">Application</p><h2 id="application-heading">Choose the instrument after defining the decision</h2></div>
      <div><p>Use the portfolio to compare intelligence families, analytical methods, and the decisions each system is built to support.</p>${localOrExternalLink("/products/", "Compare products")}</div>
    </section>
    ${nextAction("/products/", "Match a product to the decision", "Inspect the owner-scoped portfolio and endorsed analytical family.", "Explore products")}`;
}

function renderInsightsPage() {
  return `${pageIntro("Insights", "Governed records instead of an activity feed", "This page links durable methods and policies. It does not fabricate recency, readership, or live research activity.")}
    <section aria-labelledby="records-heading">
      <div class="section-heading"><h2 id="records-heading">Selected public records</h2></div>
      ${renderInsights()}
    </section>
    ${nextAction("/methodology/", "Read how evidence is evaluated", "Continue from public policy to the operational methodology and limitations.", "Open methodology")}`;
}

function renderMethodology() {
  return `${pageIntro("Methodology", "Methods built for inspection", "Public source routes, limitations, and forecasting standards make the analytical process easier to understand.")}
    <section class="trust-grid" aria-label="Methodology principles">
      <article><h2>Provenance</h2><p>Source routes and product methods remain available so readers can inspect how an output was constructed.</p></article>
      <article><h2>Freshness</h2><p>Products identify their time horizon and update behavior where that context matters to interpretation.</p></article>
      <article><h2>Limitations</h2><p>Products may depend on external sources and methodologies. A listing is not a guarantee of completeness, availability, or predictive performance.</p></article>
    </section>
    <section id="forecasting" class="split-section" aria-labelledby="forecast-method-heading">
      <div><p class="eyebrow">Forecasting</p><h2 id="forecast-method-heading">Evaluation before performance language</h2></div>
      <div><p>Forecasting claims are published only with a defined horizon, scoring rule, and evidence that readers can examine.</p>${localOrExternalLink(editorial.insights[0].url, "Read the forecast evaluation protocol")}</div>
    </section>
    <section aria-labelledby="methods-catalog-heading">
      <div class="section-heading"><h2 id="methods-catalog-heading">Product methodology routes</h2></div>
      <ul class="method-list">${site.products.map((product) => `<li><span>${escapeHtml(product.name)}</span>${localOrExternalLink(product.methodologyUrl, "Open method")}</li>`).join("")}</ul>
    </section>
    ${nextAction("/trust/", "Review the public trust commitments", "Continue to claims, security, licensing, provenance, and endorsement.", "Open trust center")}`;
}

function repositoryUrl(product) {
  const marker = "/blob/";
  const index = product.methodologyUrl.indexOf(marker);
  return index > 0 ? product.methodologyUrl.slice(0, index) : product.canonicalUrl;
}

function renderDevelopers() {
  return `${pageIntro("Developers", "Inspectable source and reproducible routes", "Use the public repositories and machine-readable dashboard data under each project’s stated license and source terms.")}
    <section aria-labelledby="repos-heading">
      <div class="section-heading"><h2 id="repos-heading">Public repositories</h2><p>Move from each system to its available technical source.</p></div>
      <ul class="repo-list">${site.products.map((product) => `<li>
        <div><strong>${escapeHtml(product.name)}</strong><span>${escapeHtml(sentenceCase(product.family))}</span></div>
        ${localOrExternalLink(repositoryUrl(product), "Open repository")}
      </li>`).join("")}</ul>
    </section>
    <section class="trust-grid" aria-label="Developer resources">
      <article><h2>Tools</h2><p>Use public calculators for bounded exploratory work; verify inputs and assumptions before relying on an output.</p>${localOrExternalLink("/tools/", "Open tools")}</article>
      <article><h2>MCP catalog</h2><p>Review the published integration catalog and its explicit interface descriptions.</p>${localOrExternalLink("/mcp/", "Open MCP catalog")}</article>
      <article><h2>License and citation</h2><p>Check repository-specific licensing and third-party notices before reuse, then preserve provenance in citations.</p><div class="card-actions">${localOrExternalLink(editorial.licenseUrl, "License")}${localOrExternalLink(editorial.citationUrl, "Citation")}</div></article>
    </section>
    ${nextAction("/trust/", "Check security and provenance", "Review the trust contract before integrating a public output.", "Open trust center")}`;
}

function renderTrust() {
  return `${pageIntro("Trust center", "Public commitments and explicit limits", "Trust is expressed through inspectable sources, analytical limits, security routes, licensing, and visible endorsement.")}
    <section class="trust-grid" aria-label="Trust commitments">
      <article><h2>Provenance</h2><p>Public methods and source routes help readers inspect the foundations of each system.</p>${localOrExternalLink(editorial.governanceUrl, "Operating principles")}</article>
      <article><h2>Forecast evidence</h2><p>${escapeHtml(site.forecastEvaluation.evidenceLabel)}. The site does not convert a template into proof.</p>${localOrExternalLink("/methodology/#forecasting", "Evaluation gate")}</article>
      <article><h2>Claims</h2><p>${escapeHtml(site.claims.publicReleasePolicy)} No comparative result is presented without its evidence record.</p>${localOrExternalLink(editorial.insights[1].url, "Claims policy")}</article>
      <article><h2>Security</h2><p>Report vulnerabilities through the published security policy rather than a public issue.</p>${localOrExternalLink(editorial.securityUrl, "Security policy")}</article>
      <article><h2>Licensing</h2><p>Site code licensing does not transfer rights to third-party data or assets. Check project notices before reuse.</p>${localOrExternalLink(editorial.licenseUrl, "Site license")}</article>
      <article><h2>Endorsement</h2><p>SDCofA is identified as an endorsed analytical unit of Monarch Castle Technologies.</p>${localOrExternalLink("/company/", "Company structure")}</article>
    </section>
    ${nextAction("/company/", "Contact the accountable organization", "Use the public company route for ownership, structure, and contact.", "About the company")}`;
}

function renderCompany() {
  return `${pageIntro("Company", site.brand.masterbrand, "An evidence-led technology organization publishing decision-intelligence products with visible governance, methodology, and limitations.")}
    <section class="split-section" aria-labelledby="position-heading">
      <div><p class="eyebrow">Positioning</p><h2 id="position-heading">${escapeHtml(site.brand.positioning)}</h2></div>
      <div><p>The portfolio brings together Monarch Castle Technologies systems and the explicitly endorsed SDCofA analytical unit.</p>${localOrExternalLink("/products/", "View the portfolio")}</div>
    </section>
    <section class="endorsed-panel" aria-labelledby="unit-heading">
      <div><p class="eyebrow">Organization structure</p><h2 id="unit-heading">${escapeHtml(site.brand.endorsedAnalyticalUnit.name)}</h2><p>${escapeHtml(site.brand.endorsedAnalyticalUnit.name)} is the ${escapeHtml(site.brand.endorsedAnalyticalUnit.relationship)} of ${escapeHtml(site.brand.masterbrand)}.</p></div>
      <div class="contact-card"><h3>Contact and governance</h3><p>Use the organization profile for contact and the trust center for security, licensing, provenance, and claims policy.</p><div class="card-actions">${localOrExternalLink(editorial.contactUrl, "Organization profile")}${localOrExternalLink("/trust/", "Trust center")}</div></div>
    </section>
    ${nextAction(editorial.contactUrl, "Start a public conversation", "Use the organization profile to inspect repositories and available contact routes.", "Open organization profile")}`;
}

function renderBody(page) {
  const renderers = {
    home: renderHome,
    products: renderProducts,
    datasets: renderDatasets,
    solutions: renderSolutions,
    insights: renderInsightsPage,
    methodology: renderMethodology,
    developers: renderDevelopers,
    trust: renderTrust,
    company: renderCompany
  };
  const renderer = renderers[page.slug];
  if (!renderer) throw new Error(`No page renderer for ${page.slug}`);
  return renderer();
}

function renderNav(currentPath) {
  return routes.sitePages.map((page) => {
    const label = page.slug === "home" ? "Home" : sentenceCase(page.slug);
    const current = page.path === currentPath ? ' aria-current="page"' : "";
    return `<li><a href="${page.path}"${current}>${escapeHtml(label)}</a></li>`;
  }).join("");
}

function renderPage(page) {
  const canonical = `${canonicalOrigin}${page.path}`;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light dark" />
  <title>${escapeHtml(page.title)}</title>
  <meta name="description" content="${escapeHtml(page.description)}" />
  <link rel="canonical" href="${canonical}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(page.title)}" />
  <meta property="og:description" content="${escapeHtml(page.description)}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:site_name" content="${escapeHtml(site.brand.masterbrand)}" />
  <link rel="stylesheet" href="/styles/site.css" />
</head>
<body data-page="${escapeHtml(page.slug)}">
  <a class="skip-link" href="#main-content">Skip to main content</a>
  <header class="site-header">
    <a class="wordmark" href="/" aria-label="${escapeHtml(site.brand.masterbrand)} home">
      <span>Monarch Castle</span><strong>Technologies</strong>
    </a>
    <nav aria-label="Primary"><ul>${renderNav(page.path)}</ul></nav>
  </header>
  <main id="main-content" tabindex="-1">${renderBody(page)}</main>
  <footer class="site-footer">
    <div><strong>${escapeHtml(site.brand.masterbrand)}</strong><p>${escapeHtml(site.brand.positioning)}</p></div>
    <nav aria-label="Trust and company">
      <a href="/methodology/">Methodology</a>
      <a href="/trust/">Trust</a>
      <a href="${escapeHtml(editorial.securityUrl)}">Security</a>
      <a href="${escapeHtml(editorial.licenseUrl)}">License</a>
      <a href="/company/">Contact</a>
    </nav>
  </footer>
</body>
</html>
`;
}

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
copyFile(path.join(root, "public", "CNAME"), path.join(dist, "CNAME"));
fs.writeFileSync(path.join(dist, ".nojekyll"), "");

for (const page of routes.sitePages) {
  const target = path.join(dist, page.output);
  ensureParent(target);
  fs.writeFileSync(target, renderPage(page));
}

for (const page of routes.localPages) {
  copyFile(path.join(root, page.source), path.join(dist, page.output));
}

fs.cpSync(path.join(root, "src", "styles"), path.join(dist, "styles"), { recursive: true });
fs.cpSync(path.join(root, "src", "scripts"), path.join(dist, "scripts"), { recursive: true });

for (const asset of routes.assets) {
  const { source, label } = resolveAssetSource(asset);
  const target = path.join(dist, asset.to);
  if (!fs.existsSync(source)) {
    throw new Error(`Missing declared asset source: ${label}. Run npm run sync:content or fix site.routes.json.`);
  }
  fs.cpSync(source, target, { recursive: true });
}

for (const mount of routes.dashboardMounts) {
  const upstreamRoot = path.join(cacheRoot, mount.repoKey);
  const targetRoot = path.join(dist, mount.slug);
  if (!fs.existsSync(upstreamRoot)) {
    throw new Error(`Missing upstream checkout for ${mount.repoKey}; run npm run sync`);
  }
  copyDirectory(upstreamRoot, targetRoot, (content) => rewriteStaticContent(content, mount.path));
}
