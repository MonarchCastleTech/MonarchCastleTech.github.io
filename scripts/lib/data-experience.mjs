export function renderDataHome({ workspace, cards, faq }) {
  return `<section class="mission-hero" id="positioning">
    <div class="mission-hero-copy"><p class="eyebrow">Monarch Castle / Open intelligence</p>
      <h1>A changing world.<br><em>Inspectable data.</em></h1>
      <p class="hero-lede">Explore geopolitical pressure, economic conditions and energy systems. Follow each observation to its source, date and method.</p>
      <div class="hero-actions"><a class="button-link" href="/platform/">Open The Keep <span aria-hidden="true">↗</span></a><a class="text-link" href="/datasets/">Explore the data →</a></div>
      <p class="public-commitment">Free public access. Published values. Visible limitations.</p>
    </div>
    <div class="mission-hero-visual"><div class="atlas-label"><span>World Threat Index</span><span id="atlas-state">Reading published snapshot</span></div>
      <svg class="atlas-fallback" viewBox="0 0 720 380" aria-hidden="true"><g id="atlas-land"></g><g id="atlas-points"></g></svg>
      <canvas class="hero-scene-canvas" aria-hidden="true"></canvas>
      <div class="atlas-controls"><label for="atlas-country">Explore a country</label><select id="atlas-country"><option value="">Loading countries…</option></select></div>
      <div class="atlas-record" id="atlas-record" aria-live="polite"><p>Country records will appear here. The source view remains available below.</p></div>
      <p class="atlas-caption">Country positions are geographic. Values use the WTI scale; they are not probabilities.</p>
    </div>
  </section>
  <div class="data-rail"><span>01 / Observe</span><span>02 / Inspect</span><span>03 / Compare within a method</span><a href="/methodology/">Source → method → output ↗</a></div>
  <section class="platform-reveal" id="platform"><div class="section-heading"><div><p class="eyebrow">Published snapshots / The Keep</p><h2>The evidence, in view.</h2></div><p>Independent feeds retain their own scales and publication states. A withdrawn value stays unavailable.</p></div>${workspace}</section>
  <section class="portfolio-overview" id="maps"><div class="section-heading"><div><p class="eyebrow">Explore the collection</p><h2>Different questions.<br>Shared evidence standards.</h2></div><a class="text-link" href="/products/">All instruments →</a></div><div class="home-instruments">${cards}</div></section>
  <section class="evidence-chain"><div class="section-heading"><div><p class="eyebrow">How to read an output</p><h2>Context travels with the number.</h2></div><a href="/methodology/">Read the methods →</a></div><div class="evidence-steps"><article><span>01 / Source</span><h3>Trace the observation</h3><p>Open the underlying dataset or article. Publisher geography does not necessarily identify the location of an event.</p></article><article><span>02 / Method</span><h3>Understand the measure</h3><p>A news pressure indicator, a measured statistic and a forecast probability answer different questions.</p></article><article><span>03 / Limitations</span><h3>Keep uncertainty visible</h3><p>Check observation years, missingness and evaluation status before comparing or quoting an output.</p></article></div></section>
  <section class="entity-definitions" id="answers"><div class="section-heading"><div><p class="eyebrow">Public access</p><h2>Frequently asked questions</h2></div><p>SDCofA is the endorsed analytical unit of Monarch Castle Technologies. The Border Neighbor Threat Index (BNTI) is currently withheld.</p></div>${faq}</section>
  <section class="company-close"><p class="eyebrow">Continue the investigation</p><h2>Start with a source.<br>Follow the evidence.</h2><a class="button-link" href="/datasets/">Browse datasets →</a><a class="text-link" href="/developers/">Repositories & APIs ↗</a></section>`;
}

export function renderFreeKeep({ intro, workspace, next }) {
  return `${intro("Open workspace", "The Keep", "Published geopolitical indicators and source-linked signals, together in a free public workspace.")}
    <section class="keep-workspace" id="overview">${workspace}</section>
    <section class="platform-boundary"><div><p class="eyebrow">Access / Free</p><h2>Explore without an account.</h2></div><div><p>Filter country records, save a watchlist on this device and export the visible records as JSON. Every value retains its source, timestamp and publication state.</p><p>Your watchlist stays in this browser. The workspace reads public outputs; it does not collect private data.</p><a href="/methodology/">Read the methods →</a></div></section>
    ${next("/products/", "Extend the view", "Open individual maps and instruments to inspect their full records and limitations.", "Browse instruments")}`;
}

export function renderFreeAccess({ intro, next, previous }) {
  return `${intro("Public access", previous ? "Start exploring" : "Free access to The Keep", "The Keep and the public collection are free to explore. No subscription, payment or account is required.")}
    <section class="access-grid"><article><p class="eyebrow">Workspace</p><h2>The Keep</h2><p>Explore published snapshots, inspect source links and keep a local watchlist.</p><a class="button-link" href="/platform/">Open The Keep →</a></article><article><p class="eyebrow">Source data</p><h2>Read & reproduce</h2><p>Public JSON, repositories and product methods let you trace each output.</p><a href="/developers/">Developer resources →</a></article></section>
    ${next("/datasets/", "Find the right observation", "Browse the catalogue by subject and open the original instrument.", "Explore data")}`;
}
