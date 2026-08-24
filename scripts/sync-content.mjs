import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);

function arg(name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 ? path.resolve(args[index + 1]) : fallback;
}

const defaultGovernanceRoot = path.resolve(repoRoot, "..", "..", "company-governance");
const governanceRoot = arg("--governance-root", defaultGovernanceRoot);
const outputPath = arg("--output", path.join(repoRoot, "src", "content", "site.json"));
const assetOutput = arg("--asset-output", path.join(repoRoot, "src", "assets", "approved"));
const checkOnly = args.includes("--check");

const sourceFiles = {
  products: "portfolio/products.json",
  brand: "portfolio/brand.json",
  logoInventory: "portfolio/logo-inventory.json",
  claims: "claims/claims-register.json",
  forecastBenchmark: "forecasting/benchmark-manifest.json"
};

const localPresentationLogos = {
  "cloudy-shiny": "assets/products/cloudy-shiny-logo.png",
  econmap: "assets/products/econmap-logo.png",
  esgmap: "assets/products/esgmap-logo.png",
  macrointel: "assets/products/macrointel-logo.png",
  "milcodec-receiver": "assets/products/milcodec-logo.png",
  "nuclear-energy-intelligence": "assets/products/nuclear-logo.png",
  prepturk: "assets/products/prepturk-logo.png",
  "superlig-forecast": "assets/products/superlig-forecast-logo.png",
  supplychain: "assets/products/supplychain-logo.png",
  "border-neighbor-threat-index": "assets/products/bnti-icon.png",
  "mena-threat-index": "assets/approved/mena-threat-index.png",
  "world-threat-index": "assets/approved/world-threat-index.png"
};

let localProjection;
function readLocalProjection() {
  if (!localProjection) {
    const projectionPath = path.join(repoRoot, "src", "content", "site.json");
    if (!fs.existsSync(projectionPath)) throw new Error("Local content projection is missing: src/content/site.json");
    localProjection = JSON.parse(fs.readFileSync(projectionPath, "utf8"));
  }
  return localProjection;
}

function readJson(relativePath) {
  const filePath = path.join(governanceRoot, relativePath);
  if (fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath, "utf8"));

  // The former company-governance checkout no longer exists. Keep the public
  // projection reproducible from this repository until a replacement registry
  // is introduced; an explicit --governance-root remains authoritative for CI.
  if (governanceRoot !== defaultGovernanceRoot) {
    throw new Error(`Missing governance source: ${relativePath}`);
  }
  const projection = readLocalProjection();
  if (relativePath === sourceFiles.products) {
    return { products: projection.products.map((product) => ({
      id: product.id,
      name: product.name,
      ownerOrg: product.owner,
      family: product.family,
      lifecycle: product.lifecycle,
      publicUrl: product.canonicalUrl,
      methodologyUrl: product.methodologyUrl,
      updateFrequency: product.updateFrequency,
      evidenceStatus: product.forecastEvidenceStatus,
      logo: null
    })) };
  }
  if (relativePath === sourceFiles.brand) return { brand: projection.brand };
  if (relativePath === sourceFiles.logoInventory) return { logos: [] };
  if (relativePath === sourceFiles.claims) {
    return { claims: Array.from({ length: projection.claims?.approvedCount ?? 0 }, () => ({ status: "approved" })) };
  }
  if (relativePath === sourceFiles.forecastBenchmark) return { status: projection.forecastEvaluation?.status ?? "template-not-evaluated" };
  throw new Error(`Missing governance source: ${relativePath}`);
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
}

function hash(value) {
  return crypto.createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex");
}

function requireText(product, field) {
  const value = product[field];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${product.id ?? "unknown product"} is missing required field ${field}`);
  }
  return value;
}

const productsSource = readJson(sourceFiles.products);
const brandSource = readJson(sourceFiles.brand);
const logoSource = readJson(sourceFiles.logoInventory);
const claimsSource = readJson(sourceFiles.claims);
const forecastSource = readJson(sourceFiles.forecastBenchmark);

if (!Array.isArray(productsSource.products)) throw new Error("products.json must contain a products array");
if (!Array.isArray(logoSource.logos)) throw new Error("logo-inventory.json must contain a logos array");
if (!brandSource.brand || !Array.isArray(brandSource.brand.pillars)) throw new Error("brand.json is missing governed brand fields");
if (!Array.isArray(claimsSource.claims)) throw new Error("claims-register.json must contain a claims array");

const publicProducts = productsSource.products.filter(({ publicUrl, lifecycle }) => publicUrl && lifecycle !== "retired");
const seenIds = new Set();
const seenUrls = new Set();
const logoByProduct = new Map(logoSource.logos.map((logo) => [logo.productId, logo]));
const approvedCopies = [];

const products = publicProducts.map((source) => {
  const id = requireText(source, "id");
  if (seenIds.has(id)) throw new Error(`Duplicate product ID: ${id}`);
  seenIds.add(id);

  const canonicalUrl = requireText(source, "publicUrl");
  if (seenUrls.has(canonicalUrl)) throw new Error(`Duplicate product URL: ${canonicalUrl}`);
  seenUrls.add(canonicalUrl);

  const name = requireText(source, "name");
  const owner = requireText(source, "ownerOrg");
  const sourceLogo = source.logo;
  const localPresentationLogo = localPresentationLogos[id];
  let logo;

  if (localPresentationLogo) {
    const localPath = path.join(repoRoot, "src", localPresentationLogo);
    if (!fs.existsSync(localPath)) throw new Error(`${id} local presentation logo is missing: ${localPresentationLogo}`);
    logo = {
      kind: "approved-image",
      sourcePath: localPresentationLogo,
      publicPath: `/${localPresentationLogo}`,
      sha256: crypto.createHash("sha256").update(fs.readFileSync(localPath)).digest("hex"),
      alt: `${name} product logo`
    };
  } else if (sourceLogo === null) {
    logo = { kind: "governed-text", label: name, status: "review-required" };
  } else {
    const approval = logoByProduct.get(id);
    if (!approval || approval.path !== sourceLogo) {
      throw new Error(`${id} references an image that is not approved by logo-inventory.json`);
    }

    const sourcePath = path.join(governanceRoot, sourceLogo);
    if (!fs.existsSync(sourcePath)) throw new Error(`${id} approved logo source is missing: ${sourceLogo}`);
    const actualHash = crypto.createHash("sha256").update(fs.readFileSync(sourcePath)).digest("hex");
    if (actualHash !== approval.sha256) throw new Error(`${id} approved logo hash does not match inventory`);

    const extension = path.extname(sourceLogo).toLowerCase();
    const outputName = `${id}${extension}`;
    logo = {
      kind: "approved-image",
      sourcePath: `assets/approved/${outputName}`,
      publicPath: `/assets/approved/${outputName}`,
      sha256: approval.sha256,
      alt: `${name} product mark`
    };
    approvedCopies.push({ sourcePath, outputName });
  }

  return {
    id,
    name,
    family: requireText(source, "family"),
    lifecycle: requireText(source, "lifecycle"),
    regions: [],
    methodologyUrl: requireText(source, "methodologyUrl"),
    updateFrequency: requireText(source, "updateFrequency"),
    logo,
    canonicalUrl,
    owner,
    forecastEvidenceStatus: requireText(source, "evidenceStatus"),
    endorsementLabel: owner === "SDCofA"
      ? "SDCofA — endorsed analytical unit of Monarch Castle Technologies"
      : brandSource.brand.productEndorsement
  };
});

const ownerViews = Object.fromEntries(
  [...new Set(products.map(({ owner }) => owner))].sort().map((owner) => [
    owner,
    products.filter((product) => product.owner === owner).map(({ id }) => id)
  ])
);

const generated = {
  schemaVersion: 1,
  source: {
    repository: "MonarchCastleTech/MonarchCastleTech.github.io/local-registry",
    files: sourceFiles,
    sha256: hash({ productsSource, brandSource, logoSource, claimsSource, forecastSource })
  },
  brand: brandSource.brand,
  forecastEvaluation: {
    status: forecastSource.status,
    evidenceLabel: forecastSource.status === "template-not-evaluated"
      ? "Forecast evaluation not yet evidenced"
      : "See governed forecast evaluation"
  },
  claims: {
    approvedCount: claimsSource.claims.filter(({ status }) => status === "approved").length,
    publicReleasePolicy: "Only separately approved claims may be published."
  },
  ownerViews,
  products
};

const rendered = `${JSON.stringify(generated, null, 2)}\n`;

if (checkOnly) {
  if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, "utf8") !== rendered) {
    throw new Error("Generated site content has drifted from governance sources; run npm run sync:content");
  }

  for (const { sourcePath, outputName } of approvedCopies) {
    const target = path.join(assetOutput, outputName);
    if (!fs.existsSync(target)) throw new Error(`Approved output asset is missing: ${outputName}`);
    const expected = crypto.createHash("sha256").update(fs.readFileSync(sourcePath)).digest("hex");
    const actual = crypto.createHash("sha256").update(fs.readFileSync(target)).digest("hex");
    if (actual !== expected) throw new Error(`Approved output asset has drifted: ${outputName}`);
  }

  console.log(`content projection current: ${products.length} products (${ownerViews.MonarchCastleTech?.length ?? 0} flagship)`);
} else {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, rendered);
  fs.mkdirSync(assetOutput, { recursive: true });
  for (const { sourcePath, outputName } of approvedCopies) {
    fs.copyFileSync(sourcePath, path.join(assetOutput, outputName));
  }
  console.log(`content projection synced: ${products.length} products (${ownerViews.MonarchCastleTech?.length ?? 0} flagship)`);
}
