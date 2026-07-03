import assert from "node:assert/strict";
import test from "node:test";
import { rewriteStaticContent, shouldCopyStaticFile } from "../scripts/lib/static-rewrite.mjs";

test("rewrites root-relative HTML assets into the dashboard mount path", () => {
  const html = '<link href="/css/app.css"><script src="/js/core.js"></script><img src="/assets/logo.png">';
  const rewritten = rewriteStaticContent(html, "/bnti/");
  assert.equal(rewritten, '<link href="/bnti/css/app.css"><script src="/bnti/js/core.js"></script><img src="/bnti/assets/logo.png">');
});

test("keeps external URLs and already-mounted paths unchanged", () => {
  const html = '<a href="https://github.com/SDCofA/border-neighbor-threat-index">Repo</a><a href="/bnti/methodology.pdf">Method</a>';
  assert.equal(rewriteStaticContent(html, "/bnti/"), html);
});

test("preserves a bare mount-root path", () => {
  const html = '<a href="/bnti">Dashboard</a>';
  assert.equal(rewriteStaticContent(html, "/bnti/"), html);
});

test("rewrites CSS url references that start at site root", () => {
  const css = 'body{background:url("/assets/bg.png")} .seal{background:url(/icon.png)}';
  assert.equal(rewriteStaticContent(css, "/wti/"), 'body{background:url("/wti/assets/bg.png")} .seal{background:url(/wti/icon.png)}');
});

test("rewrites single-quoted CSS url references that start at site root", () => {
  const css = "body{background:url('/assets/bg.png')}.seal{background:url('/icon.png')}";
  assert.equal(rewriteStaticContent(css, "/wti/"), "body{background:url('/wti/assets/bg.png')}.seal{background:url('/wti/icon.png')}");
});

test("copies web assets and dashboard data, skips source-control and Python pipeline files", () => {
  assert.equal(shouldCopyStaticFile("index.html"), true);
  assert.equal(shouldCopyStaticFile("css/app.css"), true);
  assert.equal(shouldCopyStaticFile("bnti_data.json"), true);
  assert.equal(shouldCopyStaticFile("methodology.pdf"), true);
  assert.equal(shouldCopyStaticFile(".git/config"), false);
  assert.equal(shouldCopyStaticFile(".github/workflows/update.yml"), false);
  assert.equal(shouldCopyStaticFile("borderneighboursthreatindex.py"), false);
  assert.equal(shouldCopyStaticFile("requirements.txt"), false);
});
