# Second design direction

The user rejected the live site's visual quality and asked for comparison with Janes, Palantir and Anduril. This review replaces the earlier aesthetic direction; free public access, inspectable data and source integrity remain requirements.

Primary references inspected: https://www.janes.com/, https://www.palantir.com/new-homepage/, https://www.anduril.com/. Their official HTML, published content and asset descriptions were read. Interactive browser inspection was unavailable because the browser tool failed to initialize its kernel assets, including after reset. Do not claim a fresh visual walkthrough of those rendered homepages.

Janes leads with a clear intelligence proposition, a large media hero and identifiable datasets. Palantir emphasizes its software and concrete deployments. Anduril makes named physical/software products the subject of its presentation. Their authority comes from the product and presentation hierarchy, not simply dark colors or animation.

Current MCT weaknesses: the globe is confined to a small bordered panel; both headline lines use a generic accent treatment; most sections repeat an eyebrow/headline/box pattern; product names and inconsistent thumbnails substitute for a coherent product narrative; the page repeatedly explains source integrity instead of demonstrating the collection.

## Review prototype

Files: `design-review/index.html`, `review.css`, `review.js`, `scene-source.js`; source geography, fonts and three index snapshots reused from the public collection. No production write, dependencies, invented data or external reference imagery.

- Palette: paper #F2F3F0, ink #151816, white #FFFFFF, charcoal #111613, neutral line #D6DBD4.
- Typography: local IBM Plex Sans, expressive large headline; body and metadata in ordinary sentence case. Mono only for score/date alignment.
- Layout: quiet white masthead, one full-width dark data scene, large type in the foreground, a contrasting white evidence section, editorial product rows and a working Keep preview. Left-aligned content and strong changes of section scale.
- Principle: put visual ambition in one geographic scene. Build the rest around actual data and named products. Show source dates and withdrawn readings without scattering caveats throughout the hero.
- Self-review: a dark boxed globe plus a colored headline would repeat the rejected approach. Remove the visual's container, expand the scene to the whole hero, remove headline color accents, reduce repeated labels and card grids.

Success criteria: local preview shows a distinct composition at 1440px and 390px; headline remains legible; actual country selection works; three feeds retain separate scores/timestamps; missing/withdrawn data stay unavailable; no horizontal overflow; reduced motion retains a usable scene; download contains source provenance. Review before extending the design to production and product sites.

## Review outcome

Local prototype is served at http://127.0.0.1:4176/. Four browser checks passed: desktop/data/country controls, source filtering and provenance-preserving JSON export, mobile/no overflow, reduced motion. Screenshots inspected at screenshots/review-desktop.jpg, review-mobile.jpg and review-full-desktop.jpg. The sphere required tessellation to keep country surfaces above the ocean; this was corrected before the review screenshots. Main live repository remains on its published main commit with no source changes. No GitHub push, merge or production deployment was performed for this second design direction.

## Approved production integration

The user answered yes to the design review on 2026-10-02. Prior explicit live-publication authorization persists. Implement the reviewed composition in the main site, retain live source feeds, Keep filters/watchlist/export and source events, and carry the identity through the main catalogues and supporting pages. The 24 analytical applications already published in the prior phase retain their application layouts.

Affected files: scripts/lib/data-experience.mjs, scripts/build-site.mjs, scripts/check-live-site.mjs, src/styles/identity.css, src/scripts/hero-loader.js, hero-scene.js, platform.js and feed-records.js; related contract/browser checks, design docs, memory and ledger.

Risks: inherited dark panel styles can obscure a light table; source snapshots use different timestamp formats; unsupported WebGL must preserve country controls; cached module imports must share the new revision. Visual review caught and corrected inherited table/FAQ backgrounds and a narrow-screen heading overflow. No data snapshots from the review prototype are copied into production.

Validation commands: npm test; npm run test:dist; node scripts/verify-dist.mjs; npx playwright test tests/browser/site-smoke.spec.mjs tests/browser/design-review.spec.mjs. Inspect generated screenshots under test-results/visual, then merge the reviewed commit, monitor its exact Pages run and verify canonical HTML, versioned assets and public feeds.
