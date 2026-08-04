import { Fragment, useMemo, useState } from 'react'
import ScenarioShell, { ToggleSwitch } from '../components/ScenarioShell.jsx'
import {
  ChevronDown, ChevronLeft, ChevronRight, PageFirst, PageLast, CloseIcon,
  TruncatingCell, useColumnResize, ColGroup, GridHead,
} from '../components/tableKit.jsx'
import {
  columns, dataColumns, defaultWidths, PAGE_SIZES, MICRO_PAGE_SIZE, INDENT_STEP,
  LEVELS, LEVEL_BY_KEY, flatMembers, buildGroupTree, orderedLevelName,
} from '../components/groupingModel.js'

// ---------------------------------------------------------------------------
// Variant: Accordion Drill In — Custom Grouping
// The default state is a plain, ungrouped table (no Group column). A "Group by"
// builder in the left panel lets the user pick dimensions in sequence and commit
// them with "Create groups"; only then does the table transform into the
// accordion drill-in experience, with the hierarchy DERIVED from the same flat
// rows (so counts reconcile). Reset returns the table to the flat default.
// ---------------------------------------------------------------------------

// Available grouping dimensions to choose from.
const groupCatalog = LEVELS.map((l) => ({ key: l.key, name: l.name }))

// Full "open to the last leaf" sub-path for a hierarchy of `depth` levels:
// child index 0 at every intermediate level so the leaf rows are shown.
const leafSubPath = (depth) => Array(Math.max(0, depth - 1)).fill(0)

const sameOrder = (a, b) =>
  a.length === b.length && a.every((k, i) => k === b[i])

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3.5 8.5 6.5 11.5l6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Group by builder (rendered into the shell's left-panel controls slot)
// ---------------------------------------------------------------------------
function GroupByBuilder({ draft, setDraft, activeOrder, onCreate, onReset }) {
  const toggle = (key) =>
    setDraft((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )

  const createDisabled = draft.length === 0 || sameOrder(draft, activeOrder)
  const resetDisabled = draft.length === 0 && activeOrder.length === 0

  return (
    <>
      <h2 className="dt-controls-heading">Group by</h2>
      <p className="dt-gb-hint">
        Select dimensions in the order you want to nest them, then create the groups.
      </p>
      {draft.length > 0 && (
        <div className="dt-split dt-gb-split" role="group" aria-label="Group by sequence">
          <div className="dt-split-main">
            {draft.map((key, j) => {
              const isLast = j === draft.length - 1
              const name = LEVEL_BY_KEY[key].name
              if (!isLast) {
                return (
                  <Fragment key={key}>
                    {j > 0 && <span className="dt-split-sep"><ChevronRight /></span>}
                    <button type="button" className="dt-split-crumb"
                      onClick={() => setDraft(draft.slice(0, j + 1))}>
                      {name}
                    </button>
                  </Fragment>
                )
              }
              // Last crumb + remove button form one unit, so the × stays glued
              // to the last label when the breadcrumb wraps.
              return (
                <Fragment key={key}>
                  {j > 0 && <span className="dt-split-sep"><ChevronRight /></span>}
                  <span className="dt-gb-last">
                    <button type="button" className="dt-split-crumb is-current" disabled>
                      {name}
                    </button>
                    <button type="button" className="dt-gb-x"
                      aria-label="Remove last dimension" title="Remove last dimension"
                      onClick={() => setDraft(draft.slice(0, -1))}>
                      <CloseIcon />
                    </button>
                  </span>
                </Fragment>
              )
            })}
          </div>
        </div>
      )}
      <div className="dt-gb-list">
        {groupCatalog.map((dim) => {
          const selected = draft.includes(dim.key)
          return (
            <button
              key={dim.key}
              type="button"
              className={`dt-gb-item ${selected ? 'is-selected' : ''}`}
              aria-pressed={selected}
              onClick={() => toggle(dim.key)}
            >
              <span className={`dt-gb-check ${selected ? 'is-on' : ''}`}>
                {selected && <CheckIcon />}
              </span>
              <span className="dt-gb-label">{dim.name}</span>
            </button>
          )
        })}
      </div>
      <div className="dt-gb-actions">
        <button
          type="button"
          className="dt-gb-reset"
          disabled={resetDisabled}
          onClick={onReset}
        >
          Reset
        </button>
        <button
          type="button"
          className="dt-gb-apply"
          disabled={createDisabled}
          onClick={() => onCreate(draft)}
        >
          Create groups
        </button>
      </div>
    </>
  )
}

function HeaderPager({ label, page, pageCount, total, pageSize, onGoTo }) {
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)
  return (
    <div className="dt-pager-inline dt-pager-sm">
      <span className="dt-pager-summary">{label} {start}–{end} of {total}</span>
      <button type="button" className="dt-page-btn" aria-label="First page" disabled={page === 1} onClick={() => onGoTo(1)}><PageFirst /></button>
      <button type="button" className="dt-page-btn" aria-label="Previous page" disabled={page === 1} onClick={() => onGoTo(page - 1)}><ChevronLeft /></button>
      <span className="dt-pager-page">{page} / {pageCount}</span>
      <button type="button" className="dt-page-btn" aria-label="Next page" disabled={page === pageCount} onClick={() => onGoTo(page + 1)}><ChevronRight /></button>
      <button type="button" className="dt-page-btn" aria-label="Last page" disabled={page === pageCount} onClick={() => onGoTo(pageCount)}><PageLast /></button>
    </div>
  )
}

export default function RowGroupingAccordionDrillInCustom() {
  const [sort, setSort] = useState({ key: null, dir: 'asc' })
  const [openFilters, setOpenFilters] = useState({})
  const [filters, setFilters] = useState({})
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const { widths, startResize } = useColumnResize(defaultWidths)

  // Committed grouping order (what the table renders) vs. the draft the user is
  // assembling in the builder. Empty order = flat default state.
  const [activeOrder, setActiveOrder] = useState([])
  const [draft, setDraft] = useState([])

  const grouped = activeOrder.length > 0
  const levelCount = activeOrder.length
  const defaultPath = leafSubPath(levelCount)

  // Multi-open accordion: every top group is independently open and drilled to
  // its last leaf by default. `collapseAll` is the global default (from Table
  // Controls); `openMap` holds per-group overrides; `pathMap` holds each group's
  // own drill path. Missing entries fall back to the defaults.
  const [collapseAll, setCollapseAll] = useState(false)
  const [openMap, setOpenMap] = useState({})
  const [pathMap, setPathMap] = useState({})
  const [microPage, setMicroPage] = useState({})

  const isOpen = (gi) => openMap[gi] ?? !collapseAll
  const pathOf = (gi) => pathMap[gi] ?? defaultPath

  // Grouping hierarchy derived from the same flat rows.
  const tree = useMemo(() => buildGroupTree(flatMembers, activeOrder), [activeOrder])
  const nodeAt = (path) => {
    let node = tree
    for (const idx of path) node = node.children[idx].child
    return node
  }
  const labelsAt = (path) => {
    const labels = []
    let node = tree
    for (const idx of path) {
      const c = node.children[idx]
      labels.push(c.label)
      node = c.child
    }
    return labels
  }

  // Flat (ungrouped) rows: filter + sort applied to the member list directly.
  const flatRows = useMemo(() => {
    const filtered = flatMembers.filter((row) =>
      dataColumns.every((col) => {
        const term = (filters[col.key] || '').trim().toLowerCase()
        if (!term) return true
        return String(row[col.key]).toLowerCase().includes(term)
      }),
    )
    if (!sort.key) return filtered
    const rows = [...filtered]
    rows.sort((a, b) => {
      const av = String(a[sort.key]).toLowerCase()
      const bv = String(b[sort.key]).toLowerCase()
      if (av < bv) return sort.dir === 'asc' ? -1 : 1
      if (av > bv) return sort.dir === 'asc' ? 1 : -1
      return 0
    })
    return rows
  }, [filters, sort])

  const toggleSort = (key) =>
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: 'asc' }
      if (prev.dir === 'asc') return { key, dir: 'desc' }
      return { key: null, dir: 'asc' }
    })
  const toggleFilter = (key) => setOpenFilters((p) => ({ ...p, [key]: !p[key] }))

  // Per-group open/collapse. Opening always resets that group to its last leaf.
  const toggleGroup = (gi) => {
    const next = !isOpen(gi)
    setOpenMap((prev) => ({ ...prev, [gi]: next }))
    if (next) setPathMap((prev) => ({ ...prev, [gi]: defaultPath }))
  }
  const drillInto = (gi, childIdx) =>
    setPathMap((prev) => ({ ...prev, [gi]: [...pathOf(gi), childIdx] }))
  const drillTo = (gi, len) =>
    setPathMap((prev) => ({ ...prev, [gi]: pathOf(gi).slice(0, len) }))

  const setCollapseAllGroups = (next) => {
    setCollapseAll(next)
    setOpenMap({})
  }

  const resetGroupState = () => {
    setCollapseAll(false)
    setOpenMap({})
    setPathMap({})
    setMicroPage({})
    setPage(1)
  }

  // Commit a new grouping order and reset drill/open/pager state.
  const createGroups = (order) => {
    setActiveOrder(order)
    resetGroupState()
  }

  // Reset returns to the flat default: clear the draft AND un-apply grouping.
  const resetAll = () => {
    setDraft([])
    setActiveOrder([])
    resetGroupState()
  }

  const getMicro = (key) => microPage[key] || 1
  const setMicro = (key, value, count) =>
    setMicroPage((p) => ({ ...p, [key]: Math.min(Math.max(1, value), count) }))

  const activeColumns = grouped ? columns : dataColumns
  const minWidth = activeColumns.reduce((sum, col) => sum + widths[col.key], 0)

  const total = grouped ? tree.children.length : flatRows.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, pageCount)
  const startG = (currentPage - 1) * pageSize
  const endG = Math.min(startG + pageSize, total)
  const goToMain = (p) => setPage(Math.min(Math.max(1, p), pageCount))

  return (
    <ScenarioShell
      fill
      title="Row Grouping — Accordion Drill In (Custom)"
      description="Starts as a plain ungrouped table. Pick dimensions in the left panel and click Create groups to derive the hierarchy from the same rows; Reset returns to the flat default."
      groupBy={grouped ? activeOrder.map((k) => LEVEL_BY_KEY[k].name) : undefined}
      controlsDefaultOpen={false}
      panelExtras={
        <GroupByBuilder
          draft={draft}
          setDraft={setDraft}
          activeOrder={activeOrder}
          onCreate={createGroups}
          onReset={resetAll}
        />
      }
      controls={
        grouped ? (
          <div className="dt-control">
            <span className="dt-control-text">
              <span className="dt-control-label">Collapse all groups</span>
              <span className="dt-control-desc">
                Collapse every group. Off shows all groups expanded to the last leaf.
              </span>
            </span>
            <ToggleSwitch
              on={collapseAll}
              onChange={setCollapseAllGroups}
              label="Collapse all groups"
            />
          </div>
        ) : undefined
      }
    >
      <div className="dt-table dt-table--fill">
        <div className="dt-columns">
          <table className="dt-grid" style={{ width: '100%', minWidth: `${minWidth}px` }}>
            <ColGroup columns={activeColumns} widths={widths} />
            <GridHead
              columns={activeColumns}
              widths={widths}
              startResize={startResize}
              sort={sort}
              toggleSort={toggleSort}
              openFilters={openFilters}
              toggleFilter={toggleFilter}
              filters={filters}
              setFilters={setFilters}
            />
            <tbody>
              {!grouped &&
                flatRows.slice(startG, endG).map((row, idx) => (
                  <tr className={`dt-row ${idx % 2 === 1 ? 'dt-row--alt' : ''}`} key={row.id}>
                    {dataColumns.map((col) => (
                      <td key={col.key} className="dt-cell">
                        <TruncatingCell text={row[col.key]} />
                      </td>
                    ))}
                  </tr>
                ))}

              {!grouped && flatRows.length === 0 && (
                <tr className="dt-row">
                  <td className="dt-cell dt-empty" colSpan={dataColumns.length}>
                    <span className="dt-cell-text">No matching rows</span>
                  </td>
                </tr>
              )}

              {grouped &&
                Array.from({ length: endG - startG }, (_, idx) => {
                  const gi = startG + idx
                  const gKey = `g${gi}`
                  const gOpen = isOpen(gi)
                  const gSubPath = pathOf(gi)

                  const fullPath = [gi, ...gSubPath]
                  const shownLevel = fullPath.length
                  const node = nodeAt(fullPath)
                  const labels = labelsAt(fullPath)
                  const isLeaf = node.isLeaf
                  const rowsAtNode = isLeaf ? node.members : node.children
                  const nodeTotal = rowsAtNode.length
                  const microKey = `acc-${gi}-${gSubPath.join('.')}`
                  const micro = getMicro(microKey)
                  const microPageCount = Math.max(1, Math.ceil(nodeTotal / MICRO_PAGE_SIZE))
                  const s = (micro - 1) * MICRO_PAGE_SIZE
                  const e = Math.min(s + MICRO_PAGE_SIZE, nodeTotal)
                  const rowIndent = 12 + INDENT_STEP
                  const leafIndent = 12 + INDENT_STEP * 2

                  return (
                    <Fragment key={gKey}>
                      <tr className="dt-group-row" data-level="0">
                        <td className="dt-group-cell" colSpan={activeColumns.length}>
                          <div className="dt-group-header" style={{ paddingLeft: 12 }}>
                            <div className="dt-group-header-start">
                              <button type="button" className="dt-group-toggle"
                                aria-expanded={gOpen} aria-label={gOpen ? 'Collapse group' : 'Expand group'}
                                onClick={() => toggleGroup(gi)}>
                                <span className={`dt-group-chevron ${gOpen ? 'is-open' : ''}`}><ChevronRight /></span>
                              </button>
                              <div className="dt-split" role="group" aria-label="Current path">
                                <div className="dt-split-main">
                                  <button type="button"
                                    className={`dt-split-crumb ${gSubPath.length === 0 ? 'is-current' : ''}`}
                                    disabled={gSubPath.length === 0}
                                    onClick={gSubPath.length === 0 ? undefined : () => drillTo(gi, 0)}>
                                    {labels[0]}
                                  </button>
                                  {gSubPath.map((sidx, j) => {
                                    const isLast = j === gSubPath.length - 1
                                    return (
                                      <Fragment key={`${j}-${sidx}`}>
                                        <span className="dt-split-sep"><ChevronRight /></span>
                                        <button type="button"
                                          className={`dt-split-crumb ${isLast ? 'is-current' : ''}`}
                                          disabled={isLast}
                                          onClick={isLast ? undefined : () => drillTo(gi, j + 1)}>
                                          {labels[j + 1]}
                                        </button>
                                      </Fragment>
                                    )
                                  })}
                                </div>
                                {gSubPath.length > 0 && (
                                  <>
                                    <span className="dt-split-divider" />
                                    <button type="button" className="dt-split-close"
                                      aria-label="Go up one level" title="Go up one level"
                                      onClick={() => drillTo(gi, gSubPath.length - 1)}>
                                      <CloseIcon />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                            {gOpen && (
                              <HeaderPager label={`${orderedLevelName(activeOrder, shownLevel)}s`} page={micro} pageCount={microPageCount}
                                total={nodeTotal} pageSize={MICRO_PAGE_SIZE}
                                onGoTo={(p) => setMicro(microKey, p, microPageCount)} />
                            )}
                          </div>
                        </td>
                      </tr>

                      {gOpen && !isLeaf &&
                        Array.from({ length: e - s }, (_, k) => {
                          const childIdx = s + k
                          const childNode = node.children[childIdx]
                          const onOpen = () => drillInto(gi, childIdx)
                          return (
                            <tr
                              className="dt-row dt-drill-row"
                              key={`acc-${gi}-${gSubPath.join('.')}-${childIdx}`}
                              role="button"
                              tabIndex={0}
                              onClick={onOpen}
                              onKeyDown={(ev) => {
                                if (ev.key === 'Enter' || ev.key === ' ') {
                                  ev.preventDefault()
                                  onOpen()
                                }
                              }}
                            >
                              <td className="dt-cell">
                                <div className="dt-drill-name" style={{ paddingLeft: rowIndent }}>
                                  <TruncatingCell text={childNode.label} className="dt-strong" />
                                  <span className="dt-group-count">{childNode.count}</span>
                                </div>
                              </td>
                              {dataColumns.map((col, ci) => (
                                <td key={col.key} className="dt-cell">
                                  {ci === dataColumns.length - 1 && (
                                    <span className="dt-drill-caret"><ChevronRight /></span>
                                  )}
                                </td>
                              ))}
                            </tr>
                          )
                        })}

                      {gOpen && isLeaf &&
                        Array.from({ length: e - s }, (_, k) => {
                          const item = node.members[s + k]
                          return (
                            <tr
                              className={`dt-row ${(s + k) % 2 === 1 ? 'dt-row--alt' : ''}`}
                              key={item.id}
                            >
                              <td className="dt-cell dt-cell--group-spacer" style={{ paddingLeft: leafIndent }} />
                              {dataColumns.map((col) => (
                                <td key={col.key} className="dt-cell">
                                  <TruncatingCell text={item[col.key]} />
                                </td>
                              ))}
                            </tr>
                          )
                        })}
                    </Fragment>
                  )
                })}
            </tbody>
          </table>
        </div>

        <div className="dt-footer">
          <div className="dt-page-size">
            <span className="dt-page-size-label">{grouped ? 'Groups per page' : 'Items per page'}</span>
            <div className="dt-select">
              <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}>
                {PAGE_SIZES.map((size) => (<option key={size} value={size}>{size}</option>))}
              </select>
              <span className="dt-select-chevron"><ChevronDown /></span>
            </div>
          </div>
          <div className="dt-pagination">
            <button type="button" className="dt-page-btn" aria-label="First page" disabled={currentPage === 1} onClick={() => goToMain(1)}><PageFirst /></button>
            <button type="button" className="dt-page-btn" aria-label="Previous page" disabled={currentPage === 1} onClick={() => goToMain(currentPage - 1)}><ChevronLeft /></button>
            <span className="dt-page-label">Page</span>
            <div className="dt-number-field">
              <input type="number" min={1} max={pageCount} value={currentPage} onChange={(e) => goToMain(Number(e.target.value))} />
            </div>
            <span className="dt-page-count">of {pageCount}</span>
            <button type="button" className="dt-page-btn" aria-label="Next page" disabled={currentPage === pageCount} onClick={() => goToMain(currentPage + 1)}><ChevronRight /></button>
            <button type="button" className="dt-page-btn" aria-label="Last page" disabled={currentPage === pageCount} onClick={() => goToMain(pageCount)}><PageLast /></button>
          </div>
        </div>
      </div>
    </ScenarioShell>
  )
}
