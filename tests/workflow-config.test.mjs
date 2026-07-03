import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const workflowPath = new URL("../.github/workflows/pages.yml", import.meta.url);

test("GitHub Pages workflow builds and deploys dist artifact", () => {
  const workflow = fs.readFileSync(workflowPath, "utf8");
  assert.match(workflow, /actions\/configure-pages@/);
  assert.match(workflow, /npm run sync/);
  assert.match(workflow, /npm run build/);
  assert.match(workflow, /node scripts\/verify-dist\.mjs/);
  assert.match(workflow, /actions\/upload-pages-artifact@/);
  assert.match(workflow, /actions\/deploy-pages@/);
  assert.match(workflow, /path: dist/);
});
