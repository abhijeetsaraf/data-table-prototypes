import { Fragment, useState } from 'react'
import ScenarioShell from '../components/ScenarioShell.jsx'
import {
  ChevronDown, ChevronLeft, ChevronRight, PageFirst, PageLast, CloseIcon,
  TruncatingCell, useColumnResize, useColumnVisibility, ColGroup, GridHead,
} from '../components/tableKit.jsx'
import {
  columns as allColumns, defaultWidths, PAGE_SIZES,
  GROUP_LEVEL_COUNT, levelLabel, levelName, levelTotal, childCountAt,
  leafItem, groupByDims,
} from '../components/groupingModel.js'

// ---------------------------------------------------------------------------
// Variant: Header Pager + Drill In (combination)
// Clicking a row drills one level deeper. The current path lives in a single
// "row header" split-button, and the level's pager is appended to that same
// bar — so only ONE pager is ever on screen. Generalized to the shared
// 5-level hierarchy.
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

export default function RowGroupingHeaderPagerDrillIn() {
  const [sort, setSort] = useState({ key: null, dir: 'asc' })
  const [openFilters, setOpenFilters] = useState({})
  const [filters, setFilters] = useState({})
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const { widths, startResize } = useColumnResize(defaultWidths)
  const { columns, dataColumns } = useColumnVisibility('row-grouping-header-pager-drill-in', allColumns)
  const minWidth = columns.reduce((sum, col) => sum + widths[col.key], 0)

  // Navigation path: [] = top groups, [i0, i1, …] = nested groups / leaf.
  const [path, setPath] = useState([])
  const level = path.length
  const isLeaf = level === GROUP_LEVEL_COUNT

  const navigate = (nextPath) => {
    setPath(nextPath)
    setPage(1)
  }

  const toggleSort = (key) =>
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: 'asc' }
      if (prev.dir === 'asc') return { key, dir: 'desc' }
      return { key: null, dir: 'asc' }
    })
  const toggleFilter = (key) => setOpenFilters((p) => ({ ...p, [key]: !p[key] }))

  const total = levelTotal(level)
  const groupColLabel = levelName(level)
  const levelLabelText = `${groupColLabel}s`
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, pageCount)
  const start = (currentPage - 1) * pageSize
  const end = Math.min(start + pageSize, total)
  const goToLevel = (p) => setPage(Math.min(Math.max(1, p), pageCount))

  const columnsForLevel = columns.map((c) =>
    c.key === 'group' ? { ...c, label: groupColLabel } : c,
  )

  return (
    <ScenarioShell
      fill
      title="Row Grouping — Header Pager + Drill In"
      description="Drill into a group; the path lives in a split-button row header with the level's pager appended, so only one pager is ever shown."
      groupBy={groupByDims}
      columns={allColumns}
      tableId="row-grouping-header-pager-drill-in"
    >
      <div className="dt-table dt-table--fill">
        {/* Row header: split-button breadcrumb (left) + appended header pager (right) */}
        <div className="dt-drillbar">
          <div className="dt-drillbar-start">
            {level === 0 ? (
              <span className="dt-drillbar-root">All groups</span>
            ) : (
              <div className="dt-split" role="group" aria-label="Current path">
                <div className="dt-split-main">
                  {path.map((idx, i) => {
                    const isLast = i === level - 1
                    return (
                      <Fragment key={`${i}-${idx}`}>
                        {i > 0 && (
                          <span className="dt-split-sep"><ChevronRight /></span>
                        )}
                        <button
                          type="button"
                          className={`dt-split-crumb ${isLast ? 'is-current' : ''}`}
                          disabled={isLast}
                          onClick={() => navigate(path.slice(0, i + 1))}
                        >
                          {levelLabel(i, idx)}
                        </button>
                      </Fragment>
                    )
                  })}
                </div>
                <span className="dt-split-divider" />
                <button
                  type="button"
                  className="dt-split-close"
                  aria-label="Go up one level"
                  title="Go up one level"
                  onClick={() => navigate(path.slice(0, level - 1))}
                >
                  <CloseIcon />
                </button>
              </div>
            )}
          </div>

          <div className="dt-drillbar-end">
            <div className="dt-page-size">
              <span className="dt-page-size-label">{levelLabelText} per page</span>
              <div className="dt-select">
                <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}>
                  {PAGE_SIZES.map((size) => (<option key={size} value={size}>{size}</option>))}
                </select>
                <span className="dt-select-chevron"><ChevronDown /></span>
              </div>
            </div>
            <HeaderPager label={levelLabelText} page={currentPage} pageCount={pageCount}
              total={total} pageSize={pageSize} onGoTo={goToLevel} />
          </div>
        </div>

        <div className="dt-columns">
          <table className="dt-grid dt-grid--pin" style={{ width: '100%', minWidth: `${minWidth}px` }}>
            <ColGroup columns={columnsForLevel} widths={widths} />
            <GridHead
              columns={columnsForLevel}
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
              {Array.from({ length: end - start }, (_, idx) => {
                const i = start + idx

                if (isLeaf) {
                  const item = leafItem(path, i)
                  return (
                    <tr
                      className={`dt-row ${i % 2 === 1 ? 'dt-row--alt' : ''}`}
                      key={item.id}
                    >
                      <td className="dt-cell dt-cell--group-spacer" style={{ paddingLeft: 12 }} />
                      {dataColumns.map((col) => (
                        <td key={col.key} className="dt-cell">
                          <TruncatingCell text={item[col.key]} />
                        </td>
                      ))}
                    </tr>
                  )
                }

                const label = levelLabel(level, i)
                const childCount = childCountAt(level)
                const onOpen = () => navigate([...path, i])

                return (
                  <tr
                    className="dt-row dt-drill-row"
                    key={`d${level}-${i}`}
                    role="button"
                    tabIndex={0}
                    onClick={onOpen}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onOpen()
                      }
                    }}
                  >
                    <td className="dt-cell">
                      <div className="dt-drill-name" style={{ paddingLeft: 12 }}>
                        <TruncatingCell text={label} className="dt-strong" />
                        <span className="dt-group-count">{childCount}</span>
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
            </tbody>
          </table>
        </div>
      </div>
    </ScenarioShell>
  )
}
