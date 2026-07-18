# Flagship Visual Restoration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the Monarch Castle Technologies flagship website as a polished public company site with real product logos, a dark navy-and-gold identity, and an original Janes × Palantir × Anduril design synthesis—without exposing internal workflow language.

**Architecture:** Keep the existing Node.js static-site generator and JSON content registry, but separate internal source metadata from public presentation. The build renderer emits human-facing product cards and semantic homepage sections; CSS supplies the cinematic, structured, and editorial visual modes. Tests enforce the public copy boundary, asset completeness, responsive layout, and logo rendering.

**Tech Stack:** Node.js generated static HTML, JSON content, CSS, Node test runner, Playwright.

## Global Constraints

- Do not change the ESGMap product repository or product experience.
- Do not change the World Threat Index repository unless a deployed regression is reproduced.
- Do not merge until the user approves the visual preview.
- Public HTML must never expose internal review, registry, approval, ticket, checkpoint, evidence-state, implementation-state, or release-state language.
- Preserve the existing Home, Products, Forecasting, Methodology, and Company routes.
- Use the approved local logo asset for every public product; do not substitute text lockups when a real mark exists.
- Maintain keyboard navigation, reduced-motion support, and zero horizontal overflow at 375, 552, 768, and 1440 pixels.
- Commit after each complete task so every checkpoint is independently reviewable.

---

### Task 1: Enforce the public identity and copy contract

**Files:**

- Modify: `tests/homepage-content.test.mjs`
- Modify: `tests/build-output.dist.test.mjs`
- Modify: `src/content/site.json`
- Modify: `site.routes.json`
- Modify: `scripts/build-site.mjs`

- [ ] **Step 1: Write failing content-contract tests**

Add assertions that every public product uses an approved image and that the eleven expected public paths are present:

```js
const expectedLogoPaths = [
  "/assets/products/cloudy-shiny-logo.png",
  "/assets/products/econmap-logo.png",
  "/assets/products/esgmap-logo.png",
  "/assets/products/macrointel-logo.png",
  "/assets/products/milcodec-logo.png",
  "/assets/products/nuclear-logo.png",
  "/assets/products/prepturk-logo.png",
  "/assets/products/supplychain-logo.png",
  "/assets/products/bnti-icon.png",
  "/assets/approved/mena-threat-index.png",
  "/assets/approved/world-threat-index.png"
];

assert.deepEqual(
  site.products.map((product) => product.logo.publicPath),
  expectedLogoPaths
);
assert.ok(site.products.every((product) => product.logo.kind === "approved-image"));
```

Add a public-output assertion that forbids known internal strings:

```js
assert.doesNotMatch(
  html,
  /review[- ]required|logo-review-required|github-metadata-verified|forecastEvidenceStatus|lifecycleStatus|approval ticket|registry state/i
);
```

- [ ] **Step 2: Run the focused tests and verify the red state**

Run:

```powershell
node --test tests/homepage-content.test.mjs
node --test tests/build-output.dist.test.mjs
```

Expected: failures identify the governed-text logo records and internal metadata currently emitted in product cards.

- [ ] **Step 3: Replace placeholder logo records with approved public assets**

Update each product in `src/content/site.json` to use:

```json
{
  "kind": "approved-image",
  "sourcePath": "src/assets/products/example-logo.png",
  "publicPath": "/assets/products/example-logo.png",
  "alt": "Example product logo"
}
```

Preserve the existing approved MENA Threat Index and World Threat Index records. Add all eleven logo files to the declared asset list in `site.routes.json`.

- [ ] **Step 4: Remove internal metadata from public product cards**

Refactor `renderProductCard` in `scripts/build-site.mjs` so it renders only public-facing fields:

```js
function renderProductCard(product) {
  return `
    <article class="product-card">
      <div class="product-mark">${renderMark(product)}</div>
      <p class="eyebrow">${escapeHtml(product.family)}</p>
      <h3>${escapeHtml(product.name)}</h3>
      <p>${escapeHtml(product.summary)}</p>
      <div class="product-actions">
        <a href="${escapeHtml(product.url)}">Explore system</a>
        <a href="/methodology/">How it works</a>
      </div>
    </article>`;
}
```

Do not serialize lifecycle enums, source-verification states, review flags, registry language, or internal evidence codes into public HTML.

- [ ] **Step 5: Build and rerun the focused tests**

Run:

```powershell
npm run build
node --test tests/homepage-content.test.mjs
node --test tests/build-output.dist.test.mjs
```

Expected: all focused contract tests pass and all eleven logo files exist in `dist`.

- [ ] **Step 6: Commit the checkpoint**

```powershell
git add tests/homepage-content.test.mjs tests/build-output.dist.test.mjs src/content/site.json site.routes.json scripts/build-site.mjs
git commit -m "fix: restore public product identity"
```

---

### Task 2: Rebuild the flagship public narrative

**Files:**

- Modify: `tests/homepage-content.test.mjs`
- Modify: `scripts/build-site.mjs`
- Modify: `src/content/site.json`

- [ ] **Step 1: Write failing information-architecture tests**

Assert that the homepage emits the approved section sequence:

```js
const sectionOrder = [
  'class="mission-hero"',
  'class="operating-thesis"',
  'class="featured-systems"',
  'class="intelligence-catalogue"',
  'class="sdcofa-band"',
  'class="evidence-chain"',
  'class="company-close"'
];

let cursor = -1;
for (const marker of sectionOrder) {
  const next = html.indexOf(marker);
  assert.ok(next > cursor, `${marker} should appear in the approved sequence`);
  cursor = next;
}
```

Also assert that the header contains a compact `Explore products` action and that all five existing routes remain available.

- [ ] **Step 2: Run the focused test and verify the red state**

Run:

```powershell
npm run build
node --test tests/homepage-content.test.mjs
```

Expected: failure because the approved public section classes and hierarchy are not yet emitted.

- [ ] **Step 3: Implement the new homepage hierarchy**

In `scripts/build-site.mjs`, render:

1. Mission hero with a short, forceful proposition and product exploration action.
2. Operating thesis with three clearly differentiated capabilities.
3. Featured systems with large product stages.
4. Intelligence catalogue with compact evidence-oriented cards.
5. SDCofA institutional band.
6. Evidence chain explaining how analysis becomes decision support.
7. Company close with a restrained final action.

Use human-facing copy from `src/content/site.json`; keep technical provenance available to the build but outside public markup.

- [ ] **Step 4: Keep navigation and supporting pages coherent**

Update the shared header and footer renderer so the compact dark navigation, active-route treatment, `Explore products` action, and company identity are consistent across Home, Products, Forecasting, Methodology, and Company.

- [ ] **Step 5: Build and rerun the content suite**

Run:

```powershell
npm run build
node --test tests/homepage-content.test.mjs
node --test tests/build-site.test.mjs
```

Expected: all tests pass and route output remains self-contained.

- [ ] **Step 6: Commit the checkpoint**

```powershell
git add tests/homepage-content.test.mjs scripts/build-site.mjs src/content/site.json
git commit -m "feat: rebuild flagship public narrative"
```

---

### Task 3: Restore the MCT visual identity

**Files:**

- Modify: `tests/browser/site-smoke.spec.mjs`
- Modify: `src/styles/site.css`

- [ ] **Step 1: Write failing responsive and logo-rendering tests**

Add Playwright coverage for 375, 552, 768, and 1440 pixels:

```js
for (const width of [375, 552, 768, 1440]) {
  test(`homepage is composed at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await expect(page.locator("html")).toHaveJSProperty(
      "scrollWidth",
      await page.locator("html").evaluate((el) => el.clientWidth)
    );
  });
}
```

For every `.product-mark img`, assert:

```js
const state = await image.evaluate((img) => ({
  complete: img.complete,
  naturalWidth: img.naturalWidth,
  naturalHeight: img.naturalHeight,
  objectFit: getComputedStyle(img).objectFit,
  box: img.getBoundingClientRect().toJSON()
}));
assert.ok(state.complete && state.naturalWidth > 0 && state.naturalHeight > 0);
assert.equal(state.objectFit, "contain");
assert.ok(state.box.width > 0 && state.box.height > 0);
```

Assert the root palette resolves to navy `#071522`, gold `#d7b46a`, and warm text `#f3efe4`.

- [ ] **Step 2: Run the browser suite and verify the red state**

Run:

```powershell
npm run build
npm run browser:test
```

Expected: failures identify the light report palette and incomplete public-logo rendering contract.

- [ ] **Step 3: Implement the three visual modes**

Refactor `src/styles/site.css` around the approved identity:

```css
:root {
  --navy: #071522;
  --panel: rgba(15, 28, 42, 0.78);
  --ink: #f3efe4;
  --muted: #b8b3a7;
  --line: rgba(243, 239, 228, 0.18);
  --gold: #d7b46a;
  --green: #77d39a;
}

.mission-hero,
.featured-systems,
.company-close {
  background: var(--navy);
  color: var(--ink);
}

.operating-thesis,
.evidence-chain {
  background: #f3efe4;
  color: var(--navy);
}

.intelligence-catalogue {
  background: #0f1c2a;
  color: var(--ink);
}

.product-mark img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
```

Use cinematic scale in the hero and featured stages, a disciplined modular grid in structured sections, and compact intelligence density in the catalogue. Keep MCT’s typography, gold rules, and product marks recognizably its own.

- [ ] **Step 4: Implement responsive composition**

At desktop widths, use asymmetrical two-column hero and featured stages. Collapse cleanly to one column below 58rem. At 375 and 552 pixels, keep logos fully visible, actions reachable, type within the viewport, and the navigation usable without horizontal overflow.

- [ ] **Step 5: Preserve accessibility modes**

Retain visible focus styles, semantic heading order, high-contrast text, reduced-motion behavior, and dark/light color-scheme resilience where applicable.

- [ ] **Step 6: Build and rerun all visual tests**

Run:

```powershell
npm run build
npm run browser:test
```

Expected: all responsive, logo, keyboard, route, and visual-contract tests pass.

- [ ] **Step 7: Commit the checkpoint**

```powershell
git add tests/browser/site-smoke.spec.mjs src/styles/site.css
git commit -m "style: restore MCT visual identity"
```

---

### Task 4: Verify and prepare the approval preview

**Files:**

- Modify if needed: `tests/build-output.dist.test.mjs`
- Create: local screenshot artifacts outside the repository or in the designated review-artifact directory

- [ ] **Step 1: Run the complete verification pipeline**

Run:

```powershell
npm run verify
npm run browser:test
```

Expected: build, content validation, Node tests, distribution verification, accessibility smoke tests, responsive tests, and asset checks all pass.

- [ ] **Step 2: Audit the generated public copy**

Search generated HTML programmatically for:

```text
review required
review-required
logo-review-required
github-metadata-verified
forecastEvidenceStatus
lifecycleStatus
approval ticket
registry state
implementation state
release state
```

Expected: zero public matches.

- [ ] **Step 3: Capture approval screenshots**

Serve `dist` locally and capture the homepage at:

- 1440 × 1100 for desktop composition.
- 768 × 1024 for tablet composition.
- 375 × 812 for mobile composition.

Also capture the Products route to prove that every real logo is visible and contained.

- [ ] **Step 4: Perform a final visual inspection**

Verify:

- No product logo is missing, cropped, or replaced by text.
- No internal workflow language appears.
- Dark navy/gold identity leads the experience.
- Janes-inspired catalogue density, Palantir-inspired system clarity, and Anduril-inspired cinematic scale remain an original MCT composition.
- ESGMap itself is unchanged.

- [ ] **Step 5: Commit any final test-only hardening**

If verification exposes a missing regression assertion, add it and commit:

```powershell
git add tests
git commit -m "test: lock flagship visual restoration"
```

Skip this commit when no test files change.

- [ ] **Step 6: Push the review branch without merging**

```powershell
git push -u origin fix/restore-flagship-visual-identity
```

Present the screenshots, verification results, branch name, and commit checkpoints to the user. Stop and wait for explicit visual approval before merging.
