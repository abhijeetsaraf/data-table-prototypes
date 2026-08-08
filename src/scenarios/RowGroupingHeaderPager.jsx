import { Fragment, useState } from 'react'
import ScenarioShell from '../components/ScenarioShell.jsx'
import {
  ChevronDown, ChevronLeft, ChevronRight, PageFirst, PageLast,
  TruncatingCell, useColumnResize, useColumnVisibility, ColGroup, GridHead,
} from '../components/tableKit.jsx'
import {
  columns as allColumns, defaultWidths, PAGE_SIZES, MICRO_PAGE_SIZE, INDENT_STEP,
  GROUP_LEVEL_COUNT, levelLabel, levelName, levelTotal, leafItem, groupByDims,
} from '../components/groupingModel.js'

// ---------------------------------------------------------------------------
// Variant: Header-anchored pager
// Each group's pagination lives inline on its header row (right-aligned) and
// only appears when the group is expanded. No stacked bottom bars. Single-open
// per level across the full 5-level hierarchy.
// ---------------------------------------------------------------------------
function HeaderPager({ density, label, page, pageCount, total, onGoTo }) {
  const start = (page - 1) * MICRO_PAGE_SIZE + 1
  const end = Math.min(page * MICRO_PAGE_SIZE, total)
  return (
    <div className={`dt-pager-inline dt-pager-${density}`}>
      <span className="dt-pager-summary">{label} {start}–{end} of {total}</span>
      <button type="button" className="dt-page-btn" aria-label="First page" disabled={page === 1} onClick={() => onGoTo(1)}><PageFirst /></button>
      <button type="button" className="dt-page-btn" aria-label="Previous page" disabled={page === 1} onClick={() => onGoTo(page - 1)}><ChevronLeft /></button>
      <span className="dt-pager-page">{page} / {pageCount}</span>
      <button type="button" className="dt-page-btn" aria-label="Next page" disabled={page === pageCount} onClick={() => onGoTo(page + 1)}><ChevronRight /></button>
      <button type="button" className="dt-page-btn" aria-label="Last page" disabled={page === pageCount} onClick={() => onGoTo(pageCount)}><PageLast /></button>
    </div>
  )
}

export default function RowGroupingHeaderPager() {
  const [sort, setSort] = useState({ key: null, dir: 'asc' })
  const [openFilters, setOpenFilters] = useState({})
  const [filters, setFilters] = useState({})
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const { widths, startResize } = useColumnResize(defaultWidths)
  const { columns, dataColumns } = useColumnVisibility('row-grouping-header-pager', allColumns)
  const minWidth = columns.reduce((sum, col) => sum + widths[col.key], 0)

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

  const topTotal = levelTotal(0)
  const topPageCount = Math.max(1, Math.ceil(topTotal / pageSize))
  const currentPage = Math.min(page, topPageCount)
  const startG = (currentPage - 1) * pageSize
  const endG = Math.min(startG + pageSize, topTotal)
  const goToMain = (p) => setPage(Math.min(Math.max(1, p), topPageCount))

  // Recursively render a group node (its header row + expanded children).
  const renderGroupNode = (level, path) => {
    const gi = path[level]
    const key = path.join('-')
    const open = openPath[level] === gi
    const childLevel = level + 1
    const childIsLeaf = childLevel === GROUP_LEVEL_COUNT
    const childTotal = levelTotal(childLevel)
    const micro = getMicro(key)
    const pageCount = Math.max(1, Math.ceil(childTotal / MICRO_PAGE_SIZE))
    const s = (micro - 1) * MICRO_PAGE_SIZE
    const e = Math.min(s + MICRO_PAGE_SIZE, childTotal)
    const density = childLevel >= 3 ? 'xs' : 'sm'

    const rows = [
      <tr className="dt-group-row" data-level={level} key={`h-${key}`}>
        <td className="dt-group-cell" colSpan={columns.length}>
          <div className="dt-group-header" style={{ paddingLeft: 12 + INDENT_STEP * level }}>
            <button type="button" className="dt-group-toggle-row"
              aria-expanded={open} onClick={() => toggleAt(level, gi)}>
              <span className={`dt-group-chevron ${open ? 'is-open' : ''}`}><ChevronRight /></span>
              <TruncatingCell text={levelLabel(level, gi)} className="dt-strong" />
              <span className="dt-group-count">{childTotal}</span>
            </button>
            {open && (
              <HeaderPager density={density} label={`${levelName(childLevel)}s`} page={micro}
                pageCount={pageCount} total={childTotal}
                onGoTo={(p) => setMicro(key, p, pageCount)} />
            )}
          </div>
        </td>
      </tr>,
    ]

    if (open) {
      for (let i = s; i < e; i += 1) {
        const childPath = [...path, i]
        if (childIsLeaf) {
          const item = leafItem(path, i)
          rows.push(
            <tr
              className={`dt-row ${i % 2 === 1 ? 'dt-row--alt' : ''}`}
              key={item.id}
            >
              <td className="dt-cell dt-cell--group-spacer" style={{ paddingLeft: 12 + INDENT_STEP * childLevel }} />
              {dataColumns.map((col) => (
                <td key={col.key} className="dt-cell">
                  <TruncatingCell text={item[col.key]} />
                </td>
              ))}
            </tr>,
          )
        } else {
          rows.push(<Fragment key={`n-${childPath.join('-')}`}>{renderGroupNode(childLevel, childPath)}</Fragment>)
        }
      }
    }

    return rows
  }

  return (
    <ScenarioShell
      fill
      title="Row Grouping — Header Pager"
      description="Each group's pagination is anchored to its header row (revealed on expand), so pagers never stack — across the full 5-level hierarchy."
      groupBy={groupByDims}
      columns={allColumns}
      tableId="row-grouping-header-pager"
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
                return (
                  <Fragment key={`g${gi}`}>{renderGroupNode(0, [gi])}</Fragment>
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
