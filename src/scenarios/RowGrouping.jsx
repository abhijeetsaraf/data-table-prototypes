import { Fragment, useState, useMemo } from 'react'
import ScenarioShell from '../components/ScenarioShell.jsx'
import {
  ChevronDown, ChevronLeft, ChevronRight, PageFirst, PageLast,
  TruncatingCell, useColumnResize, useColumnVisibility, ColGroup, GridHead,
} from '../components/tableKit.jsx'
import {
  columns as allColumns, defaultWidths, PAGE_SIZES, MICRO_PAGE_SIZE, INDENT_STEP,
  GROUP_LEVEL_COUNT, levelName, groupByDims,
  flatMembers, buildGroupTree, DEFAULT_ORDER, treeNodeAt,
} from '../components/groupingModel.js'

// Height of a single sticky micro-pagination row; deeper levels stack above
// shallower ones by whole multiples of this value. Matches `.dt-micro-cell`.
const MICRO_ROW_H = 47

// ---------------------------------------------------------------------------
// Row Grouping — Stacked micro pagination
// Hierarchical rows across the full 5-level hierarchy. Each expanded level
// gets its own sticky micro-pagination row; the pagers stack at the bottom of
// the scroll area, one tonal step darker per level. Single-open per level.
// ---------------------------------------------------------------------------
function MicroPagination({ label, page, pageCount, total, onGoTo, summaryWidth }) {
  const start = (page - 1) * MICRO_PAGE_SIZE + 1
  const end = Math.min(page * MICRO_PAGE_SIZE, total)
  return (
    <div className="dt-micro-pagination dt-micro-sm">
      <span
        className="dt-micro-summary"
        style={summaryWidth ? { width: summaryWidth } : undefined}
      >
        {label} {start}–{end} of {total}
      </span>
      <div className="dt-micro-controls">
        <button type="button" className="dt-page-btn" aria-label="First page" disabled={page === 1} onClick={() => onGoTo(1)}><PageFirst /></button>
        <button type="button" className="dt-page-btn" aria-label="Previous page" disabled={page === 1} onClick={() => onGoTo(page - 1)}><ChevronLeft /></button>
        <span className="dt-page-label">Page</span>
        <div className="dt-number-field">
          <input type="number" min={1} max={pageCount} value={page} onChange={(e) => onGoTo(Number(e.target.value))} />
        </div>
        <span className="dt-page-count">of {pageCount}</span>
        <button type="button" className="dt-page-btn" aria-label="Next page" disabled={page === pageCount} onClick={() => onGoTo(page + 1)}><ChevronRight /></button>
        <button type="button" className="dt-page-btn" aria-label="Last page" disabled={page === pageCount} onClick={() => onGoTo(pageCount)}><PageLast /></button>
      </div>
    </div>
  )
}

export default function RowGrouping() {
  const [sort, setSort] = useState({ key: null, dir: 'asc' })
  const [openFilters, setOpenFilters] = useState({})
  const [filters, setFilters] = useState({})
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)

  // Single-open chain: openPath[L] = the index expanded at level L.
  const [openPath, setOpenPath] = useState([])
  const [microPage, setMicroPage] = useState({})

  const toggleSort = (key) =>
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: 'asc' }
      if (prev.dir === 'asc') return { key, dir: 'desc' }
      return { key: null, dir: 'asc' }
    })
  const toggleFilter = (key) => setOpenFilters((p) => ({ ...p, [key]: !p[key] }))

  const toggleAt = (level, i) =>
    setOpenPath((prev) => {
      if (prev[level] === i) return prev.slice(0, level)
      const next = prev.slice(0, level)
      next[level] = i
      return next
    })

  const getMicro = (key) => microPage[key] || 1
  const setMicro = (key, value, count) =>
    setMicroPage((p) => ({ ...p, [key]: Math.min(Math.max(1, value), count) }))

  const { widths, startResize } = useColumnResize(defaultWidths)
  const { columns, dataColumns } = useColumnVisibility('row-grouping', allColumns)
  const minWidth = columns.reduce((sum, col) => sum + widths[col.key], 0)

  const tree = useMemo(() => buildGroupTree(flatMembers, DEFAULT_ORDER), [])

  const topTotal = tree.children.length
  const topPageCount = Math.max(1, Math.ceil(topTotal / pageSize))
  const currentPage = Math.min(page, topPageCount)
  const startG = (currentPage - 1) * pageSize
  const endG = Math.min(startG + pageSize, topTotal)
  const goToMain = (p) => setPage(Math.min(Math.max(1, p), topPageCount))

  // Render the children of an open node: nested group/leaf rows for
  // `childLevel`, followed by that level's sticky micro pager.
  const renderChildren = (childLevel, parentPath, parentKey) => {
    const parentNode = treeNodeAt(tree, parentPath)
    const isLeaf = parentNode.isLeaf
    const items = isLeaf ? parentNode.members : parentNode.children
    const total = items.length
    const micro = getMicro(parentKey)
    const pageCount = Math.max(1, Math.ceil(total / MICRO_PAGE_SIZE))
    const s = (micro - 1) * MICRO_PAGE_SIZE
    const e = Math.min(s + MICRO_PAGE_SIZE, total)
    const indent = 12 + INDENT_STEP * childLevel

    const rows = []
    for (let i = s; i < e; i += 1) {
      const path = [...parentPath, i]
      if (isLeaf) {
        const item = items[i]
        rows.push(
          <tr
            className={`dt-row ${i % 2 === 1 ? 'dt-row--alt' : ''}`}
            key={item.id}
          >
            <td className="dt-cell dt-cell--group-spacer" style={{ paddingLeft: indent }} />
            {dataColumns.map((col) => (
              <td key={col.key} className="dt-cell">
                <TruncatingCell text={item[col.key]} />
              </td>
            ))}
          </tr>,
        )
      } else {
        const entry = items[i]
        const open = openPath[childLevel] === i
        rows.push(
          <tr className="dt-group-row" data-level={childLevel} key={`g-${path.join('-')}`}>
            <td className="dt-group-cell">
              <div className="dt-group-inner" style={{ paddingLeft: indent }}>
                <button type="button" className="dt-group-toggle"
                  aria-expanded={open}
                  aria-label={open ? 'Collapse group' : 'Expand group'}
                  onClick={() => toggleAt(childLevel, i)}>
                  <span className={`dt-group-chevron ${open ? 'is-open' : ''}`}><ChevronRight /></span>
                </button>
                <TruncatingCell text={entry.label} className="dt-strong" />
                <span className="dt-group-count">{entry.count}</span>
              </div>
            </td>
            {dataColumns.map((col) => (
              <td key={col.key} className="dt-cell dt-cell--muted" />
            ))}
          </tr>,
        )
        if (open) {
          rows.push(
            <Fragment key={`c-${path.join('-')}`}>
              {renderChildren(childLevel + 1, path, path.join('-'))}
            </Fragment>,
          )
        }
      }
    }

    // Sticky micro pager for this level's children. Position is a multiple of
    // the row height so deeper pagers stack above shallower ones.
    if (pageCount > 1) {
      rows.push(
        <tr className="dt-micro-row" key={`m-${parentKey}`}>
          <td
            className={`dt-micro-cell dt-micro-tone-${childLevel}`}
            colSpan={columns.length}
            style={{ bottom: (childLevel - 1) * MICRO_ROW_H, zIndex: GROUP_LEVEL_COUNT - childLevel + 2 }}
          >
            <div className="dt-micro-indent" style={{ paddingLeft: indent }}>
              <MicroPagination
                label={isLeaf ? 'Members' : `${levelName(childLevel)}s`}
                page={micro}
                pageCount={pageCount}
                total={total}
                summaryWidth={Math.max(80, widths.group - indent)}
                onGoTo={(p) => setMicro(parentKey, p, pageCount)}
              />
            </div>
          </td>
        </tr>,
      )
    }

    return rows
  }

  return (
    <ScenarioShell
      fill
      title="Row Grouping — Stacked Micro Pagination"
      description="Fixed-height table with sticky header and stacked sticky micro-pagination — one tonal step darker per level across the full 5-level hierarchy."
      groupBy={groupByDims}
      columns={allColumns}
      tableId="row-grouping"
    >
      <div className="dt-table dt-table--fill">
        <div className="dt-columns">
          <table className="dt-grid dt-grid--pin" style={{ width: '100%', minWidth: `${minWidth}px` }}>
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
                const entry = tree.children[gi]
                const gOpen = openPath[0] === gi
                return (
                  <Fragment key={`g${gi}`}>
                    <tr className="dt-group-row" data-level="0">
                      <td className="dt-group-cell">
                        <div className="dt-group-inner" style={{ paddingLeft: 12 }}>
                          <button type="button" className="dt-group-toggle"
                            aria-expanded={gOpen}
                            aria-label={gOpen ? 'Collapse group' : 'Expand group'}
                            onClick={() => toggleAt(0, gi)}>
                            <span className={`dt-group-chevron ${gOpen ? 'is-open' : ''}`}><ChevronRight /></span>
                          </button>
                          <TruncatingCell text={entry.label} className="dt-strong" />
                          <span className="dt-group-count">{entry.count}</span>
                        </div>
                      </td>
                      {dataColumns.map((col) => (
                        <td key={col.key} className="dt-cell dt-cell--muted" />
                      ))}
                    </tr>
                    {gOpen && renderChildren(1, [gi], `g${gi}`)}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>

        {topPageCount > 1 && (
        <div className="dt-footer">
          <div className="dt-page-size">
            <span className="dt-page-size-label">Groups per page</span>
            <div className="dt-select">
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
              >
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
        )}
      </div>
    </ScenarioShell>
  )
}
