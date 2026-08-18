---
name: extract-screenshots
description: >-
  Capture screenshots of data-table prototype scenarios in a representative
  state using Playwright, writing PNGs to public/screenshots/ for the portfolio
  carousel. Use when the user asks to "extract screenshots", "grab an image of
  a scenario", "update the prototype previews", "refresh the carousel images",
  or to capture the visual state of one or more table scenarios.
---

# Extract Screenshots

Drive prototype scenarios into a meaningful state and capture a PNG per scenario
for the case-study carousel. Backed by `scripts/extract-screenshots.mjs`
(Playwright + a dedicated Vite dev server) and consumed by
`src/components/ScenarioCarousel.jsx` on the portfolio home page.

## Repo facts (this project)

- **Scenarios** live in `src/scenarios/*.jsx`, registered in `src/scenarios.jsx`
  (each `{ path, title, description, component }`). The `path` is the route and
  the screenshot filename stem.
- **Routing** is `HashRouter` under Vite base `/data-table-prototypes/`, so a
  scenario URL is `http://localhost:<port>/data-table-prototypes/#/<path>`.
- **Data is deterministic** (index/hash-based in `src/components/groupingModel.js`),
  so captures are reproducible run to run.
- **Output**: `public/screenshots/<path>.png`, served at
  `${import.meta.env.BASE_URL}screenshots/<path>.png`.
- **Carousel**: `CAROUSEL_PATHS` in `src/CaseStudy.jsx` chooses which shots show,
  in order; captions come from `VARIANT_META`.

## How to run

```bash
npm run screenshots                       # curated default set (the complex ones)
node scripts/extract-screenshots.mjs all  # every scenario that has a recipe
node scripts/extract-screenshots.mjs row-grouping-command-nested [<path> …]
```

The script boots its own Vite server on port **5199** (`--strictPort`), so it
does not collide with any dev server the user already has running. It launches
headless Chromium at a 1600×1000 viewport (2× DPI) and screenshots the
`.dt-layout` element (left control panel + table).

Prereqs (already installed here): `playwright` devDependency + the Chromium
browser (`npx playwright install chromium`).

## Adding / changing a capture

Each scenario has a **recipe** in `RECIPES` inside the script that puts it into
the state worth showing before the screenshot. Many grouping scenarios start
*ungrouped* and must be driven:

- **Command-palette scenarios** (`row-grouping-command-nested`,
  `…-stacked`): `createFromCommandPalette(page, ['Region', 'Business unit', …])`
  clicks dimension names in the `.dt-gb-tree`, then "Create groups".
- **Dimension-list scenario** (`row-grouping-accordion-drilldown-custom`):
  `createFromDimensionList(page, [...])` toggles `.dt-gb-list` items, then
  "Create groups".
- **Pre-grouped drill-in** (`row-grouping-accordion-drilldown`): expand the first
  `.dt-group-toggle`, then click the first `.dt-drill-row` to show the drill-in
  breadcrumb + level pager.
- **Sticky pills** (`…-stacked`): after grouping, scroll `.dt-columns`
  (`el.scrollTop = 640`) so the pinned ancestor pill trail engages.

Dimension names come from `LEVELS` in `groupingModel.js`
(Region, Business unit, Team, Role). Scope text lookups to the group-by builder
so a name never collides with table cell content.

To add a new scenario shot: add a `RECIPES[<path>]` async function, optionally
add the path to `DEFAULT_SET`, run the script, then (if it should appear in the
carousel) add the path to `CAROUSEL_PATHS` in `src/CaseStudy.jsx`.

## Verify

- Open each new `public/screenshots/<path>.png` and confirm it shows the intended
  state (grouped/drilled, not the empty default).
- `npm run build` succeeds and the carousel renders the images.

## Guardrails

- Do not commit unless asked. When asked, commit on a non-protected branch.
- Keep captures deterministic — don't introduce randomized data to the model.
