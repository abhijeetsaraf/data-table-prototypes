import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

// ---------------------------------------------------------------------------
// Shared icons (Polar UI style, 16px) used across every grouping scenario.
// ---------------------------------------------------------------------------
export function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 4h12M4.5 8h7M6.5 12h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function ArrowIcon({ direction }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"
      style={{ transform: direction === 'asc' ? 'rotate(180deg)' : 'none' }}
    >
      <path d="M8 3v9m0 0 3.5-3.5M8 12 4.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 4.5 6 8.5l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M10 3 6 8l4 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6 3l4 5-4 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function PageFirst() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 3v10M12 3 8 8l4 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function PageLast() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M12 3v10M4 3l4 5-4 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// TruncatingCell
// Renders single-line text that truncates with an ellipsis. It watches its own
// box (ResizeObserver) and only attaches a native tooltip (`title`) when the
// text is actually clipped — so resizing a column wider both reveals more text
// AND removes the now-unnecessary tooltip.
// ---------------------------------------------------------------------------
const MIN_COL_WIDTH = 72

export function TruncatingCell({ text, className = '' }) {
  const ref = useRef(null)
  const [truncated, setTruncated] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const check = () => setTruncated(el.scrollWidth > el.clientWidth + 1)
    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [text])

  return (
    <span
      ref={ref}
      className={`dt-cell-text dt-truncate ${truncated ? 'is-truncated' : ''} ${className}`}
      title={truncated ? text : undefined}
    >
      {text}
    </span>
  )
}

// ---------------------------------------------------------------------------
// useColumnResize
// Manages per-column pixel widths and returns a mousedown handler for the
// resize grips. Widths are keyed by column key (including the "group" column).
// ---------------------------------------------------------------------------
export function useColumnResize(initialWidths) {
  const [widths, setWidths] = useState(initialWidths)
  const widthsRef = useRef(widths)
  widthsRef.current = widths
  const drag = useRef(null)

  const onMove = useCallback((e) => {
    if (!drag.current) return
    const { key, startX, startW } = drag.current
    const next = Math.max(MIN_COL_WIDTH, startW + (e.clientX - startX))
    setWidths((prev) => ({ ...prev, [key]: next }))
  }, [])

  const onUp = useCallback(() => {
    drag.current = null
    document.body.classList.remove('dt-resizing')
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }, [onMove])

  const startResize = useCallback(
    (key, e) => {
      e.preventDefault()
      e.stopPropagation()
      drag.current = { key, startX: e.clientX, startW: widthsRef.current[key] }
      document.body.classList.add('dt-resizing')
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    },
    [onMove, onUp],
  )

  useEffect(
    () => () => {
      document.body.classList.remove('dt-resizing')
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    },
    [onMove, onUp],
  )

  const totalWidth = Object.values(widths).reduce((a, b) => a + b, 0)
  return { widths, startResize, totalWidth }
}

// The visible column-header divider doubles as the resize handle: dragging it
// updates the column width. An expanded hit area is provided in CSS so the 1px
// line is still easy to grab.
function ResizeDivider({ colKey, startResize }) {
  return (
    <span
      className="dt-divider"
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize column"
      onMouseDown={(e) => startResize(colKey, e)}
      onClick={(e) => e.stopPropagation()}
    />
  )
}

// ---------------------------------------------------------------------------
// ColGroup — explicit pixel widths per column so the table is resizable.
// ---------------------------------------------------------------------------
export function ColGroup({ columns, widths }) {
  return (
    <colgroup>
      {columns.map((col) => (
        <col key={col.key} style={{ width: `${widths[col.key]}px` }} />
      ))}
    </colgroup>
  )
}

// ---------------------------------------------------------------------------
// GridHead — the shared column header (and optional filter row) used by every
// grouping scenario. The group column shows only a label; data columns get
// sort + filter chrome. Every column gets a resize grip.
// ---------------------------------------------------------------------------
export function GridHead({
  columns,
  widths,
  startResize,
  sort,
  toggleSort,
  openFilters,
  toggleFilter,
  filters,
  setFilters,
}) {
  const dataCols = columns.filter((c) => c.key !== 'group')
  const anyFilterOpen = dataCols.some((col) => openFilters[col.key])

  return (
    <thead>
      <tr className="dt-header-row">
        {columns.map((col) => {
          if (col.key === 'group') {
            return (
              <th key={col.key} className="dt-header dt-header--group">
                <div className="dt-header-items">
                  <span className="dt-header-content">{col.label}</span>
                  <div className="dt-header-end">
                    <ResizeDivider colKey={col.key} startResize={startResize} />
                  </div>
                </div>
              </th>
            )
          }
          const isSorted = sort.key === col.key
          const isFilterOpen = !!openFilters[col.key]
          return (
            <th key={col.key} className="dt-header">
              <div className="dt-header-items">
                <button type="button" className="dt-header-start" onClick={() => toggleSort(col.key)}>
                  <span className="dt-header-content">{col.label}</span>
                  <span className={`dt-sort ${isSorted ? 'is-active' : ''}`}>
                    <ArrowIcon direction={isSorted ? sort.dir : 'desc'} />
                  </span>
                </button>
                <div className="dt-header-end">
                  <button
                    type="button"
                    className={`dt-filter-toggle ${isFilterOpen || filters[col.key] ? 'is-active' : ''}`}
                    aria-label={`Filter ${col.label}`}
                    aria-pressed={isFilterOpen}
                  >
                    <FilterIcon />
                  </button>
                  <ResizeDivider colKey={col.key} startResize={startResize} />
                </div>
              </div>
            </th>
          )
        })}
      </tr>
      {anyFilterOpen && (
        <tr className="dt-filter-row">
          {columns.map((col) => (
            <th key={col.key} className="dt-filter-cell">
              {col.key !== 'group' && openFilters[col.key] && (
                <input
                  className="dt-filter-input"
                  type="text"
                  placeholder={`Filter ${col.label}…`}
                  value={filters[col.key] || ''}
                  onChange={(e) => setFilters((p) => ({ ...p, [col.key]: e.target.value }))}
                />
              )}
            </th>
          ))}
        </tr>
      )}
    </thead>
  )
}
