---
name: extract-for-portfolio
description: >-
  Port a prototype/scenario change from the work branch into the portfolio
  branch without overwriting the portfolio's distinct intro/home page, then
  update the portfolio home page's section and details to match the new
  behavior. Use when the user says "extract for portfolio", or asks to pull a
  scenario/prototype change from data-table-work into data-table-portfolio while
  keeping the case-study landing page separate.
disable-model-invocation: true
---

# Extract for Portfolio

Port scenario/prototype changes from `data-table-work` into `data-table-portfolio`,
keep each branch's landing page distinct, and refresh the portfolio home page copy
for the changed scenario.

## Repo facts (this project)

- **Branches**
  - `data-table-work` — raw prototype work. Its `/` route renders `Home.jsx`.
  - `data-table-portfolio` — public case study. Its `/` route renders `CaseStudy.jsx`.
  - The two diverge only at their landing pages + the portfolio's added `cs-*` styles.
    Everything else (scenario files, shared kit) is meant to stay in sync.
- **Scenarios** live in `src/scenarios/*.jsx` and are registered in `src/scenarios.jsx`
  (each entry: `path`, `title`, `description`, `component`).
- **Portfolio home page** is `src/CaseStudy.jsx`. Per-scenario copy lives in:
  - `VARIANT_META[path]` → `{ family, role }` (role = the gallery/phase caption).
  - `FAMILY_ORDER` → phase grouping order.
  - `DECISIONS` → the key-decision cards (some map to a specific scenario's behavior).
- **`src/styles.css` is shared but DIVERGED**: portfolio adds all the `cs-*` case-study
  styles that work does not have. Never `git checkout <work> -- src/styles.css` — it
  would delete the portfolio styles.

## Workflow

Copy this checklist and track progress:

```
- [ ] 1. Identify the source commit(s) on work not yet on portfolio
- [ ] 2. Check out portfolio; confirm clean tree
- [ ] 3. Bring ONLY the scenario code + its scoped CSS over (no landing-page files)
- [ ] 4. Verify portfolio's cs-* styles and CaseStudy/App/Home are untouched
- [ ] 5. Update CaseStudy.jsx copy (role + any matching DECISION) for new behavior
- [ ] 6. Build + lint; report state; commit only if asked
```

### 1. Find what's on work but not portfolio

```bash
git log --oneline data-table-portfolio..data-table-work
git diff --stat data-table-portfolio..data-table-work
```

Identify the commit(s) that carry the scenario change (e.g. a single `<sha>`) and
which files they touch (typically `src/scenarios/<Name>.jsx` + a scoped block in
`src/styles.css`).

### 2. Switch to the portfolio branch

```bash
git checkout data-table-portfolio && git status   # expect a clean tree
```

### 3. Bring over ONLY the scenario change

Prefer a no-commit cherry-pick so the scoped CSS hunk 3-way merges into portfolio's
diverged `styles.css` without clobbering the `cs-*` additions:

```bash
git cherry-pick -n <sha>
git status   # expect only the scenario .jsx + styles.css staged
```

- **If `styles.css` conflicts**, keep BOTH: portfolio's `cs-*` styles AND the new
  scenario styles from work. Only the scenario's own style block should change.
- **Do NOT** stage or bring `App.jsx`, `Home.jsx`, `CaseStudy.jsx`, or any landing-page
  file from work. The intros must stay different. If the cherry-pick touched them,
  restore portfolio's versions: `git checkout HEAD -- src/App.jsx src/CaseStudy.jsx`.
- Alternative for a self-contained scenario file:
  `git checkout data-table-work -- src/scenarios/<Name>.jsx` (file-level, wholesale),
  then hand-apply just the scenario's CSS block.

### 4. Verify separation held

```bash
# Old scenario styles gone, new ones present, cs-* intact:
rg -c 'cs-hero-title' src/styles.css        # still > 0
# Landing pages still diverge (portfolio routes / to CaseStudy, work to Home):
git diff data-table-work..data-table-portfolio -- src/App.jsx
```

### 5. Refresh the portfolio home page details

The whole point: the case study must describe the *current* behavior. In
`src/CaseStudy.jsx`, update the copy for the changed scenario's `path`:

- `VARIANT_META[path].role` — rewrite the caption to match the new interaction.
- Any `DECISIONS` entry that narrates that scenario's mechanic — update
  `options` / `decision` / `why` to reflect where it actually landed.
- If the scenario is genuinely new (new `path`): add a `VARIANT_META` entry (with a
  `family` from `FAMILY_ORDER`), register it in `src/scenarios.jsx`, and add a
  `DECISIONS` card if it embodies a notable design call. Update hero counts
  (e.g. "Nine prototypes") if the total changed.

Leave `src/scenarios.jsx`'s shared `description` for existing scenarios alone unless
asked — it's shared with the work branch. Home-page copy lives in `CaseStudy.jsx`.

### 6. Verify and report

```bash
npm run build   # must succeed
```

Also run the lint/diagnostics check on edited files. Then summarize what was ported
and what home-page copy changed. **Do not commit unless the user asks.** When they do,
commit on `data-table-portfolio` (never a protected branch) with a message describing
both the ported scenario and the home-page copy update.

## Guardrails

- Never bring work's landing page (`Home.jsx` / its `App.jsx` route) into portfolio.
- Never wholesale-checkout `src/styles.css` from work — merge only the scenario's block.
- Keep changes scoped to: the scenario file, its CSS block, and `CaseStudy.jsx` copy.
