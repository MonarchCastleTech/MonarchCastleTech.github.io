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
    sitePages: [],
    localPages: [],
    dashboardMounts: mounts,
    assets: []
  }, null, 2));
  writeFile(root, "dist/CNAME", "example.com\n");
  writeFile(root, "dist/.nojekyll", "");
}

test("verify-dist rejects broken local links in generated narrative routes", () => {
  const root = makeTempRoot("verify-dist-broken-link-");
  copyVerifyScript(root);
  writeFile(root, "site.routes.json", JSON.stringify({
    canonicalDomain: "example.com",
    sitePages: [{
      slug: "home",
      path: "/",
      output: "index.html",
      title: "Home title",
      description: "A unique and sufficiently useful homepage description."
    }],
    localPages: [],
    dashboardMounts: [],
    assets: []
  }, null, 2));
  writeFile(root, "dist/CNAME", "example.com\n");
  writeFile(root, "dist/.nojekyll", "");
  writeFile(root, "dist/index.html", [
    "<!doctype html><html><head>",
    "<title>Home title</title>",
    "<meta name='description' content='A unique and sufficiently useful homepage description.'>",
    "<link rel='canonical' href='https://example.com/'>",
    "</head><body><header></header><nav aria-label='Primary'></nav>",
    "<main id='main-content'><h1>Home</h1><a href='/missing/'>Missing</a></main>",
    "<footer></footer></body></html>"
  ].join(""));

  const result = runVerify(root);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /broken local reference/i);
  fs.rmSync(root, { recursive: true, force: true });
});

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

test("verify-dist rejects redirect assignment and call forms", async (t) => {
  const redirectCases = [
    { name: "location.assign", script: "location.assign('/login/');" },
    { name: "location.replace", script: "location.replace('/login/');" },
    { name: "window.location.assign", script: "window.location.assign('/login/');" },
    { name: "window.location.replace", script: "window.location.replace('/login/');" },
    { name: "location assignment", script: "location = '/login/';" },
    { name: "window.location assignment", script: "window.location = '/login/';" },
    { name: "location.href assignment", script: "location.href = '/login/';" },
    { name: "window.location.href assignment", script: "window.location.href = '/login/';" }
  ];

  for (const redirectCase of redirectCases) {
    await t.test(redirectCase.name, () => {
      const root = makeTempRoot(`verify-dist-redirect-${redirectCase.name.replaceAll(/[^a-z]+/gi, "-").toLowerCase()}-`);

      writeBaseProject(root, [{ slug: "bnti", path: "/bnti/", repoKey: "bnti", dataFile: "bnti_data.json" }]);
      writeFile(root, "dist/bnti/index.html", `<!doctype html><script>${redirectCase.script}</script>`);
      writeFile(root, "dist/bnti/bnti_data.json", "{\"ok\":true}");

      const result = runVerify(root);

      assert.notEqual(result.status, 0, `verify-dist unexpectedly accepted ${redirectCase.name}`);
      assert.match(result.stderr, /redirect marker/i);
      fs.rmSync(root, { recursive: true, force: true });
    });
  }
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

test("verify-dist rejects normalized root-relative escapes from the dashboard mount path", async (t) => {
  const leakCases = [
    { name: "dot-dot mount escape", markup: "<a href='/mena/../../wti/'>WTI</a>" },
    { name: "shared stylesheet escape", markup: "<link rel='stylesheet' href='/mena/../shared.css'>" }
  ];

  for (const leakCase of leakCases) {
    await t.test(leakCase.name, () => {
      const root = makeTempRoot(`verify-dist-normalized-leak-${leakCase.name.replaceAll(/[^a-z]+/gi, "-").toLowerCase()}-`);

      writeBaseProject(root, [{ slug: "mena", path: "/mena/", repoKey: "mena", dataFile: "mena_data.json" }]);
      writeFile(root, "dist/mena/index.html", `<!doctype html>${leakCase.markup}`);
      writeFile(root, "dist/mena/mena_data.json", "{\"ok\":true}");

      const result = runVerify(root);

      assert.notEqual(result.status, 0, `verify-dist unexpectedly accepted ${leakCase.name}`);
      assert.match(result.stderr, /root-relative/i);
      fs.rmSync(root, { recursive: true, force: true });
    });
  }
});
