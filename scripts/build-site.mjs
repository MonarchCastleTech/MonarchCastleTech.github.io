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

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

copyFile(path.join(root, "public", "CNAME"), path.join(dist, "CNAME"));
fs.writeFileSync(path.join(dist, ".nojekyll"), "");

for (const page of routes.localPages) {
  copyFile(path.join(root, page.source), path.join(dist, page.output));
}

fs.cpSync(path.join(root, "src", "styles"), path.join(dist, "styles"), { recursive: true });
fs.cpSync(path.join(root, "src", "scripts"), path.join(dist, "scripts"), { recursive: true });

for (const asset of routes.assets) {
  const source = path.join(cacheRoot, asset.fromRepo, asset.from);
  const target = path.join(dist, asset.to);

  if (fs.existsSync(source)) {
    fs.cpSync(source, target, { recursive: true });
  }
}

for (const mount of routes.dashboardMounts) {
  const upstreamRoot = path.join(cacheRoot, mount.repoKey);
  const targetRoot = path.join(dist, mount.slug);

  if (!fs.existsSync(upstreamRoot)) {
    throw new Error(`Missing upstream checkout for ${mount.repoKey}; run npm run sync`);
  }

  copyDirectory(upstreamRoot, targetRoot, (content) => rewriteStaticContent(content, mount.path));
}
