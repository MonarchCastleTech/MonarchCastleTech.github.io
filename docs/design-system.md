# Public experience, 2026.10

The user approved a second direction after reviewing the local prototype: a paper masthead, full-width charcoal hero, large IBM Plex Sans headline, a solid geographic Three.js globe, contrasting evidence section and editorial system rows. Palette: paper #F2F3F0, ink #151816, white #FFFFFF, charcoal #111613, line #D6DBD4. Current main-site styles are src/styles/identity.css; the base stylesheet supplies supporting route layouts.

The globe renders on desktop and mobile, animates only for initial positioning or country selection, and becomes static for reduced motion. SVG geography and HTML controls remain usable if WebGL is unavailable. Country positions are approximate geographic centres, never event coordinates. Index scales remain independent. Naive publication dates retain their source string and are labeled as published; explicitly zoned dates can be displayed in UTC. Exports preserve the original publication timestamp.

The Keep's public workspace is free, with country/source filters, a device-local watchlist and JSON export. Missing and withdrawn readings remain null. Each source has its own timestamp and publication state. Historical pricing/pilot routes now explain free access; commercial proposals and the old pilot intake are archived under docs/archive/the-keep-commercial. No private account, existing agreement or external billing service was changed.

The public interface no longer links to the external enterprise Worker. Its implementation was unavailable in the accessible repositories, so disabling any separate payment system there is outside this change. OAuth, API, MCP and other access boundaries are preserved.

The Keep now uses a scrollable source table with country/source filters, device-local watchlists, matching-record counts and provenance-preserving JSON export. Source events remain available in an expandable section. Main-site catalogues, supporting pages, footer and mobile navigation share the paper identity.

The earlier 2026.10 product shell remains published across the 24 analytical applications: src/design-system/design.css and scripts/sync-product-design.mjs. Those applications retain their existing analytical layouts and the same local Plex fonts. This second release changes the main site and Keep, not those 24 application internals. See Planner-docs/approved-editorial-redesign.md for the approved direction and scope.

Validation: npm test (77 passed), npm run test:dist (14 passed), node scripts/verify-dist.mjs; 35 smoke checks plus the visual review across 320, 390, 820 and 1440px. Includes country controls, reduced motion, WebGL failure, independent feed failure, table contrast, local watchlists and JSON provenance. Product results from the prior release are recorded in docs/portfolio-delivery.md.

Publication is authorized. Use the existing main-site Pages workflow and Cloudflare proxy. Versioned asset references cover the complete owned CSS/module graph, including the lazy Three.js bundle, to prevent mixed cached releases. Source data, authentication, billing, DNS and deployment workflows remain outside this redesign.
