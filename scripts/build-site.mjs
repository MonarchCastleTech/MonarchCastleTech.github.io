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

function withMctLogo(html) {
  if (html.includes('src="assets/products/logo.png"')) {
    return html;
  }

  return html.replace(
    /<svg class="mark-svg"[\s\S]*?<\/svg>/,
    '<img class="mark" src="assets/products/logo.png" alt="" />'
  );
}

function sdcofaDivisionMarkup() {
  return `
    <!-- DIVISION 04 - SDCofA -->
    <section class="division reveal" aria-labelledby="div-sdcofa">
      <header class="div-head">
        <div>
          <p class="div-eyebrow"><span class="tick" aria-hidden="true">&#9670;</span> Division 04</p>
          <p class="div-org">Strategic Data Company of Ankara</p>
          <h3 class="div-title" id="div-sdcofa">SDCofA</h3>
        </div>
        <p class="div-mandate">Publish standing open-source threat indices with traceable inputs and fixed scoring doctrine.</p>
      </header>
      <div class="div-products">
        <article class="module">
          <span class="mnum">S.01</span>
          <div class="mcopy">
            <p class="mkind">Open-source threat indices</p>
            <h3>Strategic Data Company of Ankara</h3>
            <p class="mdecide">A public division for BNTI, WTI and MENA threat dashboards.</p>
            <p class="mrigor">SDCofA publishes scheduled, inspectable snapshots from the same doctrine: canonical data files, fixed scoring logic, dashboard routes and provenance-preserving refresh cycles.</p>
            <div class="mtags">
              <a class="mlink" href="/sdcofa/">Open SDCofA <span class="ar" aria-hidden="true">&#8599;</span></a>
              <a class="mlink" href="/bnti/">BNTI <span class="ar" aria-hidden="true">&#8599;</span></a>
              <a class="mlink" href="/wti/">WTI <span class="ar" aria-hidden="true">&#8599;</span></a>
              <a class="mlink" href="/mena/">MENA <span class="ar" aria-hidden="true">&#8599;</span></a>
            </div>
          </div>
          <div class="mviz" aria-label="SDCofA - Strategic Data Company of Ankara division">
            <div class="vlabel"><span>SDCofA</span><span>PUBLIC DIVISION</span></div>
            <img src="assets/products/sdcofa-logo-dark.png" alt="Strategic Data Company of Ankara" style="display:block;max-width:100%;height:auto;margin:22px auto 18px;" />
            <div class="sc-tests"><span class="t">Standing indices</span><span class="n">3</span></div>
          </div>
        </article>
      </div>
    </section>`;
}

function withSdcofaDivision(html) {
  if (html.includes('id="div-sdcofa"')) {
    return html;
  }

  const updated = html.replace(
    "Seven instruments. Three divisions. One engine.",
    "Eight instruments. Four divisions. One engine."
  );
  const inserted = updated.replace(
    /(\r?\n  <\/div>\r?\n<\/section>\r?\n\r?\n<!-- ============================== WHY SOVEREIGN ============================== -->)/,
    `${sdcofaDivisionMarkup()}\n$1`
  );

  return inserted;
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

  html = withMctLogo(html);
  html = withSdcofaDivision(html);

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
