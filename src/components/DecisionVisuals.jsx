import {
  ChevronRight, ChevronLeft, PageFirst, PageLast, CloseIcon,
} from './tableKit.jsx'

// ---------------------------------------------------------------------------
// DecisionVisuals
// Small, self-contained, non-interactive representations of the specific
// artifact each "Key decision" card is about. They exist so a reader can *see*
// the thing being discussed (e.g. what "pagination inside pagination" actually
// looks like) instead of only reading about it. Every preview reuses the real
// `dt-*` component classes so it stays visually faithful to the live scenarios,
// and is marked aria-hidden because the surrounding prose already describes it.
// ---------------------------------------------------------------------------

// Static pager control cluster (rendered as spans, not buttons, so it never
// picks up interactive/disabled styling inside a decorative preview).
function PagerControls({ page, count }) {
  return (
    <div className="dt-micro-controls">
      <span className="dt-page-btn"><PageFirst /></span>
      <span className="dt-page-btn"><ChevronLeft /></span>
      <span className="dt-page-label">Page</span>
      <span className="cs-dv-field">{page}</span>
      <span className="dt-page-count">of {count}</span>
      <span className="dt-page-btn"><ChevronRight /></span>
      <span className="dt-page-btn"><PageLast /></span>
    </div>
  )
}

// 1 — Micro-pagers: three nested pagers, one density + tone step darker per
// level, exactly as they stack at the bottom of the stacked scenario.
function MicroPagers() {
  const levels = [
    { label: 'Regions', page: 1, count: 3, indent: 0, density: '', tone: 0, token: 'polar.surface.action' },
    { label: 'Business Units', page: 2, count: 6, indent: 22, density: 'dt-micro-sm', tone: 1, token: 'polar.surface.action.emphasis' },
    { label: 'Members', page: 4, count: 9, indent: 44, density: 'dt-micro-xs', tone: 2, token: 'polar.surface.action.strong' },
  ]
  return (
    <div className="cs-dv-micro">
      {levels.map((l) => (
        <div className="cs-dv-micro-row" key={l.label} style={{ paddingLeft: l.indent }}>
          <div className={`dt-micro-pagination ${l.density} cs-dv-tone-${l.tone}`}>
            <span className="dt-micro-summary">{l.label} 1–10 of {l.count * 10}</span>
            <PagerControls page={l.page} count={l.count} />
          </div>
          <code className="cs-token cs-token--sm">{l.token}</code>
        </div>
      ))}
    </div>
  )
}

// 2 — Split-button breadcrumb, shown once as it appears when navigating and
// once as the group-by builder, to make the "one component, two jobs" reuse
// legible at a glance.
function SplitBreadcrumb() {
  const crumbs = ['APAC', 'Business Unit', 'Team']
  const bar = (
    <div className="dt-split" role="group">
      <div className="dt-split-main">
        {crumbs.map((c, i) => (
          <span key={c} className="cs-dv-inline">
            {i > 0 && <span className="dt-split-sep"><ChevronRight /></span>}
            <span className={`dt-split-crumb ${i === crumbs.length - 1 ? 'is-current' : ''}`}>{c}</span>
          </span>
        ))}
      </div>
      <span className="dt-split-divider" />
      <span className="dt-split-close"><CloseIcon /></span>
    </div>
  )
  return (
    <div className="cs-dv-stack">
      <div className="cs-dv-labeled">
        <span className="cs-dv-mini-k t-eyebrow-strong">Drill navigation</span>
        {bar}
      </div>
      <div className="cs-dv-labeled">
        <span className="cs-dv-mini-k t-eyebrow-strong">Group-by builder</span>
        {bar}
      </div>
    </div>
  )
}

// 3 — The wrapping-breadcrumb detour: the abandoned state where a wrapped
// breadcrumb renders as one tall bordered box, next to the compact revert.
function WrappingCrumb() {
  const crumbs = ['Region', 'Business Unit', 'Team', 'Segment', 'Account', 'Owner']
  return (
    <div className="cs-dv-detour">
      <div className="cs-dv-labeled">
          <span className="cs-dv-mini-k cs-dv-k-bad t-eyebrow-strong">Explored — one tall box</span>
        <div className="cs-dv-wrapbox">
          {crumbs.map((c, i) => (
            <span key={c} className="cs-dv-inline">
              {i > 0 && <span className="dt-split-sep"><ChevronRight /></span>}
              <span className="dt-split-crumb">{c}</span>
            </span>
          ))}
        </div>
      </div>
      <div className="cs-dv-labeled">
        <span className="cs-dv-mini-k cs-dv-k-good t-eyebrow-strong">Reverted — compact ×</span>
        <div className="dt-split" role="group">
          <div className="dt-split-main">
            <span className="dt-split-crumb">Region</span>
            <span className="dt-split-sep"><ChevronRight /></span>
            <span className="dt-split-crumb is-current">Business Unit</span>
          </div>
          <span className="dt-split-divider" />
          <span className="dt-split-close"><CloseIcon /></span>
        </div>
      </div>
    </div>
  )
}

// 4 — Faithful data model: a flat list on the left grouping into a hierarchy on
// the right whose counts sum back to the same total.
function FaithfulData() {
  return (
    <div className="cs-dv-fidelity">
      <div className="cs-dv-mini-table">
        <span className="cs-dv-mini-k t-eyebrow-strong">Flat · 300 members</span>
        <ul className="cs-dv-flat">
          <li><i /><span>Acme — APAC</span></li>
          <li><i /><span>Globex — EMEA</span></li>
          <li><i /><span>Initech — APAC</span></li>
          <li className="cs-dv-more">+ 297 more</li>
        </ul>
      </div>
      <span className="cs-dv-arrow"><ChevronRight /></span>
      <div className="cs-dv-mini-table">
        <span className="cs-dv-mini-k t-eyebrow-strong">Grouped · sums to 300</span>
        <ul className="cs-dv-grouped">
          <li><span className="cs-dv-chev"><ChevronRight /></span><span>APAC</span><b>182</b></li>
          <li><span className="cs-dv-chev"><ChevronRight /></span><span>EMEA</span><b>74</b></li>
          <li><span className="cs-dv-chev"><ChevronRight /></span><span>AMER</span><b>44</b></li>
          <li className="cs-dv-total"><span>Total</span><b>300</b></li>
        </ul>
      </div>
    </div>
  )
}

// 5 — Open-to-last-leaf: a nested accordion opened all the way down, with a
// sibling kept visible so the "don't hide the siblings" point lands.
function OpenToLeaf() {
  const rows = [
    { label: 'APAC', count: 182, depth: 0, open: true },
    { label: 'Sales', count: 96, depth: 1, open: true },
    { label: 'Enterprise', count: 40, depth: 2, open: true, leaf: true },
    { label: 'Mid-Market', count: 56, depth: 2, sibling: true },
    { label: 'EMEA', count: 74, depth: 0, sibling: true },
  ]
  return (
    <div className="cs-dv-accordion">
      {rows.map((r) => (
        <div
          key={r.label + r.depth}
          className={`cs-dv-acc-row ${r.leaf ? 'is-leaf' : ''} ${r.sibling ? 'is-sibling' : ''}`}
          style={{ paddingLeft: 10 + r.depth * 20 }}
        >
          {!r.leaf && (
            <span className={`cs-dv-chev ${r.open ? 'is-open' : ''}`}><ChevronRight /></span>
          )}
          {r.leaf && <span className="cs-dv-leaf-dot" />}
          <span className="cs-dv-acc-name">{r.label}</span>
          <span className="cs-dv-acc-count">{r.count}</span>
        </div>
      ))}
    </div>
  )
}

// 6 — Sticky pill trail: the pinned depth-0 header whose label becomes the
// ancestor breadcrumb, each level you scrolled past collapsed into a pill.
function StickyPill() {
  return (
    <div className="cs-dv-sticky">
      <div className="cs-dv-colhead t-eyebrow-strong">Group</div>
      <div className="cs-dv-pinned">
        <span className="cs-dv-chev is-open"><ChevronRight /></span>
        <span className="dt-split-crumb">APAC</span>
        <span className="dt-split-sep"><ChevronRight /></span>
        <span className="dt-split-crumb">Sales</span>
        <span className="dt-split-sep"><ChevronRight /></span>
        <span className="dt-split-crumb is-current">EMEA Team</span>
        <span className="cs-dv-pin-tag t-eyebrow-strong">pinned</span>
      </div>
      <div className="cs-dv-scrollrows">
        <span />
        <span />
        <span />
      </div>
    </div>
  )
}

const VISUALS = {
  'micro-pagers': MicroPagers,
  'split-breadcrumb': SplitBreadcrumb,
  'wrapping-crumb': WrappingCrumb,
  'faithful-data': FaithfulData,
  'open-to-leaf': OpenToLeaf,
  'sticky-pill': StickyPill,
}

export default function DecisionVisual({ kind, caption }) {
  const Visual = VISUALS[kind]
  if (!Visual) return null
  return (
    <div className="cs-dv" aria-hidden="true">
      <span className="cs-dv-label t-eyebrow-strong">Preview</span>
      <div className="cs-dv-canvas">
        <Visual />
      </div>
      {caption && <span className="cs-dv-caption t-meta">{caption}</span>}
    </div>
  )
}
