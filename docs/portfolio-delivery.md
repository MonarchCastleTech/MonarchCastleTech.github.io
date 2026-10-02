# Public design delivery — 2026-10-02

User-approved data-first design implemented in the main site and 24 public products. The user explicitly authorized production publication on 2026-10-02. Product changes are being merged first, followed by the main site through the existing GitHub Pages workflows. Live verification is recorded in the workspace release journal.

| Product | Change | Base branch |
| --- | --- | --- |
| Caspian & Black Sea Monitor | [PR](https://github.com/MonarchCastleTech/caspian-black-sea-monitor/pull/1) | main |
| Climate Security News Monitor | [PR](https://github.com/SDCofA/climate-security-index/pull/1) | main |
| Cloudy&Shiny Index | [PR](https://github.com/MonarchCastleTech/Cloudy-Shiny/pull/3) | main |
| Conflict News Monitor | [PR](https://github.com/SDCofA/conflict-early-warning/pull/1) | main |
| Cyber Threat News Monitor | [PR](https://github.com/SDCofA/cyber-exposure-map/pull/1) | main |
| Defense Procurement Intelligence | [PR](https://github.com/MonarchCastleTech/defense-procurement/pull/1) | main |
| EconMap | [PR](https://github.com/MonarchCastleTech/econmap/pull/7) | main |
| ESGMap | [PR](https://github.com/MonarchCastleTech/esgmap/pull/4) | master |
| MacroIntel | [PR](https://github.com/MonarchCastleTech/macrointel/pull/4) | main |
| MENA Energy Flow Tracker | [PR](https://github.com/MonarchCastleTech/mena-energy-flow/pull/1) | main |
| MILCODEC Receiver | [PR](https://github.com/MonarchCastleTech/milcodec-receiver/pull/3) | main |
| Nuclear Energy Intelligence | [PR](https://github.com/MonarchCastleTech/NuclearEnergyIntelligence/pull/3) | main |
| Nuclear Policy News Monitor | [PR](https://github.com/SDCofA/nuclear-proliferation-watch/pull/1) | main |
| Port Congestion Pulse | [PR](https://github.com/MonarchCastleTech/port-congestion-pulse/pull/1) | main |
| PrepTurk | [PR](https://github.com/MonarchCastleTech/prepturk/pull/5) | master |
| Sanctions News Monitor | [PR](https://github.com/SDCofA/sanctions-exposure-index/pull/1) | main |
| Süper Lig Forecast | [PR](https://github.com/MonarchCastleTech/superlig-forecast/pull/4) | main |
| Supply Chain Intelligence | [PR](https://github.com/MonarchCastleTech/supplychain/pull/3) | master |
| Türkiye Economic Sentiment Radar | [PR](https://github.com/MonarchCastleTech/tr-economic-sentiment/pull/1) | main |
| Border Neighbor Threat Index | [PR](https://github.com/SDCofA/border-neighbor-threat-index/pull/4) | main |
| MENA Threat Index | [PR](https://github.com/SDCofA/mena-threat-index/pull/7) | main |
| World Threat Index | [PR](https://github.com/SDCofA/world-threat-index/pull/6) | main |
| Election Monitor | [PR](https://github.com/SDCofA/election/pull/1) | master |
| GeoRisk | [PR](https://github.com/SDCofA/georisk/pull/1) | main |

## Validation

- Main: npm test — 75 passed; npm run test:dist — 13 passed; node scripts/verify-dist.mjs passed. Main browser suite — 33 passed, including responsive pages, reduced-motion atlas and Keep filters/watchlist/JSON provenance export.
- Product shell suite — 48 passed across 24 products at 390px and 1280px. Set PRODUCT_PREVIEW_BASE_URL and run tests/browser/product-shell.spec.mjs against locally built products mounted at their canonical paths.
- EconMap: typecheck/export build passed; 257 tests passed, 3 skipped. Its existing command restored the official pinned data release and verified its SHA-256; generated data remains ignored.
- ESGMap: build and 10 tests passed. Nuclear: verify passed (tests, lint, TypeScript, Vite). Superlig: typecheck, unit tests, Pages build and 2 static contract tests passed.
- Supplychain: build and 325 tests passed. MacroIntel: 15 passed; its modal backdrop stays in the fixed-panel stacking context. MILCODEC: 16 passed; existing CSP permits local fonts. PrepTürk: 5 passed and new assets are cached offline.
- BNTI: 4 frontend contract tests passed; WTI: 7; MENA: 16, including updated palette contrast checks; Cloudy&Shiny: 7 product contract tests. Its regeneration template retains the shared shell.
- Election and GeoRisk: normal builds and GitHub Pages exports passed with existing export flags. GeoRisk runtime tests: 20 passed, 3 failed because the clean clone lacks the external canonical forecast snapshot expected by unchanged tests (30 countries / AUS). No forecast or replacement data was fabricated.

Product diffs were audited against their original branches. Data files, models, workflows and analytical calculations remain outside these changes.

## Review and publication

Review product PRs first, especially BNTI, WTI and MENA, which the main site's existing sync step mounts. Review the main release after those upstream changes are available. Publication uses the existing deployment workflows and Cloudflare proxy. Hosting settings are unchanged.

The Keep is free on the public site. The external enterprise Worker source was unavailable; public sales/login links are removed, while its separate billing system and private accounts are unchanged.
