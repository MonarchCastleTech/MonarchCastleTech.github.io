import assert from "node:assert/strict";
import test from "node:test";
import { asFinite, normaliseFeed, timestamp, sourceDate } from "../src/scripts/feed-records.js";

test("missing and invalid scores never become zero", () => {
  for (const value of [null, undefined, "", "  ", false, true, [], [0], {}, "unknown", Infinity]) {
    assert.equal(asFinite(value), null);
  }
  assert.equal(asFinite(0), 0);
  assert.equal(asFinite("1.25"), 1.25);
});
test("withdrawal suppresses both aggregate and country scores", () => {
  const data = normaliseFeed({ id: "bnti", label: "BNTI" }, {
    meta: { withdrawn: true, main_index: 50 }, countries: { TR: { index: 12 } }
  });
  assert.equal(data.value, null);
  assert.equal(data.countries[0].value, null);
  assert.equal(data.status, "WITHHELD");
});
test("source events retain dates and reject executable links", () => {
  const data = normaliseFeed({ id: "wti", label: "WTI" }, {
    countries: { TR: { events: [
      { date: "2026-01-01", link: "javascript:alert(1)" },
      { date: "2026-01-02", link: "https://example.org/source" },
      { date: "invalid", link: "https://example.org/invalid" }
    ] } }
  });
  assert.equal(data.events.length, 2);
  assert.equal(data.events[0].href, "https://example.org/source");
  assert.equal(data.events[1].href, null);
  assert.equal(timestamp(null), null);
});

test("publication dates retain their source timezone instead of guessing a viewer offset", () => {
  for (const generated_at of ["2026-10-02T09:12:00", "2026-10-02T09:12:00Z", "2026-10-02T09:12:00+03:00"]) {
    const data = normaliseFeed({ id: "wti" }, {
      meta: { generated_at }, countries: { TR: { index: 1 } }
    });
    assert.equal(data.updated, generated_at);
    assert.equal(data.countries[0].updated, generated_at);
  }
  assert.equal(sourceDate("2026-10-02T09:12:00"), "2026-10-02 09:12 (as published)");
  assert.match(sourceDate("2026-10-02T09:12:00Z"), /UTC$/);
});
