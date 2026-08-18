import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import GradientBackground from '@abhijeetsaraf/gradient-background/react'
import { scenarios } from './scenarios.jsx'
import HeroCellDemo from './components/HeroCellDemo.jsx'
import DecisionVisual from './components/DecisionVisuals.jsx'
import ScenarioCarousel from './components/ScenarioCarousel.jsx'

// The prototypes worth previewing up front: the later, most complex grouping
// variants. Each has a matching screenshot in public/screenshots/<path>.png
// captured by scripts/extract-screenshots.mjs.
const CAROUSEL_PATHS = [
  'row-grouping-command-nested',
  'row-grouping-command-nested-stacked',
  'row-grouping-accordion-drilldown',
  'row-grouping-accordion-drilldown-custom',
]

// The blues from the hero's radial-gradient wash (see `.cs-hero::before` in
// styles.css), fed to the animated WebGL mesh-gradient as [highlight, shadow].
const HERO_GRADIENT_COLORS = ['rgba(9, 128, 255, 0.85)', 'rgba(0, 90, 180, 0.72)']

// Persist the case-study scroll position so opening a prototype "full screen"
// (a route change that unmounts this page) and returning — via the in-app
// "← Back" link or the browser Back button — lands the user exactly where they
// left off. sessionStorage keeps this per-tab and survives a refresh.
const SCROLL_KEY = 'caseStudy:scrollY'

function useScrollRestoration() {
  useLayoutEffect(() => {
    const saved = Number(sessionStorage.getItem(SCROLL_KEY))
    if (Number.isFinite(saved) && saved > 0) {
      // Wait a frame so the (tall) page has laid out before we jump.
      requestAnimationFrame(() => window.scrollTo(0, saved))
    }

    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        sessionStorage.setItem(SCROLL_KEY, String(window.scrollY))
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])
}

// ---------------------------------------------------------------------------
// Case-study data
// The nine prototypes, re-framed as the narrative artifacts of the exploration.
// `family` clusters them into the phases of the design arc; `role` is the
// one-line "why this variant exists" caption used in the gallery.
// ---------------------------------------------------------------------------
const VARIANT_META = {
  'basic-table': {
    family: 'Foundation',
    role: 'The baseline. A Polar UI table rebuilt 1:1 from a Figma exploration — tokens, resize, sort, filter, pagination.',
  },
  'row-grouping-stacked': {
    family: 'Taming pagination',
    role: 'First answer to "pagination inside pagination": micro-pagers that step one density and tone darker per level.',
  },
  'row-grouping-header': {
    family: 'Taming pagination',
    role: 'Second answer: anchor each group’s pager to its header row so pagers never stack on top of each other.',
  },
  'row-grouping-drilldown': {
    family: 'Drill-in',
    role: 'Trade breadth for focus: click a group to navigate into it with a breadcrumb — one level, one pager at a time.',
  },
  'row-grouping-header-drilldown': {
    family: 'Drill-in',
    role: 'Fold the breadcrumb into a split-button header with the level’s pager appended — only one pager ever on screen.',
  },
  'row-grouping-accordion-drilldown': {
    family: 'Drill-in',
    role: 'Keep the familiar footer pager for top groups; the accordion header becomes the split-button breadcrumb as you drill.',
  },
  'row-grouping-accordion-drilldown-custom': {
    family: 'User-defined grouping',
    role: 'The hierarchy becomes the user’s: sequence dimensions in a builder, Create groups, and the table re-derives from a faithful dataset.',
  },
  'row-grouping-command-nested': {
    family: 'Designing for scale',
    role: 'A searchable, hundreds-deep group-by command palette that resolves into a nested, always-visible multi-level accordion.',
  },
  'row-grouping-command-nested-stacked': {
    family: 'Designing for scale',
    role: 'Over ~5,000 rows: the top-level group header pins under the column header and hosts the ancestor breadcrumb — each level you scroll past collapses into a pill on that same row, no floating bar.',
  },
}

const FAMILY_ORDER = [
  'Foundation',
  'Taming pagination',
  'Drill-in',
  'User-defined grouping',
  'Designing for scale',
]

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'problem', label: 'The problem' },
  { id: 'principles', label: 'Principles' },
  { id: 'process', label: 'The exploration' },
  { id: 'decisions', label: 'Key decisions' },
  { id: 'system', label: 'System work' },
  { id: 'gallery', label: 'Live artifacts' },
  { id: 'reflection', label: 'Reflection' },
]

const DECISIONS = [
  {
    tag: 'Interaction model',
    title: 'Pagination inside pagination, without the clutter',
    visual: 'micro-pagers',
    visualCaption: 'Nested pagers step one density + tone darker per level.',
    problem:
      'Hierarchical groups mean a pager can appear at every level. Stack three of them and the table reads as noise.',
    options: [
      'Micro-pagers that inherit the main pager but step one density + tone darker per nesting level.',
      'Anchor each pager to its group header so they never pile up vertically.',
      'Drill in — replace breadth with one level and one pager at a time.',
    ],
    decision:
      'Prototyped all three as separate routes rather than picking on paper, then let the drill-in family win for depth while micro-pagination stayed the answer for shallow, scannable groups.',
    why: 'Stakeholders needed to feel the difference. Building the variants side-by-side turned an opinion argument into a comparison.',
  },
  {
    tag: 'Consistency',
    title: 'Reuse the drill-in breadcrumb as the group-by builder',
    visual: 'split-breadcrumb',
    visualCaption: 'The same split-button drives navigation and grouping.',
    problem:
      'The custom group-by builder needed a way to show and edit the selected dimension sequence. A brand-new chip control would have been a second thing to learn.',
    options: [
      'Numbered checkboxes with a separate "Preview" label.',
      'The exact split-button breadcrumb component used inside the accordion header.',
    ],
    decision:
      'Dropped the numbers and the label, and rendered the sequence in the same split breadcrumb — click a crumb to truncate, the × to retract the last dimension.',
    why: 'One gesture vocabulary. The control that builds the grouping looks and behaves like the control that navigates it.',
  },
  {
    tag: 'Knowing when to stop',
    title: 'The wrapping-breadcrumb detour',
    visual: 'wrapping-crumb',
    visualCaption: 'A wrapped path became one tall box — so I backed out.',
    problem:
      'Moving the × onto the last crumb exposed a layout edge case: a wrapped breadcrumb rendered as one tall bordered box across all lines.',
    options: [
      'box-decoration-break: clone so each wrapped line is its own bordered pill.',
      'Per-row DOM to drop the top stroke of continuation rows.',
      'Revert to a single container and simply restyle the × as a compact rounded button.',
    ],
    decision:
      'Explored the CSS fragmentation route, saw it fought the design more than it helped, and deliberately reverted to the single container.',
    why: 'A prototype’s job is to de-risk interactions, not to win a CSS fight. Recognizing a dead-end and backing out is a design decision too.',
  },
  {
    tag: 'Data fidelity',
    title: 'A faithful data model over a prototype-cheap fake',
    visual: 'faithful-data',
    visualCaption: 'One flat dataset; grouped counts sum back to the whole.',
    problem:
      'The original grouping was a fabricated tree where each level’s counts were independent of its parent. Starting flat and then grouping "the same data" wasn’t actually possible.',
    options: [
      'Option A — show a separate flat dummy table for the default state (fast, but counts never reconcile).',
      'Option B — one flat list of members, with the hierarchy derived by grouping on the selected dimensions in order.',
    ],
    decision:
      'Chose Option B: a single 300-member dataset, groups built by real field values, counts that sum back to the whole.',
    why: 'The moment the demo lets someone toggle between flat and grouped, mismatched totals break the illusion. Correctness was worth the refactor.',
  },
  {
    tag: 'Default state',
    title: 'Always open to the last leaf',
    visual: 'open-to-leaf',
    visualCaption: 'Opens to the leaf while keeping siblings in view.',
    problem:
      'When someone groups by APAC → Business Unit, opening straight to the first leaf hides every sibling region — information loss at the exact moment of orientation.',
    options: [
      'Open to the first intermediate level and let users drill.',
      'Open every group all the way to its leaf by default, accepting extra scroll.',
    ],
    decision:
      'Defaulted to open-to-last-leaf everywhere, with a Collapse-all escape hatch in Table Controls.',
    why: 'The brief valued data-at-a-glance and fewer clicks over a shorter page. The tradeoff was named explicitly rather than defaulted into.',
  },
  {
    tag: 'One component, two states',
    title: 'The sticky pill IS the accordion header',
    visual: 'sticky-pill',
    visualCaption: 'The pinned header itself becomes the ancestor pill trail.',
    problem:
      'At ~5,000 rows the nested accordion scrolls far past its own headers, so you lose track of which branch you’re in.',
    options: [
      'A separate sticky breadcrumb bar floated above the table as an absolute overlay.',
      'Host the ancestor breadcrumb inside the top-level group header itself, pinned under the column header via CSS sticky.',
    ],
    decision:
      'Started with the floating overlay, then collapsed it into the header: the depth-0 group header pins under the column header and its label becomes the pill trail, with each descendant you scroll past appended as a pill after the parent’s chevron.',
    why: 'The overlay was a second element with its own detached shadow and a layout gap. Making the pinned header the pill trail means one element in two states — nothing extra to explain, and no seam between the header and the thing that tracks your position.',
  },
]

const SYSTEM_PIECES = [
  { name: 'ScenarioShell', desc: 'The presentation frame: left control panel (back, heading, description, Table Controls) + table canvas. Every variant is a thin body inside it.' },
  { name: 'GridHead + ColGroup', desc: 'Shared header with sort affordance, funnel filter toggle, and a divider that doubles as the resize grip.' },
  { name: 'useColumnResize', desc: 'Per-column pixel widths driven by dragging the header divider, with a sensible min-width floor.' },
  { name: 'TruncatingCell', desc: 'Truncates with an ellipsis and only attaches a tooltip when text is actually clipped — widen the column and the tooltip disappears.' },
  { name: 'Column visibility store', desc: 'A tiny per-table store (persisted to localStorage) shared by the panel toggles and the table, so both stay in sync and the group column is never hideable.' },
  { name: 'Split-button breadcrumb', desc: 'The drill navigation: clickable crumbs to jump levels, × to go up one. Reused verbatim inside the group-by builder.' },
  {
    name: 'Micro / header pagers',
    desc: 'A pager with density + tonal variants so nested pagers read as subordinate to the primary one — each level pulls the next step of the same surface token.',
    tokens: [
      { name: 'polar.surface.action', note: 'Level 0' },
      { name: 'polar.surface.action.emphasis', note: 'Level 1' },
      { name: 'polar.surface.action.strong', note: 'Level 2' },
    ],
  },
  {
    name: 'Density + tokens',
    desc: 'A global density toggle keyed off a data-attribute on the root, driven by a blue-tinted surface token set so every table reacts without per-table wiring — text stays anchored to one token while only the surface steps.',
    tokens: [
      { name: 'polar.surface.action', note: 'Base tint' },
      { name: 'polar.surface.action.emphasis', note: 'Step +1' },
      { name: 'polar.surface.action.strong', note: 'Step +2' },
      { name: 'polar.text.text.primary', note: 'Text (fixed)' },
    ],
  },
]

// ---------------------------------------------------------------------------
// TokenPill / TokenList — surface the real design tokens by name.
// A token pill is code-styled (monospace) and tinted with the light-orange
// "tooling" family (--ctrl-*) so a referenced token reads as a design-system
// artifact, distinct from the blue product chrome around it. TokenList renders
// a small code block of pills, each annotated with the step it drives (used by
// the density system piece to show the surface token stepping per level).
// ---------------------------------------------------------------------------
function TokenPill({ children }) {
  return <code className="cs-token">{children}</code>
}

function TokenList({ tokens }) {
  return (
    <div className="cs-token-code">
      {tokens.map((t) => (
        <div className="cs-token-row" key={t.name}>
          <TokenPill>{t.name}</TokenPill>
          {t.note && <span className="cs-token-step">{t.note}</span>}
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// LivePreview — click-to-activate framed embed of a real prototype route.
// Boots the actual app inside an iframe only after the user opts in, so nine
// live artifacts don't all mount React at once.
// ---------------------------------------------------------------------------
function LivePreview({ path, title }) {
  const [active, setActive] = useState(false)
  const src = `${import.meta.env.BASE_URL}#/${path}`
  return (
    <div className={`cs-live ${active ? 'is-active' : ''}`}>
      <div className="cs-live-chrome">
        <span className="cs-live-dots" aria-hidden="true">
          <i /><i /><i />
        </span>
        <span className="cs-live-url">/{path}</span>
        <Link className="cs-live-open" to={`/${path}`}>Open full ↗</Link>
      </div>
      <div className="cs-live-stage">
        {active ? (
          <iframe className="cs-live-frame" src={src} title={title} loading="lazy" />
        ) : (
          <button
            type="button"
            className="cs-live-play"
            onClick={() => setActive(true)}
          >
            <span className="cs-live-play-icon" aria-hidden="true">▶</span>
            <span className="cs-live-play-text">Launch live prototype</span>
            <span className="cs-live-play-sub">Runs the real interaction inline</span>
          </button>
        )}
      </div>
    </div>
  )
}

function useScrollSpy(ids) {
  const [active, setActive] = useState(ids[0])
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] },
    )
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [ids])
  return active
}

export default function CaseStudy() {
  useScrollRestoration()
  const activeSection = useScrollSpy(SECTIONS.map((s) => s.id))
  const byPath = Object.fromEntries(scenarios.map((s) => [s.path, s]))

  const carouselItems = CAROUSEL_PATHS.filter((p) => byPath[p]).map((p) => ({
    path: p,
    title: byPath[p].title,
    family: VARIANT_META[p]?.family,
    role: VARIANT_META[p]?.role || byPath[p].description,
  }))

  // The left rail is extracted out of the content container and pinned to the
  // page. It should stay hidden across the hero (role/surface/etc.) and only
  // reveal once the section list begins — so we show it once the hero has
  // scrolled out of view.
  const heroRef = useRef(null)
  const [showToc, setShowToc] = useState(false)
  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setShowToc(!entry.isIntersecting),
      { threshold: 0 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Under HashRouter the URL hash drives the router, so native `#id` anchors
  // would be swallowed as a route change instead of scrolling. Scroll manually.
  const scrollToSection = (e, id) => {
    e.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="cs">
      {/* ---------------------------------------------------------------- */}
      {/* Hero */}
      {/* ---------------------------------------------------------------- */}
      <header className="cs-hero" ref={heroRef}>
        <GradientBackground
          className="cs-hero-gradient"
          colors={HERO_GRADIENT_COLORS}
          style={{ height: '75vh', bottom: 'auto', zIndex: 0 }}
        />
        <div className="cs-hero-inner">
          <div className="cs-hero-top">
            <div className="cs-hero-head">
              <p className="cs-eyebrow t-eyebrow">Case study · Platform &amp; design system</p>
              <h1 className="cs-hero-title t-display">
                Designing a data table that scales from ten rows to millions
              </h1>
              <p className="cs-hero-lede t-lead">
                Exploratory prototypes for bridging the gaps between the
                multiple verticals that consume data tables — the same
                structure has to behave differently in a conversational
                surface than in a report. Built to earn stakeholder buy-in on
                the <em>feel</em> of the interaction.
              </p>
            </div>
            <HeroCellDemo />
          </div>
          <dl className="cs-hero-meta">
            <div><dt className="t-eyebrow-strong">Role</dt><dd className="t-body-sm">Platform &amp; Design System Designer</dd></div>
            <div><dt className="t-eyebrow-strong">Surface</dt><dd className="t-body-sm">Agents, Platform &amp; Analytics</dd></div>
            <div><dt className="t-eyebrow-strong">Craft</dt><dd className="t-body-sm">React · TypeScript · Figma</dd></div>
            <div><dt className="t-eyebrow-strong">Artifacts</dt><dd className="t-body-sm">9 live prototypes</dd></div>
          </dl>
        </div>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* Left rail — extracted from the content container and pinned to    */}
      {/* the page. Revealed once the hero scrolls away (see showToc).      */}
      {/* ---------------------------------------------------------------- */}
      <nav
        className={`cs-toc ${showToc ? 'is-visible' : ''}`}
        aria-label="Sections"
      >
        <span className="cs-toc-label t-eyebrow-strong">On this page</span>
        <ul>
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className={`t-body-sm ${activeSection === s.id ? 'is-active' : ''}`}
                onClick={(e) => scrollToSection(e, s.id)}
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="cs-body">
        <main className="cs-content">
          {/* Overview ------------------------------------------------- */}
          <section id="overview" className="cs-section">
            <h2 className="cs-h2 t-h1">Overview</h2>
            <p className="cs-lead t-lead">
              As Highspot scaled, each vertical built its own data table — so
              users relearned the interaction every time. This study pairs
              research with PMs and executives to replace that per-team freedom
              with one consistent pattern. Row grouping was the hardest case,
              and the one I solved through prototyping.
            </p>
            <div className="cs-callouts">
              <div className="cs-callout">
                <span className="cs-callout-k t-eyebrow-strong">The ask</span>
                <p className="t-body-sm">
                  Establish the interaction patterns for grouping, nested
                  pagination, and drill-in — convincingly enough to align
                  stakeholders before engineering committed.
                </p>
              </div>
              <div className="cs-callout">
                <span className="cs-callout-k t-eyebrow-strong">My approach</span>
                <p className="t-body-sm">
                  Treat prototypes as the argument. Ship many small, real,
                  clickable variants on top of one shared component kit instead
                  of debating flat comps.
                </p>
              </div>
              <div className="cs-callout">
                <span className="cs-callout-k t-eyebrow-strong">Outcome</span>
                <p className="t-body-sm">
                  A comparable set of live options that turned "which direction?"
                  into a hands-on decision — an iterative study, presented to
                  stakeholders, that surfaced the exact patterns users rely on
                  to read data at scale.
                </p>
              </div>
            </div>

            <div className="cs-preview">
              <div className="cs-preview-head">
                <span className="cs-preview-k t-eyebrow-strong">A look at the work</span>
                <p className="cs-preview-lede t-body-sm">
                  A quick preview of the most complex prototypes — the nested
                  accordions, drill-in breadcrumbs, and grouping-at-scale states
                  you can open live below.
                </p>
              </div>
              <ScenarioCarousel items={carouselItems} />
            </div>
          </section>

          {/* Problem -------------------------------------------------- */}
          <section id="problem" className="cs-section">
            <h2 className="cs-h2 t-h1">The problem</h2>
            <p className="cs-lead t-lead">
              Grouping is where a data table stops being a list and becomes a
              tree — and trees break the assumptions a flat table is built on.
            </p>
            <div className="cs-grid-2">
              <div className="cs-prob">
                <h3 className="t-h4">Pagination inside pagination</h3>
                <p className="t-body-sm">
                  Every group can have more children than fit. Naively, that
                  means a pager at every level — a stack of near-identical
                  controls competing for attention.
                </p>
              </div>
              <div className="cs-prob">
                <h3 className="t-h4">Depth causes information loss</h3>
                <p className="t-body-sm">
                  Drilling from a region into a business unit can silently hide
                  every sibling. The user gets focus but loses their map.
                </p>
              </div>
              <div className="cs-prob">
                <h3 className="t-h4">Grouping is user-defined</h3>
                <p className="t-body-sm">
                  Real hierarchies aren’t fixed. Users pick the dimensions and
                  their order — potentially hundreds of combinations, several
                  levels deep.
                </p>
              </div>
              <div className="cs-prob">
                <h3 className="t-h4">Scale is unforgiving</h3>
                <p className="t-body-sm">
                  Behind an index, a table can be millions of records. Sticky
                  context, lazy loading, and orientation-while-scrolling stop
                  being nice-to-haves.
                </p>
              </div>
            </div>
          </section>

          {/* Principles ----------------------------------------------- */}
          <section id="principles" className="cs-section">
            <h2 className="cs-h2 t-h1">Principles I held to</h2>
            <ol className="cs-principles">
              <li>
                <span className="cs-num">01</span>
                <div>
                  <h3 className="t-h4">Prototype the interaction, fake the logic</h3>
                  <p className="t-body-sm">
                    These are buy-in prototypes. Synthetic data and real
                    gestures beat production plumbing and a static screen.
                  </p>
                </div>
              </li>
              <li>
                <span className="cs-num">02</span>
                <div>
                  <h3 className="t-h4">One kit, many variants</h3>
                  <p className="t-body-sm">
                    Every option is a thin body over a shared shell, header,
                    pager, and breadcrumb. Consistency comes for free and each
                    new variant costs less.
                  </p>
                </div>
              </li>
              <li>
                <span className="cs-num">03</span>
                <div>
                  <h3 className="t-h4">Reuse gestures, don’t invent them</h3>
                  <p className="t-body-sm">
                    A control the user already understands in one place should
                    look and behave the same everywhere else it appears.
                  </p>
                </div>
              </li>
              <li>
                <span className="cs-num">04</span>
                <div>
                  <h3 className="t-h4">Name the tradeoff</h3>
                  <p className="t-body-sm">
                    Every fork — more scroll vs. more clicks, faithful vs. cheap
                    — was decided out loud, not defaulted into.
                  </p>
                </div>
              </li>
            </ol>
          </section>

          {/* Process -------------------------------------------------- */}
          <section id="process" className="cs-section">
            <h2 className="cs-h2 t-h1">The exploration, phase by phase</h2>
            <p className="cs-lead t-lead">
              The nine prototypes weren’t parallel guesses; they’re an arc.
              Each phase answered the question the previous one raised.
            </p>
            <div className="cs-phases">
              {FAMILY_ORDER.map((family, i) => {
                const items = scenarios.filter(
                  (s) => VARIANT_META[s.path]?.family === family,
                )
                return (
                  <div className="cs-phase" key={family}>
                    <div className="cs-phase-rail">
                      <span className="cs-phase-num">{`0${i + 1}`}</span>
                    </div>
                    <div className="cs-phase-body">
                      <h3 className="cs-phase-title t-h3">{family}</h3>
                      <ul className="cs-phase-list">
                        {items.map((s) => (
                          <li key={s.path}>
                            <Link to={`/${s.path}`} className="cs-phase-link">
                              <span className="cs-phase-name t-h4">{s.title}</span>
                              <span className="cs-phase-role t-body-sm">
                                {VARIANT_META[s.path].role}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Decisions ------------------------------------------------ */}
          <section id="decisions" className="cs-section">
            <h2 className="cs-h2 t-h1">Key design decisions</h2>
            <p className="cs-lead t-lead">
              The variants are the surface. These are the calls underneath them
              — each a small problem, a set of options, and the reasoning for
              where it landed.
            </p>
            <div className="cs-decisions">
              {DECISIONS.map((d) => (
                <article className="cs-decision" key={d.title}>
                  <span className="cs-decision-tag t-eyebrow-strong">{d.tag}</span>
                  <h3 className="cs-decision-title t-h3">{d.title}</h3>
                  <p className="cs-decision-problem t-body-sm">{d.problem}</p>
                  {d.visual && (
                    <DecisionVisual kind={d.visual} caption={d.visualCaption} />
                  )}
                  <div className="cs-decision-block">
                    <span className="cs-decision-k t-eyebrow-strong">Options weighed</span>
                    <ul>
                      {d.options.map((o) => (
                        <li key={o} className="t-body-sm">{o}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="cs-decision-block">
                    <span className="cs-decision-k t-eyebrow-strong">Decision</span>
                    <p className="t-body-sm">{d.decision}</p>
                  </div>
                  <div className="cs-decision-block cs-decision-why">
                    <span className="cs-decision-k t-eyebrow-strong">Why</span>
                    <p className="t-body-sm">{d.why}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* System --------------------------------------------------- */}
          <section id="system" className="cs-section">
            <h2 className="cs-h2 t-h1">The system underneath</h2>
            <p className="cs-lead t-lead">
              Because I was wearing the design-system hat, the real deliverable
              wasn’t nine screens — it was the shared kit that made nine screens
              feel like one product.
            </p>
            <div className="cs-system">
              {SYSTEM_PIECES.map((p) => (
                <div className="cs-chip-card" key={p.name}>
                  <code className="cs-chip-name">{p.name}</code>
                  <p className="t-body-sm">{p.desc}</p>
                  {p.tokens && <TokenList tokens={p.tokens} />}
                </div>
              ))}
            </div>
          </section>

          {/* Gallery -------------------------------------------------- */}
          <section id="gallery" className="cs-section">
            <h2 className="cs-h2 t-h1">Live artifacts</h2>
            <p className="cs-lead t-lead">
              Every prototype below is the real, running interaction — not a
              screenshot. Launch one inline, or open it full-screen.
            </p>
            <div className="cs-gallery">
              {scenarios.map((s, i) => (
                <figure className="cs-artifact" key={s.path}>
                  <figcaption className="cs-artifact-cap">
                    <span className="cs-artifact-index t-eyebrow-strong">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="cs-artifact-family t-eyebrow-strong">
                      {VARIANT_META[s.path]?.family}
                    </span>
                    <h3 className="cs-artifact-title t-h3">{s.title}</h3>
                    <p className="cs-artifact-desc t-body-sm">
                      {VARIANT_META[s.path]?.role || s.description}
                    </p>
                  </figcaption>
                  <LivePreview path={s.path} title={s.title} />
                </figure>
              ))}
            </div>
          </section>

          {/* Reflection ----------------------------------------------- */}
          <section id="reflection" className="cs-section">
            <h2 className="cs-h2 t-h1">Reflection &amp; what’s next</h2>
            <div className="cs-grid-2">
              <div className="cs-reflect">
                <h3 className="t-h4">What worked</h3>
                <p className="t-body">
                  Building the argument as clickable variants collapsed weeks of
                  circular debate. The shared kit meant feedback on one table
                  improved all of them, and the faithful data model kept the
                  demos honest under scrutiny.
                </p>
              </div>
              <div className="cs-reflect">
                <h3 className="t-h4">What I’d do next</h3>
                <p className="t-body">
                  Make grouped-mode sort and filter fully functional against the
                  derived tree, promote the inline accordion into a shared
                  component, and prototype real lazy loading against the
                  multi-million-row scenario behind a preset index.
                </p>
              </div>
            </div>
          </section>

          <footer className="cs-footer">
            <p className="t-body">
              Prototyped in React + Vite on the Polar UI design system. Nine
              routes, one shared table kit.
            </p>
            <Link to={`/${byPath['basic-table'] ? 'basic-table' : scenarios[0].path}`} className="cs-footer-cta">
              Start from the Basic Table →
            </Link>
          </footer>
        </main>
      </div>
    </div>
  )
}
