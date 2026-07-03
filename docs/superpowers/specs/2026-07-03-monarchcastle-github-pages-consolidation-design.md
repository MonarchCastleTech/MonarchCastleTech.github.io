# Monarch Castle GitHub Pages Consolidation Design

Date: 2026-07-03

## Goal

Move Monarch Castle's public web presence to `monarchcastle.tech`, hosted on GitHub Pages, with the main corporate site at the apex and the full live dashboards available under short product paths such as `/bnti/`, `/wti/`, and `/mena/`.

The result should make `monarchcastle.tech` the canonical public home while preserving the existing GitHub-hosted operating model.

## Source Sites

- `https://akgularda.github.io/monarch-castle-technologies/`: primary visual direction, thesis, live sections, The Keep narrative, divisions, methodology, and open/public instrumentation language.
- `https://monarchcastletech.github.io/`: product catalog, logos/assets, tools page, MCP page, SDCofA positioning, and product-line taxonomy.
- `https://sdcofa.github.io/border-neighbor-threat-index/`: full BNTI dashboard.
- `https://sdcofa.github.io/world-threat-index/`: full WTI dashboard.
- `https://sdcofa.github.io/mena-threat-index/`: full MENA dashboard.

## Canonical URL Map

- `/`: merged Monarch Castle corporate homepage.
- `/bnti/`: full Border Neighbor Threat Index dashboard.
- `/wti/`: full World Threat Index dashboard.
- `/mena/`: full MENA Threat Index dashboard.
- `/tools/`: free deterministic tools from the existing Monarch Castle Technologies tool bench.
- `/mcp/`: MCP-ready catalog and starter-pack material.
- `/sdcofa/`: Strategic Data Company of Ankara landing surface inside the Monarch Castle domain.

Additional product pages can be added later using the same pattern, for example `/prepturk/`, `/esgmap/`, or `/macrointel/`, once their live assets are ready to serve as complete standalone surfaces.

## Recommended Hosting Architecture

Use GitHub Pages as the only host for the first version.

The canonical Pages repository should be the organization/user Pages site that will own the custom domain, preferably `monarchcastletech.github.io` if write/admin access is available. The repository publishes one static artifact containing:

- the merged root site,
- copied dashboard directories for BNTI, WTI, and MENA,
- shared Monarch Castle assets,
- `CNAME` containing `monarchcastle.tech`,
- any route helpers needed for clean static subpath behavior.

This avoids paid hosting, keeps deployment inside GitHub, and gives every product a short canonical URL under the same domain.

## Dashboard Mounting Strategy

Each dashboard should be served as a real static subdirectory, not as a redirect:

- dashboard HTML, CSS, JS, data files, images, and manifests live under their matching folder in the published site,
- absolute and root-relative asset paths are rewritten so they resolve correctly from `/bnti/`, `/wti/`, and `/mena/`,
- dashboard-internal links are adjusted to stay inside the canonical subpath,
- external links back to legacy GitHub Pages can be removed or treated as secondary repository/source links.

The existing source repositories may continue running their own data-refresh workflows. The consolidated site can either periodically sync generated static files from those repositories or vendor the current generated site files during manual releases.

## Homepage Content Design

The root homepage should merge the two current Monarch Castle surfaces:

- keep the more distinctive sovereign-decision-intelligence theme and live sections from the `akgularda.github.io/monarch-castle-technologies` site,
- incorporate the stronger logo/product identity from `monarchcastletech.github.io`,
- make BNTI, WTI, and MENA first-class live instruments with direct canonical links,
- retain product families for defense, financial, sustainability, energy, tools, and MCP distribution,
- make SDCofA a clearly named institutional data subsidiary rather than a separate destination that users must discover elsewhere.

The root should feel like the command foyer for the whole group: editorial and institutional, but directly connected to live instruments.

## DNS Plan

Configure GitHub Pages before changing DNS when possible, then update the registrar DNS for `monarchcastle.tech`.

For the apex domain:

- `A @ 185.199.108.153`
- `A @ 185.199.109.153`
- `A @ 185.199.110.153`
- `A @ 185.199.111.153`

Optionally add IPv6:

- `AAAA @ 2606:50c0:8000::153`
- `AAAA @ 2606:50c0:8001::153`
- `AAAA @ 2606:50c0:8002::153`
- `AAAA @ 2606:50c0:8003::153`

For `www`:

- `CNAME www monarchcastletech.github.io`

If a different GitHub Pages owner becomes canonical, replace `monarchcastletech.github.io` with that owner's Pages hostname.

After DNS resolves, enable Enforce HTTPS in GitHub Pages.

## Verification

Before handoff:

- root page loads at local preview,
- `/bnti/`, `/wti/`, and `/mena/` load their dashboards directly,
- dashboard assets load without 404s,
- dashboard data files are fetched from canonical subpaths or stable raw/public URLs,
- all navigation links point to `monarchcastle.tech` paths where appropriate,
- responsive layout works on desktop and mobile,
- `CNAME` is present in the publish output,
- DNS instructions match the chosen Pages owner.

After DNS propagation:

- `monarchcastle.tech` resolves to GitHub Pages A records,
- `www.monarchcastle.tech` resolves to the GitHub Pages hostname,
- HTTPS is active,
- `www` and apex redirect consistently to the selected canonical domain.

## Out Of Scope For First Version

- Paid hosting, reverse proxies, or server-side routing.
- Rebuilding the dashboard data pipelines.
- Moving every product into a complete subpath before its static assets are ready.
- Authentication, private dashboards, or email delivery.
- Rebranding source repositories unless needed for link clarity.

