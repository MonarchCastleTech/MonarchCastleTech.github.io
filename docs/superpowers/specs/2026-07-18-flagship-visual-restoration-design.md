# Flagship Visual Restoration Design

## Objective

Restore the Monarch Castle Technologies flagship site's former dark navy-and-gold character without discarding the stronger content structure, accessibility work, build verification, or governance controls added during the professionalization program.

The restored site must combine Janes-style intelligence authority, Palantir-style systems clarity, and Anduril-style product confidence without copying their branding, layouts, wording, media, or proprietary assets. It must feel like a confident technology and intelligence company, not an internal registry report. Every available product mark must be visible, correctly contained, and readable at desktop and mobile widths. ESGMap itself is outside this change and remains untouched.

## Scope

This change is limited to the flagship repository:

- restore the former visual direction across the existing generated routes;
- replace public text-logo placeholders with the existing product image assets;
- simplify internal governance language on public-facing cards;
- preserve the current navigation, routes, claims discipline, accessibility semantics, and source-driven build;
- add responsive and image-loading regression coverage.

World Threat Index source is not changed unless a fresh deployed-page regression test reproduces an overflow in that repository. The reported narrow rendering will be covered on the flagship's WTI presentation and by a live WTI viewport probe.

## Visual Direction

### Reference synthesis

The approved reference blend is:

- **Janes:** editorial intelligence density, compact evidence labels, strong information hierarchy, catalogue-like product discovery, and clear separation between datasets, analysis, and use cases;
- **Palantir:** mission-led narrative, disciplined modular grids, restrained technical typography, systems explanations, and high-confidence whitespace;
- **Anduril:** cinematic opening, product-first storytelling, large visual stages, short forceful headings, and strong transitions between mission and product;
- **MCT:** navy-and-gold identity, transparent evidence, calibrated forecasting, the four capability pillars, and the existing product portfolio.

The result must be recognizably MCT. Reference companies inform rhythm and hierarchy only. Their logos, imagery, distinctive slogans, exact compositions, and proprietary interaction patterns are excluded.

### MCT visual system

Use the former site's visual vocabulary as the color authority:

- deep navy page background: `#071522`;
- translucent navy panels derived from `rgba(15, 28, 42, 0.78)`;
- warm off-white primary text: `#f3efe4`;
- restrained muted text: `#b8b3a7`;
- fine light borders: `rgba(243, 239, 228, 0.18)`;
- gold emphasis: `#d7b46a`;
- green only for genuinely positive or active status: `#77d39a`.

Retain visible focus indicators, AA contrast, reduced-motion behavior, semantic landmarks, and responsive type. Avoid beige report surfaces, near-black body text, large administrative tables on the homepage, and decorative effects that reduce readability.

Use three presentation modes:

1. **Cinematic navy:** full-width hero and featured-product stages with deep navy, restrained gradients, subtle data-grid or coordinate-line texture, and gold wayfinding.
2. **Structured light:** occasional off-white evidence sections that introduce Palantir-like clarity and prevent the site from becoming a featureless dark wall.
3. **Editorial intelligence:** compact Janes-inspired labels, dates, lifecycle indicators, and evidence links below the primary product story.

Typography should pair a confident editorial display face for major statements with a neutral sans-serif for interfaces and a restrained monospace face for data labels. Headlines may be large, but supporting copy must remain compact and readable.

## Information Architecture

Keep the current generated routes and navigation:

- Home
- Products
- Forecasting
- Methodology
- Company

The homepage hierarchy becomes:

1. **Mission hero:** Anduril-scale visual confidence with MCT's positioning, one primary product call to action, and a subtle portfolio signal field rather than stock defence imagery.
2. **Operating thesis:** a Palantir-like mission statement explaining how MCT connects strategy, data, intelligence, and forecasting.
3. **Featured systems:** large product stages with real marks, concise outcomes, lifecycle context, and direct live-product links.
4. **Intelligence catalogue:** a denser Janes-like grid for the remaining portfolio, grouped by economic intelligence, strategic monitoring, and operational tools.
5. **SDCofA analytical unit:** a clear endorsed-unit relationship and its production threat indices.
6. **Evidence chain:** methodology, provenance, claims discipline, and forecast evaluation presented as human-readable proof rather than registry internals.
7. **Company close:** a concise mission statement with company, GitHub, and methodology calls to action.

Governance remains available through methodology and evidence links. Machine-oriented values such as `github-metadata-verified`, `logo-review-required`, and raw registry field names must not appear as primary marketing copy.

## Public Copy Contract

The flagship is an end-user company website. It must never expose internal workflow or governance vocabulary as public interface copy.

Prohibited public labels include:

- `review required`;
- `logo review required`;
- `github metadata verified`;
- raw lifecycle enum values;
- approval, ticket, registry, or implementation-state language;
- internal test, checkpoint, evidence-status, and release-gate identifiers.

Governance data may still control what the build is allowed to publish, but the rendered site translates that state into normal visitor language. Public cards describe what a product does, who it helps, where it is available, and what methodology or limitations matter. If an item is not ready for public presentation, omit it or describe the limitation plainly; never display an internal status code.

## Component Treatment

### Header

- Compact dark navigation with the MCT wordmark, five existing routes, and one high-contrast `Explore products` action.
- No oversized institutional banner.
- Navigation collapses cleanly into a wrapped or menu treatment before it constrains the logo.

### Hero

- One decisive statement, one supporting paragraph, and at most two actions.
- Subtle data-coordinate texture built locally with CSS/SVG, not borrowed imagery.
- A product-signal rail may show current portfolio counts and production systems, but it must not resemble an internal dashboard.

### Product stages

- Featured products use large, uncropped visual stages inspired by Anduril's product presentation.
- Product marks remain fully contained; the surrounding card supplies atmosphere rather than cropping the artwork.
- Secondary products use compact Janes-like catalogue rows or cards with clear live/source links.
- Palantir-like structural consistency keeps every card aligned despite different logo proportions and name lengths.

### Evidence modules

- Small uppercase or monospace labels identify methodology, provenance, evaluation, and lifecycle.
- Evidence appears after the human product benefit, not before it.
- Negative or inconclusive evaluation results remain plainly stated.

### Motion

- Motion is limited to restrained opacity, translation, and signal-line effects.
- No autoplay video is required.
- `prefers-reduced-motion` disables nonessential transitions and animated texture.

## Logo and Asset Contract

Use the repository's existing image inventory:

| Product | Public asset |
|---|---|
| Cloudy&Shiny Index | `src/assets/products/cloudy-shiny-logo.png` |
| EconMap | `src/assets/products/econmap-logo.png` |
| ESGMap | `src/assets/products/esgmap-logo.png` |
| MacroIntel | `src/assets/products/macrointel-logo.png` |
| MILCODEC Receiver | `src/assets/products/milcodec-logo.png` |
| Nuclear Energy Intelligence | `src/assets/products/nuclear-logo.png` |
| PrepTurk | `src/assets/products/prepturk-logo.png` |
| Supply Chain Intelligence | `src/assets/products/supplychain-logo.png` |
| Border Neighbor Threat Index | `src/assets/products/bnti-icon.png` |
| MENA Threat Index | `src/assets/approved/mena-threat-index.png` |
| World Threat Index | `src/assets/approved/world-threat-index.png` |

All product images render with:

- stable copied public paths under `/assets/products/` or `/assets/approved/`;
- intrinsic dimensions available after load;
- `object-fit: contain`;
- preserved aspect ratio;
- a bounded logo stage that never clips the mark;
- transparent backgrounds rendered on a compatible dark panel;
- meaningful alternative text.

Text lockups remain only as a defensive build fallback for a genuinely missing image and must be treated as a failing portfolio regression for the current eleven products.

## Responsive Behavior

The visual contract applies at `375`, `552`, `768`, and `1440` CSS pixels.

- The document must never exceed the viewport width.
- Header navigation wraps or collapses without clipping.
- Product cards become a single column before their logo/content layout becomes constrained.
- Logo stages use fluid width and bounded height rather than fixed cropping.
- Long product names, repository URLs, badges, and evidence links wrap safely.
- Tables remain inside explicitly scrollable regions.
- The WTI presentation must not reproduce the horizontally clipped masthead shown in the reported screenshot.

## Accessibility and Interaction

- Preserve the skip link, landmarks, heading hierarchy, keyboard navigation, and current-page indication.
- Maintain WCAG 2.2 AA text and control contrast.
- Provide visible `:focus-visible` styling on every interactive element.
- Respect `prefers-reduced-motion`.
- Do not use color as the only lifecycle or status signal.
- Product logos are decorative only when adjacent text provides the same name; otherwise use specific alternative text.

## Implementation Boundaries

Primary implementation files:

- `src/content/site.json` for governed public logo mappings and human-readable presentation copy;
- `scripts/build-site.mjs` for logo rendering and public card markup;
- `src/styles/site.css` for the restored visual system and responsive layout;
- existing test files for source, build-output, and browser contracts.

No product repository, product scoring logic, DNS record, hosting target, or ESGMap implementation is modified.

## Verification

The implementation is complete only when:

1. tests first fail for the missing image-logo and narrow-layout contracts;
2. every focused and full flagship test passes;
3. the production build and distribution verifier pass;
4. all eleven product images load with non-zero natural dimensions;
5. no page or card overflows at `375`, `552`, `768`, or `1440`;
6. keyboard, focus, reduced-motion, and semantic checks pass;
7. a local screenshot review confirms the former navy/gold direction and unclipped marks;
8. the preview demonstrates the approved Janes/Palantir/Anduril synthesis while remaining recognizably MCT;
9. the user approves the preview before merge;
10. the deployed flagship smoke test passes after merge.

## Reference Sites

- [Janes](https://www.janes.com/)
- [Palantir](https://www.palantir.com/about/)
- [Anduril](https://www.anduril.com/)

## Rollback

Create a repository-scoped commit and pull request. The existing `pre-professionalization-2026-07-18` tag remains the program rollback point, while the immediate pre-restoration default-branch SHA is recorded in the pull request. If the deployed build loses routes, content, image assets, or responsive containment, revert the restoration merge and redeploy the prior verified default branch.
