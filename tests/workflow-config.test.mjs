import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const workflowPath = new URL("../.github/workflows/pages.yml", import.meta.url);
const healthWorkflowPath = new URL("../.github/workflows/site-health.yml", import.meta.url);
const healthScriptPath = new URL("../scripts/check-live-site.mjs", import.meta.url);

test("GitHub Pages workflow builds and deploys dist artifact", () => {
  const workflow = fs.readFileSync(workflowPath, "utf8");
  assert.match(workflow, /actions\/checkout@v7/);
  assert.match(workflow, /actions\/setup-node@v6/);
  assert.match(workflow, /actions\/configure-pages@v6/);
  assert.match(workflow, /npm run sync/);
  assert.match(workflow, /npm run build/);
  assert.match(workflow, /node scripts\/verify-dist\.mjs/);
  assert.match(workflow, /actions\/upload-pages-artifact@v5/);
  assert.match(workflow, /actions\/deploy-pages@v5/);
  assert.match(workflow, /path: dist/);
});

test("GitHub Pages workflow refreshes upstream dashboard snapshots on a schedule", () => {
  const workflow = fs.readFileSync(workflowPath, "utf8");
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /cron:\s+["']7 \* \* \* \*["']/);
});

test("site health workflow checks live routes and data freshness often", () => {
  assert.equal(fs.existsSync(healthWorkflowPath), true);
  const workflow = fs.readFileSync(healthWorkflowPath, "utf8");

  assert.match(workflow, /schedule:/);
  assert.match(workflow, /cron:\s+["']\*\/30 \* \* \* \*["']/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /node scripts\/check-live-site\.mjs/);
});

test("live site health script covers canonical routes and dashboard data freshness", () => {
  assert.equal(fs.existsSync(healthScriptPath), true);
  const script = fs.readFileSync(healthScriptPath, "utf8");

  for (const path of ["/", "/tools/", "/mcp/", "/sdcofa/", "/bnti/", "/wti/", "/mena/"]) {
    assert.match(script, new RegExp(`"${path}"`));
  }

  for (const dataFile of ["bnti_data.json", "wti_data.json", "mena_data.json"]) {
    assert.match(script, new RegExp(dataFile));
  }

  assert.match(script, /maxAgeHours/);
  assert.match(script, /SITE_BASE_URL/);
});
