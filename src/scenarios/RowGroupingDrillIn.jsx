import { Fragment, useMemo, useState } from 'react'
import ScenarioShell from '../components/ScenarioShell.jsx'
import {
  ChevronDown, ChevronLeft, ChevronRight, PageFirst, PageLast,
  TruncatingCell, useColumnResize, useColumnVisibility, ColGroup, GridHead,
} from '../components/tableKit.jsx'
import {
  columns as allColumns, defaultWidths, PAGE_SIZES,
  flatMembers, buildGroupTree, DEFAULT_ORDER, treeNodeAt, treeLabelsAt,
  levelName, groupByDims,
} from '../components/groupingModel.js'

// ---------------------------------------------------------------------------
// Variant: Drill-in navigation
// Only one level is on screen at a time. Clicking a group navigates INTO it
// (breadcrumb tracks the path), so a single pager is ever needed — no nesting.
// Generalized to the shared 5-level hierarchy (Region › Business unit › Team ›
// Role › Member).
// ---------------------------------------------------------------------------
export default function RowGroupingDrillIn() {
  const [sort, setSort] = useState({ key: null, dir: 'asc' })
  const [openFilters, setOpenFilters] = useState({})
  const [filters, setFilters] = useState({})
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const { widths, startResize } = useColumnResize(defaultWidths)
  const { columns, dataColumns } = useColumnVisibility('row-grouping-drill-in', allColumns)
  const minWidth = columns.reduce((sum, col) => sum + widths[col.key], 0)

  const tree = useMemo(() => buildGroupTree(flatMembers, DEFAULT_ORDER), [])

  // Navigation path: [] = top groups, [i0, i1, …] = nested groups / leaf.
  const [path, setPath] = useState([])
  const level = path.length
  const node = treeNodeAt(tree, path)
  const labels = treeLabelsAt(tree, path)
  const isLeaf = node.isLeaf
  const items = isLeaf ? node.members : node.children

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

  const total = items.length
  const groupColLabel = levelName(level)
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, pageCount)
  const start = (currentPage - 1) * pageSize
  const end = Math.min(start + pageSize, total)
  const goToMain = (p) => setPage(Math.min(Math.max(1, p), pageCount))

  const columnsForLevel = columns.map((c) =>
    c.key === 'group' ? { ...c, label: groupColLabel } : c,
  )

  return (
    <ScenarioShell
      fill
      title="Row Grouping — Drill In"
      description="Click a group to navigate into it. One level, one pager — no nested pagination."
      groupBy={groupByDims}
      columns={allColumns}
      tableId="row-grouping-drill-in"
    >
      <div className="dt-breadcrumb">
        <button
          type="button"
          className={`dt-crumb ${level === 0 ? 'is-current' : ''}`}
          disabled={level === 0}
          onClick={() => navigate([])}
        >
          All groups
        </button>
        {path.map((idx, i) => {
          const crumbCurrent = i === level - 1
          return (
            <Fragment key={`${i}-${idx}`}>
              <span className="dt-crumb-sep"><ChevronRight /></span>
              <button
                type="button"
                className={`dt-crumb ${crumbCurrent ? 'is-current' : ''}`}
                disabled={crumbCurrent}
                onClick={() => navigate(path.slice(0, i + 1))}
              >
                {labels[i]}
              </button>
            </Fragment>
          )
        })}
      </div>

      <div className="dt-table dt-table--fill">
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
                  const item = node.members[i]
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

                const childNode = node.children[i]
                const label = childNode.label
                const childCount = childNode.count
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

        {pageCount > 1 && (
        <div className="dt-footer">
          <div className="dt-page-size">
            <span className="dt-page-size-label">{groupColLabel}s per page</span>
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
        )}
      </div>
    </ScenarioShell>
  )
}
