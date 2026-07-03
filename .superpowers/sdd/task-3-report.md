# Task 3 Report: Upstream Sync And Build Pipeline

## Status

DONE

## Scope Delivered

- Added upstream sync automation in `scripts/sync-upstreams.mjs`.
- Added static site build pipeline in `scripts/build-site.mjs`.
- Added dist artifact verification in `scripts/verify-dist.mjs`.
- Added local site pages in `src/pages/index.html`, `src/pages/tools.html`, `src/pages/mcp.html`, and `src/pages/sdcofa.html`.
- Added shared site styling in `src/styles/site.css`.
- Added live dashboard panel hydration in `src/scripts/live-panels.js`.
- Added built-artifact coverage in `tests/build-output.dist.test.mjs`.

## TDD Notes

1. Wrote `tests/build-output.dist.test.mjs` first.
2. Ran `npm run test:dist` before implementation and observed the expected missing-dist failure.
3. Corrected the test harness to use `fileURLToPath(...)` on Windows so the red failure reflected missing artifacts rather than a malformed path.
4. Implemented the minimum production surface required to make the dist suite pass.

## Implementation Notes

- `scripts/sync-upstreams.mjs` clones all upstream repositories from `site.routes.json` into `.cache/upstreams/` and updates existing clones with `git pull --ff-only`.
- `scripts/build-site.mjs` wipes and rebuilds `dist/`, copies canonical local pages, writes `.nojekyll`, copies shared styles/scripts, copies upstream asset directories, and mounts the dashboard repositories under `/bnti/`, `/wti/`, and `/mena/` while rewriting root-relative static asset paths through `rewriteStaticContent(...)`.
- `scripts/verify-dist.mjs` asserts the canonical CNAME, `.nojekyll`, all local pages, required dashboard `index.html` files, required dashboard data JSON files, and the absence of root `/css/` and `/js/` references in mounted dashboards.
- The local homepage links directly to `/bnti/`, `/wti/`, and `/mena/`, and the live cards fetch their corresponding mounted JSON snapshots.

## Verification Evidence

Red phase:

```text
npm run test:dist
-> failed before implementation because dist artifacts were missing
```

Required final verification sequence:

```text
npm run sync
-> exit 0; all five upstream repositories were already up to date on the final run

npm run build
-> exit 0

npm test
-> 12 tests, 12 passed, 0 failed

npm run test:dist
-> 3 tests, 3 passed, 0 failed

node scripts/verify-dist.mjs
-> dist verification passed
```

## Issues Encountered And Resolved

- The first sync attempt failed on Windows because spawning `git` with `shell: true` split the target path containing spaces. I removed `shell: true` from `scripts/sync-upstreams.mjs`, then reran the full verification successfully.

## Concerns

None.
