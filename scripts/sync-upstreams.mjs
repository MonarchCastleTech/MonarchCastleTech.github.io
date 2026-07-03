import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const routes = JSON.parse(fs.readFileSync(path.join(root, "site.routes.json"), "utf8"));
const cacheRoot = path.join(root, ".cache", "upstreams");

function run(command, args, cwd = root) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8"
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (result.status !== 0) {
    const rendered = [command, ...args].join(" ");
    const details = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
    throw new Error(`${rendered} failed${details ? `\n${details}` : ""}`);
  }
}

fs.mkdirSync(cacheRoot, { recursive: true });

for (const [key, url] of Object.entries(routes.upstreams)) {
  const target = path.join(cacheRoot, key);
  const gitDir = path.join(target, ".git");

  if (!fs.existsSync(gitDir)) {
    run("git", ["clone", "--depth", "1", url, target]);
    continue;
  }

  run("git", ["pull", "--ff-only"], target);
}
