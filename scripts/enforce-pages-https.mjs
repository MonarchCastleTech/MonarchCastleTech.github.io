import { spawnSync } from "node:child_process";

const repo = process.env.PAGES_REPO || "MonarchCastleTech/MonarchCastleTech.github.io";
const customDomain = process.env.PAGES_CNAME || "monarchcastle.tech";

function runGh(args) {
  return spawnSync("gh", args, {
    encoding: "utf8",
    env: process.env,
  });
}

function parseJson(text) {
  try {
    return JSON.parse(text || "{}");
  } catch {
    return {};
  }
}

function output(result) {
  return `${result.stdout || ""}\n${result.stderr || ""}`.trim();
}

const current = runGh(["api", `repos/${repo}/pages`]);
if (current.status !== 0) {
  console.error(output(current));
  process.exit(current.status || 1);
}

const page = parseJson(current.stdout);
if (page.https_enforced === true) {
  console.log(`HTTPS already enforced for ${page.cname || customDomain}`);
  process.exit(0);
}

const result = runGh([
  "api",
  "--method",
  "PUT",
  `repos/${repo}/pages`,
  "-f",
  `cname=${customDomain}`,
  "-f",
  "build_type=workflow",
  "-F",
  "https_enforced=true",
]);

if (result.status === 0) {
  console.log(`HTTPS enforcement requested for ${customDomain}`);
  process.exit(0);
}

const combined = output(result);
if (/certificate does not exist yet/i.test(combined)) {
  console.log(`HTTPS certificate for ${customDomain} is still pending; will retry on the next schedule.`);
  process.exit(0);
}

console.error(combined || `Unable to enforce HTTPS for ${customDomain}`);
process.exit(result.status || 1);
