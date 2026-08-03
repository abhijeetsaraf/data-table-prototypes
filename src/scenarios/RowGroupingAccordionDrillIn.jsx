import { Fragment, useState } from 'react'
import ScenarioShell from '../components/ScenarioShell.jsx'
import {
  ChevronDown, ChevronLeft, ChevronRight, PageFirst, PageLast, CloseIcon,
  TruncatingCell, useColumnResize, ColGroup, GridHead,
} from '../components/tableKit.jsx'
import {
  columns, dataColumns, defaultWidths, PAGE_SIZES, MICRO_PAGE_SIZE, INDENT_STEP,
  GROUP_LEVEL_COUNT, levelLabel, levelName, levelTotal, childCountAt,
  leafItem, groupByDims,
} from '../components/groupingModel.js'

// ---------------------------------------------------------------------------
// Variant: Accordion Drill In
// Top-level groups keep the standard footer pager. Each top group is a
// single-open accordion; expanding one reveals a drill-in experience embedded
// inside it (split-button breadcrumb + the current level's header pager),
// drilling down through the remaining hierarchy levels. Only the embedded
// drill controls move; the main pager never leaves the footer.
// ---------------------------------------------------------------------------
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

export default function RowGroupingAccordionDrillIn() {
  const [sort, setSort] = useState({ key: null, dir: 'asc' })
  const [openFilters, setOpenFilters] = useState({})
  const [filters, setFilters] = useState({})
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const { widths, startResize, totalWidth } = useColumnResize(defaultWidths)

  // Single-open top group + drill state scoped to that group.
  //   subPath = []      -> showing the group's level-1 children
  //   subPath = [a, b…] -> drilled deeper; showing children of [gi, a, b, …]
  const [openGroup, setOpenGroup] = useState(null)
  const [subPath, setSubPath] = useState([])
  const [microPage, setMicroPage] = useState({})

  const toggleSort = (key) =>
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: 'asc' }
      if (prev.dir === 'asc') return { key, dir: 'desc' }
      return { key: null, dir: 'asc' }
    })
  const toggleFilter = (key) => setOpenFilters((p) => ({ ...p, [key]: !p[key] }))

  const toggleGroup = (gi) => {
    setOpenGroup((prev) => (prev === gi ? null : gi))
    setSubPath([])
  }
  const drillInto = (childIdx) => setSubPath((prev) => [...prev, childIdx])
  const drillTo = (len) => setSubPath((prev) => prev.slice(0, len))

  const getMicro = (key) => microPage[key] || 1
  const setMicro = (key, value, count) =>
    setMicroPage((p) => ({ ...p, [key]: Math.min(Math.max(1, value), count) }))

  const topTotal = levelTotal(0)
  const topPageCount = Math.max(1, Math.ceil(topTotal / pageSize))
  const currentPage = Math.min(page, topPageCount)
  const startG = (currentPage - 1) * pageSize
  const endG = Math.min(startG + pageSize, topTotal)
  const goToMain = (p) => setPage(Math.min(Math.max(1, p), topPageCount))

  return (
    <ScenarioShell
      fill
      title="Row Grouping — Accordion Drill In"
      description="Primary groups keep the standard footer pager. Each group's accordion header becomes a split-button breadcrumb, and the current level's pager is anchored to that same header row as you drill down the hierarchy."
      groupBy={groupByDims}
    >
      <div className="dt-table dt-table--fill">
        <div className="dt-columns">
          <table className="dt-grid" style={{ width: '100%', minWidth: `${totalWidth}px` }}>
            <ColGroup columns={columns} widths={widths} />
            <GridHead
              columns={columns}
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
              {Array.from({ length: endG - startG }, (_, idx) => {
                const gi = startG + idx
                const gKey = `g${gi}`
                const gOpen = openGroup === gi

                // Full path currently shown inside this open group + the level
                // (depth) of the nodes being listed.
                const fullPath = [gi, ...subPath]
                const shownLevel = fullPath.length
                const isLeaf = shownLevel === GROUP_LEVEL_COUNT
                const total = levelTotal(shownLevel)
                const microKey = `acc-${gi}-${subPath.join('.')}`
                const micro = getMicro(microKey)
                const pageCount = Math.max(1, Math.ceil(total / MICRO_PAGE_SIZE))
                const s = (micro - 1) * MICRO_PAGE_SIZE
                const e = Math.min(s + MICRO_PAGE_SIZE, total)
                const rowIndent = 12 + INDENT_STEP
                const leafIndent = 12 + INDENT_STEP * 2

                return (
                  <Fragment key={gKey}>
                    <tr className="dt-group-row" data-level="0">
                      <td className="dt-group-cell" colSpan={columns.length}>
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
                                  className={`dt-split-crumb ${subPath.length === 0 ? 'is-current' : ''}`}
                                  disabled={subPath.length === 0}
                                  onClick={subPath.length === 0 ? undefined : () => drillTo(0)}>
                                  {levelLabel(0, gi)}
                                </button>
                                {subPath.map((sidx, j) => {
                                  const isLast = j === subPath.length - 1
                                  return (
                                    <Fragment key={`${j}-${sidx}`}>
                                      <span className="dt-split-sep"><ChevronRight /></span>
                                      <button type="button"
                                        className={`dt-split-crumb ${isLast ? 'is-current' : ''}`}
                                        disabled={isLast}
                                        onClick={isLast ? undefined : () => drillTo(j + 1)}>
                                        {levelLabel(j + 1, sidx)}
                                      </button>
                                    </Fragment>
                                  )
                                })}
                              </div>
                              {subPath.length > 0 && (
                                <>
                                  <span className="dt-split-divider" />
                                  <button type="button" className="dt-split-close"
                                    aria-label="Go up one level" title="Go up one level"
                                    onClick={() => drillTo(subPath.length - 1)}>
                                    <CloseIcon />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          {gOpen && (
                            <HeaderPager label={`${levelName(shownLevel)}s`} page={micro} pageCount={pageCount}
                              total={total} pageSize={MICRO_PAGE_SIZE}
                              onGoTo={(p) => setMicro(microKey, p, pageCount)} />
                          )}
                        </div>
                      </td>
                    </tr>

                    {gOpen && !isLeaf &&
                      Array.from({ length: e - s }, (_, k) => {
                        const childIdx = s + k
                        const onOpen = () => drillInto(childIdx)
                        return (
                          <tr
                            className="dt-row dt-drill-row"
                            key={`acc-${gi}-${subPath.join('.')}-${childIdx}`}
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
                                <TruncatingCell text={levelLabel(shownLevel, childIdx)} className="dt-strong" />
                                <span className="dt-group-count">{childCountAt(shownLevel)}</span>
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
                        const ii = s + k
                        const item = leafItem(fullPath, ii)
                        return (
                          <tr
                            className={`dt-row ${ii % 2 === 1 ? 'dt-row--alt' : ''}`}
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
            <span className="dt-page-size-label">Groups per page</span>
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
              <input type="number" min={1} max={topPageCount} value={currentPage} onChange={(e) => goToMain(Number(e.target.value))} />
            </div>
            <span className="dt-page-count">of {topPageCount}</span>
            <button type="button" className="dt-page-btn" aria-label="Next page" disabled={currentPage === topPageCount} onClick={() => goToMain(currentPage + 1)}><ChevronRight /></button>
            <button type="button" className="dt-page-btn" aria-label="Last page" disabled={currentPage === topPageCount} onClick={() => goToMain(topPageCount)}><PageLast /></button>
          </div>
        </div>
      </div>
    </ScenarioShell>
  )
}
