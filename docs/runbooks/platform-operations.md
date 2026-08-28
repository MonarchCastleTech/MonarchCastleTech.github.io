# The Keep public-platform runbook

## Normal operation

The company Pages workflow runs hourly. It checks out the company site, pulls declared public upstreams, builds, tests, verifies, and deploys. The platform page refreshes its browser view every five minutes from the mounted outputs.

## Failure behavior

- Upstream clone/pull fails: build stops; previous deployed site remains.
- Required dashboard output missing: build stops.
- One browser feed fails after deployment: unavailable value is excluded; UI reports partial feed state; no substitute value is generated.
- Stale output: live health workflow alerts through GitHub Actions.
- Broken route or asset: built-artifact verification blocks deployment.

## Operator response

1. Open latest Pages or health run.
2. Identify build, upstream, schema, freshness, or deploy failure.
3. Reproduce with `npm run sync`, `npm run verify`, and `npm run browser:test`.
4. Fix the owning upstream when the output contract broke; do not patch data in the company-site build.
5. Dispatch the failed workflow after the fix.
6. Confirm `/`, `/platform/`, `/bnti/`, `/wti/`, and `/mena/` plus data timestamps.

## Security boundary

This public preview must never receive credentials, private customer data, personal data, payment data, or secrets. Enterprise storage/authentication requires a separate reviewed deployment.

