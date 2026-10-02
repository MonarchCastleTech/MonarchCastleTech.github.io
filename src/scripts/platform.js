import { feeds, readFeeds, sourceDate } from "./feed-records.js";
const number = new Intl.NumberFormat("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dated = sourceDate;
const text = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
let records = [], events = [], visible = [], watchlist = new Set();
try { const saved = JSON.parse(localStorage.getItem("monarch-keep-watchlist") ?? "[]"); if (Array.isArray(saved)) watchlist = new Set(saved.filter(v => typeof v === "string")); } catch { /* Storage is optional. */ }
const key = row => row.product + ":" + row.code;
function render() {
  const query = document.getElementById("keep-search")?.value.trim().toLowerCase() ?? "";
  const source = document.getElementById("keep-source")?.value ?? "";
  const savedOnly = document.getElementById("keep-watchlist")?.checked;
  visible = records.filter(row => row.name.toLowerCase().includes(query) && (!source || row.product === source) && (!savedOnly || watchlist.has(key(row))));
  text("platform-note", visible.length + " matching source records. Export includes every match. Independent scales; withheld values stay unavailable.");
  const list = document.getElementById("exposure-list");
  if (list) {
    list.replaceChildren(...visible.map(row => {
      const item = document.createElement("tr"), link = document.createElement("a"), pin = document.createElement("button");
      for (const value of [row.name, row.label, row.value === null ? "—" : number.format(row.value), row.status, dated(row.updated)]) {
        const cell = document.createElement("td"); cell.textContent = value; item.append(cell);
      }
      link.href = row.view; link.textContent = "↗";
      link.setAttribute("aria-label", "Inspect " + row.name + " " + row.label + " source");
      pin.type = "button"; pin.className = "watchlist-pin"; pin.textContent = watchlist.has(key(row)) ? "★" : "☆";
      pin.setAttribute("aria-label", (watchlist.has(key(row)) ? "Remove " : "Save ") + row.name + " " + row.label + " watchlist");
      pin.setAttribute("aria-pressed", String(watchlist.has(key(row))));
      pin.addEventListener("click", () => { if (watchlist.has(key(row))) watchlist.delete(key(row)); else watchlist.add(key(row)); try { localStorage.setItem("monarch-keep-watchlist", JSON.stringify([...watchlist])); } catch { /* In-memory saving still works. */ } render(); });
      for (const content of [pin, link]) { const cell = document.createElement("td"); cell.append(content); item.append(cell); }
      return item;
    }));
    if (!visible.length) { const empty = document.createElement("tr"), cell = document.createElement("td"); cell.colSpan = 7; cell.textContent = "No country records match these filters."; empty.append(cell); list.append(empty); }
  }
  const eventList = document.getElementById("signal-list");
  if (eventList) {
    const matches = events.filter(row => (!source || row.product === source) && row.country.toLowerCase().includes(query) && (!savedOnly || records.some(record => record.product === row.product && record.name === row.country && watchlist.has(key(record))))).slice(0, 12);
    eventList.replaceChildren(...matches.map(row => {
      const item = document.createElement("li"), link = document.createElement(row.href ? "a" : "div"), title = document.createElement("b"), meta = document.createElement("span");
      if (row.href) { link.href = row.href; link.target = "_blank"; link.rel = "noopener noreferrer"; }
      title.textContent = row.title; meta.textContent = row.label + " · source grouping: " + row.country + " · " + dated(row.timestamp);
      link.append(title, meta); item.append(link); return item;
    }));
    if (!matches.length) { const empty = document.createElement("li"); empty.textContent = "No dated source records match these filters."; eventList.append(empty); }
  }
}
async function refresh() {
  const settled = await readFeeds(), valid = settled.filter(r => r.status === "fulfilled").map(r => r.value);
  for (const feed of feeds) { text("metric-" + feed.id, "—"); text("status-" + feed.id, feed.label + " · Unavailable"); text("updated-" + feed.id, "Timestamp unavailable"); }
  for (const feed of valid) { text("metric-" + feed.id, feed.value === null ? "—" : number.format(feed.value)); text("status-" + feed.id, feed.label + " · " + feed.status); text("updated-" + feed.id, (feed.withheld ? "Withdrawal notice: " : "Source output: ") + dated(feed.updated)); }
  records = valid.flatMap(feed => feed.countries).sort((a, b) => a.name.localeCompare(b.name) || a.label.localeCompare(b.label));
  events = valid.flatMap(feed => feed.events).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  text("feed-state", valid.length === feeds.length ? "All feeds connected" : valid.length + "/" + feeds.length + " feeds available");
  render(); document.dispatchEvent(new CustomEvent("monarch:feeds", { detail: valid }));
}
for (const id of ["keep-search", "keep-source", "keep-watchlist"]) document.getElementById(id)?.addEventListener("input", render);
document.getElementById("keep-export")?.addEventListener("click", () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), note: "Independent scales; withheld values are null.", records: visible }, null, 2)], { type: "application/json" }));
  const link = document.createElement("a"); link.href = url; link.download = "monarch-keep-records.json"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
refresh(); window.setInterval(() => { if (!document.hidden) refresh(); }, 300000);
