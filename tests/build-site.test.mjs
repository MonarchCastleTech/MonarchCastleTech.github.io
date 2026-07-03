import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function makeTempRoot(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function writeFile(root, relativePath, content) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

function copyBuildScripts(root) {
  fs.mkdirSync(path.join(root, "scripts", "lib"), { recursive: true });
  fs.copyFileSync(path.join(repoRoot, "scripts", "build-site.mjs"), path.join(root, "scripts", "build-site.mjs"));
  fs.copyFileSync(path.join(repoRoot, "scripts", "lib", "static-rewrite.mjs"), path.join(root, "scripts", "lib", "static-rewrite.mjs"));
}

function runBuild(root) {
  return spawnSync(process.execPath, ["scripts/build-site.mjs"], {
    cwd: root,
    encoding: "utf8"
  });
}

test("build fails when a declared upstream asset source is missing", () => {
  const root = makeTempRoot("build-site-test-");

  copyBuildScripts(root);
  writeFile(root, "site.routes.json", JSON.stringify({
    canonicalDomain: "example.com",
    localPages: [{ slug: "home", path: "/", source: "src/pages/index.html", output: "index.html" }],
    dashboardMounts: [],
    assets: [{ fromRepo: "products", from: "assets", to: "assets/products" }]
  }, null, 2));
  writeFile(root, "public/CNAME", "example.com\n");
  writeFile(root, "src/pages/index.html", "<!doctype html><title>Home</title>");
  writeFile(root, "src/styles/site.css", "body{}");
  writeFile(root, "src/scripts/live-panels.js", "console.log('ok');");

  const result = runBuild(root);

  assert.notEqual(result.status, 0, `build unexpectedly succeeded\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  assert.match(result.stderr, /Missing declared asset source/i);
  fs.rmSync(root, { recursive: true, force: true });
});

test("build copies declared local assets without requiring an upstream cache", () => {
  const root = makeTempRoot("build-site-local-asset-test-");

  copyBuildScripts(root);
  writeFile(root, "site.routes.json", JSON.stringify({
    canonicalDomain: "example.com",
    localPages: [{ slug: "home", path: "/", source: "src/pages/index.html", output: "index.html" }],
    dashboardMounts: [],
    assets: [{ fromLocal: "src/assets/products", to: "assets/products" }]
  }, null, 2));
  writeFile(root, "public/CNAME", "example.com\n");
  writeFile(root, "src/pages/index.html", "<!doctype html><title>Home</title>");
  writeFile(root, "src/styles/site.css", "body{}");
  writeFile(root, "src/scripts/live-panels.js", "console.log('ok');");
  writeFile(root, "src/assets/products/logo.png", "fake image bytes");

  const result = runBuild(root);

  assert.equal(result.status, 0, `build failed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  assert.equal(fs.readFileSync(path.join(root, "dist", "assets", "products", "logo.png"), "utf8"), "fake image bytes");
  fs.rmSync(root, { recursive: true, force: true });
});
