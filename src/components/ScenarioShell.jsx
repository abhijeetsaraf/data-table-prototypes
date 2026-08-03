import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

// ---------------------------------------------------------------------------
// Density
// A single global control that every table reads from. Cell sizing itself is
// driven by CSS keyed off `[data-density]` on the layout root, so any table
// using the shared `.dt-cell` / `.dt-header` / `.dt-group-inner` classes reacts
// to the toggle without per-table wiring. The context is exposed so a cell
// *can* also branch in JS (e.g. embed extra content) when it wants to.
// ---------------------------------------------------------------------------
const DensityContext = createContext({ dense: false, setDense: () => {} })

export function useDensity() {
  return useContext(DensityContext)
}

function ToggleSwitch({ on, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`dt-switch ${on ? 'is-on' : ''}`}
      onClick={() => onChange(!on)}
    >
      <span className="dt-switch-track">
        <span className="dt-switch-thumb" />
      </span>
    </button>
  )
}

function GroupByChips({ groupBy }) {
  if (!groupBy || groupBy.length === 0) return null
  return (
    <div className="dt-groupby dt-panel-groupby">
      <span className="dt-groupby-label">Grouped by</span>
      {groupBy.map((dim, i) => (
        <span key={`${dim}-${i}`} className="dt-groupby-inline">
          <span className="dt-groupby-chip">{dim}</span>
          {i < groupBy.length - 1 && (
            <span className="dt-groupby-arrow">→</span>
          )}
        </span>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Icons — hand-authored inline SVGs to match the repo's 16px / 1.5-stroke set
// (the Figma export glyph ships as an expiring remote asset, so it is redrawn
// here in the same line-icon style rather than embedded by URL).
// ---------------------------------------------------------------------------
function ExportIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 10V2m0 0L5.25 4.75M8 2l2.75 2.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 9v3.5a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M2 4.5 6 8.5l4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// ItemControlBar
// The table header that sits directly above the table. Its left ("Start")
// region can surface the table heading, description, and an item count; its
// right ("End") region holds the Export split button. Counts assume lazy
// loading — `loaded` is what is currently in view, `total` is the full table.
// ---------------------------------------------------------------------------
function ItemControlBar({
  showCount,
  showHeading,
  showDescription,
  heading,
  description,
  loadedCount,
  totalCount,
}) {
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef(null)

  useEffect(() => {
    if (!exportOpen) return
    const onPointerDown = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setExportOpen(false)
      }
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setExportOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [exportOpen])

  const handleExport = () => {
    // Wiring to be expanded later; for now the interaction just closes the menu.
    setExportOpen(false)
  }

  const hasHeading = showHeading && heading
  const hasDescription = showDescription && description

  return (
    <div className="dt-icb">
      <div className="dt-icb-start">
        {hasHeading && <span className="dt-icb-heading">{heading}</span>}
        {hasDescription && <span className="dt-icb-desc">{description}</span>}
        {showCount && (
          <span className="dt-icb-count">
            {loadedCount.toLocaleString()} of {totalCount.toLocaleString()} items
          </span>
        )}
      </div>

      <div className="dt-icb-end">
        <div className="dt-export" ref={exportRef} data-open={exportOpen}>
          <button
            type="button"
            className="dt-export-btn"
            aria-haspopup="listbox"
            aria-expanded={exportOpen}
            onClick={() => setExportOpen((o) => !o)}
          >
            <span className="dt-export-icon">
              <ExportIcon />
            </span>
            <span className="dt-export-label">Export</span>
            <span className="dt-export-caret">
              <ChevronDown />
            </span>
          </button>

          {exportOpen && (
            <ul className="dt-export-menu" role="listbox" aria-label="Export options">
              <li>
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  className="dt-export-option"
                  onClick={handleExport}
                >
                  <span className="dt-export-option-label">Export current view</span>
                  <span className="dt-export-option-meta">
                    {loadedCount.toLocaleString()} items loaded
                  </span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  className="dt-export-option"
                  onClick={handleExport}
                >
                  <span className="dt-export-option-label">Export all</span>
                  <span className="dt-export-option-meta">
                    {totalCount.toLocaleString()} items
                  </span>
                </button>
              </li>
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ScenarioShell
// Presentation + control panel on the left, table (children) on the right.
// Panel is laid out top-down: back + heading, description, then (pushed to the
// bottom) the "Table Controls" section. Extra scenario-specific controls can be
// injected via `controls`. An Item Control Bar renders above the table; its
// toggles live in the shared control panel alongside density/striped.
// ---------------------------------------------------------------------------
export default function ScenarioShell({
  title,
  description,
  groupBy,
  fill = false,
  controls,
  loadedCount = 50,
  totalCount = 1234,
  children,
}) {
  const [dense, setDense] = useState(false)
  const [striped, setStriped] = useState(false)
  const [showCount, setShowCount] = useState(true)
  const [showHeading, setShowHeading] = useState(false)
  const [showDescription, setShowDescription] = useState(false)
  const ctx = useMemo(() => ({ dense, setDense }), [dense])

  return (
    <DensityContext.Provider value={ctx}>
      <main
        className={`dt-layout ${fill ? 'dt-layout--fill' : ''}`}
        data-density={dense ? 'dense' : 'normal'}
        data-striped={striped ? 'on' : 'off'}
      >
        <aside className="dt-panel">
          <div className="dt-panel-head">
            <Link to="/" className="back-link">← Back</Link>
            <h1 className="dt-panel-title">{title}</h1>
            {description && <p className="dt-panel-desc">{description}</p>}
            <GroupByChips groupBy={groupBy} />
          </div>

          <div className="dt-panel-controls">
            <h2 className="dt-controls-heading">Table Controls</h2>

            <div className="dt-control">
              <span className="dt-control-text">
                <span className="dt-control-label">Density</span>
                <span className="dt-control-desc">
                  Compact rows to fit more data on screen.
                </span>
              </span>
              <ToggleSwitch on={dense} onChange={setDense} label="Density" />
            </div>

            <div className="dt-control">
              <span className="dt-control-text">
                <span className="dt-control-label">Striped rows</span>
                <span className="dt-control-desc">
                  Shade alternate rows to make content easier to scan.
                </span>
              </span>
              <ToggleSwitch on={striped} onChange={setStriped} label="Striped rows" />
            </div>

            <h2 className="dt-controls-heading dt-controls-heading--sub">
              Item Control Bar
            </h2>

            <div className="dt-control dt-control--simple">
              <span className="dt-control-label">Item count</span>
              <ToggleSwitch on={showCount} onChange={setShowCount} label="Item count" />
            </div>

            <div className="dt-control dt-control--simple">
              <span className="dt-control-label">Table heading</span>
              <ToggleSwitch
                on={showHeading}
                onChange={setShowHeading}
                label="Table heading"
              />
            </div>

            <div className="dt-control dt-control--simple">
              <span className="dt-control-label">Table description</span>
              <ToggleSwitch
                on={showDescription}
                onChange={setShowDescription}
                label="Table description"
              />
            </div>

            {controls}
          </div>
        </aside>

        <div className="dt-main">
          <ItemControlBar
            showCount={showCount}
            showHeading={showHeading}
            showDescription={showDescription}
            heading={title}
            description={description}
            loadedCount={loadedCount}
            totalCount={totalCount}
          />
          {children}
        </div>
      </main>
    </DensityContext.Provider>
  )
}
