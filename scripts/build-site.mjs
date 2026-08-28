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
const productPresentation = {
  "cloudy-shiny": {
    summary: "A market weather system that turns financial signals into an immediate read on risk appetite.",
    signal: "Market conditions"
  },
  econmap: {
    summary: "Country-level economic indicators arranged for fast comparison and macroeconomic orientation.",
    signal: "Economic landscape"
  },
  esgmap: {
    summary: "Explore environmental, social, and governance signals through a global geospatial interface.",
    signal: "Sustainability intelligence"
  },
  macrointel: {
    summary: "Macro signals, country context, and decision-ready economic views in one analytical surface.",
    signal: "Macro intelligence"
  },
  "milcodec-receiver": {
    summary: "A focused receiver and analysis environment for military-coded communications.",
    signal: "Defense signals"
  },
  "nuclear-energy-intelligence": {
    summary: "Structured intelligence for monitoring the global nuclear-energy operating environment.",
    signal: "Energy systems"
  },
  prepturk: {
    summary: "Practical emergency-preparedness intelligence designed for households and communities in Türkiye.",
    signal: "Preparedness"
  },
  "superlig-forecast": {
    summary: "Five million simulated seasons turn current matches, squads, transfers, and market values into transparent title and table probabilities.",
    signal: "Football forecasting"
  },
  supplychain: {
    summary: "Map operational exposure and trace the forces shaping complex supply networks.",
    signal: "Supply networks"
  },
  "border-neighbor-threat-index": {
    summary: "Compare how cross-border conditions shape national threat exposure.",
    signal: "Border risk"
  },
  "mena-threat-index": {
    summary: "A regional threat lens built for direct comparison across the Middle East and North Africa.",
    signal: "Regional threat"
  },
  "world-threat-index": {
    summary: "Comparative global threat monitoring across political, security, and structural conditions.",
    signal: "Global threat"
  }
};

function presentationFor(product) {
  return productPresentation[product.id] ?? {
    summary: "Purpose-built intelligence for decisions that demand clear context and usable outputs.",
    signal: sentenceCase(product.family)
  };
}

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
    <article class="product-card system-row" data-product-id="${escapeHtml(product.id)}">
      <div class="product-mark">${renderMark(product)}</div>
      <div class="system-row-index" aria-hidden="true">${escapeHtml(product.id.slice(0, 3).toUpperCase())}</div>
      <div class="system-row-copy">
        <p class="eyebrow">${escapeHtml(sentenceCase(product.family))}</p>
        <h3>${escapeHtml(product.name)}</h3>
      </div>
      <p>${escapeHtml(presentationFor(product).summary)}</p>
      <dl class="system-row-meta"><div><dt>Owner</dt><dd>${escapeHtml(product.owner)}</dd></div><div><dt>Cadence</dt><dd>${escapeHtml(product.updateFrequency === "review-required" ? "not declared" : product.updateFrequency)}</dd></div></dl>
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

function renderEndorsedFamily(headingId = "") {
  return `
    <div class="endorsed-panel">
      <div>
        <p class="eyebrow">Endorsed analytical unit</p>
        <h2${headingId ? ` id="${escapeHtml(headingId)}"` : ""}>${escapeHtml(site.brand.endorsedAnalyticalUnit.name)}</h2>
        <p>SDCofA publishes standing open-source threat indices as the endorsed analytical unit of Monarch Castle Technologies.</p>
        <p class="endorsement">SDCofA — endorsed analytical unit of Monarch Castle Technologies</p>
      </div>
      <div class="endorsed-links">
        ${endorsedProducts.map((product) => {
          const localPath = dashboardPaths[product.id];
          return `<article data-product-id="${escapeHtml(product.id)}">
            <div class="product-mark">${renderMark(product)}</div>
            <span class="system-row-index" aria-hidden="true">${escapeHtml(product.id.slice(0, 3).toUpperCase())}</span>
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

function renderFeaturedSystem(product, index) {
  const presentation = presentationFor(product);
  const productUrl = dashboardPaths[product.id] ?? product.canonicalUrl;
  return `
    <article class="featured-system" data-product-id="${escapeHtml(product.id)}">
      <div class="featured-system-copy">
        <p class="eyebrow">${String(index + 1).padStart(2, "0")} / ${escapeHtml(presentation.signal)}</p>
        <h3>${escapeHtml(product.name)}</h3>
        <p>${escapeHtml(presentation.summary)}</p>
        <div class="card-actions">
          ${localOrExternalLink(productUrl, "Explore system", "button-link")}
          ${localOrExternalLink(product.methodologyUrl, "View methodology")}
        </div>
      </div>
      <div class="featured-system-mark" aria-hidden="true"><span class="system-index">${String(index + 1).padStart(2, "0")}</span><span>${escapeHtml(product.family)}</span></div>
    </article>`;
}

function renderHome() {
  const featuredIds = ["border-neighbor-threat-index", "world-threat-index", "macrointel"];
  const featured = featuredIds.map((id) => productById.get(id)).filter(Boolean);
  return `
    <section class="mission-hero" id="positioning" aria-labelledby="home-heading">
      <div class="mission-hero-copy">
        <p class="eyebrow">Early warning for private enterprise</p>
        <h1 id="home-heading">See disruption before it reaches your operation.</h1>
        <p class="lede">The Keep brings geopolitical, economic, energy, and supply-chain signals into one source-visible operating picture for companies exposed to a changing world.</p>
        <div class="hero-actions">
          ${localOrExternalLink("/platform/", "Explore The Keep", "button-link")}
          ${localOrExternalLink("/bnti/", "Open free BNTI", "button-link button-secondary")}
        </div>
        <p class="public-commitment">Every current public product stays open. Commercial access applies only to the unified enterprise workspace.</p>
      </div>
      <aside class="mission-hero-visual bnti-first" aria-label="Border Neighbor Threat Index">
        <div class="instrument-heading"><p class="eyebrow">Live public instrument</p><span class="live-chip"><i></i> Autonomous</span></div>
        <a class="hero-product-link" href="/bnti/">
          <img src="/assets/products/bnti-hero.png" alt="Border Neighbor Threat Index" />
          <span><strong>BNTI</strong><small>Border Neighbor Threat Index</small></span>
        </a>
        <p class="hero-product-copy">Inspectable cross-border risk monitoring for Türkiye's land-neighbor relationships.</p>
        <div class="hero-product-meta"><span>Scheduled refresh</span><span>Free and open</span></div>
      </aside>
    </section>
    <section class="platform-rail" aria-label="The Keep operating loop">
      <span>01 / Observe</span><span>02 / Connect</span><span>03 / Estimate</span><span>04 / Act</span>
    </section>
    <section class="platform-reveal" id="platform" aria-labelledby="platform-heading">
      <div class="section-heading">
        <div><p class="eyebrow">The Keep</p><h2 id="platform-heading">One operating picture. Every public instrument behind it.</h2></div>
        <p>Monitor exposure, compare regions, follow changes, and move from an alert to its source without switching between disconnected dashboards.</p>
      </div>
      <div class="platform-preview" aria-label="The Keep platform preview">
        <div class="preview-sidebar"><strong>THE KEEP</strong><span class="active">Overview</span><span>Exposure</span><span>Signals</span><span>Watchlists</span><span>Methods</span></div>
        <div class="preview-main">
          <div class="preview-status"><span><i></i> Monitoring active</span><small>Public preview</small></div>
          <div class="preview-kpis"><article><small>Global risk</small><strong>2.12</strong><span>WTI</span></article><article><small>Border risk</small><strong>7.29</strong><span>BNTI</span></article><article><small>MENA risk</small><strong>2.11</strong><span>Regional</span></article></div>
          <div class="preview-grid"><div class="signal-field"><span class="pulse p1"></span><span class="pulse p2"></span><span class="pulse p3"></span><span class="pulse p4"></span><span class="scan-line"></span></div><ol><li><b>Border pressure</b><span>Critical</span></li><li><b>Regional energy</b><span>Watch</span></li><li><b>Trade exposure</b><span>Stable</span></li></ol></div>
        </div>
      </div>
      <p class="section-action">${localOrExternalLink("/platform/", "Open the live platform preview", "button-link")}</p>
    </section>
    <section class="operating-thesis" id="capabilities" aria-labelledby="capabilities-heading">
      <div class="section-heading"><div><p class="eyebrow">Built for operators</p><h2 id="capabilities-heading">Answers tied to the evidence that produced them.</h2></div><p>Automated collection handles repetition. Declared methods handle calculation. People retain judgment and accountability.</p></div>
      ${renderCapabilities()}
    </section>
    <section class="sector-band" aria-labelledby="sector-heading">
      <div class="section-heading"><div><p class="eyebrow">Commercial focus</p><h2 id="sector-heading">Four operating environments where surprise is expensive.</h2></div><p>No government sales required. The platform is designed for private companies carrying cross-border exposure.</p></div>
      <div class="sector-grid"><a href="/impact/#energy"><span>01</span><h3>Energy</h3><p>Routes, sanctions, regional stability, infrastructure.</p></a><a href="/impact/#logistics"><span>02</span><h3>Logistics</h3><p>Ports, corridors, borders, congestion, disruption.</p></a><a href="/impact/#finance"><span>03</span><h3>Finance</h3><p>Country exposure, macro shifts, scenario monitoring.</p></a><a href="/impact/#insurance"><span>04</span><h3>Insurance</h3><p>Accumulation risk, emerging events, portfolio watchlists.</p></a></div>
    </section>
    <section class="featured-systems" id="featured-systems" aria-labelledby="featured-heading">
      <div class="section-heading">
        <p class="eyebrow">Featured systems</p>
        <h2 id="featured-heading">Built around the decision, not the dashboard.</h2>
        <p>Each public product remains directly accessible, free of a platform paywall.</p>
      </div>
      <div class="featured-system-list">${featured.map(renderFeaturedSystem).join("")}</div>
    </section>
    <section class="intelligence-catalogue" id="portfolio" aria-labelledby="portfolio-heading">
      <div class="section-heading">
        <p class="eyebrow">Intelligence catalogue</p>
        <h2 id="portfolio-heading">One portfolio. Multiple operating environments.</h2>
        <p>Explore systems across financial, energy, defense, emergency, and threat intelligence.</p>
      </div>
      ${renderProductGrid(flagshipProducts)}
      <p class="section-action">${localOrExternalLink("/products/", "View the full product portfolio", "button-link")}</p>
    </section>
    <section class="sdcofa-band" id="sdcofa" aria-labelledby="sdcofa-heading">
      ${renderEndorsedFamily("sdcofa-heading")}
    </section>
    <section class="evidence-chain" id="methods" aria-labelledby="methods-heading">
      <div class="section-heading">
        <p class="eyebrow">Evidence chain</p>
        <h2 id="methods-heading">Intelligence is useful when its reasoning can be followed.</h2>
      </div>
      <div class="evidence-steps">
        <article><span>01</span><h3>Source context</h3><p>Start with where an observation came from, when it was captured, and what it can support.</p></article>
        <article><span>02</span><h3>Analytical method</h3><p>Make transformations, comparisons, and limitations understandable to the reader.</p></article>
        <article><span>03</span><h3>Decision output</h3><p>Present the result in a form that clarifies choices without hiding uncertainty.</p></article>
      </div>
      <div class="evidence-actions">
        ${localOrExternalLink("/methodology/", "Explore methodology", "button-link")}
        ${localOrExternalLink("/trust/", "Read our commitments")}
      </div>
    </section>
    <section class="company-close" id="company-contact" aria-labelledby="company-heading">
      <div class="company-close-copy">
        <p class="eyebrow">Monarch Castle Technologies</p>
        <h2 id="company-heading">Start with one exposure. Prove value in six weeks.</h2>
        <p>A paid pilot connects your operating question to The Keep without restricting any existing public product.</p>
      </div>
      <div class="company-close-actions">
        ${localOrExternalLink("/pilot/", "Request a pilot", "button-link")}
        ${localOrExternalLink("/pricing/", "Platform access")}
      </div>
    </section>`;
}

function renderPlatform() {
  return `${pageIntro("The Keep", "A unified early-warning workspace", "Live public indicators become one operating picture for private-sector teams. Sources, timestamps, and methods remain visible.")}
    <section class="platform-workspace" aria-labelledby="workspace-heading">
      <div class="workspace-toolbar"><div><p class="eyebrow">Live public preview</p><h2 id="workspace-heading">Operating picture</h2></div><div class="workspace-freshness"><span class="live-chip"><i></i> Autonomous refresh</span><time id="platform-updated">Loading feeds…</time></div></div>
      <div class="workspace-grid">
        <aside class="workspace-nav" aria-label="Platform modules"><strong>THE KEEP</strong><button class="is-active" type="button">Overview</button><button type="button">Exposure</button><button type="button">Signals</button><button type="button">Methods</button><hr><small>PUBLIC PREVIEW</small></aside>
        <div class="workspace-content">
          <div class="workspace-metrics"><article><span>Global threat</span><strong id="metric-wti">—</strong><small id="status-wti">WTI</small></article><article><span>Border pressure</span><strong id="metric-bnti">—</strong><small id="status-bnti">BNTI</small></article><article><span>MENA exposure</span><strong id="metric-mena">—</strong><small id="status-mena">MENA</small></article><article><span>Composite stress</span><strong id="metric-composite">—</strong><small>Declared mean</small></article></div>
          <div class="workspace-panels"><section class="exposure-panel"><header><div><p class="eyebrow">Cross-system view</p><h3>Highest current exposures</h3></div><span id="feed-state">Connecting</span></header><ol id="exposure-list"><li class="loading-row">Loading source-visible indicators…</li></ol></section><section class="signal-panel"><header><p class="eyebrow">Recent signals</p><h3>Traceable event stream</h3></header><ol id="signal-list"><li class="loading-row">Loading published events…</li></ol></section></div>
          <p class="workspace-note" id="platform-note">This preview reads only public product outputs. No private customer data is collected or stored.</p>
        </div>
      </div>
    </section>
    <section class="platform-boundary" aria-labelledby="boundary-heading"><div><p class="eyebrow">Open-product promise</p><h2 id="boundary-heading">The public portfolio stays public.</h2></div><div><p>BNTI, WTI, EconMap, GeoRisk, MacroIntel, and every current published product remain available without a platform subscription.</p><p>Paid access covers unified watchlists, organization workspaces, private data connections, scheduled briefings, exports, API access, and support.</p>${localOrExternalLink("/pricing/", "Compare access")}</div></section>
    <section class="process-grid" aria-label="Platform operating model"><article><span>01</span><h3>Collect</h3><p>Scheduled product workflows refresh declared public sources.</p></article><article><span>02</span><h3>Normalize</h3><p>Versioned schemas preserve timestamps, provenance, and missingness.</p></article><article><span>03</span><h3>Connect</h3><p>The Keep aligns signals across geography, time, sector, and exposure.</p></article><article><span>04</span><h3>Deliver</h3><p>Teams receive watchlists, alerts, exports, and reproducible evidence.</p></article></section>
    ${nextAction("/pilot/", "Connect one real operating decision", "A six-week pilot begins with an exposure, a decision owner, and an agreed success measure.", "Request a pilot")}`;
}

function renderImpact() {
  const cases = [
    ["energy", "Energy and commodities", "Track regional instability, sanctions, ports, infrastructure, and route conditions around assets and contracts.", "Trading, procurement, strategy, security"],
    ["logistics", "Logistics and supply chains", "Watch border pressure, port congestion, corridor disruption, and country conditions before schedules and inventories absorb the shock.", "Network planning, operations, procurement"],
    ["finance", "Finance and advisory", "Combine macro, country, and event signals into transparent watchlists for research, risk, and client work.", "Country risk, research, portfolio oversight"],
    ["insurance", "Insurance and reinsurance", "Monitor emerging accumulation patterns and retain the source trail needed for triage and escalation.", "Exposure management, underwriting, claims"]
  ];
  return `${pageIntro("Operational use cases", "Built for commercial exposure, not government procurement", "The Keep helps private-sector teams detect change, connect it to assets and routes, and preserve an inspectable evidence trail.")}
    <section class="impact-list" aria-label="Private-sector use cases">${cases.map(([id, title, summary, users], index) => `<article id="${id}"><span>${String(index + 1).padStart(2, "0")}</span><div><p class="eyebrow">${escapeHtml(users)}</p><h2>${escapeHtml(title)}</h2><p>${escapeHtml(summary)}</p></div><ol><li>Define exposed assets, countries, routes, or suppliers.</li><li>Monitor public signals and declared model outputs.</li><li>Escalate changes with source and timestamp attached.</li></ol></article>`).join("")}</section>
    <section class="evidence-chain" aria-labelledby="measurement-heading"><div class="section-heading"><div><p class="eyebrow">Pilot measurement</p><h2 id="measurement-heading">Prove operational value without inventing a case study.</h2></div><p>Until paid pilots produce permissioned results, this site publishes workflows and measurement criteria—not fabricated customer logos or claims.</p></div><div class="evidence-steps"><article><span>01</span><h3>Lead time</h3><p>How much earlier did the workflow surface a relevant change?</p></article><article><span>02</span><h3>Analyst effort</h3><p>How much repetitive collection and triage time was removed?</p></article><article><span>03</span><h3>Decision trace</h3><p>Could a reviewer reproduce the evidence used to escalate?</p></article></div></section>
    ${nextAction("/pilot/", "Create the first permissioned impact record", "Run one bounded pilot with agreed inputs, outputs, and measures.", "Request a pilot")}`;
}

function renderPricing() {
  return `${pageIntro("Platform access", "Public products stay free. The unified workspace is commercial.", "No existing dashboard, methodology page, or public data output is placed behind a paywall.")}
    <section class="pricing-grid" aria-label="The Keep commercial access">
      <article><p class="eyebrow">Public</p><h2>Open products</h2><p class="price">$0</p><ul><li>Every current public dashboard</li><li>Published methodologies</li><li>Public source and timestamp trails</li><li>Repository access under stated licenses</li></ul>${localOrExternalLink("/products/", "Explore free products", "button-link button-secondary")}</article>
      <article class="pricing-featured"><p class="eyebrow">Six-week engagement</p><h2>Paid pilot</h2><p class="price">From $15k</p><ul><li>One defined exposure and decision workflow</li><li>Unified watchlist and scheduled briefing</li><li>Customer-provided data mapping when permitted</li><li>Measured lead-time and analyst-effort baseline</li></ul>${localOrExternalLink("/pilot/", "Scope a pilot", "button-link")}</article>
      <article><p class="eyebrow">Annual access</p><h2>Enterprise</h2><p class="price">From $36k / year</p><ul><li>Organization workspace and role-based access</li><li>Watchlists, exports, alerts, and API access</li><li>Private connectors and deployment options</li><li>Support, onboarding, and service objectives</li></ul>${localOrExternalLink("/pilot/", "Discuss enterprise access", "button-link button-secondary")}</article>
    </section>
    <section class="platform-boundary" aria-labelledby="commercial-boundary"><div><p class="eyebrow">Commercial boundary</p><h2 id="commercial-boundary">Pay for coordination and service—not for access to work already published.</h2></div><div><p>The commercial product is The Keep workspace: cross-product views, team workflows, private integrations, delivery guarantees, and support.</p><p>Prices are starting points for qualified private-sector buyers. Taxes, data licensing, bespoke infrastructure, and third-party services are scoped separately.</p></div></section>
    ${nextAction("/pilot/", "Begin with a bounded outcome", "A pilot converts one recurring risk question into a measured operating workflow.", "Request a pilot")}`;
}

function renderPilot() {
  const intakeUrl = "https://github.com/MonarchCastleTech/MonarchCastleTech.github.io/issues/new?template=pilot_request.yml";
  return `${pageIntro("Private-sector pilot", "Turn one exposure into a working early-warning loop", "A six-week pilot has a decision owner, a bounded scope, declared data, and a measurable operational result.")}
    <section class="pilot-layout" aria-labelledby="pilot-scope-heading"><div><p class="eyebrow">Pilot structure</p><h2 id="pilot-scope-heading">Small enough to finish. Useful enough to renew.</h2><ol class="pilot-steps"><li><span>01</span><div><strong>Define</strong><p>Choose one portfolio, route, region, supplier set, or recurring risk decision.</p></div></li><li><span>02</span><div><strong>Connect</strong><p>Map public products and approved customer inputs into The Keep.</p></div></li><li><span>03</span><div><strong>Operate</strong><p>Run scheduled monitoring, briefing, escalation, and evidence capture.</p></div></li><li><span>04</span><div><strong>Measure</strong><p>Compare lead time, analyst effort, coverage, and reproducibility against baseline.</p></div></li></ol></div><aside class="pilot-card"><p class="eyebrow">Non-confidential intake</p><h3>Request a pilot</h3><p>Use the public intake to describe sector, geography, and decision. Do not include confidential, personal, or regulated information.</p><dl><div><dt>Duration</dt><dd>6 weeks</dd></div><div><dt>Starting price</dt><dd>USD 15,000</dd></div><div><dt>Customer</dt><dd>Private-sector organizations</dd></div></dl>${localOrExternalLink(intakeUrl, "Open pilot intake", "button-link")}<small>A GitHub account is required for this temporary intake route.</small></aside></section>
    <section class="trust-grid" aria-label="Pilot conditions"><article><h2>No hidden lock-in</h2><p>Public product access remains unchanged before, during, and after a pilot.</p></article><article><h2>No invented certainty</h2><p>Outputs preserve confidence, limitations, missingness, and source boundaries.</p></article><article><h2>No government dependency</h2><p>The commercial plan targets private companies in energy, logistics, finance, insurance, and advisory services.</p></article></section>
    ${nextAction("/methodology/", "Inspect the method before buying", "Review provenance, automation, model evaluation, and platform formulas.", "Read methodology")}`;
}

function renderProducts() {
  return `${pageIntro("Products", "Intelligence systems for consequential decisions", "Explore Monarch Castle Technologies products and the SDCofA threat-intelligence family.")}
    <section class="owner-portfolio-section owner-portfolio-section--flagship" aria-labelledby="flagship-heading">
      <div class="section-heading"><div><p class="eyebrow">Product owner</p><h2 id="flagship-heading">Monarch Castle Technologies</h2></div><p>Each system turns a defined information problem into a focused analytical experience.</p></div>
      ${renderProductGrid(flagshipProducts)}
    </section>
    <section class="sdcofa-band owner-portfolio-section owner-portfolio-section--endorsed" aria-labelledby="endorsed-heading">${renderEndorsedFamily("endorsed-heading")}</section>
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
  return `${pageIntro("Offerings", "Early warning built around commercial exposure", "The Keep connects open intelligence products to the operating questions faced by energy, logistics, finance, and insurance teams.")}
    <section aria-labelledby="solutions-heading"><div class="section-heading"><div><p class="eyebrow">Operating model</p><h2 id="solutions-heading">From exposed asset to traceable action.</h2></div><p>Start with the decision and exposure. Add only the sources, models, and alerts that materially improve it.</p></div>${renderCapabilities()}</section>
    <section class="split-section" aria-labelledby="application-heading"><div><p class="eyebrow">Delivery</p><h2 id="application-heading">Public instruments below. Unified workflow above.</h2></div><div><p>Open products remain independently usable. The commercial layer coordinates them into watchlists, private integrations, scheduled briefings, exports, and team workflows.</p>${localOrExternalLink("/platform/", "Explore The Keep")}</div></section>
    ${nextAction("/impact/", "Match the platform to an operating environment", "Review private-sector workflows without fabricated customer claims.", "See use cases")}`;
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
    <section id="platform-formula" class="platform-boundary" aria-labelledby="platform-method-heading">
      <div><p class="eyebrow">The Keep preview</p><h2 id="platform-method-heading">A declared cross-system summary—not a hidden model.</h2></div>
      <div><p>The live preview reads each product's published <code>meta.main_index</code>, status, timestamp, country records, and events. It does not alter upstream scores.</p><p>The displayed composite is the arithmetic mean of available BNTI, WTI, and MENA main indices: <code>(BNTI + WTI + MENA) / n</code>. Missing or failed feeds are excluded and visibly reported. This preview composite is an orientation aid, not a forecast or customer-specific risk score.</p><p>Country exposure rows are sorted by the published product index. Event rows retain source links and timestamps. No LLM is required for platform rendering.</p></div>
    </section>
    <section class="trust-grid" aria-label="Reproducibility controls"><article><h2>Versioned inputs</h2><p>Each mounted product output carries its own generation time, model version, and source boundary where available.</p></article><article><h2>Deterministic presentation</h2><p>Given the same JSON outputs, the platform preview produces the same metrics, rankings, and event order.</p></article><article><h2>Failure visibility</h2><p>Feed failures remain visible; the interface does not silently fabricate substitute values.</p></article></section>
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
  return `${pageIntro("Company", site.brand.masterbrand, "An independent technology company building transparent early-warning systems for private-sector operators exposed to geopolitical and economic change.")}
    <section class="split-section" aria-labelledby="position-heading">
      <div><p class="eyebrow">Positioning</p><h2 id="position-heading">Early warning for companies operating across borders.</h2></div>
      <div><p>The Keep unifies the public Monarch Castle Technologies portfolio and the explicitly endorsed SDCofA analytical unit without restricting their existing public access.</p>${localOrExternalLink("/platform/", "Explore The Keep")}</div>
    </section>
    <section class="endorsed-panel" aria-labelledby="unit-heading">
      <div><p class="eyebrow">Organization structure</p><h2 id="unit-heading">${escapeHtml(site.brand.endorsedAnalyticalUnit.name)}</h2><p>${escapeHtml(site.brand.endorsedAnalyticalUnit.name)} is the ${escapeHtml(site.brand.endorsedAnalyticalUnit.relationship)} of ${escapeHtml(site.brand.masterbrand)}.</p></div>
      <div class="contact-card"><h3>Company state</h3><p>Product, methodology, security, and commercial materials are public. Legal incorporation and confidential contact infrastructure remain subject to their formal completion records.</p><div class="card-actions">${localOrExternalLink("/pilot/", "Pilot intake")}${localOrExternalLink("/trust/", "Trust center")}</div></div>
    </section>
    ${nextAction("/pilot/", "Start with a private-sector pilot", "Define one exposure, one decision owner, and one measurable result.", "Request a pilot")}`;
}

function renderBody(page) {
  const renderers = {
    home: renderHome,
    products: renderProducts,
    platform: renderPlatform,
    impact: renderImpact,
    pricing: renderPricing,
    pilot: renderPilot,
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
  const navigation = [
    { label: "Platform", path: "/platform/" },
    { label: "Offerings", path: "/solutions/" },
    { label: "Products", path: "/products/" },
    { label: "Methodology", path: "/methodology/" },
    { label: "Company", path: "/company/" }
  ];
  return navigation.map((item) => {
    const current = item.path === currentPath ? ' aria-current="page"' : "";
    return `<li><a href="${item.path}"${current}>${escapeHtml(item.label)}</a></li>`;
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
  <meta property="og:image" content="${canonicalOrigin}/assets/approved/social-preview.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(page.title)}" />
  <meta name="twitter:description" content="${escapeHtml(page.description)}" />
  <meta name="twitter:image" content="${canonicalOrigin}/assets/approved/social-preview.png" />
  <link rel="icon" type="image/png" href="/assets/products/logo.png" />
  <link rel="stylesheet" href="/styles/site.css" />
</head>
<body data-page="${escapeHtml(page.slug)}">
  <a class="skip-link" href="#main-content">Skip to main content</a>
  <header class="site-header">
    <a class="wordmark" href="/" aria-label="${escapeHtml(site.brand.masterbrand)} home">
      <img class="brand-logo" src="/assets/products/logo.png" alt="" />
      <span class="wordmark-copy"><span>Monarch Castle</span><strong>Technologies</strong></span>
    </a>
    <nav aria-label="Primary"><ul>${renderNav(page.path)}</ul></nav>
    <a class="header-action" href="/pilot/">Request pilot</a>
  </header>
  <main id="main-content" tabindex="-1">${renderBody(page)}</main>
  <footer class="site-footer">
    <div><strong>${escapeHtml(site.brand.masterbrand)}</strong><p>${escapeHtml(site.brand.positioning)}</p></div>
    <nav aria-label="Trust and company">
      <a href="/methodology/">Methodology</a>
      <a href="/pricing/">Access</a>
      <a href="/impact/">Use cases</a>
      <a href="/trust/">Trust</a>
      <a href="${escapeHtml(editorial.securityUrl)}">Security</a>
      <a href="${escapeHtml(editorial.licenseUrl)}">License</a>
      <a href="/company/">Contact</a>
    </nav>
  </footer>
  ${page.slug === "platform" ? '<script type="module" src="/scripts/platform.js"></script>' : ""}
</body>
</html>
`;
}

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
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
