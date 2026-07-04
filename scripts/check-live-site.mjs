const baseUrl = new URL(process.env.SITE_BASE_URL || "http://monarchcastle.tech");
const maxAgeHours = Number(process.env.SITE_DATA_MAX_AGE_HOURS || 12);
const requireHttps = process.env.SITE_REQUIRE_HTTPS === "1";

const routeChecks = [
  { path: "/", markers: ["Sovereign decision intelligence", "assets/products/logo.png", 'id="div-sdcofa"'] },
  { path: "/tools/", markers: ["Tools", "Calculators"] },
  { path: "/mcp/", markers: ["MCP", "catalog"] },
  { path: "/sdcofa/", markers: ["Strategic Data Company of Ankara", "BNTI", "WTI", "MENA"] },
  { path: "/bnti/", markers: ["BNTI", "Threat Index"] },
  { path: "/wti/", markers: ["WTI", "Threat Index"] },
  { path: "/mena/", markers: ["MENA", "Threat Index"] },
];

const dataChecks = [
  { label: "BNTI", path: "/bnti/bnti_data.json", maxAgeHours },
  { label: "WTI", path: "/wti/wti_data.json", maxAgeHours },
  { label: "MENA", path: "/mena/mena_data.json", maxAgeHours },
];

function siteUrl(path) {
  return new URL(path.replace(/^\//, ""), baseUrl).toString();
}

async function fetchText(path) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${siteUrl(path)}?health=${Date.now()}`, {
      headers: { "Cache-Control": "no-cache" },
      signal: controller.signal,
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`${path} returned HTTP ${response.status}`);
    }
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

function dashboardTimestamp(payload) {
  return (
    payload.updated ||
    payload.last_updated ||
    payload.generated_at ||
    payload.timestamp ||
    payload.as_of ||
    payload.meta?.updated ||
    payload.meta?.generated_at ||
    payload.metadata?.updated ||
    null
  );
}

function assertFresh(label, timestamp, allowedHours) {
  if (!timestamp) {
    throw new Error(`${label} data does not expose an update timestamp`);
  }
  const updatedAt = new Date(timestamp);
  if (Number.isNaN(updatedAt.getTime())) {
    throw new Error(`${label} data timestamp is invalid: ${timestamp}`);
  }
  const ageHours = (Date.now() - updatedAt.getTime()) / 36e5;
  if (ageHours > allowedHours) {
    throw new Error(`${label} data is stale: ${ageHours.toFixed(1)}h old, limit ${allowedHours}h`);
  }
  return ageHours;
}

async function checkHttpsIfRequired() {
  if (!requireHttps) {
    return;
  }
  const httpsBase = new URL(baseUrl);
  httpsBase.protocol = "https:";
  const response = await fetch(httpsBase.toString(), { headers: { "Cache-Control": "no-cache" } });
  if (!response.ok) {
    throw new Error(`HTTPS root returned HTTP ${response.status}`);
  }
}

const failures = [];

try {
  await checkHttpsIfRequired();
} catch (error) {
  failures.push(error.message);
}

for (const check of routeChecks) {
  try {
    const text = await fetchText(check.path);
    for (const marker of check.markers) {
      if (!text.includes(marker)) {
        throw new Error(`${check.path} missing marker: ${marker}`);
      }
    }
    console.log(`ok route ${check.path}`);
  } catch (error) {
    failures.push(error.message);
  }
}

for (const check of dataChecks) {
  try {
    const text = await fetchText(check.path);
    const payload = JSON.parse(text);
    const timestamp = dashboardTimestamp(payload);
    const ageHours = assertFresh(check.label, timestamp, check.maxAgeHours);
    console.log(`ok data ${check.label} updated=${timestamp} ageHours=${ageHours.toFixed(2)}`);
  } catch (error) {
    failures.push(error.message);
  }
}

if (failures.length) {
  console.error("live site health check failed");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("live site health check passed");
