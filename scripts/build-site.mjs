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
const secureWorkspaceUrl = "https://the-keep-enterprise.ardakgul4.workers.dev/login";
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
    { question: "Which Monarch Castle products are free?", answer: "Every current public dashboard, methodology page, and standing index remains free and open. Paid access applies only to The Keep enterprise workspace and related services." },
    { question: "Who publishes the SDCofA products?", answer: "SDCofA (Strategic Data Company of Ankara) is the endorsed analytical unit of Monarch Castle Technologies and publishes BNTI, WTI, MENA, election, and GeoRisk intelligence surfaces." }
  ],
  platform: [
    { question: "What is The Keep?", answer: "The Keep is a unified early-warning workspace that combines geopolitical, economic, energy, and supply-chain signals into one source-visible operating picture for private-sector teams." },
    { question: "Does The Keep replace the public dashboards?", answer: "No. BNTI's withdrawal notice, WTI, MENA, and every current public product remain independently accessible without a platform subscription. The Keep adds cross-product views, watchlists, alerts, exports, and team workflows." },
    { question: "Does the public platform preview store private customer data?", answer: "No. The live public preview reads only published product outputs. Private customer data is not collected or stored in that preview." }
  ],
  pricing: [
    { question: "Are Monarch Castle public products free?", answer: "Yes. Public dashboards, methodologies, and standing index outputs stay free. Commercial pricing applies to The Keep workspace, services, and support." },
    { question: "What does a paid pilot cost?", answer: "Paid pilots start from USD 15,000 for a six-week engagement with one defined exposure, decision owner, and measurable operational result." },
    { question: "What does enterprise access include?", answer: "Enterprise access starts from USD 36,000 per year and covers organization workspaces, role-based access, watchlists, exports, alerts, API access, private connectors, and support." }
  ],
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
  impact: [
    { question: "Who is The Keep built for?", answer: "Private-sector teams in energy, logistics, finance, insurance, and advisory services that carry cross-border exposure and need inspectable early-warning context." },
    { question: "How is pilot value measured?", answer: "Pilots measure lead time, analyst effort removed, and whether a reviewer can reproduce the evidence used to escalate a change." }
  ],
  pilot: [
    { question: "How long does a pilot run?", answer: "A pilot runs for six weeks with one defined exposure, a decision owner, and an agreed success measure." },
    { question: "What should not be sent in the intake?", answer: "Do not include confidential, personal, or regulated information. The intake is a non-confidential public GitHub issue form." }
  ],
  datasets: [
    { question: "Where can I download standing index JSON?", answer: "Use GET /api/bnti, /api/wti, /api/mena, /api/indices or the canonical snapshots under /sdcofa/<index>/<index>_data.json. BNTI currently returns a withdrawal notice, not a valid score. The API catalog is at /.well-known/api-catalog." },
    { question: "Does third-party data remain under its original terms?", answer: "Yes. Third-party data remains subject to its original terms. The datasets route documents public source routes and analytical scope." }
  ],
  insights: [
    { question: "What is published on Insights?", answer: "Insights shows live public signal snapshots and selected governed records without fabricated activity feeds or unsupported performance claims." },
    { question: "Is there an RSS feed?", answer: "Yes. Subscribe at /insights/feed.xml for automatically published, source-visible outputs from the public portfolio." }
  ],
  company: [
    { question: "Where is Monarch Castle Technologies based?", answer: "The company operates from Ankara, Türkiye and publishes decision-intelligence and early-warning products for private-sector operators." },
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
    answer: "Monarch Castle Technologies is an independent technology company that publishes transparent early-warning and decision-intelligence products for private-sector operators. The public portfolio stays free; paid access applies only to The Keep enterprise workspace."
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
    answer: "Yes. Every current public product, methodology page, and standing index remains free and open. Commercial access covers only the unified enterprise workspace, private integrations, exports, and support."
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
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Public product access remains free; commercial access applies to enterprise workspace features." }
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
        { "@type": "Offer", name: "Paid pilot", price: "15000", priceCurrency: "USD", description: "Six-week bounded pilot engagement." },
        { "@type": "Offer", name: "Enterprise annual access", price: "36000", priceCurrency: "USD", description: "Organization workspace, exports, API access, and support." }
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
      name: page.slug === "pilot" ? "Six-week early-warning pilot" : page.title.split("|")[0].trim(),
      url: canonical,
      provider: orgRef,
      serviceType: "Decision intelligence",
      areaServed: "Private-sector operators with cross-border exposure",
      isAccessibleForFree: page.slug !== "pilot"
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
    summary: "Season probabilities are temporarily withheld because the last release lacked completed official fixtures and full team matching.",
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
      const value = Number(payload?.meta?.main_index);
      if (!Number.isFinite(value)) continue;
      const countries = Object.entries(payload?.countries ?? {}).map(([code, record]) => ({
        name: record?.name ?? code,
        value: Number(record?.index)
      })).filter((record) => Number.isFinite(record.value)).sort((a, b) => b.value - a.value).slice(0, 3);
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
    <article class="product-card system-row" data-product-id="${escapeHtml(product.id)}">
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
        <p>SDCofA publishes open-source threat products as the endorsed analytical unit of Monarch Castle Technologies. Each product states when a score is unavailable.</p>
        <p class="endorsement">SDCofA — endorsed analytical unit of Monarch Castle Technologies</p>
      </div>
      <div class="endorsed-links">
        ${endorsedProducts.map((product) => {
          const localPath = dashboardPaths[product.id];
          return `<article data-product-id="${escapeHtml(product.id)}">
            <div class="product-mark">${renderMark(product)}</div>
            <span class="system-row-index" aria-hidden="true">${escapeHtml(product.id.slice(0, 3).toUpperCase())}</span>
            <h3>${escapeHtml(product.name)}</h3>
            <p>${escapeHtml(presentationFor(product).summary)}</p>
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
      <div class="featured-system-mark"><div class="featured-system-logo">${renderMark(product)}</div><span class="featured-system-category">${escapeHtml(presentation.signal)}</span></div>
    </article>`;
}

function renderLiveWorkspace(overviewAnchor) {
  return `
    <div class="workspace-grid" aria-label="The Keep public operating picture">
      <nav class="workspace-nav" aria-label="Operating picture sections">
        <strong>THE KEEP<span> / PUBLIC VIEW</span></strong>
        <a class="is-active" href="#${overviewAnchor}">Overview</a>
        <a href="#exposure-panel">Exposure</a>
        <a href="#signal-panel">Signals</a>
        <a href="/methodology/">Methods</a>
        <small>Source-linked public data</small>
      </nav>
      <div class="workspace-content">
        <div class="workspace-topline">
          <div><span class="eyebrow">Public operating picture</span><strong>Current published indices</strong></div>
          <time id="platform-updated">Reading source timestamps…</time>
        </div>
        <div class="workspace-metrics">
          <article><span>Global threat</span><strong id="metric-wti">—</strong><small id="status-wti">WTI</small><a href="/sdcofa/wti/">Open source view</a></article>
          <article><span>Border pressure</span><strong id="metric-bnti">—</strong><small id="status-bnti">BNTI</small><a href="/sdcofa/bnti/">Open source view</a></article>
          <article><span>MENA exposure</span><strong id="metric-mena">—</strong><small id="status-mena">MENA</small><a href="/sdcofa/mena/">Open source view</a></article>
        </div>
        <div class="workspace-panels">
          <section class="exposure-panel" id="exposure-panel"><header><div><p class="eyebrow">Index by index</p><h3>Published country readings</h3></div><span id="feed-state">Connecting</span></header><ol id="exposure-list"><li class="loading-row">Reading published records…</li></ol></section>
          <section class="signal-panel" id="signal-panel"><header><div><p class="eyebrow">Source trail</p><h3>Recent published events</h3></div></header><ol id="signal-list"><li class="loading-row">Reading published events…</li></ol></section>
        </div>
        <p class="workspace-note" id="platform-note">Each index has its own scale and method. Open its source view before comparing or quoting a value.</p>
      </div>
    </div>`;
}

function renderHome() {
  const featuredIds = ["esgmap", "prepturk", "cloudy-shiny"];
  const featured = featuredIds.map((id) => productById.get(id)).filter(Boolean);
  return `
    <section class="mission-hero" id="positioning" aria-labelledby="home-heading">
      <div class="mission-hero-copy">
        <p class="eyebrow">Decision intelligence for cross-border operations</p>
        <h1 id="home-heading">Know how global change reaches your business.</h1>
        <p class="lede">The Keep connects geopolitical, economic, energy, and supply-chain signals to one source-visible operating picture for the teams carrying the exposure.</p>
        <div class="hero-actions">
          ${localOrExternalLink("/platform/", "Explore The Keep", "button-link")}
          ${localOrExternalLink("/products/", "Explore public intelligence", "button-link button-secondary")}
        </div>
        <p class="public-commitment">Public instruments remain open. The enterprise workspace brings them together.</p>
      </div>
      <div class="mission-hero-visual" aria-hidden="true">
        <img class="hero-scene-fallback" src="/assets/brand/exposure-field.svg" alt="" />
        <canvas class="hero-scene-canvas"></canvas>
        <div class="hero-scene-caption"><span>The Keep / operating picture</span><strong>Signals become context.</strong></div>
      </div>
    </section>
    <section class="platform-rail" aria-label="The Keep operating loop">
      <span>01 / Observe</span><span>02 / Connect</span><span>03 / Estimate</span><span>04 / Act</span>
    </section>
    <section class="platform-reveal" id="platform" aria-labelledby="platform-heading">
      <div class="section-heading">
        <div><p class="eyebrow">The Keep platform</p><h2 id="platform-heading">Follow a signal all the way to its source.</h2></div>
        <p>One view brings published indicators, regional exposure, and underlying evidence into the same workflow.</p>
      </div>
      ${renderLiveWorkspace("platform-heading")}
      <p class="section-action">${localOrExternalLink("/platform/", "Explore the platform", "button-link")}</p>
    </section>
    <section class="operating-thesis" id="capabilities" aria-labelledby="capabilities-heading">
      <div class="section-heading"><div><p class="eyebrow">Built for operators</p><h2 id="capabilities-heading">Answers tied to the evidence that produced them.</h2></div><p>Automated collection handles repetition. Declared methods handle calculation. People retain judgment and accountability.</p></div>
      ${renderCapabilities()}
    </section>
    <section class="sector-band" aria-labelledby="sector-heading">
      <div class="section-heading"><div><p class="eyebrow">Where the work happens</p><h2 id="sector-heading">External change reaches every operating decision.</h2></div><p>Built for private-sector teams managing assets, routes, markets, and portfolios across borders.</p></div>
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
    <section class="portfolio-overview" id="portfolio" aria-labelledby="portfolio-heading">
      <div class="section-heading">
        <div><p class="eyebrow">Portfolio architecture</p><h2 id="portfolio-heading">A connected portfolio with clear ownership.</h2></div>
        <p>Focused public instruments remain directly accessible. The Keep adds a unified workspace above them.</p>
      </div>
      <div class="portfolio-groups">
        <article>
          <span class="portfolio-group-index">01 / Company systems</span>
          <h3>Monarch Castle Technologies</h3>
          <p>Market, energy, maritime, supply-chain, and forecasting products developed for defined information problems.</p>
          ${localOrExternalLink("/products/", "Explore all products")}
        </article>
        <article id="sdcofa">
          <span class="portfolio-group-index">02 / Endorsed analytical unit</span>
          <h3>SDCofA</h3>
          <p>Standing open-source threat indices published by the endorsed analytical unit of Monarch Castle Technologies.</p>
          <div class="portfolio-direct-links">
            ${localOrExternalLink("/sdcofa/bnti/", "BNTI")}
            ${localOrExternalLink("/sdcofa/wti/", "WTI")}
            ${localOrExternalLink("/sdcofa/mena/", "MENA")}
          </div>
        </article>
      </div>
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
    <section class="entity-definitions" id="answers" aria-labelledby="answers-heading">
      <div class="section-heading">
        <div><p class="eyebrow">At a glance</p><h2 id="answers-heading">Know what each part of the portfolio does.</h2></div>
        <p>Clear definitions of the company, The Keep, and the public indices it brings into view.</p>
      </div>
      <dl class="definition-list">
        <div><dt>Monarch Castle Technologies</dt><dd>Independent technology company publishing transparent early-warning and decision-intelligence products for private-sector operators with cross-border exposure.</dd></div>
        <div><dt>The Keep</dt><dd>Unified early-warning workspace that combines geopolitical, economic, energy, and supply-chain signals into one source-visible operating picture.</dd></div>
        <div><dt>Border Neighbor Threat Index (BNTI)</dt><dd>Cross-border threat index for Türkiye's land-neighbor relationships. Its country scores are currently withheld after article classification failed.</dd></div>
        <div><dt>World Threat Index (WTI)</dt><dd>Standing open-source index for comparative global geopolitical threat pressure across countries and blocs.</dd></div>
        <div><dt>MENA Threat Index</dt><dd>Standing open-source index for regional threat assessment across the Middle East and North Africa.</dd></div>
        <div><dt>SDCofA</dt><dd>Strategic Data Company of Ankara — the endorsed analytical unit of Monarch Castle Technologies that publishes threat products and their current publication status.</dd></div>
      </dl>
      <div class="faq-block">
        <h3>Frequently asked questions</h3>
        ${homeFaq.map((entry) => `<details><summary>${escapeHtml(entry.question)}</summary><p>${escapeHtml(entry.answer)}</p></details>`).join("")}
      </div>
      <p class="platform-disclaimer">Index outputs are analytical aids, not investment advice or official government intelligence. Inspect methodology before quoting a value.</p>
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
      <div class="workspace-toolbar"><div><p class="eyebrow">Live public preview</p><h2 id="workspace-heading">Operating picture</h2></div><p>Follow published indicators into the records and methods behind them. Each index retains its own scale.</p></div>
      ${renderLiveWorkspace("workspace-heading")}
    </section>
    <section class="platform-boundary" aria-labelledby="boundary-heading"><div><p class="eyebrow">Open-product promise</p><h2 id="boundary-heading">The public portfolio stays public.</h2></div><div><p>BNTI, WTI, EconMap, GeoRisk, MacroIntel, and every current published product remain available without a platform subscription.</p><p>Paid access covers unified watchlists, organization workspaces, private data connections, scheduled briefings, exports, API access, and support.</p><p>${localOrExternalLink(secureWorkspaceUrl, "Enter secure workspace", "button-link")} ${localOrExternalLink("/pricing/", "Compare access")}</p></div></section>
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
  return `${pageIntro("Platform access", "Public products stay free. The unified workspace is commercial.", "No existing dashboard, methodology page, or public data output is placed behind a paywall. Explore independently; no sales call is required.")}
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
    <section class="pilot-layout" aria-labelledby="pilot-scope-heading"><div><p class="eyebrow">Pilot structure</p><h2 id="pilot-scope-heading">Small enough to finish. Useful enough to renew.</h2><ol class="pilot-steps"><li><span>01</span><div><strong>Define</strong><p>Choose one portfolio, route, region, supplier set, or recurring risk decision.</p></div></li><li><span>02</span><div><strong>Connect</strong><p>Map public products and approved customer inputs into The Keep.</p></div></li><li><span>03</span><div><strong>Operate</strong><p>Run scheduled monitoring, briefing, escalation, and evidence capture.</p></div></li><li><span>04</span><div><strong>Measure</strong><p>Compare lead time, analyst effort, coverage, and reproducibility against baseline.</p></div></li></ol></div><aside class="pilot-card"><p class="eyebrow">Non-confidential intake</p><h3>Request a pilot</h3><p>Use the asynchronous public intake to describe sector, geography, and decision. No cold call is required. Do not include confidential, personal, or regulated information.</p><dl><div><dt>Duration</dt><dd>6 weeks</dd></div><div><dt>Starting price</dt><dd>USD 15,000</dd></div><div><dt>Customer</dt><dd>Private-sector organizations</dd></div></dl>${localOrExternalLink(intakeUrl, "Open pilot intake", "button-link")}<small>A GitHub account is required for this temporary intake route.</small></aside></section>
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
      <div><p>Forecasting claims are published only with a defined horizon, scoring rule, and evidence that readers can examine.</p>${localOrExternalLink(editorial.insights[0].url, "Read the forecast evaluation protocol")}</div>
    </section>
    <section id="platform-formula" class="platform-boundary" aria-labelledby="platform-method-heading">
      <div><p class="eyebrow">The Keep preview</p><h2 id="platform-method-heading">A declared cross-system summary—not a hidden model.</h2></div>
      <div><p>The live preview reads each product's published <code>meta.main_index</code>, status, timestamp, country records, and events. It does not alter upstream scores or combine indices that use different scales.</p><p>Country readings are grouped by index and ordered within each product. Event rows retain source links and timestamps. Failed feeds are reported as unavailable without substitute values.</p></div>
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
      <div class="contact-card"><h3>How we work</h3><p>Our products, methods, and security reporting are available for inspection. A focused pilot starts with one operating decision and a clear measure of value.</p><div class="card-actions">${localOrExternalLink("/pilot/", "Discuss a pilot")}${localOrExternalLink("/trust/", "Read our commitments")}</div></div>
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
  const body = renderer();
  if (page.slug === "home") return body;
  return `${body}${renderPageFaq(page.slug)}`;
}

function renderNav(currentPath) {
  const navigation = [
    { label: "Platform", path: "/platform/" },
    { label: "Products", path: "/products/" },
    { label: "Insights", path: "/insights/" },
    { label: "Methodology", path: "/methodology/" },
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
  <meta name="color-scheme" content="light dark" />
  <title>${escapeHtml(page.title)}</title>
  <meta name="description" content="${escapeHtml(page.description)}" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <meta name="author" content="${escapeHtml(site.brand.masterbrand)}" />
  <meta name="theme-color" content="#071522" />
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
  <header class="site-header">
    <a class="wordmark" href="/" aria-label="${escapeHtml(site.brand.masterbrand)} home">
      <img class="brand-logo" src="/assets/products/logo.png" alt="" />
      <span class="wordmark-copy"><span>Monarch Castle</span><strong>Technologies</strong></span>
    </a>
    <nav aria-label="Primary"><ul>${renderNav(page.path)}</ul></nav>
    <a class="header-action" href="${secureWorkspaceUrl}">Open The Keep</a>
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
fs.writeFileSync(path.join(dist, "llms.txt"), `# ${site.brand.masterbrand}\n\nTransparent public early-warning products and methods. The Keep unifies free public dashboards with an optional enterprise workspace.\n\n## Quick facts\n\n- ${site.brand.masterbrand}: ${canonicalOrigin}/ — independent technology company publishing transparent early-warning and decision-intelligence products for private-sector operators.\n- The Keep: ${canonicalOrigin}/platform/ — unified early-warning workspace across geopolitical, economic, energy, and supply-chain signals.\n- SDCofA: ${canonicalOrigin}/sdcofa/ — endorsed analytical unit that publishes WTI and MENA threat indices; BNTI's score is currently withdrawn.\n- Pricing: ${canonicalOrigin}/pricing/ — every current public product stays free; paid access is only the enterprise workspace.\n\n## Primary routes\n\n- Platform: ${canonicalOrigin}/platform/\n- Public products: ${canonicalOrigin}/products/\n- Current signals: ${canonicalOrigin}/insights/\n- RSS: ${canonicalOrigin}/insights/feed.xml\n- Methodology: ${canonicalOrigin}/methodology/\n- Trust and limitations: ${canonicalOrigin}/trust/\n- Company: ${canonicalOrigin}/company/\n- Datasets and sources: ${canonicalOrigin}/datasets/\n- Developer routes: ${canonicalOrigin}/developers/\n- Tools: ${canonicalOrigin}/tools/\n- MCP catalog: ${canonicalOrigin}/mcp/\n- REST API index: ${canonicalOrigin}/api\n- API catalog: ${canonicalOrigin}/.well-known/api-catalog\n- AI catalog: ${canonicalOrigin}/.well-known/ai-catalog.json\n- Agent card: ${canonicalOrigin}/.well-known/agent.json\n- SDCofA endorsed unit: ${canonicalOrigin}/sdcofa/\n- Source repositories: https://github.com/MonarchCastleTech and https://github.com/SDCofA\n\n## Standing indices\n\n- Border Neighbor Threat Index (score withdrawn pending classification repair): ${canonicalOrigin}/sdcofa/bnti/\n- World Threat Index: ${canonicalOrigin}/sdcofa/wti/\n- MENA Threat Index: ${canonicalOrigin}/sdcofa/mena/\n\n## Standing index JSON APIs (public, no key)\n\n- API index: GET ${canonicalOrigin}/api\n- BNTI: GET ${canonicalOrigin}/api/bnti (canonical: ${canonicalOrigin}/sdcofa/bnti/bnti_data.json)\n- WTI: GET ${canonicalOrigin}/api/wti (canonical: ${canonicalOrigin}/sdcofa/wti/wti_data.json)\n- MENA: GET ${canonicalOrigin}/api/mena (canonical: ${canonicalOrigin}/sdcofa/mena/mena_data.json)\n- Catalog: GET ${canonicalOrigin}/api/indices\n- Query: ?country=Name&top=10\n- MCP: POST ${canonicalOrigin}/mcp\n\n## FAQ\n\n- What is Monarch Castle Technologies? An independent technology company publishing transparent early-warning and decision-intelligence products for private-sector operators.\n- What is The Keep? A unified early-warning workspace that combines geopolitical, economic, energy, and supply-chain signals into one source-visible operating picture.\n- Are public products free? Yes. Every current public product, methodology page, and standing index remains free; paid access applies only to the enterprise workspace.\n- How do applications read the indices? GET ${canonicalOrigin}/api/bnti, ${canonicalOrigin}/api/wti, ${canonicalOrigin}/api/mena, and ${canonicalOrigin}/api/indices, or POST ${canonicalOrigin}/mcp. No API key is required.\n- Who publishes BNTI, WTI, and MENA? SDCofA (Strategic Data Company of Ankara), the endorsed analytical unit of Monarch Castle Technologies.\n- Full page answers: ${canonicalOrigin}/#answers and per-route #faq anchors on narrative pages.\n\n## Glossary\n\n- BNTI: Border Neighbor Threat Index — score withdrawn after article-classification failure; the public endpoint carries a withdrawal notice.\n- WTI: World Threat Index — comparative global geopolitical threat pressure.\n- MENA: MENA Threat Index — regional threat assessment for the Middle East and North Africa.\n- SDCofA: Strategic Data Company of Ankara — endorsed analytical unit of Monarch Castle Technologies.\n- The Keep: unified early-warning workspace layer above free public dashboards.\n- Evidence chain: source context → analytical method → decision output with explicit limitations.\n`);
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
  ...site.products.map((product) => `- ${product.name} (${product.owner}): ${product.canonicalUrl} — ${presentationFor(product).summary} Method: ${product.methodologyUrl}. Cadence: ${product.updateFrequency}.`),
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
