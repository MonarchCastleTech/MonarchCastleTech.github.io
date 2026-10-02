import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("public page and lazy atlas modules share a cache revision", () => {
  const html = fs.readFileSync("dist/index.html", "utf8");
  const revision = html.match(/styles\/identity\.css\?v=([a-f0-9]{16})/)?.[1];
  assert.ok(revision, "changed styles must use a versioned browser cache key");
  for (const filename of ["hero-loader.js", "platform.js"]) {
    assert.ok(html.includes(`/scripts/${filename}?v=${revision}`));
    const module = fs.readFileSync(`dist/scripts/${filename}`, "utf8");
    for (const reference of module.matchAll(/(?:from\s*["']|import\(["'])(\.\/[^"']+\.js(?:\?[^"']*)?)["']/g)) {
      assert.ok(reference[1].endsWith(`?v=${revision}`), `unversioned module: ${reference[1]}`);
    }
  }
  assert.ok(fs.readFileSync("dist/scripts/hero-loader.js", "utf8").includes(`hero-scene.js?v=${revision}`));
  assert.ok(fs.statSync("dist/scripts/hero-scene.js").size > 100_000, "lazy scene bundle exists");
});
