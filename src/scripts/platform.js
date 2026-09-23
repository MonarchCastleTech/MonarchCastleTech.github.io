const feeds = [
  { id: "bnti", label: "BNTI", url: "/sdcofa/bnti/bnti_data.json" },
  { id: "wti", label: "WTI", url: "/sdcofa/wti/wti_data.json" },
  { id: "mena", label: "MENA", url: "/sdcofa/mena/mena_data.json" }
];

const number = new Intl.NumberFormat("en", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
const date = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });

function text(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function asFinite(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function generatedAt(payload) {
  const value = payload?.meta?.generated_at ?? payload?.meta?.issued_at;
  const parsed = value ? new Date(value) : null;
  return parsed && !Number.isNaN(parsed.valueOf()) ? parsed : null;
}

function countryRows(feed, payload) {
  const entries = Object.entries(payload?.countries ?? {});
  return entries
    .map(([code, record]) => ({
      product: feed.label,
      name: record?.name ?? code,
      value: asFinite(record?.index),
      status: record?.status ?? payload?.meta?.status ?? "Published"
    }))
    .filter((row) => row.value !== null)
    .sort((a, b) => b.value - a.value)
    .slice(0, 2);
}

function eventRows(feed, payload) {
  const rows = [];
  for (const [code, record] of Object.entries(payload?.countries ?? {})) {
    for (const event of record?.events ?? []) {
      const timestamp = new Date(event?.date ?? 0);
      rows.push({
        product: feed.label,
        country: record?.name ?? code,
        title: event?.translated_title || event?.title || "Published signal",
        href: event?.link,
        timestamp: Number.isNaN(timestamp.valueOf()) ? new Date(0) : timestamp
      });
    }
  }
  return rows.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
}

function renderExposure(rows) {
  const list = document.getElementById("exposure-list");
  if (!list) return;
  if (!rows.length) {
    const item = document.createElement("li");
    item.className = "empty-row";
    item.textContent = "No exposure rows are available from the connected public feeds.";
    list.replaceChildren(item);
    return;
  }
  list.replaceChildren(...rows.map((row) => {
    const item = document.createElement("li");
    const name = document.createElement("b");
    const product = document.createElement("span");
    const value = document.createElement("strong");
    name.textContent = row.name;
    product.textContent = `${row.product} · ${row.status}`;
    value.textContent = number.format(row.value);
    item.append(name, product, value);
    return item;
  }));
}

function renderEvents(rows) {
  const list = document.getElementById("signal-list");
  if (!list) return;
  if (!rows.length) {
    const item = document.createElement("li");
    item.className = "empty-row";
    item.textContent = "No dated events are available from the connected public feeds.";
    list.replaceChildren(item);
    return;
  }
  list.replaceChildren(...rows.map((row) => {
    const item = document.createElement("li");
    const validLink = /^https?:\/\//.test(row.href ?? "");
    const link = document.createElement(validLink ? "a" : "div");
    const title = document.createElement("b");
    const meta = document.createElement("span");
    if (validLink) {
      link.href = row.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
    title.textContent = row.title;
    meta.textContent = `${row.product} · ${row.country} · ${date.format(row.timestamp)} UTC`;
    link.append(title, meta);
    item.append(link);
    return item;
  }));
}

async function readFeed(feed) {
  const response = await fetch(feed.url, { cache: "no-store", headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`${feed.label} returned ${response.status}`);
  return { feed, payload: await response.json() };
}

async function refresh() {
  const settled = await Promise.allSettled(feeds.map(readFeed));
  const valid = settled.filter((result) => result.status === "fulfilled").map((result) => result.value);
  const failures = settled.length - valid.length;
  const exposures = [];
  const events = [];
  const timestamps = [];

  for (const feed of feeds) {
    text(`metric-${feed.id}`, "—");
    text(`status-${feed.id}`, `${feed.label} · Unavailable`);
  }

  for (const { feed, payload } of valid) {
    const value = asFinite(payload?.meta?.main_index);
    if (value !== null) {
      text(`metric-${feed.id}`, number.format(value));
    }
    text(`status-${feed.id}`, `${feed.label} · ${payload?.meta?.withdrawn ? "WITHHELD" : value === null ? "No current value" : payload?.meta?.status ?? "Published"}`);
    exposures.push(...countryRows(feed, payload));
    events.push(...eventRows(feed, payload));
    const timestamp = generatedAt(payload);
    if (timestamp) timestamps.push(timestamp);
  }

  text("feed-state", failures ? `${valid.length}/${settled.length} feeds` : "All feeds connected");
  text("platform-updated", timestamps.length ? `Latest source output ${date.format(new Date(Math.max(...timestamps)))} UTC` : "No source timestamp available");
  text("platform-note", failures
    ? `${failures} public feed${failures === 1 ? "" : "s"} could not be read. Missing values are excluded; no substitute values were generated.`
    : "Each index uses its own scale and method. Open its source view before comparing or quoting a value.");

  renderExposure(exposures);
  renderEvents(events.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5));
}

refresh();
window.setInterval(() => {
  if (!document.hidden) refresh();
}, 5 * 60 * 1000);
