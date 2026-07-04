import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const indexHtml = fs.readFileSync(path.join(root, "dist", "index.html"), "utf8");
const toolsHtml = fs.readFileSync(new URL("../src/pages/tools.html", import.meta.url), "utf8");
const mcpHtml = fs.readFileSync(new URL("../src/pages/mcp.html", import.meta.url), "utf8");
const sdcofaHtml = fs.readFileSync(new URL("../src/pages/sdcofa.html", import.meta.url), "utf8");
const siteJsonUrl = new URL("../src/content/site.json", import.meta.url);

test("structured site content captures the approved brand thesis and instruments", () => {
  assert.equal(fs.existsSync(siteJsonUrl), true);
  const site = JSON.parse(fs.readFileSync(siteJsonUrl, "utf8"));

  assert.equal(site.brand, "Monarch Castle Technologies");
  assert.equal(site.domain, "monarchcastle.tech");
  assert.equal(site.thesis, "Sovereign decision intelligence for institutions that cannot afford to be surprised.");
  assert.equal(site.engine, "The Keep");
  assert.deepEqual(
    site.productLines,
    [
      "Defense Intelligence",
      "Financial Intelligence",
      "Supply Chain Intelligence",
      "Sustainability Intelligence",
      "Energy Intelligence",
      "Agent Distribution"
    ]
  );
  assert.deepEqual(
    site.instruments.map(({ label, path, data }) => ({ label, path, data })),
    [
      { label: "BNTI", path: "/bnti/", data: "/bnti/bnti_data.json" },
      { label: "WTI", path: "/wti/", data: "/wti/wti_data.json" },
      { label: "MENA", path: "/mena/", data: "/mena/mena_data.json" }
    ]
  );
});

test("homepage keeps sovereign decision intelligence theme", () => {
  assert.match(indexHtml, /Sovereign decision intelligence/);
  assert.match(indexHtml, /The Keep/);
  assert.match(indexHtml, /Intelligence for institutions that cannot afford to be/);
  assert.match(indexHtml, /mct-styles\.css/);
  assert.doesNotMatch(indexHtml, /\/styles\/site\.css/);
});

test("homepage exposes products and live instruments at canonical paths", () => {
  for (const path of ["/bnti/", "/wti/", "/mena/"]) {
    assert.match(indexHtml, new RegExp(`href="${path}"`));
  }
  for (const label of ["BNTI", "WTI", "MENA", "Defense Intelligence", "Financial Intelligence", "Sustainability Intelligence"]) {
    assert.match(indexHtml, new RegExp(label));
  }
});

test("homepage does not make GitHub Pages dashboard URLs primary navigation", () => {
  assert.doesNotMatch(indexHtml, /href="https:\/\/sdcofa\.github\.io\/border-neighbor-threat-index\//);
  assert.doesNotMatch(indexHtml, /href="https:\/\/sdcofa\.github\.io\/world-threat-index\//);
  assert.doesNotMatch(indexHtml, /href="https:\/\/sdcofa\.github\.io\/mena-threat-index\//);
});

test("tools page includes the required visible calculators", () => {
  for (const label of [
    "Country Risk Score Calculator",
    "Supply Chain Exposure Calculator",
    "ESG Incident Severity Calculator",
    "Market Weather Checklist",
    "OSINT Source Reliability Scorer"
  ]) {
    assert.match(toolsHtml, new RegExp(label));
  }
});

test("mcp page includes the required catalog entries", () => {
  for (const label of [
    "mct.risk_calculators",
    "mct.sdcofa_almanac_bridge",
    "mct.static_publisher"
  ]) {
    assert.match(mcpHtml, new RegExp(label));
  }
});

test("sdcofa page describes the standing indices and links to canonical routes", () => {
  assert.match(sdcofaHtml, /SDCofA publishes standing open-source threat indices/);
  for (const path of ["/bnti/", "/wti/", "/mena/"]) {
    assert.match(sdcofaHtml, new RegExp(`href="${path}"`));
  }
});
