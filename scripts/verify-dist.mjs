import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const routes = JSON.parse(fs.readFileSync(path.join(root, "site.routes.json"), "utf8"));
const dist = path.join(root, "dist");

function targetForLocalReference(value) {
  const parsed = new URL(value, `https://${routes.canonicalDomain}`);
  const decoded = decodeURIComponent(parsed.pathname);
  if (decoded === "/") return path.join(dist, "index.html");
  if (decoded.endsWith("/")) return path.join(dist, decoded, "index.html");
  const direct = path.join(dist, decoded);
  if (path.extname(decoded)) return direct;
  return fs.existsSync(direct) ? direct : path.join(direct, "index.html");
}

function collectLocalReferences(html) {
  const references = [];
  for (const match of html.matchAll(/(?:href|src)=["']([^"']+)["']/gi)) {
    const value = match[1];
    if (!value.startsWith("/") || value.startsWith("//")) continue;
    references.push(value);
  }
  return references;
}

function assertNarrativePages() {
  const seenTitles = new Set();
  const seenDescriptions = new Set();
  const seenCanonicals = new Set();
  const prohibitedClaim = /\b(?:best|leading|most accurate|ai-powered)\b/i;
  const unsourcedCounter = /\b\d+[,.]?\d*\+?\s+(?:customers|countries|forecasts|signals|datasets)\b/i;

  for (const page of routes.sitePages ?? []) {
    const output = path.join(dist, page.output);
    assert.equal(fs.existsSync(output), true, `${page.output} exists`);
    const html = fs.readFileSync(output, "utf8");
    const title = html.match(/<title>([^<]+)<\/title>/i)?.[1];
    const description = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)?.[1];
    const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1];

    assert.equal((html.match(/<h1\b/gi) ?? []).length, 1, `${page.path} has exactly one h1`);
    assert.match(html, /<header\b/i, `${page.path} has a header landmark`);
    assert.match(html, /<nav\b[^>]+aria-label=["']Primary["']/i, `${page.path} has primary navigation`);
    assert.match(html, /<main\b[^>]+id=["']main-content["']/i, `${page.path} has a main landmark`);
    assert.match(html, /<footer\b/i, `${page.path} has a footer landmark`);
    assert.ok(title && !seenTitles.has(title), `${page.path} title is present and unique`);
    assert.ok(description && !seenDescriptions.has(description), `${page.path} description is present and unique`);
    assert.equal(canonical, `https://${routes.canonicalDomain}${page.path}`, `${page.path} canonical is correct`);
    assert.ok(!seenCanonicals.has(canonical), `${page.path} canonical is unique`);
    assert.doesNotMatch(html, prohibitedClaim, `${page.path} has no prohibited public claim`);
    assert.doesNotMatch(html, unsourcedCounter, `${page.path} has no unsourced public counter`);

    seenTitles.add(title);
    seenDescriptions.add(description);
    seenCanonicals.add(canonical);

    for (const reference of collectLocalReferences(html)) {
      assert.equal(
        fs.existsSync(targetForLocalReference(reference)),
        true,
        `${page.path} has broken local reference: ${reference}`
      );
    }
  }
}

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
assertNarrativePages();

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
