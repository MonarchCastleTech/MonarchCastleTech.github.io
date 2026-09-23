# memory.md — MonarchCastleTech.github.io

## Project
Public site for Monarch Castle Technologies + endorsed SDCofA indices. Static generator (`scripts/build-site.mjs`) + GitHub Pages Actions deploy + Cloudflare edge (`monarch-edge` worker) for canonical domain `monarchcastle.com`.

## Stack
- Node 20, no framework; `npm run sync|build|test|test:dist|verify`
- Origin: `monarchcastletech.github.io` (GitHub Pages, no CNAME — edge-terminated)
- Edge: Cloudflare zone `4fb144dbd5e6e2b4ab0a34a25ae97c0b`, worker `monarch-edge`, routes `monarchcastle.com/*` + `www.monarchcastle.com/*`
- Workers.dev (enabled): `https://monarch-edge.ardakgul4.workers.dev`
- Zone status: **restored 2026-09-23T00:04Z** — NS back to `earl`/`noor.ns.cloudflare.com`, zone `active`, **DNSSEC `active`**; public DoH (dns.google / cloudflare-dns.com) → CF anycast; apex CNAME → `monarchcastletech.github.io` proxied; worker routes healthy. **Local UDP/53 still returns Squarespace parking (TT middlebox)** — use `curl --doh-url https://cloudflare-dns.com/dns-query` for local probes; workers.dev still TLS-reset locally.

## Key decisions (2026-09-22)
- canonicalDomain = `monarchcastle.com` (site.routes.json)
- Dashboard mounts: `/sdcofa/bnti/`, `/sdcofa/wti/`, `/sdcofa/mena/` (slug stays `bnti` etc.; dist dir derived from mount path)
- Unmounted SDCofA products (election, georisk) proxied by worker fallback: `/sdcofa/<rest>` 404 → `sdcofa.github.io/<rest>`; also root `/election/*`, `/georisk/*` fallback
- **No Pages CNAME** — `verify-dist` asserts CNAME never exists
- `upload-pages-artifact@v5` needs `include-hidden-files: true` (dotfiles: `.well-known`, `.nojekyll`) — locked in workflow test
- Worker: Link header (describedby/api-catalog/ai-catalog/oauth-protected-resource/ard), `Accept: text/markdown` HTML→MD, octet-stream→json for extensionless well-known
- Worker MCP: POST/OPTIONS `/mcp` + `/mcp/` → JSON-RPC streamable-http (initialize/tools/list/tools/call); GET `/mcp` → 302 `/mcp/` HTML docs; tools: get_index, get_bnti, list_indices, get_site_page
- Worker REST API: GET `/api` (docs), `/api/indices`, `/api/{bnti,wti,mena}` with `?country=&top=` (CORS *); aliases raw `/sdcofa/*/…_data.json`; listed in `.well-known/api-catalog` + `llms.txt` + `/mcp/`
- Agent discovery: `/auth.md`, `/.well-known/oauth-authorization-server` (with `agent_auth` block: skill/register_uri/anonymous registration — empty AS metadata fails isitagentready authMd), `/.well-known/jwks.json`, `/.well-known/agent-card.json` (A2A 0.3.0 + `version` + `supportedInterfaces` each with `url` + `transport` — missing interface `url` fails isitagentready a2aAgentCard), `/.well-known/oauth-protected-resource` (non-empty `scopes_supported: ["read"]`), `/oauth/{authorize,token}/index.html` (static, no tokens issued)
- isitagentready level 5 Agent-Native (rescan 2026-09-23T00:04Z): ALL checks pass (authMd, a2aAgentCard, oauthDiscovery, oauthProtectedResource, mcpServerCard, ard, agent-skills, apiCatalog, webMcp)
- SSL mode: full; DNS-AID HTTPS records: `_a2a`, `_mcp`, `_index` `._agents`
- DNSSEC **active** (2026-09-23T00:04Z); DS: `monarchcastle.com. 3600 IN DS 2371 13 2 FA2ED8584C599F9460442883A52D013BFD7C04FFB7B9D14F01BE7913A8B97B0D`
- SITE_BASE_URL / PAGES_HOST intentionally left as github.io (origin health)
- **SEO/GEO/GenAI overhaul (2026-09-23):** `renderPage` now emits robots/hreflang/og:locale/theme-color/apple-touch-icon/manifest + Organization/WebSite/WebPage/BreadcrumbList JSON-LD (+ FAQPage on home); homepage `#answers` entity definitions + FAQ details; sitemap `lastmod/changefreq/priority`; llms.txt `## Quick facts` + `## FAQ`; llms-full entity definitions + FAQ; ai.txt/agents.txt/ai-catalog/ard/agent.json gain REST/MCP/FAQ discovery; new `static/site.webmanifest`; local pages (tools/mcp/sdcofa) full SEO heads; SKILL.md digest updated `7508ad4d…`; `check-live-site` markers for answers/sitemap/llms/ai-catalog/manifest
- **SEO/GEO/GenAI wave-2 (2026-09-23):** `pageFaqs` map (products/platform/pricing/methodology/trust/developers/impact/pilot/datasets/insights/company/solutions/home) → `renderPageFaq` `#faq` sections; `pageExtraJsonLd` (SoftwareApplication, ItemList, OfferCatalog, CollectionPage+Dataset, Article, Blog, AboutPage+subOrganization SDCofA, Service); `faqJsonLd` generalized; head adds `rel="agent"` + logo preload; robots aiBots further expanded; llms.txt Glossary + full-page answers pointer; llms-full FAQ expanded + Glossary; ai.txt/agents.txt `#answers`+pricing; new `static/404.html` (noindex recovery + machine-readable links); worker LINK gains `agent/manifest/alternate/author`; tests extended (per-page FAQ/typed JSON-LD/404); test 71/71 + test:dist 13/13 + verify-dist pass; edge restored, isitagentready level 5 re-scan 2026-09-23T00:04Z ALL pass
- Worker LINK header (wave-2): + `rel="agent"` → agent.json, `rel="manifest"` → site.webmanifest, `rel="alternate"` → ai.txt, `rel="author"` → humans.txt (deployed 2026-09-22T22:42Z, deployment `934aca27`)

## CI
`pages.yml`: sync → build → test → test:dist → verify-dist → upload(hidden) → deploy. Healthy through `9548b75` (run `35793834079`).

## Local env gotchas
- PS5.1: no `??`, no complex `gh --jq`; binary downloads need curl not `>`
- `workers.dev` blocked by TT middlebox locally (TLS reset) — use external probers (wivrix, r.jina.ai, check-host)
- CF settings PATCH often wants multipart; subdomain enable: `POST .../scripts/{name}/subdomain` with JSON body file

## User reminders
- Revoke CF API token when done (value was pasted in chat only — never store it in the repo)
- DNSSEC now active (no further re-check needed unless DS changes)
- Local probes: use `curl --doh-url https://cloudflare-dns.com/dns-query` — local UDP/53 still TT→Squarespace
- arda-akgul.com: rescan isitagentready after ~4h; Squarespace A/AAAA + www CNAME to CF still user-side for arda
- CF token was pasted in chat (do not commit tokens)
