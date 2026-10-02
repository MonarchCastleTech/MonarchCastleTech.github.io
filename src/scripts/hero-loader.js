import { normaliseFeed, feeds, sourceDate } from "./feed-records.js";

const host = document.querySelector(".world-scene");
const picker = document.getElementById("atlas-country");
let scene;

async function start() {
  const feed = feeds.find(entry => entry.id === "wti");
  const responses = await Promise.all([
    fetch("/assets/geo/world.json"), fetch(feed.url, { cache: "no-store" })
  ]);
  if (responses.some(response => !response.ok)) throw new Error("Source unavailable");
  const [geography, payload] = await Promise.all(responses.map(response => response.json()));
  const countries = normaliseFeed(feed, payload).countries.sort((a, b) => a.name.localeCompare(b.name));
  const ns = "http://www.w3.org/2000/svg";
  for (const feature of geography) {
    const shape = document.createElementNS(ns, "path");
    shape.setAttribute("d", feature.rings.map(ring => ring.map(([lon, lat], index) =>
      (index === 0 || Math.abs(lon - ring[index - 1][0]) > 180 ? "M" : "L") +
      (lon + 180) * 2 + "," + (90 - lat) * 2
    ).join(" ")).join(" "));
    document.getElementById("atlas-land").append(shape);
    document.getElementById("regional-map")?.append(shape.cloneNode());
  }
  picker.replaceChildren(...countries.map(row => {
    const option = document.createElement("option");
    option.value = row.code; option.textContent = row.name;
    return option;
  }));
  const select = code => {
    const row = countries.find(entry => entry.code === code);
    if (!row) return;
    picker.value = code;
    document.getElementById("country-score").textContent = row.value === null ? "—" : row.value.toFixed(2);
    document.getElementById("atlas-state").textContent = row.status + " · " + sourceDate(row.updated);
    scene?.select(row);
  };
  picker.addEventListener("change", () => select(picker.value));
  const initial = countries.find(row => ["Turkey", "Türkiye"].includes(row.name))?.code ?? countries[0]?.code;
  select(initial);
  try {
    scene = (await import("./hero-scene.js")).createScene(geography, countries, select);
    select(picker.value);
  } catch { /* Geographic SVG and the country controls remain available. */ }
}

if (host) start().catch(() => {
  document.getElementById("atlas-state").textContent = "Source unavailable. Inspect the source view.";
  picker.replaceChildren(new Option("Source unavailable", ""));
});
