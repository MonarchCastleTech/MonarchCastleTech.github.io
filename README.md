# Monarch Castle Technologies Website

---

<!-- repository-hygiene:start -->

![Monarch Castle Technologies approved lockup](docs/brand/organization-lockup.png)

Public website for Monarch Castle Technologies

![Lifecycle: Active](docs/lifecycle-active.svg)

## Repository status

Lifecycle: **Active**. The badge and this statement describe maintenance status, not service availability.

## Public access

The canonical production route is [monarchcastle.tech](https://monarchcastle.tech/). A GitHub Pages certificate/HTTPS defect confirmed on 2026-07-18 is tracked in the company-governance infrastructure follow-up; the source-controlled `CNAME` remains unchanged.

## Screenshots

![Monarch Castle Technologies Website repository preview](docs/social-preview.png)

The preview is maintained as a repository asset; the live interface or generated output remains authoritative.

## Data and methodology

- [site.routes.json](site.routes.json)

These repository-specific sources define the methodology or provenance boundary. Source dates, transformation steps, and known gaps must travel with analytical outputs.

## Update frequency

Release-driven; rebuilt when approved company or portfolio content changes.

## Quick start

```shell
npm ci
npm run sync
npm run build
```

Run only in a trusted development environment and review repository-specific prerequisites before using networked or hardware features.

When the sibling `company-governance` checkout is available, regenerate and verify the public registry projection with:

```shell
npm run sync:content
npm run check:content
```

## Architecture

- `site.routes.json` — the single route manifest for the homepage, eight narrative routes, supporting pages, and mounted dashboards.
- `src/content/site.json` — deterministic generated projection of the approved portfolio and brand registries.
- `src/content/editorial.json` — non-inventory narrative, contact, trust, and capability copy.
- `scripts/sync-content.mjs` — fail-closed governance projection and approved-mark synchronizer.
- `scripts/build-site.mjs` — self-contained narrative renderer plus dashboard mount pipeline.
- `scripts/verify-dist.mjs` — route, metadata, local-reference, claims, and dashboard boundary verifier.

## Tests

```shell
npm test
npm run build
npm run test:dist
npm run browser:test
```

## Provenance

Original software history is maintained in Git. External datasets, reports, trademarks, screenshots, and assets are not relicensed by this repository; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) before reuse.

## Forecast limitations

This repository does not publish a guaranteed forecast. Any scenarios, scores, or forward-looking language are analytical aids, not facts or advice; review source dates and methodology before use.

## Security

Do not publish vulnerabilities in an issue. Use GitHub's private vulnerability-reporting flow when available, or follow the [organization security policy](https://github.com/MonarchCastleTech/.github/security/policy).

## License

Original repository code and documentation are available under **MIT**; see [LICENSE](LICENSE). That license does not override third-party terms documented in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Citation

Use the machine-readable [CITATION.cff](CITATION.cff). Cite the specific commit and, for analytical use, record the data or model snapshot date.

## Masterbrand endorsement

Monarch Castle Technologies Website is a Monarch Castle Technologies project. **Part of Monarch Castle Technologies.**

<!-- repository-hygiene:end -->
