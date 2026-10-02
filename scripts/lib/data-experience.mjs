export function renderSourceBoard() {
  return `<div class="source-board" aria-label="Published intelligence snapshots">
    <div class="source-heading"><span>Published intelligence</span><span>Independent indicators. Independent scales.</span></div>
    <div id="source-readings">${[
      ["wti", "World Threat Index"], ["mena", "MENA Threat Index"], ["bnti", "Border Neighbor Threat Index (BNTI)"]
    ].map(([id, name]) => `<article class="source-entry"><header><span>${name}</span><a href="/sdcofa/${id}/" aria-label="Open ${name}">↗</a></header><strong id="metric-${id}">—</strong><p id="status-${id}">Reading source</p><time id="updated-${id}">Source date pending</time></article>`).join("")}</div>
    <p class="source-note">Country positions are geographic references. Indicators describe published source outputs, not event coordinates or probabilities.</p>
  </div>`;
}

export function renderDataHome({ workspace, faq }) {
  return `<section class="hero" aria-labelledby="hero-title">
      <div class="world-scene" aria-hidden="true"><svg class="world-fallback atlas-fallback" viewBox="0 0 720 360"><g id="atlas-land"></g></svg><canvas id="world-canvas" class="hero-scene-canvas"></canvas></div>
      <div class="hero-copy"><h1 id="hero-title">Data. Context.<br>Intelligence.</h1><p>Geopolitics, economics and energy.<br>A connected view, with the evidence in reach.</p><a class="hero-action" href="#published-data">Explore the data <span aria-hidden="true">↘</span></a></div>
      <div class="hero-bottom"><p>Public intelligence.<br>Open to exploration.</p><div class="country-reading" id="atlas-record"><label for="atlas-country">World Threat Index</label><div class="country-line"><select id="atlas-country"><option value="">Loading country records</option></select><strong id="country-score">—</strong></div><div class="country-meta"><span id="atlas-state">Published snapshot</span><a href="/sdcofa/wti/">Inspect the source ↗</a></div></div></div>
    </section>
    <section class="introduction" id="published-data">
      <div class="intro-heading"><h2>The world is complex.<br>Your starting point<br>should be clear.</h2><div><p>Follow country conditions, regional pressure and economic change through an open collection of data and analytical tools.</p><p>Every instrument has a defined purpose. Every reading keeps its source and publication date.</p><a class="simple-link" href="/datasets/">Explore the collection <span aria-hidden="true">↗</span></a></div></div>
      ${renderSourceBoard()}
    </section>
    <section class="systems" id="collection">
      <div class="section-heading"><h2>See the system.<br>Follow the signal.</h2><a class="simple-link" href="/products/">All systems <span aria-hidden="true">↗</span></a></div>
      <article class="system-row"><div class="system-title"><span>Geopolitical intelligence</span><h3>Country conditions.<br>Regional pressure.</h3></div><div class="system-description"><p>Explore the World Threat Index and MENA assessments. Follow a country reading into the articles and methods behind it.</p><div class="system-links"><a href="/sdcofa/wti/">World Threat Index ↗</a><a href="/sdcofa/mena/">MENA Threat Index ↗</a></div></div><div class="system-visual geo-visual" aria-hidden="true"><svg viewBox="0 0 720 360"><g id="regional-map"></g></svg></div></article>
      <article class="system-row"><div class="system-title"><span>Economic intelligence</span><h3>Economies.<br>In perspective.</h3></div><div class="system-description"><p>Inspect country indicators in EconMap and macroeconomic conditions in MacroIntel. See observation years, source series and missing data.</p><div class="system-links"><a href="https://monarchcastle.com/econmap/">EconMap ↗</a><a href="https://monarchcastle.com/macrointel/">MacroIntel ↗</a></div></div><div class="system-index" aria-label="Economic data themes"><span>Output & growth</span><span>Trade & exposure</span><span>Prices & conditions</span></div></article>
      <article class="system-row"><div class="system-title"><span>Energy intelligence</span><h3>Energy systems.<br>Visible dependencies.</h3></div><div class="system-description"><p>Read sourced ESG indicators, nuclear energy records and regional energy flows. Open the original instrument to inspect its coverage.</p><div class="system-links"><a href="https://monarchcastle.com/esgmap/">ESGMap ↗</a><a href="https://monarchcastle.com/NuclearEnergyIntelligence/">Nuclear Energy Intelligence ↗</a></div></div><div class="system-index" aria-label="Energy data themes"><span>Generation & supply</span><span>Infrastructure</span><span>Source coverage</span></div></article>
    </section>
    <section class="keep" id="keep">
      <div class="keep-intro"><h2>The Keep.</h2><div><p>A workspace for the public record.</p><p>Search countries, compare readings within their own method and take the source data with you. Free public access. No account required.</p></div></div>
      ${workspace}
      <div class="keep-footer"><p id="record-count">Published source records</p><a href="/platform/">Enter the full workspace <span aria-hidden="true">↗</span></a></div>
    </section>
    <section class="entity-definitions" id="answers"><h2>Frequently asked questions</h2>${faq}</section>
    <section class="closing company-close"><h2>Start with the data.<br>Follow the evidence.</h2><a href="/methodology/">Read our methods <span aria-hidden="true">↗</span></a></section>`;
}

export function renderFreeKeep({ intro, workspace, next }) {
  return `${intro("Public intelligence", "The Keep.", "A workspace for the public record. Free access. No account required.")}
    <section class="keep-full" id="overview">${renderSourceBoard()}${workspace}</section>
    <section class="platform-boundary"><div><h2>Explore without an account.</h2></div><div><p>Filter country records, save a watchlist on this device and export the matching records as JSON. Every value retains its source, timestamp and publication state.</p><p>Your watchlist stays in this browser. The workspace reads public outputs; it does not collect private data.</p><a href="/methodology/">Read the methods →</a></div></section>
    ${next("/products/", "Extend the view", "Open individual maps and instruments to inspect their full records and limitations.", "Browse instruments")}`;
}

export function renderFreeAccess({ intro, next, previous }) {
  return `${intro("Public access", previous ? "Start exploring" : "Free access to The Keep", "The Keep and the public collection are free to explore. No subscription, payment or account is required.")}
    <section class="access-grid"><article><p class="eyebrow">Workspace</p><h2>The Keep</h2><p>Explore published snapshots, inspect source links and keep a local watchlist.</p><a class="button-link" href="/platform/">Open The Keep →</a></article><article><p class="eyebrow">Source data</p><h2>Read & reproduce</h2><p>Public JSON, repositories and product methods let you trace each output.</p><a href="/developers/">Developer resources →</a></article></section>
    ${next("/datasets/", "Find the right observation", "Browse the catalogue by subject and open the original instrument.", "Explore data")}`;
}
