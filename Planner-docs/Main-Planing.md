# Main Planing — monarchcastle.com agent-ready edge (2026-09-22)

## Approach
Move canonical host to monarchcastle.com via Cloudflare worker reverse-proxy of GitHub Pages origin; mount SDCofA dashboards under /sdcofa/*; ship agent/GEO discovery stack; edge-inject Link headers and markdown Accept.

## Affected
- site.routes.json, scripts/build-site.mjs, scripts/verify-dist.mjs, scripts/check-live-site.mjs
- src/content/site.json, src/pages/{sdcofa,mcp,tools}.html, src/scripts/platform.js
- tests/* contracts, README.md, static/.well-known/*, .github/workflows/pages.yml

## Success criteria
- npm test + test:dist + verify-dist green (local + CI)
- origin serves canonical monarchcastle.com, /sdcofa/bnti/, .well-known, robots Content-Signal
- worker serves Link header, api-catalog application/json, election/georisk fallback, markdown Accept
- no dist/CNAME

## Status
Built and CI-green through `4f7be4c` (SEO wave-2). Edge restored: zone active, DNSSEC active, isitagentready level 5 @ 2026-09-23T00:04Z. Remaining user: revoke CF token; local UDP/53 still TT middlebox→Squarespace (probes need DoH).
