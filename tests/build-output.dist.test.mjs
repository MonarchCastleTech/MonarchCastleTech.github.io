import assert from "node:assert/strict";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = path.join(root, "dist");

test("build output includes canonical site files", () => {
  assert.equal(fs.existsSync(path.join(dist, "CNAME")), true);
  assert.equal(fs.readFileSync(path.join(dist, "CNAME"), "utf8").trim(), "monarchcastle.tech");
  assert.equal(fs.existsSync(path.join(dist, ".nojekyll")), true);
  assert.equal(fs.existsSync(path.join(dist, "index.html")), true);
});

test("build output includes full dashboard subpaths", () => {
  for (const [slug, dataFile] of [["bnti", "bnti_data.json"], ["wti", "wti_data.json"], ["mena", "mena_data.json"]]) {
    assert.equal(fs.existsSync(path.join(dist, slug, "index.html")), true, `${slug}/index.html exists`);
    assert.equal(fs.existsSync(path.join(dist, slug, dataFile)), true, `${slug}/${dataFile} exists`);
  }
});

test("root homepage links to canonical dashboard paths", () => {
  const html = fs.readFileSync(path.join(dist, "index.html"), "utf8");
  assert.match(html, /href="\/bnti\/"/);
  assert.match(html, /href="\/wti\/"/);
  assert.match(html, /href="\/mena\/"/);
  assert.doesNotMatch(html, /sdcofa\.github\.io\/border-neighbor-threat-index/);
});
