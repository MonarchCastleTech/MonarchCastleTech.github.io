# The Keep architecture

The free public workspace reads mounted BNTI, WTI and MENA JSON snapshots. Independent scales, per-source dates and withdrawal states remain visible. No cross-index average is calculated.

Country search, source filters, a browser-local watchlist and JSON export operate without authentication or a backend. Watchlists contain only public product/country identifiers; local storage is optional.

The homepage atlas uses published WTI records and locally bundled geographic boundaries derived from ESGMap's Natural Earth topology. Three.js loads on desktop when reduced motion is off; an SVG map and the same country controls remain available otherwise. Country marker positions are approximate geographic centres, not event coordinates.

The repository does not contain the separately deployed legacy Workers runtime. Its authentication, billing and private tenant data are outside this change. All public site entry actions open /platform/.

Historical commercial plans and unsigned templates are retained under docs/archive/the-keep-commercial and are not active offers.

Validation: npm test, npm run test:dist, npm run browser:test, node scripts/verify-dist.mjs.
