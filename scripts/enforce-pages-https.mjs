import { spawnSync } from "node:child_process";

const repo = process.env.PAGES_REPO || "MonarchCastleTech/MonarchCastleTech.github.io";
const expectedHost = process.env.PAGES_HOST || "monarchcastletech.github.io";

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
if (page.cname) {
  const clear = runGh(["api", "--method", "PUT", `repos/${repo}/pages`, "-f", "cname=", "-f", "build_type=workflow"]);
  if (clear.status !== 0) {
    console.error(output(clear));
    process.exit(clear.status || 1);
  }
}

const expectedUrl = `https://${expectedHost}/`;
const currentUrl = page.cname ? expectedUrl : page.html_url;
if (currentUrl !== expectedUrl) {
  console.error(`Unexpected Pages URL: ${currentUrl}; expected ${expectedUrl}`);
  process.exit(1);
}

console.log(`Pages host verified: ${expectedUrl}`);
