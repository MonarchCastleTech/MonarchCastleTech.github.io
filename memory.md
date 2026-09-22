# memory.md — MonarchCastleTech.github.io

## Project
Public site for Monarch Castle Technologies + endorsed SDCofA indices. Static generator (`scripts/build-site.mjs`) + GitHub Pages Actions deploy + Cloudflare edge (`monarch-edge` worker) for canonical domain `monarchcastle.com`.

## Stack
- Node 20, no framework; `npm run sync|build|test|test:dist|verify`
- Origin: `monarchcastletech.github.io` (GitHub Pages, no CNAME — edge-terminated)
- Edge: Cloudflare zone `4fb144dbd5e6e2b4ab0a34a25ae97c0b`, worker `monarch-edge`, routes `monarchcastle.com/*` + `www.monarchcastle.com/*`
- Workers.dev (enabled): `https://monarch-edge.ardakgul4.workers.dev`
- Zone status: **pending** until user switches Squarespace NS → `earl.ns.cloudflare.com` / `noor.ns.cloudflare.com`

## Key decisions (2026-09-22)
- canonicalDomain = `monarchcastle.com` (site.routes.json)
- Dashboard mounts: `/sdcofa/bnti/`, `/sdcofa/wti/`, `/sdcofa/mena/` (slug stays `bnti` etc.; dist dir derived from mount path)
- Unmounted SDCofA products (election, georisk) proxied by worker fallback: `/sdcofa/<rest>` 404 → `sdcofa.github.io/<rest>`; also root `/election/*`, `/georisk/*` fallback
- **No Pages CNAME** — `verify-dist` asserts CNAME never exists
- `upload-pages-artifact@v5` needs `include-hidden-files: true` (dotfiles: `.well-known`, `.nojekyll`) — locked in workflow test
- Worker: Link header (describedby/api-catalog/ai-catalog/oauth-protected-resource/ard), `Accept: text/markdown` HTML→MD, octet-stream→json for extensionless well-known
- Worker MCP: POST/OPTIONS `/mcp` + `/mcp/` → JSON-RPC streamable-http (initialize/tools/list/tools/call); GET `/mcp` → 302 `/mcp/` HTML docs; tools: get_index, get_bnti, list_indices, get_site_page
- Agent discovery: `/auth.md`, `/.well-known/oauth-authorization-server`, `/.well-known/jwks.json`, `/.well-known/agent-card.json`, `/oauth/{authorize,token}/index.html` (static, no tokens issued)
- SSL mode: full; DNS-AID HTTPS records: `_a2a`, `_mcp`, `_index` `._agents`
- DNSSEC pending; DS: `monarchcastle.com. 3600 IN DS 2371 13 2 FA2ED8584C599F9460442883A52D013BFD7C04FFB7B9D14F01BE7913A8B97B0D`
- SITE_BASE_URL / PAGES_HOST intentionally left as github.io (origin health)

## CI
`pages.yml`: sync → build → test → test:dist → verify-dist → upload(hidden) → deploy. Healthy through `45fdf11`.

## Local env gotchas
- PS5.1: no `??`, no complex `gh --jq`; binary downloads need curl not `>`
- `workers.dev` blocked by TT middlebox locally (TLS reset) — use external probers (wivrix, r.jina.ai, check-host)
- CF settings PATCH often wants multipart; subdomain enable: `POST .../scripts/{name}/subdomain` with JSON body file

## User reminders
- Revoke CF token `cfut_...` when done
- arda-akgul.com: rescan isitagentready after ~4h; Squarespace A/AAAA + www CNAME to CF still user-side for arda
- CF token was pasted in chat
