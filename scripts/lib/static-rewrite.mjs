const TEXT_EXTENSIONS = new Set([".html", ".css", ".js", ".json", ".webmanifest", ".svg", ".txt", ".md"]);
const STATIC_EXTENSIONS = new Set([
  ".html", ".css", ".js", ".json", ".csv", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg",
  ".ico", ".pdf", ".txt", ".webmanifest", ".woff", ".woff2", ".ttf", ".map"
]);
const SKIP_PREFIXES = [".git/", ".github/", ".agent/", "__pycache__/", "docs/", "PythontoExcelandPowerBI/"];
const SKIP_EXTENSIONS = new Set([".py", ".tex", ".xlsx", ".bib"]);
const SKIP_FILENAMES = new Set(["requirements.txt", ".gitignore"]);

export function extensionOf(relativePath) {
  const normalized = relativePath.replaceAll("\\\\", "/");
  const lastIndex = normalized.lastIndexOf(".");
  return lastIndex === -1 ? "" : normalized.slice(lastIndex).toLowerCase();
}

export function isTextAsset(relativePath) {
  return TEXT_EXTENSIONS.has(extensionOf(relativePath));
}

export function shouldCopyStaticFile(relativePath) {
  const normalized = relativePath.replaceAll("\\\\", "/");
  if (SKIP_PREFIXES.some((prefix) => normalized === prefix.slice(0, -1) || normalized.startsWith(prefix))) {
    return false;
  }
  const filename = normalized.split("/").pop();
  if (SKIP_FILENAMES.has(filename)) return false;
  const ext = extensionOf(normalized);
  if (SKIP_EXTENSIONS.has(ext)) return false;
  return STATIC_EXTENSIONS.has(ext);
}

export function rewriteStaticContent(content, mountPath) {
  const cleanMount = mountPath.endsWith("/") ? mountPath.slice(0, -1) : mountPath;
  const rewritePath = (rawPath) => {
    if (!rawPath.startsWith("/")) return rawPath;
    if (rawPath.startsWith(`${cleanMount}/`)) return rawPath;
    if (/^\/\//.test(rawPath)) return rawPath;
    return `${cleanMount}${rawPath}`;
  };

  return content
    .replace(/(href|src)=("|')\/(?!\/)([^"']+)/g, (_match, attr, quote, rest) => `${attr}=${quote}${rewritePath(`/${rest}`)}`)
    .replace(/url\(("?)\/(?!\/)([^)"']+)\1\)/g, (_match, quote, rest) => `url(${quote}${rewritePath(`/${rest}`)}${quote})`);
}
