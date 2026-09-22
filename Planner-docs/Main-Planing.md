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
Built and CI-green through 9548b75 (SEO wave-2: per-page FAQ, typed JSON-LD, 404, worker LINK agent/manifest). CF zone **regressed to Squarespace NS** — user must re-point registrar NS to Cloudflare; DNSSEC still pending re-check after restore.
