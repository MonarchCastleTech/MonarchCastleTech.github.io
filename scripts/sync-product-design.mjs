import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspace = path.resolve(process.argv[2] ?? path.join(root, ".."));
const products = JSON.parse(fs.readFileSync(path.join(root, "src/content/site.json"), "utf8")).products;
const css = fs.readFileSync(path.join(root, "src/design-system/design.css"), "utf8");
const copy = (source, destination) => { fs.mkdirSync(path.dirname(destination), { recursive: true }); fs.copyFileSync(source, destination); };
const write = (destination, content) => { fs.mkdirSync(path.dirname(destination), { recursive: true }); fs.writeFileSync(destination, content); };
const escape = value => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
const links = [["Data", "datasets"], ["Maps", "products"], ["Signals", "insights"], ["Research", "developers"], ["Methodology", "methodology"], ["Open The Keep", "platform"]];
const nav = () => `<nav aria-label="Monarch Castle collection">${links.map(([label, url]) => `<a ${url === "platform" ? 'class="monarch-shell-keep" ' : ""}href="https://monarchcastle.com/${url}/">${label}</a>`).join("")}</nav>`;
const shell = product => `<header class="monarch-shell"><a class="monarch-shell-brand" href="https://monarchcastle.com/">Monarch Castle<span class="monarch-shell-product">${escape(product.name)}</span></a>${nav()}<details><summary>Collection</summary>${nav()}</details></header>`;
const configs = {
  econmap: { app: "src/app", layout: "src/app/layout.tsx", full: true },
  election: { app: "apps/web/app", layout: "apps/web/app/layout.tsx" },
  georisk: { app: "web/src/app", layout: "web/src/app/layout.tsx" },
  esgmap: { html: ["index.html"], assets: "public/monarch", href: "%BASE_URL%monarch/design.css", full: true },
  "nuclear-energy-intelligence": { directory: "NuclearEnergyIntelligence", html: ["index.html"], assets: "public/monarch", href: "%BASE_URL%monarch/design.css" },
  "superlig-forecast": { html: ["dashboard/index.html"], assets: "dashboard/public/monarch", href: "%BASE_URL%monarch/design.css" },
  prepturk: { html: ["site/index.html"], assets: "site/assets/monarch", href: "./assets/monarch/design.css" },
  "cloudy-shiny": { directory: "Cloudy-Shiny", html: ["template.html", "index.html"] },
  macrointel: { full: true },
  "mena-threat-index": { inline: true }
};
for (const product of products) {
  const config = configs[product.id] ?? {};
  const directory = path.join(workspace, config.directory ?? product.id);
  if (!fs.existsSync(path.join(directory, ".git"))) throw new Error(`Clone missing: ${directory}`);
  const assets = path.join(directory, config.app ? `${config.app}/monarch` : config.assets ?? "assets/monarch");
  write(path.join(assets, "design.css"), css);
  for (const filename of ["IBMPlexSans-Regular.woff2", "IBMPlexSans-SemiBold.woff2", "IBMPlexMono-Regular.woff2", "OFL.txt"]) copy(path.join(root, "src/assets/fonts", filename), path.join(assets, "fonts", filename));
  write(path.join(assets, "manifest.json"), JSON.stringify({ version: "2026.10", source: "https://github.com/MonarchCastleTech/MonarchCastleTech.github.io/tree/main/src/design-system", fonts: "IBM Plex / SIL OFL 1.1", product: product.id }, null, 2) + "\n");
  if (config.app) {
    const component = shell(product).replaceAll('class="', 'className="');
    write(path.join(assets, "navigation.tsx"), `export function MonarchNavigation() {\n  return (${component});\n}\n`);
    const layout = path.join(directory, config.layout);
    let source = fs.readFileSync(layout, "utf8");
    if (!source.includes('"./monarch/design.css"')) {
      source = source.replace('import "./globals.css";', 'import "./globals.css";\nimport "./monarch/design.css";\nimport { MonarchNavigation } from "./monarch/navigation";');
      source = source.replace(/<body([^>]*)>/, `<body$1 data-monarch-product="${product.id}">\n        <MonarchNavigation />${config.full ? '\n        <div className="monarch-product-surface">' : ""}`);
      // Preserve pre-existing body classes and append the shared theme scope.
      source = source.replace(/<body className="([^"]*)"/, '<body className="$1 monarch-product"');
      source = source.replace(/<body className=\{`([^`]*)`\}/, '<body className={`$1 monarch-product`}');
      if (config.full) source = source.replace("</body>", "</div>\n      </body>");
      fs.writeFileSync(layout, source);
    }
  } else {
    const entrypoints = config.html ?? ["index.html", ...["methodology/index.html"].filter(file => fs.existsSync(path.join(directory, file)))];
    for (const relative of entrypoints) {
      const filename = path.join(directory, relative);
      let source = fs.readFileSync(filename, "utf8");
      const href = config.href ?? path.relative(path.dirname(path.join(directory, relative)), path.join(assets, "design.css")).replaceAll("\\", "/");
      if (source.includes('class="monarch-shell"')) {
        source = source.replace(/<header class="monarch-shell">[\s\S]*?<\/header>/, shell(product));
        fs.writeFileSync(filename, source);
        continue;
      }
      const stylesheet = `<link rel="stylesheet" href="${href}">`;
      source = source.replace(/<body([^>]*)>/i, (_, attrs) => `<body${/class=/.test(attrs) ? attrs.replace(/class="([^"]*)"/, 'class="$1 monarch-product"') : `${attrs} class="monarch-product"`} data-monarch-product="${product.id}">\n${shell(product)}${config.full ? '\n<div class="monarch-product-surface">' : ""}`);
      if (config.inline) source = source.replace("</helmet>", `${stylesheet}\n</helmet>`); else source = source.replace(/<\/head>/i, `${stylesheet}\n</head>`);
      if (config.full) source = source.replace(/<\/body>/i, "</div>\n</body>");
      fs.writeFileSync(filename, source);
    }
  }
  if (product.id === "prepturk") {
    const sw = path.join(directory, "site/sw.js"); let source = fs.readFileSync(sw, "utf8");
    source = source.replace('prepturk-pages-2026-08-30-v1', 'prepturk-pages-2026-10-02-v2');
    if (!source.includes('"./assets/monarch/design.css"')) source = source.replace('  "./assets/style.css",', '  "./assets/style.css",\n  "./assets/monarch/design.css",\n  "./assets/monarch/fonts/IBMPlexSans-Regular.woff2",\n  "./assets/monarch/fonts/IBMPlexSans-SemiBold.woff2",\n  "./assets/monarch/fonts/IBMPlexMono-Regular.woff2",');
    fs.writeFileSync(sw, source);
  }
  console.log(`${product.owner}/${path.basename(directory)}: design 2026.10`);
}
