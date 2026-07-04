import fs from "node:fs";
import path from "node:path";
import { isTextAsset, rewriteStaticContent, shouldCopyStaticFile } from "./lib/static-rewrite.mjs";

const root = process.cwd();
const routes = JSON.parse(fs.readFileSync(path.join(root, "site.routes.json"), "utf8"));
const dist = path.join(root, "dist");
const cacheRoot = path.join(root, ".cache", "upstreams");

function ensureParent(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function copyFile(source, target) {
  ensureParent(target);
  fs.copyFileSync(source, target);
}

function copyDirectory(sourceRoot, targetRoot, transformText, baseRoot = sourceRoot) {
  for (const entry of fs.readdirSync(sourceRoot, { withFileTypes: true })) {
    const source = path.join(sourceRoot, entry.name);
    const target = path.join(targetRoot, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(source, target, transformText, baseRoot);
      continue;
    }

    const relative = path.relative(baseRoot, source).replaceAll("\\", "/");
    if (!shouldCopyStaticFile(relative)) continue;

    ensureParent(target);
    if (isTextAsset(relative)) {
      const content = fs.readFileSync(source, "utf8");
      fs.writeFileSync(target, transformText(content, relative));
      continue;
    }

    fs.copyFileSync(source, target);
  }
}

function resolveAssetSource(asset) {
  if (asset.fromLocal) {
    return {
      source: path.join(root, asset.fromLocal),
      label: asset.fromLocal
    };
  }

  if (asset.fromRepo && asset.from) {
    return {
      source: path.join(cacheRoot, asset.fromRepo, asset.from),
      label: `${asset.fromRepo}/${asset.from}`
    };
  }

  throw new Error(`Invalid declared asset source for ${asset.to}`);
}

function requireThemeSource(theme, fileName) {
  const source = path.join(cacheRoot, theme.repoKey, fileName);

  if (!fs.existsSync(source)) {
    throw new Error(`Missing theme homepage source: ${theme.repoKey}/${fileName}. Run npm run sync.`);
  }

  return source;
}

function rewriteThemeHomepage(content) {
  let html = content
    .replaceAll("https://akgularda.github.io/border-neighbor-threat-index/", "/bnti/")
    .replaceAll("https://akgularda.github.io/mena-threat-index/", "/mena/")
    .replaceAll("https://sdcofa.github.io/border-neighbor-threat-index/", "/bnti/")
    .replaceAll("https://sdcofa.github.io/world-threat-index/", "/wti/")
    .replaceAll("https://sdcofa.github.io/mena-threat-index/", "/mena/")
    .replace(/href="(\/(?:bnti|wti|mena)\/)"\s+target="_blank"\s+rel="noopener"/g, 'href="$1"');

  if (!html.includes('href="/wti/"')) {
    html = html.replace(
      '      <a href="#open">Open</a>',
      '      <a href="#open">Open</a>\n      <a href="/wti/">WTI</a>'
    );
  }

  return html;
}

function rewriteThemeScript(content) {
  return content
    .replace(
      /var BNTI_URL = "[^"]+";/,
      'var BNTI_URL = "/bnti/bnti_data.json";'
    )
    .replace(
      /var MENA_URL = "[^"]+";/,
      'var MENA_URL = "/mena/mena_data.json";'
    );
}

function copyThemeHomepage() {
  const theme = routes.themeHomepage;
  if (!theme) {
    throw new Error("Missing themeHomepage in site.routes.json");
  }

  const indexSource = requireThemeSource(theme, theme.index);
  const stylesheetSource = requireThemeSource(theme, theme.stylesheet);
  const scriptSource = requireThemeSource(theme, theme.script);
  const assetSource = requireThemeSource(theme, theme.assets);

  fs.writeFileSync(path.join(dist, "index.html"), rewriteThemeHomepage(fs.readFileSync(indexSource, "utf8")));
  copyFile(stylesheetSource, path.join(dist, theme.stylesheet));
  fs.writeFileSync(path.join(dist, theme.script), rewriteThemeScript(fs.readFileSync(scriptSource, "utf8")));
  fs.cpSync(assetSource, path.join(dist, theme.assets), { recursive: true });
}

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

copyFile(path.join(root, "public", "CNAME"), path.join(dist, "CNAME"));
fs.writeFileSync(path.join(dist, ".nojekyll"), "");

copyThemeHomepage();

for (const page of routes.localPages) {
  copyFile(path.join(root, page.source), path.join(dist, page.output));
}

fs.cpSync(path.join(root, "src", "styles"), path.join(dist, "styles"), { recursive: true });
fs.cpSync(path.join(root, "src", "scripts"), path.join(dist, "scripts"), { recursive: true });

for (const asset of routes.assets) {
  const { source, label } = resolveAssetSource(asset);
  const target = path.join(dist, asset.to);

  if (!fs.existsSync(source)) {
    throw new Error(`Missing declared asset source: ${label}. Run npm run sync or fix site.routes.json.`);
  }

  fs.cpSync(source, target, { recursive: true });
}

for (const mount of routes.dashboardMounts) {
  const upstreamRoot = path.join(cacheRoot, mount.repoKey);
  const targetRoot = path.join(dist, mount.slug);

  if (!fs.existsSync(upstreamRoot)) {
    throw new Error(`Missing upstream checkout for ${mount.repoKey}; run npm run sync`);
  }

  copyDirectory(upstreamRoot, targetRoot, (content) => rewriteStaticContent(content, mount.path));
}
