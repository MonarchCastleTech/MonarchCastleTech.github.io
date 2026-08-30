const organizations = ["MonarchCastleTech", "SDCofA"];
const prohibited = [
  "Latest declared source timestamp",
  "Need improvement",
  "should not be treated as directly interchangeable",
];

async function fetchRepositories(owner) {
  const response = await fetch(`https://api.github.com/orgs/${owner}/repos?type=public&per_page=100`, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "MCT-Portfolio-Health/1.0" },
  });
  if (!response.ok) throw new Error(`${owner} inventory returned HTTP ${response.status}`);
  const repositories = await response.json();
  return repositories.filter((repo) => !repo.archived && repo.name !== ".github").map((repo) => {
    const rootSite = repo.name.toLowerCase() === `${owner.toLowerCase()}.github.io`;
    return {
      label: `${owner}/${repo.name}`,
      url: repo.homepage || `https://${owner.toLowerCase()}.github.io/${rootSite ? "" : `${repo.name}/`}`,
    };
  });
}

const targets = (await Promise.all(organizations.map(fetchRepositories))).flat();
if (targets.length < 30) throw new Error(`Portfolio inventory unexpectedly contains only ${targets.length} public projects`);

async function inspect(project) {
  if (!project.url.startsWith("https://")) throw new Error("canonical URL is not HTTPS");
  let lastError;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await fetch(`${project.url}?portfolio-health=${Date.now()}`, {
        headers: { "Cache-Control": "no-cache", "User-Agent": "MCT-Portfolio-Health/1.0" },
        redirect: "follow",
        signal: controller.signal,
      });
      const html = await response.text();
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (html.length < 500) throw new Error("response is unexpectedly small");
      const exposed = prohibited.find((phrase) => html.toLowerCase().includes(phrase.toLowerCase()));
      if (exposed) throw new Error(`internal language exposed: ${exposed}`);
      return;
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError;
}

const failures = [];
for (let offset = 0; offset < targets.length; offset += 6) {
  const batch = targets.slice(offset, offset + 6);
  const results = await Promise.allSettled(batch.map(inspect));
  results.forEach((result, index) => {
    const project = batch[index];
    if (result.status === "fulfilled") console.log(`ok ${project.label}`);
    else failures.push(`${project.label}: ${result.reason?.message ?? result.reason}`);
  });
}

if (failures.length) {
  throw new Error(`Portfolio health failed:\n${failures.join("\n")}`);
}

console.log(`portfolio health passed (${targets.length} products)`);
