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

function copyVerifyScript(root) {
  fs.mkdirSync(path.join(root, "scripts"), { recursive: true });
  fs.copyFileSync(path.join(repoRoot, "scripts", "verify-dist.mjs"), path.join(root, "scripts", "verify-dist.mjs"));
}

function runVerify(root) {
  return spawnSync(process.execPath, ["scripts/verify-dist.mjs"], {
    cwd: root,
    encoding: "utf8"
  });
}

function writeBaseProject(root, mounts) {
  copyVerifyScript(root);
  writeFile(root, "site.routes.json", JSON.stringify({
    canonicalDomain: "example.com",
    localPages: [],
    dashboardMounts: mounts,
    assets: []
  }, null, 2));
  writeFile(root, "dist/CNAME", "example.com\n");
  writeFile(root, "dist/.nojekyll", "");
}

test("verify-dist reports a missing dashboard index with an intentional assertion message", () => {
  const root = makeTempRoot("verify-dist-missing-index-");

  writeBaseProject(root, [{ slug: "bnti", path: "/bnti/", repoKey: "bnti", dataFile: "bnti_data.json" }]);
  writeFile(root, "dist/bnti/bnti_data.json", "{\"ok\":true}");

  const result = runVerify(root);

  assert.notEqual(result.status, 0, "verify-dist unexpectedly succeeded");
  assert.match(result.stderr, /bnti\/index\.html exists/);
  assert.doesNotMatch(result.stderr, /ENOENT/);
  fs.rmSync(root, { recursive: true, force: true });
});

test("verify-dist rejects dashboard redirect markers", () => {
  const root = makeTempRoot("verify-dist-redirect-");

  writeBaseProject(root, [{ slug: "bnti", path: "/bnti/", repoKey: "bnti", dataFile: "bnti_data.json" }]);
  writeFile(root, "dist/bnti/index.html", '<!doctype html><meta http-equiv="refresh" content="0; url=/login/">');
  writeFile(root, "dist/bnti/bnti_data.json", "{\"ok\":true}");

  const result = runVerify(root);

  assert.notEqual(result.status, 0, "verify-dist unexpectedly accepted redirect markup");
  assert.match(result.stderr, /redirect marker/i);
  fs.rmSync(root, { recursive: true, force: true });
});

test("verify-dist rejects root-relative leaks outside the dashboard mount path", () => {
  const root = makeTempRoot("verify-dist-root-leak-");

  writeBaseProject(root, [{ slug: "mena", path: "/mena/", repoKey: "mena", dataFile: "mena_data.json" }]);
  writeFile(
    root,
    "dist/mena/index.html",
    [
      "<!doctype html>",
      "<a href='/reports/latest'>Report</a>",
      "<img src=\"/images/chart.png\">",
      "<style>.hero{background:url('/media/bg.png')} .seal{background:url(/icons/seal.png)}</style>",
      "<script>fetch('/api/snapshot');</script>"
    ].join("")
  );
  writeFile(root, "dist/mena/mena_data.json", "{\"ok\":true}");

  const result = runVerify(root);

  assert.notEqual(result.status, 0, "verify-dist unexpectedly accepted root-relative leaks");
  assert.match(result.stderr, /root-relative/i);
  fs.rmSync(root, { recursive: true, force: true });
});
