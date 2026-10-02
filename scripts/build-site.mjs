import fs from "node:fs";
import { createHash } from "node:crypto";
import { renderDataHome, renderFreeKeep, renderFreeAccess } from "./lib/data-experience.mjs";
import { asFinite } from "../src/scripts/feed-records.js";
import path from "node:path";
import { isTextAsset, rewriteStaticContent, shouldCopyStaticFile } from "./lib/static-rewrite.mjs";

const root = process.cwd();
const routes = JSON.parse(fs.readFileSync(path.join(root, "site.routes.json"), "utf8"));
const site = JSON.parse(fs.readFileSync(path.join(root, "src", "content", "site.json"), "utf8"));
const editorial = JSON.parse(fs.readFileSync(path.join(root, "src", "content", "editorial.json"), "utf8"));
const dist = path.join(root, "dist");
// One content revision covers the complete stylesheet/module graph, including Three.js.
const assetHash = createHash("sha256").update(fs.readFileSync(path.join(root, "package-lock.json")));
for (const directory of ["styles", "scripts"]) {
  for (const filename of fs.readdirSync(path.join(root, "src", directory)).sort()) {
    assetHash.update(filename).update(fs.readFileSync(path.join(root, "src", directory, filename)));
  }
}
const assetRevision = assetHash.digest("hex").slice(0, 16);
const cacheRoot = path.join(root, ".cache", "upstreams");
const canonicalOrigin = `https://${routes.canonicalDomain}`;
const secureWorkspaceUrl = "/platform/";
const productById = new Map(site.products.map((product) => [product.id, product]));
const flagshipProducts = (site.ownerViews?.MonarchCastleTech ?? [])
  .map((id) => productById.get(id))
  .filter(Boolean);
const endorsedProducts = (site.ownerViews?.SDCofA ?? [])
  .map((id) => productById.get(id))
  .filter(Boolean);
const dashboardPaths = {
  "border-neighbor-threat-index": "/sdcofa/bnti/",
  "world-threat-index": "/sdcofa/wti/",
  "mena-threat-index": "/sdcofa/mena/"
};
const publicSignals = readPublicSignalSnapshot();
const pageFaqs = {
  products: [
    { question: "What products does Monarch Castle Technologies publish?", answer: "The portfolio covers market weather, country economics, ESG mapping, macro intelligence, defense signals, nuclear energy intelligence, emergency preparedness, football forecasting, supply networks, and the endorsed SDCofA standing threat indices." },
    { question: "Which Monarch Castle products are free?", answer: "Every current public dashboard, methodology page, and standing index remains free and open. The Keep public workspace is also free." },
    { question: "Who publishes the SDCofA products?", answer: "SDCofA (Strategic Data Company of Ankara) is the endorsed analytical unit of Monarch Castle Technologies and publishes BNTI, WTI, MENA, election, and GeoRisk intelligence surfaces." }
  ],
  platform: [
    { question: "What is The Keep?", answer: "The Keep is a unified early-warning workspace that combines geopolitical, economic, energy, and supply-chain signals into one source-visible public workspace." },
    { question: "Does The Keep replace the public dashboards?", answer: "No. BNTI's withdrawal notice, WTI, MENA, and every current public product remain independently accessible without an account. The Keep displays public snapshots, a local watchlist and source-linked records." },
    { question: "Does the public platform preview store private customer data?", answer: "No. The live public preview reads only published product outputs. Private customer data is not collected or stored in that preview." }
  ],
  pricing: [{ question: "Is The Keep free?", answer: "Yes. The public workspace, dashboards, source links and methods are free to explore without payment or an account." }],
  methodology: [
    { question: "How should an index value be interpreted?", answer: "Treat each index as a focused analytical lens. Open the methodology route before quoting a score so provenance, cadence, limitations, and evidence status are visible." },
    { question: "How often do standing indices refresh?", answer: "Each product declares its own update cadence and publication state. BNTI's index is currently withheld after classification failure; its endpoint carries a withdrawal notice." },
    { question: "Are forecasts investment advice?", answer: "No. Forecast and index outputs are analytical aids, not investment advice or official government intelligence. Evaluation rules and limitations are published on the methodology and trust routes." }
  ],
  trust: [
    { question: "What public commitments does the trust center publish?", answer: "The trust center covers provenance, claims policy, forecast evidence rules, security reporting, licensing, and the SDCofA endorsement relationship." },
    { question: "How are security issues reported?", answer: "Report vulnerabilities through the published security policy rather than a public issue. The security route is linked from the trust center and site footer." },
    { question: "What does SDCofA endorsement mean?", answer: "SDCofA is identified as the endorsed analytical unit of Monarch Castle Technologies. The relationship is explicit on company, products, and SDCofA routes." }
  ],
  developers: [
    { question: "Is there a public JSON API?", answer: "Yes. GET /api, /api/bnti, /api/wti, /api/mena, and /api/indices are public read-only endpoints with optional ?country= and ?top= query parameters. No API key is required." },
    { question: "Is there an MCP endpoint?", answer: "Yes. POST https://monarchcastle.com/mcp exposes get_index, get_bnti, list_indices, and get_site_page over streamable HTTP. Server card: /.well-known/mcp/server-card.json." },
    { question: "Where is the source code?", answer: "Public repositories live under https://github.com/MonarchCastleTech and https://github.com/SDCofA. Repository links are listed on the developers route." }
  ],
  impact: [{ question: "How should outputs be used?", answer: "Read each observation with its source, date, method and limitations. Separate published statistics, proxies and forecast probabilities." }],
  pilot: [{ question: "How do I start?", answer: "Open The Keep or browse the dataset catalogue. Access is free and no intake is required." }],
  datasets: [
    { question: "Where can I download standing index JSON?", answer: "Use GET /api/bnti, /api/wti, /api/mena, /api/indices or the canonical snapshots under /sdcofa/<index>/<index>_data.json. BNTI currently returns a withdrawal notice, not a valid score. The API catalog is at /.well-known/api-catalog." },
    { question: "Does third-party data remain under its original terms?", answer: "Yes. Third-party data remains subject to its original terms. The datasets route documents public source routes and analytical scope." }
  ],
  insights: [
    { question: "What is published on Insights?", answer: "Insights shows live public signal snapshots and selected governed records without fabricated activity feeds or unsupported performance claims." },
    { question: "Is there an RSS feed?", answer: "Yes. Subscribe at /insights/feed.xml for automatically published, source-visible outputs from the public portfolio." }
  ],
  company: [
    { question: "Where is Monarch Castle Technologies based?", answer: "The company operates from Ankara, Türkiye and publishes open data instruments and analytical methods." },
    { question: "What is SDCofA?", answer: "SDCofA (Strategic Data Company of Ankara) is the endorsed analytical unit of Monarch Castle Technologies and publishes the standing threat indices." }
  ],
  solutions: [
    { question: "How does delivery work?", answer: "Start with the decision and exposure, add only sources and models that materially improve it, then keep open products independently usable above a unified workflow layer." }
  ],
  home: []
};
const homeFaq = pageFaqs.home.length ? pageFaqs.home : [
  {
    question: "What is Monarch Castle Technologies?",
    answer: "Monarch Castle Technologies is an independent technology company that publishes transparent early-warning and decision-intelligence products for private-sector operators. The public portfolio and The Keep are free."
  },
  {
    question: "What is The Keep?",
    answer: "The Keep is a unified early-warning workspace that brings geopolitical, economic, energy, and supply-chain signals into one source-visible operating picture without paywalling the existing public dashboards."
  },
  {
    question: "What are BNTI, WTI, and MENA?",
    answer: "BNTI is the Border Neighbor Threat Index for Türkiye's land-neighbor relationships, WTI covers global geopolitical pressure, and MENA covers Middle East and North Africa regional risk. BNTI's current score is withheld because its article classification failed."
  },
  {
    question: "Are Monarch Castle public products free?",
    answer: "Yes. Every current public product, methodology page, and standing index remains free and open. The Keep public workspace is free to explore without an account."
  },
  {
    question: "How can an application read the standing indices?",
    answer: "Read-only JSON is available at GET /api/bnti, GET /api/wti, GET /api/mena, and GET /api/indices with optional ?country= and ?top= query parameters. An MCP endpoint is also available at POST /mcp. No API key is required."
  },
  {
    question: "Who publishes the standing indices?",
    answer: "SDCofA (Strategic Data Company of Ankara) is the endorsed analytical unit of Monarch Castle Technologies. It publishes public threat products with declared methods and publication status; BNTI's score is currently withheld."
  }
];
pageFaqs.home = homeFaq;

function faqsForSlug(slug) {
  return pageFaqs[slug] ?? [];
}

function renderPageFaq(slug) {
  const faqs = faqsForSlug(slug);
  if (!faqs.length) return "";
  return `
    <section class="entity-definitions page-faq" id="faq" aria-labelledby="page-faq-heading">
      <div class="section-heading">
        <div><p class="eyebrow">FAQ</p><h2 id="page-faq-heading">Common questions</h2></div>
        <p>Direct answers on access, methods, and the scope of our products.</p>
      </div>
      <div class="faq-block">
        ${faqs.map((entry) => `<details><summary>${escapeHtml(entry.question)}</summary><p>${escapeHtml(entry.answer)}</p></details>`).join("")}
      </div>
    </section>`;
}

function pageExtraJsonLd(page, canonical) {
  const orgRef = { "@id": `${canonicalOrigin}/#organization` };
  const blocks = [];
  if (page.slug === "home") {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "@id": `${canonicalOrigin}/platform/#the-keep`,
      name: "The Keep",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: `${canonicalOrigin}/platform/`,
      description: "Unified early-warning workspace combining public geopolitical, economic, energy, and supply-chain indicators.",
      publisher: orgRef,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "The Keep and public products are free to explore." }
    });
  }
  if (page.slug === "products") {
    const items = flagshipProducts.concat(endorsedProducts).map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "SoftwareApplication",
        name: product.name,
        applicationCategory: "BusinessApplication",
        url: product.canonicalUrl,
        description: presentationFor(product).summary,
        publisher: orgRef,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }
      }
    }));
    blocks.push({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Monarch Castle Technologies product portfolio",
      url: canonical,
      itemListElement: items
    });
  }
  if (page.slug === "platform") {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "@id": `${canonicalOrigin}/platform/#the-keep`,
      name: "The Keep",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: `${canonicalOrigin}/platform/`,
      description: page.description,
      publisher: orgRef
    });
  }
  if (page.slug === "pricing") {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "OfferCatalog",
      name: "The Keep access",
      url: canonical,
      publisher: orgRef,
      itemListElement: [
        { "@type": "Offer", name: "Open products", price: "0", priceCurrency: "USD", description: "Every current public dashboard and methodology." },
      ]
    });
  }
  if (page.slug === "datasets" || page.slug === "home") {
    const datasets = routes.dashboardMounts.map((mount) => ({
      "@type": "Dataset",
      name: mount.label,
      url: `${canonicalOrigin}${mount.path}`,
      keywords: `${mount.slug}, threat index, open-source intelligence`,
      creator: { "@type": "Organization", name: "SDCofA", url: `${canonicalOrigin}/sdcofa/` },
      isAccessibleForFree: true,
      distribution: {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        contentUrl: `${canonicalOrigin}/api/${mount.slug}`
      }
    }));
    blocks.push({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${canonical}#collection`,
      name: page.title,
      url: canonical,
      publisher: orgRef,
      hasPart: datasets
    });
  }
  if (page.slug === "methodology") {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Methodology and evidence rules",
      url: canonical,
      author: orgRef,
      publisher: orgRef,
      mainEntityOfPage: canonical,
      about: ["provenance", "forecast evaluation", "index limitations"],
      isAccessibleForFree: true
    });
  }
  if (page.slug === "insights") {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "Blog",
      name: page.title,
      url: canonical,
      publisher: orgRef,
      blogPost: publicSignals.map((record) => ({
        "@type": "BlogPosting",
        headline: `${record.label} public signal: ${record.value.toFixed(2)}`,
        url: `${canonicalOrigin}${record.path}`,
        datePublished: record.generatedAt ?? undefined,
        author: orgRef
      }))
    });
  }
  if (page.slug === "company") {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "AboutPage",
      url: canonical,
      name: page.title,
      mainEntity: {
        "@id": `${canonicalOrigin}/#organization`,
        subOrganization: {
          "@type": "Organization",
          name: "Strategic Data Company of Ankara",
          alternateName: "SDCofA",
          url: `${canonicalOrigin}/sdcofa/`
        }
      }
    });
  }
  if (page.slug === "pilot" || page.slug === "solutions" || page.slug === "impact") {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "Service",
      name: page.slug === "pilot" ? "Public data exploration" : page.title.split("|")[0].trim(),
      url: canonical,
      provider: orgRef,
      serviceType: "Decision intelligence",
      areaServed: "Private-sector operators with cross-border exposure",
      isAccessibleForFree: true
    });
  }
  return blocks;
}
const productPresentation = {
  "caspian-black-sea-monitor": {
    summary: "A source-backed corridor warning indicator with declared analyst weights; its score is not an event probability.",
    signal: "Maritime corridors"
  },
  "climate-security-index": {
    summary: "Source-linked climate and security headlines. The feed is a topical sample and does not produce a risk score.",
    signal: "Climate news"
  },
  "conflict-early-warning": {
    summary: "Source-linked conflict headlines for reading. The feed does not calculate an early-warning probability.",
    signal: "Conflict news"
  },
  "cyber-exposure-map": {
    summary: "Source-linked cyber incident and vulnerability headlines, with no geographic exposure map or score.",
    signal: "Cyber news"
  },
  "cloudy-shiny": {
    summary: "A market sentiment composite built from observed prices and public fear/greed feeds; it does not forecast returns.",
    signal: "Market conditions"
  },
  "defense-procurement": {
    summary: "Tracks sourced procurement and policy signals through an analyst-weighted indicator, not an official procurement statistic.",
    signal: "Defense procurement"
  },
  econmap: {
    summary: "Source-linked country indicators with explicitly illustrative scenarios. Unsupported composite risk and regional figures are withheld.",
    signal: "Economic landscape"
  },
  esgmap: {
    summary: "Maps sourced ESG indicators and an openly weighted editorial composite; missing observations remain unavailable.",
    signal: "Sustainability intelligence"
  },
  macrointel: {
    summary: "World Bank macro data and UN Comtrade goods exports; inbound trade links are labeled as mirrored partner exports where needed.",
    signal: "Macro intelligence"
  },
  "mena-energy-flow": {
    summary: "A source-backed regional warning proxy for energy corridors; the score is not measured shipment volume or a risk probability.",
    signal: "Regional energy"
  },
  "milcodec-receiver": {
    summary: "A technical decoder demonstration with sample packets and a shared demo key; it does not publish operational intelligence.",
    signal: "Technical demonstration"
  },
  "nuclear-energy-intelligence": {
    summary: "OWID-derived nuclear electricity shares for 23 selected countries, with observation years. Unsourced facility and project modules are withheld pending record-level verification.",
    signal: "Nuclear electricity"
  },
  "nuclear-proliferation-watch": {
    summary: "Source-linked nuclear policy headlines. No facility-level or proliferation-risk estimate is published.",
    signal: "Nuclear news"
  },
  "port-congestion-pulse": {
    summary: "A declared early-warning proxy from port, weather, and disaster feeds; it is not a direct measure of vessel waiting time.",
    signal: "Port conditions"
  },
  prepturk: {
    summary: "A static preparedness resource grounded in official sources; it does not provide live alerts or a public AI service.",
    signal: "Preparedness"
  },
  "superlig-forecast": {
    summary: "Current-season probabilities use all 18 official TFF clubs and completed results in a historically evaluated structural model. No current squad values are imputed.",
    signal: "Football forecasting"
  },
  supplychain: {
    summary: "Browse source-linked company profiles and disclosed research gaps; unsupported global supply links have been removed.",
    signal: "Supply networks"
  },
  "sanctions-exposure-index": {
    summary: "Source-linked sanctions headlines. No country or company exposure index is currently calculated.",
    signal: "Sanctions news"
  },
  "tr-economic-sentiment": {
    summary: "A deterministic anomaly indicator using TCMB, FRED, OECD, and news inputs; its composite is not an official statistic.",
    signal: "Economic sentiment"
  },
  "border-neighbor-threat-index": {
    summary: "Index publication is paused after article attribution failed; the prior country scores have been withdrawn.",
    signal: "Border risk"
  },
  "mena-threat-index": {
    summary: "A source-linked news pressure indicator. Its experimental forecast did not outperform a naive baseline in the published review.",
    signal: "Regional threat"
  },
  "world-threat-index": {
    summary: "A news-flow threat indicator using article classification, with substantial low-confidence heuristic coverage disclosed.",
    signal: "Global threat"
  },
  election: {
    summary: "A sourced election calendar; grade-D structural simulations are retained for method review but numerical win probabilities are withheld.",
    signal: "Election watch"
  },
  georisk: {
    summary: "Country probabilities are withheld while the last forecast snapshot is past its validity window.",
    signal: "Geographic risk"
  }
};

function presentationFor(product) {
  return productPresentation[product.id] ?? {
    summary: "Purpose-built intelligence for decisions that demand clear context and usable outputs.",
    signal: sentenceCase(product.family)
  };
}

function readPublicSignalSnapshot() {
  const records = [];
  for (const mount of routes.dashboardMounts) {
    const source = path.join(cacheRoot, mount.repoKey, mount.dataFile);
    if (!fs.existsSync(source)) continue;
    try {
      const payload = JSON.parse(fs.readFileSync(source, "utf8"));
      const value = asFinite(payload?.meta?.main_index);
      if (payload?.meta?.withdrawn || value === null) continue;
      const countries = Object.entries(payload?.countries ?? {}).map(([code, record]) => ({
        name: record?.name ?? code,
        value: asFinite(record?.index)
      })).filter((record) => record.value !== null).sort((a, b) => b.value - a.value).slice(0, 3);
      records.push({
        generatedAt: payload?.meta?.generated_at ?? payload?.meta?.issued_at ?? null,
        label: mount.label,
        path: mount.path,
        status: payload?.meta?.status ?? "Published",
        top: countries,
        value
      });
    } catch {
      // A malformed upstream is excluded; mounted-artifact verification remains authoritative.
    }
  }
  return records;
}

function renderPublicSignalSnapshot() {
  if (!publicSignals.length) return "";
  return `<section aria-labelledby="public-snapshot-heading">
    <div class="section-heading"><div><p class="eyebrow">Live operating picture</p><h2 id="public-snapshot-heading">What deserves attention now</h2></div><p>${publicSignals.length} independent intelligence views, refreshed automatically and ready to explore.</p></div>
    <div class="workspace-metrics">${publicSignals.map((record) => `<article><span>${escapeHtml(record.label)}</span><strong>${record.value.toFixed(2)}</strong><small>${escapeHtml(record.status)}</small></article>`).join("")}</div>
    <div class="insight-grid">${publicSignals.map((record) => `<article><h3>${escapeHtml(record.label)}</h3><p>${record.top.length ? `Priority exposures: ${record.top.map((item) => `${escapeHtml(item.name)} ${item.value.toFixed(2)}`).join(", ")}.` : "Open the dashboard for the current regional picture."}</p>${localOrExternalLink(record.path, "Open intelligence view")}</article>`).join("")}</div>
    <p class="platform-disclaimer">Each index is a focused intelligence lens. Open any view for its drivers, sources, and method.</p>
  </section>`;
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
    <article class="product-card system-row" data-search="${escapeHtml(product.name + " " + product.family + " " + product.regions.join(" "))}" data-family="${escapeHtml(product.family)}" data-product-id="${escapeHtml(product.id)}">
      <div class="product-mark">${renderMark(product)}</div>
      <div class="system-row-index" aria-hidden="true">${escapeHtml(product.id.slice(0, 3).toUpperCase())}</div>
      <div class="system-row-copy">
        <p class="eyebrow">${escapeHtml(sentenceCase(product.family))}</p>
        <h3>${escapeHtml(product.name)}</h3>
      </div>
      <p>${escapeHtml(presentationFor(product).summary)}</p>
      <dl class="system-row-meta"><div><dt>Owner</dt><dd>${escapeHtml(product.owner === "MonarchCastleTech" ? "Monarch Castle Technologies" : product.owner)}</dd></div><div><dt>Cadence</dt><dd>${escapeHtml(product.updateFrequency === "review-required" ? "Not specified" : product.updateFrequency)}</dd></div></dl>
      <div class="card-actions">
        ${localOrExternalLink(product.canonicalUrl, "Explore system")}
        ${localOrExternalLink(methodologyUrlFor(product), "How it works")}
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


function renderInsights() {
  return `<div class="insight-grid">${editorial.insights.map((insight) => `
    <article>
      <h3>${escapeHtml(insight.title)}</h3>
      <p>${escapeHtml(insight.summary)}</p>
      ${localOrExternalLink(insight.url, "Read analysis")}
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


function renderLiveWorkspace() {
  return `<div class="keep-workspace" aria-label="The Keep public workspace">
    <div class="keep-toolbar"><label>Find a country<input id="keep-search" type="search" placeholder="Search country names" /></label><label>Source<select id="keep-source"><option value="">All sources</option><option value="wti">WTI</option><option value="mena">MENA</option><option value="bnti">BNTI</option></select></label><label class="watchlist-toggle"><input id="keep-watchlist" type="checkbox" />Watchlist only</label><button id="keep-export" type="button">Export source records <span aria-hidden="true">↓</span></button></div>
    <section class="exposure-panel" id="exposure-panel" aria-labelledby="readings-heading"><header class="readings-heading"><h3 id="readings-heading">Published country readings</h3><span id="feed-state" role="status">Connecting</span></header>
      <div class="data-table" tabindex="0" aria-label="Scrollable published country readings"><table><thead><tr><th scope="col">Country</th><th scope="col">Source</th><th scope="col">Reading</th><th scope="col">Publication state</th><th scope="col">Source date</th><th scope="col"><span class="sr-only">Watchlist</span></th><th scope="col"><span class="sr-only">Source link</span></th></tr></thead><tbody id="exposure-list"><tr><td colspan="7">Loading published records.</td></tr></tbody></table></div>
    </section><p class="workspace-note" id="platform-note">Each index has its own scale and method. Open its source view before comparing or quoting a value.</p>
    <details class="signal-panel" id="signal-panel"><summary>Recent published events</summary><ol id="signal-list"><li>Reading source events.</li></ol></details>
  </div>`;
}

function renderHome() {
  return renderDataHome({
    workspace: renderLiveWorkspace(),
    faq: '<div class="faq-block">' + homeFaq.map(entry => '<details><summary>' + escapeHtml(entry.question) + '</summary><p>' + escapeHtml(entry.answer) + '</p></details>').join("") + '</div>'
  });
}

function renderPlatform() {
  return renderFreeKeep({ intro: pageIntro, workspace: renderLiveWorkspace(), next: nextAction });
}

function renderImpact() {
  return `${pageIntro("Applications", "Put observations in context", "Inspect energy, logistics, economic and geopolitical observations in their original analytical context.")}
    <section class="evidence-chain"><div class="evidence-steps"><article><span>Energy</span><h2>Compare observation years</h2><p>Open nuclear electricity and ESG records with their source years and missingness.</p><a href="https://monarchcastle.com/NuclearEnergyIntelligence/">Nuclear electricity →</a></article><article><span>Geopolitics</span><h2>Follow the source trail</h2><p>Read WTI and MENA as news pressure indicators, with distinct methods and uncertainty.</p><a href="/sdcofa/wti/">World Threat Index →</a></article><article><span>Economics</span><h2>Inspect the measure</h2><p>Compare sourced macroeconomic observations and trade records within their stated scope.</p><a href="https://monarchcastle.com/macrointel/">MacroIntel →</a></article></div></section>
    ${nextAction("/datasets/", "Explore the collection", "Choose a subject, inspect a source and read its method.", "Browse datasets")}`;
}

function renderPricing() {
  return renderFreeAccess({ intro: pageIntro, next: nextAction, previous: false });
}

function renderPilot() {
  return renderFreeAccess({ intro: pageIntro, next: nextAction, previous: true });
}

function renderProducts() {
  return `${pageIntro("Products", "Intelligence systems for consequential decisions", "Explore Monarch Castle Technologies products and the SDCofA threat-intelligence family.")}
    <div class="catalogue-filter"><label>Search instruments<input id="catalogue-search" type="search" placeholder="Country, subject or instrument" /></label><label>Subject<select id="catalogue-family"><option value="">All subjects</option>${[...new Set(site.products.map(p => p.family))].map(f => `<option>${escapeHtml(f)}</option>`).join("")}</select></label><p id="catalogue-count" role="status"></p></div>
    <section class="owner-portfolio-section owner-portfolio-section--flagship" aria-labelledby="flagship-heading">
      <div class="section-heading"><div><p class="eyebrow">Product owner</p><h2 id="flagship-heading">Monarch Castle Technologies</h2></div><p>Each system turns a defined information problem into a focused analytical experience.</p></div>
      ${renderProductGrid(flagshipProducts)}
    </section>
    <section class="sdcofa-band owner-portfolio-section owner-portfolio-section--endorsed" aria-labelledby="endorsed-heading"><div class="section-heading"><div><p class="eyebrow">Endorsed analytical unit</p><h2 id="endorsed-heading">SDCofA</h2></div><p>Source-linked indicators and analytical methods.</p></div>${renderProductGrid(endorsedProducts)}</section>
    ${nextAction("/datasets/", "See the intelligence foundations", "Continue to the public source and methodology routes behind the portfolio.", "Browse datasets and sources")}`;
}

function renderDatasets() {
  return `${pageIntro("Datasets and sources", "Source routes and analytical scope", "Explore the public methods and source records behind each system. Third-party data remains subject to its original terms.")}
    <div class="catalogue-filter"><label>Search datasets<input id="catalogue-search" type="search" placeholder="Country, subject or instrument" /></label><label>Subject<select id="catalogue-family"><option value="">All subjects</option>${[...new Set(site.products.map(p => p.family))].map(f => `<option>${escapeHtml(f)}</option>`).join("")}</select></label><p id="catalogue-count" role="status"></p></div>
    <section aria-labelledby="catalog-heading">
      <div class="section-heading"><h2 id="catalog-heading">Public source catalog</h2><p>Move directly from a product to the method that supports it.</p></div>
      <div class="table-wrap" tabindex="0" aria-label="Scrollable dataset catalog">
        <table>
          <thead><tr><th scope="col">Product</th><th scope="col">Intelligence family</th><th scope="col">Method</th></tr></thead>
          <tbody>${site.products.map((product) => `<tr data-product-id="${escapeHtml(product.id)}" data-search="${escapeHtml(product.name + " " + product.family + " " + product.regions.join(" "))}" data-family="${escapeHtml(product.family)}">
            <th scope="row">${localOrExternalLink(product.canonicalUrl, product.name)}</th>
            <td>${escapeHtml(sentenceCase(product.family))}</td>
            <td>${localOrExternalLink(methodologyUrlFor(product), "Explore method")}</td>
          </tr>`).join("")}</tbody>
        </table>
      </div>
    </section>
    ${nextAction("/methodology/", "Understand the evidence rules", "Review provenance, missing-data, claims, and forecast evaluation constraints.", "Read methodology")}`;
}

function renderSolutions() {
  return `${pageIntro("Analytical process", "From observation to interpretation", "Sources, methods and explicit limitations connect the public collection.")}
    <section>${renderCapabilities()}</section>
    ${nextAction("/platform/", "Inspect the published evidence", "The Keep brings public snapshots and source records into one free workspace.", "Open The Keep")}`;
}

function renderInsightsPage() {
  return `${pageIntro("Insights", "Live signals. Clear next steps.", "See where pressure is building, compare intelligence views, and move directly into the underlying evidence.")}
    ${renderPublicSignalSnapshot()}
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
      <div><p>Read each product's evaluation record before interpreting its forecast. The portfolio does not claim validated predictive performance from a protocol alone.</p><ol><li>Define the target, horizon, observation unit and outcome rule before evaluation.</li><li>Use only information available at the forecast date. Keep event, publication and ingestion dates distinct.</li><li>Evaluate in forward time against declared naive baselines.</li><li>Publish scoring rules, calibration, missingness and sample limits with the results.</li><li>Withhold numerical claims when evidence or source attribution fails.</li></ol></div>
    </section>
    <section id="platform-formula" class="platform-boundary" aria-labelledby="platform-method-heading">
      <div><p class="eyebrow">The Keep preview</p><h2 id="platform-method-heading">Separate measures. Visible sources.</h2></div>
      <div><p>The live preview reads each product's published <code>meta.main_index</code>, status, timestamp, country records, and events. It does not alter upstream scores or combine indices that use different scales.</p><p>Country readings are grouped by index and ordered within each product. Event rows retain source links and timestamps. Failed feeds are reported as unavailable without substitute values.</p></div>
    </section>
    <section class="trust-grid" aria-label="Reproducibility controls"><article><h2>Versioned inputs</h2><p>Each mounted product output carries its own generation time, model version, and source boundary where available.</p></article><article><h2>Deterministic presentation</h2><p>Given the same JSON outputs, the platform preview produces the same metrics, rankings, and event order.</p></article><article><h2>Failure visibility</h2><p>Feed failures remain visible; the interface does not silently fabricate substitute values.</p></article></section>
    <section aria-labelledby="methods-catalog-heading">
      <div class="section-heading"><h2 id="methods-catalog-heading">Product methodology routes</h2></div>
      <ul class="method-list">${site.products.map((product) => `<li><span>${escapeHtml(product.name)}</span>${localOrExternalLink(methodologyUrlFor(product), "Open method")}</li>`).join("")}</ul>
    </section>
    ${nextAction("/trust/", "Review the public trust commitments", "Continue to claims, security, licensing, provenance, and endorsement.", "Open trust center")}`;
}

// The election repository publishes from master; preserve the governed registry projection.
function methodologyUrlFor(product) {
  return product.id === "election" ? product.methodologyUrl.replace("/blob/main/", "/blob/master/") : product.methodologyUrl;
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
  return `${pageIntro("Company", site.brand.masterbrand, "An independent technology company publishing transparent data instruments and analytical methods.")}
    <section class="split-section"><div><p class="eyebrow">Our work</p><h2>Inspectable observations.</h2></div><div><p>The Keep brings the public collection together in a free workspace. Every instrument keeps its own sources and limitations.</p><a href="/platform/">Open The Keep →</a></div></section>
    <section class="endorsed-panel"><div><p class="eyebrow">Endorsed analytical unit</p><h2>SDCofA</h2><p>Strategic Data Company of Ankara is the endorsed analytical unit of Monarch Castle Technologies.</p></div><div class="contact-card"><h3>Contact & contribution</h3><p>Inspect our repositories, raise a source correction or contribute through the public project routes.</p><a href="https://github.com/MonarchCastleTech">GitHub organization ↗</a></div></section>
    ${nextAction("/trust/", "Read our public commitments", "Sources, licensing, security and analytical limitations.", "Open trust center")}`;
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
  const body = renderer();
  if (page.slug === "home") return body;
  return `${body}${renderPageFaq(page.slug)}`;
}

function renderNav(currentPath) {
  const navigation = [
    { label: "Our systems", path: "/products/" },
    { label: "Data", path: "/datasets/" },
    { label: "Research & methods", path: "/methodology/" },
    { label: "Company", path: "/company/" }
  ];
  return navigation.map((item) => {
    const current = item.path === currentPath ? ' aria-current="page"' : "";
    return `<li><a href="${item.path}"${current}>${escapeHtml(item.label)}</a></li>`;
  }).join("");
}

function breadcrumbJsonLd(page, canonical) {
  const items = [{ "@type": "ListItem", position: 1, name: "Home", item: `${canonicalOrigin}/` }];
  if (page.path !== "/") {
    items.push({ "@type": "ListItem", position: 2, name: page.title.split("|")[0].trim(), item: canonical });
  }
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items
  };
}

function faqJsonLd(faqs, canonical) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer }
    })),
    url: canonical
  };
}

function renderPage(page) {
  const canonical = `${canonicalOrigin}${page.path}`;
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${canonicalOrigin}/#organization`,
    name: site.brand.masterbrand,
    url: `${canonicalOrigin}/`,
    logo: {
      "@type": "ImageObject",
      url: `${canonicalOrigin}/assets/products/logo.png`
    },
    description: site.brand.positioning,
    sameAs: ["https://github.com/MonarchCastleTech", "https://github.com/SDCofA"],
    publishingPrinciples: `${canonicalOrigin}/trust/`,
    knowsAbout: [
      "early-warning intelligence",
      "threat indices",
      "decision intelligence",
      "geopolitical risk",
      "supply-chain exposure"
    ]
  };
  const webSite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${canonicalOrigin}/#website`,
    name: site.brand.masterbrand,
    url: `${canonicalOrigin}/`,
    description: page.slug === "home" ? site.brand.positioning : page.description,
    inLanguage: "en",
    publisher: { "@id": `${canonicalOrigin}/#organization` }
  };
  const webPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${canonical}#webpage`,
    url: canonical,
    name: page.title,
    description: page.description,
    inLanguage: "en",
    isPartOf: { "@id": `${canonicalOrigin}/#website` },
    about: { "@id": `${canonicalOrigin}/#organization` },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: `${canonicalOrigin}/assets/approved/social-preview.png`,
      width: 1200,
      height: 630
    }
  };
  const pageFaqsList = faqsForSlug(page.slug);
  const jsonLdBlocks = [organization, webSite, webPage, breadcrumbJsonLd(page, canonical), ...pageExtraJsonLd(page, canonical)];
  if (pageFaqsList.length) jsonLdBlocks.push(faqJsonLd(pageFaqsList, canonical));
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${escapeHtml(page.title)}</title>
  <meta name="description" content="${escapeHtml(page.description)}" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <meta name="author" content="${escapeHtml(site.brand.masterbrand)}" />
  <meta name="theme-color" content="#F2F3F0" />
  <link rel="canonical" href="${canonical}" />
  <link rel="alternate" hreflang="en" href="${canonical}" />
  <link rel="alternate" hreflang="x-default" href="${canonical}" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="en_US" />
  <meta property="og:title" content="${escapeHtml(page.title)}" />
  <meta property="og:description" content="${escapeHtml(page.description)}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:site_name" content="${escapeHtml(site.brand.masterbrand)}" />
  <meta property="og:image" content="${canonicalOrigin}/assets/approved/social-preview.png" />
  <meta property="og:image:alt" content="${escapeHtml(site.brand.masterbrand)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(page.title)}" />
  <meta name="twitter:description" content="${escapeHtml(page.description)}" />
  <meta name="twitter:image" content="${canonicalOrigin}/assets/approved/social-preview.png" />
  <meta name="twitter:image:alt" content="${escapeHtml(site.brand.masterbrand)}" />
  <link rel="alternate" type="application/rss+xml" title="Monarch Castle public signals" href="/insights/feed.xml" />
  <link rel="icon" type="image/png" href="/assets/products/logo.png" />
  <link rel="apple-touch-icon" href="/assets/products/logo.png" />
  <link rel="manifest" href="/site.webmanifest" />
  <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
  <link rel="alternate" type="text/plain" href="/llms.txt" title="LLM Context" />
  <link rel="alternate" type="text/plain" href="/llms-full.txt" title="Full LLM Context" />
  <link rel="describedby" type="text/plain" href="/llms.txt" title="LLM Context" />
  <link rel="ard" type="application/json" href="/.well-known/ard.json" title="ARD manifest" />
  <link rel="ai-catalog" type="application/json" href="/.well-known/ai-catalog.json" title="AI catalog" />
  <link rel="api-catalog" type="application/json" href="/.well-known/api-catalog" title="API catalog" />
  <link rel="agent" type="application/json" href="/.well-known/agent.json" title="Agent card" />
  <link rel="preload" as="image" href="/assets/products/logo.png" />
  <link rel="stylesheet" href="/styles/site.css" />
  <link rel="stylesheet" href="/styles/identity.css" />
  ${jsonLdBlocks.map((block) => `<script type="application/ld+json">${JSON.stringify(block)}</script>`).join("\n  ")}
  <script>
  (function () {
    try {
      if (navigator.modelContext && navigator.modelContext.provideContext) {
        navigator.modelContext.provideContext({
          tools: [
            {
              name: "open_monarchcastle_page",
              description: "Open a canonical page of monarchcastle.com by short name: products, platform, insights, methodology, trust, company, developers, sdcofa, bnti, wti, mena.",
              inputSchema: {
                type: "object",
                properties: { page: { type: "string", enum: ["products", "platform", "insights", "methodology", "trust", "company", "developers", "sdcofa", "bnti", "wti", "mena"] } },
                required: ["page"]
              },
              execute: function (input) {
                var map = { products: "/products/", platform: "/platform/", insights: "/insights/", methodology: "/methodology/", trust: "/trust/", company: "/company/", developers: "/developers/", sdcofa: "/sdcofa/", bnti: "/sdcofa/bnti/", wti: "/sdcofa/wti/", mena: "/sdcofa/mena/" };
                var path = map[input.page] || "/products/";
                window.location.href = path;
                return { opened: path };
              }
            }
          ]
        });
      }
    } catch (e) {}
  })();
  </script>
</head>
<body data-page="${escapeHtml(page.slug)}">
  <a class="skip-link" href="#main-content">Skip to main content</a>
  <header class="site-header masthead">
    <a class="wordmark" href="/" aria-label="${escapeHtml(site.brand.masterbrand)} home">
      <span class="brand-symbol"><img class="brand-logo" src="/assets/products/logo.png" alt="" /></span>
      <span>Monarch Castle<small>Technologies</small></span>
    </a>
    <nav aria-label="Primary"><ul>${renderNav(page.path)}</ul></nav>
    <a class="header-action" href="${secureWorkspaceUrl}">Open The Keep</a>
    <details class="mobile-nav"><summary><span class="sr-only">Menu</span></summary><nav aria-label="Mobile"><a href="/products/">Our systems</a><a href="/datasets/">Data</a><a href="/methodology/">Research & methods</a><a href="/company/">Company</a></nav></details>
  </header>
  <main id="main-content" tabindex="-1">${renderBody(page)}</main>
  <footer class="site-footer">
    <a class="footer-brand" href="/">Monarch Castle</a>
    <div><span>Technologies</span><nav aria-label="Trust and company"><a href="/trust/">Trust & limitations</a><a href="/developers/">Developers</a><a href="/insights/">Research</a><a href="/pricing/">Free access</a><a href="${escapeHtml(editorial.securityUrl)}">Security</a><a href="${escapeHtml(editorial.licenseUrl)}">License</a><a href="/company/">Contact</a></nav></div>
    <p>SDCofA is the endorsed analytical unit of Monarch Castle Technologies.</p>
  </footer>
  ${["products", "datasets"].includes(page.slug) ? '<script type="module" src="/scripts/catalogue.js"></script>' : ""}
  ${page.slug === "home" ? '<script type="module" src="/scripts/hero-loader.js"></script>' : ""}
  ${["home", "platform"].includes(page.slug) ? '<script type="module" src="/scripts/platform.js"></script>' : ""}
</body>
</html>
`;
}

function xmlEscape(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[character]);
}

function renderRssFeed() {
  const items = publicSignals.map((record) => {
    const published = record.generatedAt && !Number.isNaN(new Date(record.generatedAt).valueOf()) ? `<pubDate>${new Date(record.generatedAt).toUTCString()}</pubDate>` : "";
    const description = `${record.label} published ${record.value.toFixed(2)} (${record.status}). ${record.top.map((item) => `${item.name} ${item.value.toFixed(2)}`).join(", ")}`;
    return `<item><title>${xmlEscape(record.label)} public signal: ${record.value.toFixed(2)}</title><link>${canonicalOrigin}${record.path}</link><guid isPermaLink="false">${xmlEscape(`${record.label}:${record.generatedAt ?? record.value}`)}</guid><description>${xmlEscape(description)}</description>${published}</item>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Monarch Castle public signals</title><link>${canonicalOrigin}/insights/</link><description>Automatically published, source-visible outputs from Monarch Castle Technologies and its endorsed analytical portfolio.</description><language>en</language>${items}</channel></rss>`;
}

function renderSitemap() {
  const paths = [
    ...routes.sitePages.map((page) => page.path),
    ...routes.localPages.map((page) => page.path),
    ...routes.dashboardMounts.map((mount) => mount.path)
  ];
  const lastmod = new Date().toISOString().slice(0, 10);
  const changefreqFor = (pagePath) => {
    if (pagePath === "/" || routes.dashboardMounts.some((mount) => mount.path === pagePath)) return "daily";
    if (pagePath === "/insights/" || pagePath === "/datasets/") return "weekly";
    return "monthly";
  };
  const priorityFor = (pagePath) => {
    if (pagePath === "/") return "1.0";
    if (routes.dashboardMounts.some((mount) => mount.path === pagePath)) return "0.9";
    if (["/products/", "/platform/", "/sdcofa/", "/mcp/"].includes(pagePath)) return "0.8";
    return "0.7";
  };
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((pagePath) => `<url><loc>${canonicalOrigin}${xmlEscape(pagePath)}</loc><lastmod>${lastmod}</lastmod><changefreq>${changefreqFor(pagePath)}</changefreq><priority>${priorityFor(pagePath)}</priority></url>`).join("")}</urlset>`;
}

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
fs.writeFileSync(path.join(dist, ".nojekyll"), "");

for (const page of routes.sitePages) {
  const target = path.join(dist, page.output);
  ensureParent(target);
  fs.writeFileSync(target, renderPage(page));
}

ensureParent(path.join(dist, "insights", "feed.xml"));
fs.writeFileSync(path.join(dist, "insights", "feed.xml"), renderRssFeed());
fs.writeFileSync(path.join(dist, "sitemap.xml"), renderSitemap());
const aiBots = [
  "GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-Web", "Claude-SearchBot",
  "Claude-User", "anthropic-ai", "PerplexityBot", "Perplexity-User", "Google-Extended",
  "GoogleOther", "Google-InspectionTool", "AdsBot-Google", "Applebot", "Applebot-Extended",
  "DuckAssistBot", "DuckDuckBot", "cohere-ai", "CCBot", "Amazonbot", "meta-externalagent",
  "Bytespider", "DeepSeekBot", "MistralAI-User", "YouBot", "Diffbot", "ImagesiftBot",
  "omgili", "AI2Bot", "FriendlyCrawler", "facebookbot", "Pinterestbot", "Dataprovider.com",
  "bingbot", "Bingbot", "adidxbot", "SemrushBot", "AhrefsBot", "MJ12bot", "YandexBot",
  "Timpibot", "Seekr", "NorthStarBot", "SentieoBot", "Feedly", "NetcraftSurveyBot"
];
fs.writeFileSync(path.join(dist, "robots.txt"), [
  "# AI assistants and search crawlers are explicitly welcomed to read and cite this site.",
  "Content-Signal: ai-train=yes, search=yes, ai-input=yes",
  `Agentmap: ${canonicalOrigin}/.well-known/ard.json`,
  ...aiBots.map((bot) => `User-agent: ${bot}`),
  "Allow: /",
  "",
  "User-agent: *",
  "Content-Signal: ai-train=yes, search=yes, ai-input=yes",
  "Allow: /",
  "",
  `Sitemap: ${canonicalOrigin}/sitemap.xml`,
  ""
].join("\n"));
fs.writeFileSync(path.join(dist, "llms.txt"), `# ${site.brand.masterbrand}\n\nTransparent public early-warning products and methods. The Keep brings public datasets and source records together in a free workspace.\n\n## Quick facts\n\n- ${site.brand.masterbrand}: ${canonicalOrigin}/ — independent technology company publishing transparent early-warning and decision-intelligence products for private-sector operators.\n- The Keep: ${canonicalOrigin}/platform/ — unified early-warning workspace across geopolitical, economic, energy, and supply-chain signals.\n- SDCofA: ${canonicalOrigin}/sdcofa/ — endorsed analytical unit that publishes WTI and MENA threat indices; BNTI's score is currently withdrawn.\n- Pricing: ${canonicalOrigin}/pricing/ — The Keep and the public collection are free.\n\n## Primary routes\n\n- Platform: ${canonicalOrigin}/platform/\n- Public products: ${canonicalOrigin}/products/\n- Current signals: ${canonicalOrigin}/insights/\n- RSS: ${canonicalOrigin}/insights/feed.xml\n- Methodology: ${canonicalOrigin}/methodology/\n- Trust and limitations: ${canonicalOrigin}/trust/\n- Company: ${canonicalOrigin}/company/\n- Datasets and sources: ${canonicalOrigin}/datasets/\n- Developer routes: ${canonicalOrigin}/developers/\n- Tools: ${canonicalOrigin}/tools/\n- MCP catalog: ${canonicalOrigin}/mcp/\n- REST API index: ${canonicalOrigin}/api\n- API catalog: ${canonicalOrigin}/.well-known/api-catalog\n- AI catalog: ${canonicalOrigin}/.well-known/ai-catalog.json\n- Agent card: ${canonicalOrigin}/.well-known/agent.json\n- SDCofA endorsed unit: ${canonicalOrigin}/sdcofa/\n- Source repositories: https://github.com/MonarchCastleTech and https://github.com/SDCofA\n\n## Standing indices\n\n- Border Neighbor Threat Index (score withdrawn pending classification repair): ${canonicalOrigin}/sdcofa/bnti/\n- World Threat Index: ${canonicalOrigin}/sdcofa/wti/\n- MENA Threat Index: ${canonicalOrigin}/sdcofa/mena/\n\n## Standing index JSON APIs (public, no key)\n\n- API index: GET ${canonicalOrigin}/api\n- BNTI: GET ${canonicalOrigin}/api/bnti (canonical: ${canonicalOrigin}/sdcofa/bnti/bnti_data.json)\n- WTI: GET ${canonicalOrigin}/api/wti (canonical: ${canonicalOrigin}/sdcofa/wti/wti_data.json)\n- MENA: GET ${canonicalOrigin}/api/mena (canonical: ${canonicalOrigin}/sdcofa/mena/mena_data.json)\n- Catalog: GET ${canonicalOrigin}/api/indices\n- Query: ?country=Name&top=10\n- MCP: POST ${canonicalOrigin}/mcp\n\n## FAQ\n\n- What is Monarch Castle Technologies? An independent technology company publishing transparent early-warning and decision-intelligence products for private-sector operators.\n- What is The Keep? A unified early-warning workspace that combines geopolitical, economic, energy, and supply-chain signals into one source-visible operating picture.\n- Are public products free? Yes. The Keep, public products and methods are free.\n- How do applications read the indices? GET ${canonicalOrigin}/api/bnti, ${canonicalOrigin}/api/wti, ${canonicalOrigin}/api/mena, and ${canonicalOrigin}/api/indices, or POST ${canonicalOrigin}/mcp. No API key is required.\n- Who publishes BNTI, WTI, and MENA? SDCofA (Strategic Data Company of Ankara), the endorsed analytical unit of Monarch Castle Technologies.\n- Full page answers: ${canonicalOrigin}/#answers and per-route #faq anchors on narrative pages.\n\n## Glossary\n\n- BNTI: Border Neighbor Threat Index — score withdrawn after article-classification failure; the public endpoint carries a withdrawal notice.\n- WTI: World Threat Index — comparative global geopolitical threat pressure.\n- MENA: MENA Threat Index — regional threat assessment for the Middle East and North Africa.\n- SDCofA: Strategic Data Company of Ankara — endorsed analytical unit of Monarch Castle Technologies.\n- The Keep: unified early-warning workspace layer above free public dashboards.\n- Evidence chain: source context → analytical method → decision output with explicit limitations.\n`);
const llmsFullLines = [
  `# ${site.brand.masterbrand} full corpus`,
  "",
  site.brand.positioning,
  "",
  "## Entity definitions",
  "",
  `- Monarch Castle Technologies: independent technology company publishing transparent early-warning and decision-intelligence products for private-sector operators with cross-border exposure.`,
  `- The Keep: unified early-warning workspace combining geopolitical, economic, energy, and supply-chain signals into one source-visible operating picture.`,
  `- Border Neighbor Threat Index (BNTI): cross-border index whose score is currently withdrawn after classification failure.`,
  `- World Threat Index (WTI): standing open-source index for comparative global geopolitical threat pressure across countries and blocs.`,
  `- MENA Threat Index: standing open-source index for regional threat assessment across the Middle East and North Africa.`,
  `- SDCofA: Strategic Data Company of Ankara, the endorsed analytical unit of Monarch Castle Technologies that publishes the standing threat indices.`,
  "",
  "## Products",
  "",
  ...site.products.map((product) => `- ${product.name} (${product.owner}): ${product.canonicalUrl} — ${presentationFor(product).summary} Method: ${methodologyUrlFor(product)}. Cadence: ${product.updateFrequency}.`),
  "",
  "## Narrative routes",
  "",
  ...routes.sitePages.map((page) => `- ${page.title}: ${canonicalOrigin}${page.path} — ${page.description}`),
  ...routes.localPages.map((page) => `- ${page.slug}: ${canonicalOrigin}${page.path}`),
  "",
  "## Standing index APIs",
  "",
  `- API index: ${canonicalOrigin}/api`,
  `- BNTI: ${canonicalOrigin}/api/bnti`,
  `- WTI: ${canonicalOrigin}/api/wti`,
  `- MENA: ${canonicalOrigin}/api/mena`,
  `- Indices catalog: ${canonicalOrigin}/api/indices`,
  `- Raw BNTI snapshot: ${canonicalOrigin}/sdcofa/bnti/bnti_data.json`,
  `- Raw WTI snapshot: ${canonicalOrigin}/sdcofa/wti/wti_data.json`,
  `- Raw MENA snapshot: ${canonicalOrigin}/sdcofa/mena/mena_data.json`,
  `- MCP endpoint: ${canonicalOrigin}/mcp`,
  `- MCP server card: ${canonicalOrigin}/.well-known/mcp/server-card.json`,
  "",
  "## FAQ",
  "",
  ...homeFaq.map((entry) => `Q: ${entry.question}\nA: ${entry.answer}`),
  ...Object.entries(pageFaqs).flatMap(([slug, faqs]) => slug === "home" ? [] : faqs.map((entry) => `Q: ${entry.question}\nA: ${entry.answer}`)),
  "",
  "## Glossary",
  "",
  "- BNTI: Border Neighbor Threat Index — score withdrawn after article-classification failure; the public endpoint carries a withdrawal notice.",
  "- WTI: World Threat Index — comparative global geopolitical threat pressure.",
  "- MENA: MENA Threat Index — regional threat assessment for the Middle East and North Africa.",
  "- SDCofA: Strategic Data Company of Ankara — endorsed analytical unit of Monarch Castle Technologies.",
  "- The Keep: unified early-warning workspace layer above free public dashboards.",
  "- Evidence chain: source context → analytical method → decision output with explicit limitations.",
  "",
  "## Citation and limits",
  "",
  "- Cite canonical page URLs and methodology links when quoting index values.",
  "- Index outputs are analytical aids, not investment advice or official government intelligence.",
  "- Inspect methodology and trust pages before reproducing a score or forecast claim.",
  ""
];
fs.writeFileSync(path.join(dist, "llms-full.txt"), `${llmsFullLines.join("\n")}`);

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
  const targetRoot = path.join(dist, ...mount.path.split("/").filter(Boolean));
  if (!fs.existsSync(upstreamRoot)) {
    throw new Error(`Missing upstream checkout for ${mount.repoKey}; run npm run sync`);
  }
  copyDirectory(upstreamRoot, targetRoot, (content) => rewriteStaticContent(content, mount.path));
}

function copyStaticTree(sourceRoot, targetRoot) {
  for (const entry of fs.readdirSync(sourceRoot, { withFileTypes: true })) {
    const source = path.join(sourceRoot, entry.name);
    const target = path.join(targetRoot, entry.name);
    if (entry.isDirectory()) {
      copyStaticTree(source, target);
      continue;
    }
    ensureParent(target);
    fs.copyFileSync(source, target);
  }
}

const staticRoot = path.join(root, "static");
if (fs.existsSync(staticRoot)) {
  copyStaticTree(staticRoot, dist);
}

// Keep public URLs stable while preventing old cached files from mixing with a new page.
for (const page of [...routes.sitePages, ...routes.localPages]) {
  const target = path.join(dist, page.output);
  const html = fs.readFileSync(target, "utf8").replace(
    /((?:href|src)=["'])(\/(?:styles|scripts)\/[^"'?]+\.(?:css|js))(["'])/g,
    `$1$2?v=${assetRevision}$3`
  );
  fs.writeFileSync(target, html);
}
for (const filename of fs.readdirSync(path.join(dist, "scripts")).filter(file => file.endsWith(".js"))) {
  const target = path.join(dist, "scripts", filename);
  const source = fs.readFileSync(target, "utf8").replace(
    /(\bfrom\s*["']|\bimport\(["'])(\.\/[^"'?]+\.js)(["'])/g,
    `$1$2?v=${assetRevision}$3`
  );
  fs.writeFileSync(target, source);
}
