import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const routes = JSON.parse(fs.readFileSync(path.join(root, "site.routes.json"), "utf8"));
const dist = path.join(root, "dist");

function assertNoRedirectMarkers(html, mount) {
  const redirectChecks = [
    { label: "meta refresh", pattern: /<meta[^>]+http-equiv=["']refresh["']/i },
    { label: "location.assign(...)", pattern: /\blocation\s*\.\s*assign\s*\(/i },
    { label: "location.replace(...)", pattern: /\blocation\s*\.\s*replace\s*\(/i },
    { label: "location = ...", pattern: /\b(?:window\s*\.\s*)?location\s*=\s*(?!=)/i },
    { label: "location.href = ...", pattern: /\b(?:window\s*\.\s*)?location\s*\.\s*href\s*=\s*(?!=)/i }
  ];

  for (const check of redirectChecks) {
    assert.equal(
      check.pattern.test(html),
      false,
      `${mount.slug}/index.html contains redirect marker: ${check.label}`
    );
  }
}

function collectRootRelativeReferences(html) {
  const references = [];
  const matchers = [
    { kind: "href", pattern: /href=["'](\/[^"']*)["']/gi },
    { kind: "src", pattern: /src=["'](\/[^"']*)["']/gi },
    { kind: "fetch", pattern: /fetch\(\s*["'](\/[^"']*)["']/gi },
    { kind: "css url", pattern: /url\(\s*["']?(\/[^"')\s]*)["']?\s*\)/gi }
  ];

  for (const matcher of matchers) {
    for (const match of html.matchAll(matcher.pattern)) {
      references.push({ kind: matcher.kind, value: match[1] });
    }
  }

  return references;
}

function normalizeRootRelativePath(value) {
  return new URL(value, "https://dist.local").pathname;
}

function normalizeMountBase(mountPath) {
  const normalizedPath = normalizeRootRelativePath(mountPath);
  return normalizedPath !== "/" && normalizedPath.endsWith("/")
    ? normalizedPath.slice(0, -1)
    : normalizedPath;
}

function assertMountedRootRelativePaths(html, mount) {
  const mountBase = normalizeMountBase(mount.path);
  const mountPrefix = mountBase === "/" ? "/" : `${mountBase}/`;
  const leaks = collectRootRelativeReferences(html).flatMap(({ kind, value }) => {
    if (value.startsWith("//")) return false;
    const normalizedValue = normalizeRootRelativePath(value);
    const isInsideMount = normalizedValue === mountBase || normalizedValue.startsWith(mountPrefix);
    return isInsideMount ? [] : [{ kind, value, normalizedValue }];
  });

  assert.equal(
    leaks.length,
    0,
    `${mount.slug}/index.html has root-relative references outside ${mount.path}: ${leaks.map(({ kind, value, normalizedValue }) => `${kind}=${value} -> ${normalizedValue}`).join(", ")}`
  );
}

assert.equal(fs.readFileSync(path.join(dist, "CNAME"), "utf8").trim(), routes.canonicalDomain);
assert.equal(fs.existsSync(path.join(dist, ".nojekyll")), true, ".nojekyll exists");

for (const page of routes.localPages) {
  assert.equal(fs.existsSync(path.join(dist, page.output)), true, `${page.output} exists`);
}

for (const mount of routes.dashboardMounts) {
  const indexPath = path.join(dist, mount.slug, "index.html");
  const dataPath = path.join(dist, mount.slug, mount.dataFile);

  assert.equal(fs.existsSync(indexPath), true, `${mount.slug}/index.html exists`);
  assert.equal(fs.existsSync(dataPath), true, `${mount.slug}/${mount.dataFile} exists`);

  const html = fs.readFileSync(indexPath, "utf8");
  assertNoRedirectMarkers(html, mount);
  assertMountedRootRelativePaths(html, mount);
}

console.log("dist verification passed");
