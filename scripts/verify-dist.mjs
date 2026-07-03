import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const routes = JSON.parse(fs.readFileSync(path.join(root, "site.routes.json"), "utf8"));
const dist = path.join(root, "dist");

assert.equal(fs.readFileSync(path.join(dist, "CNAME"), "utf8").trim(), routes.canonicalDomain);
assert.equal(fs.existsSync(path.join(dist, ".nojekyll")), true, ".nojekyll exists");

for (const page of routes.localPages) {
  assert.equal(fs.existsSync(path.join(dist, page.output)), true, `${page.output} exists`);
}

for (const mount of routes.dashboardMounts) {
  const indexPath = path.join(dist, mount.slug, "index.html");
  const dataPath = path.join(dist, mount.slug, mount.dataFile);
  const html = fs.readFileSync(indexPath, "utf8");

  assert.equal(fs.existsSync(indexPath), true, `${mount.slug}/index.html exists`);
  assert.equal(fs.existsSync(dataPath), true, `${mount.slug}/${mount.dataFile} exists`);
  assert.equal(html.includes('href="/css/'), false, `${mount.slug} has no root css href`);
  assert.equal(html.includes('src="/js/'), false, `${mount.slug} has no root js src`);
}

console.log("dist verification passed");
