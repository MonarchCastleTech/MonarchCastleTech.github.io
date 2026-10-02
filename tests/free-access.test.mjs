import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = new URL("../", import.meta.url);
test("public pages and discovery files contain no commercial Keep offers", () => {
  const routes = JSON.parse(fs.readFileSync(new URL("site.routes.json", root), "utf8"));
  const files = routes.sitePages.map(page => path.join("dist", page.output));
  files.push("dist/llms.txt", "dist/llms-full.txt", "dist/site.webmanifest");
  for (const file of files) {
    const content = fs.readFileSync(new URL(file, root), "utf8");
    assert.doesNotMatch(content, /paid pilot|15,?000|36,?000|\$15k|\$36k|optional enterprise workspace|the-keep-enterprise/i, file);
  }
  const platform = fs.readFileSync(new URL("dist/platform/index.html", root), "utf8");
  assert.match(platform, /free public workspace/);
  assert.match(platform, /id="keep-export"/);
  assert.match(platform, /id="keep-watchlist"/);
});
