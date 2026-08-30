# Product interface standard

Operator-first design shared by Monarch Castle Technologies and SDCofA. Inspired by the information hierarchy of Palantir Foundry/Gotham and Anduril Lattice; never a copy of their trade dress.

## Product surface

- Lead with operating picture, decision, or answer—not engineering process.
- Use compact header, persistent product identity, restrained navigation, and one primary action.
- Put map/chart/table before explanatory prose. Keep methodology one click away.
- Use dark neutral canvas, warm off-white type, amber focus/accent, and semantic green/amber/red only for state.
- Prefer dense, aligned panels over decorative cards. Preserve whitespace around the primary signal.
- Show relative freshness (`Updated 2h ago`) in context. Keep raw ISO timestamps in downloads, source drawers, and methodology pages.

## Language

Never expose internal labels such as `demo`, `mock`, `placeholder`, `pipeline`, `generated at`, `declared source`, or `need improvement` in the primary experience.

Translate system language into user value:

| Internal | End-user |
| --- | --- |
| Pipeline healthy | Live |
| Generated timestamp | Updated 2h ago |
| Declared mean | Blended signal |
| Missing feed | Temporarily unavailable |
| Need improvement | Review recommended |
| Demo data | Example scenario, visibly separated from live data |

Methodological caution stays available, but does not interrupt the operating view.

## Resilience

- Prefer public, keyless sources and committed last-known-good snapshots.
- Never fabricate replacement values.
- Bound network requests with timeouts and retries; one failed feed must not blank the product.
- Distinguish `live`, `recent`, `delayed`, and `unavailable` with text—not color alone.
- Keep static shell, methodology, and last-known-good data usable when upstream services fail.
- Every repository needs automated tests, scheduled refresh where data changes, Pages deployment, and live health verification.

## Acceptance gate

- No horizontal overflow at 390px.
- Keyboard-visible focus; semantic landmarks; one `h1`; accessible chart/table alternative.
- No uncaught console errors or broken local assets.
- No API-registration requirement for core public functionality.
- Source, method, and limitations reachable without dominating the main view.
- Desktop and mobile screenshots reviewed after production deployment.

## Research basis

- [Palantir Foundry documentation](https://www.palantir.com/docs/foundry)
- [Palantir Gotham AI-enabled operations](https://www.palantir.com/assets/xrfr7uokpv1b/3A0y10xksgXENvRMNaAsUu/ed8f7f1ed534c0101f64536a85f7297b/Gotham_AI-Enabled_Operations_White_Paper.pdf)
- [Anduril Lattice Command & Control](https://www.anduril.com/lattice/command-and-control)
