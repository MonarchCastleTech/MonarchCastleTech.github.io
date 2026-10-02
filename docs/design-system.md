# Data-first public experience, 2026.10

The main site leads with inspectable data, a geographic WTI atlas, source dates, catalogue filters and links to methods. Three.js loads only on larger screens without reduced-motion preference; the SVG geography and HTML country controls remain available when it cannot start. Globe positions are approximate country centres, never event locations. Independent index scales are not combined.

The Keep's public workspace is free, with country/source filters, a device-local watchlist and JSON export. Missing and withdrawn readings remain null. Each source has its own timestamp and publication state. Historical pricing/pilot routes now explain free access; commercial proposals and the old pilot intake are archived under docs/archive/the-keep-commercial. No private account, existing agreement or external billing service was changed.

The public interface no longer links to the external enterprise Worker. Its implementation was unavailable in the accessible repositories, so disabling any separate payment system there is outside this change. OAuth, API, MCP and other access boundaries are preserved.

Shared product source: src/design-system/design.css. Versioned CSS, IBM Plex Sans/Mono fonts and SIL OFL licence are vendored into each of the 24 existing product repositories. scripts/sync-product-design.mjs updates those assets and the shared navigation. Font assets are local; no new dependencies were added. See Planner-docs/data-first-2026-10 for the approved plan and audit.

Validation: npm test (75 passed), npm run test:dist (13 passed), node scripts/verify-dist.mjs; npm run browser:test (33 passed). Product build/test results and known data-fixture limits are recorded in docs/portfolio-delivery.md.

Release order: review product PRs first, including BNTI/WTI/MENA which the main build mounts from their repositories. Review the main site afterward so its existing sync step fetches the updated product files. Draft PRs do not publish these changes; merging follows the repositories' existing deployment workflows.
