export const feeds = [
  { id: "bnti", label: "BNTI", url: "/sdcofa/bnti/bnti_data.json", view: "/sdcofa/bnti/" },
  { id: "wti", label: "WTI", url: "/sdcofa/wti/wti_data.json", view: "/sdcofa/wti/" },
  { id: "mena", label: "MENA", url: "/sdcofa/mena/mena_data.json", view: "/sdcofa/mena/" }
];

export function asFinite(value) {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function timestamp(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? null : parsed.toISOString();
}

// Publication dates without an offset do not establish a timezone. Keep the
// source string in records and exports instead of guessing the viewer's zone.
export function publicationDate(value) {
  return typeof value === "string" && !Number.isNaN(new Date(value).valueOf()) ? value : null;
}

export function sourceDate(value) {
  if (!value) return "Source date unavailable";
  const zone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
  if (!zone) return value.replace("T", " ").slice(0, 16) + " (as published)";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium", timeStyle: "short", timeZone: "UTC"
  }).format(new Date(value)) + " UTC";
}

export function normaliseFeed(feed, payload) {
  const withheld = payload?.meta?.withdrawn === true || payload?.meta?.status === "WITHHELD";
  const updated = publicationDate(payload?.meta?.generated_at ?? payload?.meta?.issued_at);
  const value = withheld ? null : asFinite(payload?.meta?.main_index);
  const status = withheld ? "WITHHELD" : payload?.meta?.status ?? (value === null ? "No current value" : "Published");
  const countries = Object.entries(payload?.countries ?? {}).map(([code, record]) => ({
    code, name: record?.name ?? code, product: feed.id, label: feed.label,
    value: withheld ? null : asFinite(record?.index),
    status: withheld ? "WITHHELD" : record?.status ?? status,
    updated, source: feed.url, view: feed.view
  }));
  const events = Object.entries(payload?.countries ?? {}).flatMap(([code, record]) =>
    (record?.events ?? []).map((event) => ({
      product: feed.id, label: feed.label, country: record?.name ?? code,
      title: event?.translated_title || event?.title || "Published source record",
      href: /^https?:\/\//i.test(event?.link ?? "") ? event.link : null,
      timestamp: timestamp(event?.date)
    })).filter((event) => event.timestamp)
  ).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return { ...feed, value, status, updated, withheld, countries, events };
}

export async function readFeeds() {
  return Promise.allSettled(feeds.map(async (feed) => {
    const response = await fetch(feed.url, { cache: "no-store", headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`${feed.label}: ${response.status}`);
    return normaliseFeed(feed, await response.json());
  }));
}
