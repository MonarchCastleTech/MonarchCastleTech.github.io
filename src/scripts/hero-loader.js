import { countryCentre, matchGeography } from "./atlas-data.js";
import { normaliseFeed, feeds } from "./feed-records.js";
const host = document.querySelector(".mission-hero-visual"), picker = document.getElementById("atlas-country");
let atlas = null;
async function start() {
  const feedConfig = feeds.find(feed => feed.id === "wti");
  const responses = await Promise.all([fetch("/assets/geo/world.json"), fetch(feedConfig.url)]);
  if (responses.some(response => !response.ok)) throw new Error("Atlas source unavailable");
  const [geography, payload] = await Promise.all(responses.map(response => response.json()));
  const rows = normaliseFeed(feedConfig, payload).countries.sort((a, b) => a.name.localeCompare(b.name));
  const points = rows.flatMap(row => { const feature = matchGeography(row, geography), centre = feature && countryCentre(feature); return centre && row.value !== null ? [{ ...row, lon: centre[0], lat: centre[1] }] : []; });
  const ns = "http://www.w3.org/2000/svg", land = document.getElementById("atlas-land"), marks = document.getElementById("atlas-points");
  for (const feature of geography) {
    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", feature.rings.map(ring => ring.map(([lon, lat], i) => (i === 0 || Math.abs(lon - ring[i - 1][0]) > 180 ? "M" : "L") + (lon + 180) * 2 + "," + (90 - lat) * 2).join(" ")).join(" "));
    land.append(path);
  }
  for (const point of points) { const dot = document.createElementNS(ns, "circle"); dot.setAttribute("cx", (point.lon + 180) * 2); dot.setAttribute("cy", (90 - point.lat) * 2); dot.setAttribute("r", "2"); dot.dataset.code = point.code; marks.append(dot); }
  picker.replaceChildren(...rows.map(row => { const option = document.createElement("option"); option.value = row.code; option.textContent = row.name; return option; }));
  function select(code) {
    const row = rows.find(entry => entry.code === code); if (!row) return;
    picker.value = code;
    const label = document.createElement("span"), value = document.createElement("strong"), detail = document.createElement("small"), link = document.createElement("a");
    label.textContent = row.name + " / WTI"; value.textContent = row.value === null ? "—" : row.value.toFixed(2);
    detail.textContent = row.status + " · " + (row.updated ?? "No source date"); link.href = row.view; link.textContent = "Inspect source & method ↗";
    document.getElementById("atlas-record").replaceChildren(label, value, detail, link);
    for (const point of marks.children) point.classList.toggle("selected", point.dataset.code === code);
    atlas?.select(code);
  }
  picker.addEventListener("change", () => select(picker.value));
  document.getElementById("atlas-state").textContent = points.length + " mapped published records";
  select(rows.find(row => ["Turkey", "Türkiye"].includes(row.name))?.code ?? rows[0]?.code);
  if (matchMedia("(min-width: 48rem)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    try { atlas = (await import("./hero-scene.js")).createAtlas(host, geography, points, select); atlas?.select(picker.value); } catch { /* The geographic SVG and controls remain available. */ }
  }
}
if (host) start().catch(() => {
  document.getElementById("atlas-state").textContent = "Snapshot unavailable";
  picker.replaceChildren(new Option("Source unavailable", ""));
  const link = document.createElement("a"); link.href = "/sdcofa/wti/"; link.textContent = "Open the World Threat Index source view →";
  document.getElementById("atlas-record").replaceChildren(link);
});
