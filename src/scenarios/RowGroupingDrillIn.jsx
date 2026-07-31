import { useState } from 'react'
import { Link } from 'react-router-dom'

// ---------------------------------------------------------------------------
// Variant: Drill-in navigation (Point 5)
// Only one level is on screen at a time. Clicking a group navigates INTO it
// (breadcrumb tracks the path), so a single pager is ever needed — no nesting.
// ---------------------------------------------------------------------------
const GROUP_COL_WIDTH = 320

const columns = [
  { key: 'group', label: 'Group' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'status', label: 'Status' },
  { key: 'lastActive', label: 'Last active' },
]
const dataColumns = columns.slice(1)

const TOP_GROUPS = 30
const SUBGROUPS = 30
const LEAF_ITEMS = 50

const orgs = [
  'Growth', 'Platform', 'Design', 'Sales', 'Support', 'Data', 'Revenue',
  'Success', 'Ops', 'Research',
]
const subDims = ['Admin', 'Editor', 'Viewer', 'Manager', 'Analyst', 'Owner']
const firstNames = [
  'Ava', 'Liam', 'Noah', 'Emma', 'Olivia', 'Mia', 'Ethan', 'Sophia', 'Lucas',
  'Isla', 'Mason', 'Aria', 'Leo', 'Zoe', 'Ella', 'Kai', 'Nora', 'Owen',
  'Ruby', 'Finn', 'Maya', 'Jack', 'Iris', 'Theo',
]
const lastNames = [
  'Carter', 'Reed', 'Bishop', 'Nguyen', 'Patel', 'Ortiz', 'Walsh', 'Sato',
  'Klein', 'Moore', 'Ibarra', 'Frost', 'Diaz', 'Okoro', 'Lund', 'Ali',
]
const statuses = ['Active', 'Invited', 'Suspended', 'Pending']
const lastActive = [
  'Just now', '2h ago', '5h ago', '1d ago', '3d ago', '1w ago', '2w ago',
]

const topLabel = (gi) => `${orgs[gi % orgs.length]} ${Math.floor(gi / orgs.length) + 1}`
const subLabel = (si) => `${subDims[si % subDims.length]} ${Math.floor(si / subDims.length) + 1}`

function leafItem(gi, si, ii) {
  const first = firstNames[(gi * 13 + si * 7 + ii) % firstNames.length]
  const last = lastNames[(ii * 5 + si * 3) % lastNames.length]
  return {
    id: `${gi}-${si}-${ii}`,
    name: `${first} ${last}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@highspot.com`,
    status: statuses[(gi + si + ii) % statuses.length],
    lastActive: lastActive[(ii * 3 + si) % lastActive.length],
  }
}

// --- Icons ---
function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 4h12M4.5 8h7M6.5 12h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
function ArrowIcon({ direction }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"
      style={{ transform: direction === 'asc' ? 'rotate(180deg)' : 'none' }}>
      <path d="M8 3v9m0 0 3.5-3.5M8 12 4.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function ChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 4.5 6 8.5l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M10 3 6 8l4 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6 3l4 5-4 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function PageFirst() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 3v10M12 3 8 8l4 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function PageLast() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M12 3v10M4 3l4 5-4 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const PAGE_SIZES = [10, 20, 50]

export default function RowGroupingDrillIn() {
  const [sort, setSort] = useState({ key: null, dir: 'asc' })
  const [openFilters, setOpenFilters] = useState({})
  const [filters, setFilters] = useState({})
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)

  // Navigation path: [] = groups, [gi] = sub-groups, [gi, si] = items.
  const [path, setPath] = useState([])
  const level = path.length

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

  const total = level === 0 ? TOP_GROUPS : level === 1 ? SUBGROUPS : LEAF_ITEMS
  const groupColLabel = level === 0 ? 'Group' : level === 1 ? 'Sub-group' : 'Group'
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, pageCount)
  const start = (currentPage - 1) * pageSize
  const end = Math.min(start + pageSize, total)
  const goToMain = (p) => setPage(Math.min(Math.max(1, p), pageCount))
  const anyFilterOpen = dataColumns.some((col) => openFilters[col.key])

  const columnsForLevel = columns.map((c) =>
    c.key === 'group' ? { ...c, label: groupColLabel } : c,
  )

  return (
    <main className="dt-scenario dt-scenario--fill">
      <div className="dt-topbar">
        <Link to="/" className="back-link">← Back</Link>
        <h1 className="dt-title">Row Grouping — Drill In</h1>
        <p className="dt-subtitle">
          Click a group to navigate into it. One level, one pager — no nested
          pagination.
        </p>
        <div className="dt-groupby">
          <span className="dt-groupby-label">Grouped by</span>
          <span className="dt-groupby-chip">Team</span>
          <span className="dt-groupby-arrow">→</span>
          <span className="dt-groupby-chip">Role</span>
        </div>
      </div>

      <div className="dt-breadcrumb">
        <button
          type="button"
          className={`dt-crumb ${level === 0 ? 'is-current' : ''}`}
          disabled={level === 0}
          onClick={() => navigate([])}
        >
          All groups
        </button>
        {level >= 1 && (
          <>
            <span className="dt-crumb-sep"><ChevronRight /></span>
            <button
              type="button"
              className={`dt-crumb ${level === 1 ? 'is-current' : ''}`}
              disabled={level === 1}
              onClick={() => navigate([path[0]])}
            >
              {topLabel(path[0])}
            </button>
          </>
        )}
        {level >= 2 && (
          <>
            <span className="dt-crumb-sep"><ChevronRight /></span>
            <span className="dt-crumb is-current">{subLabel(path[1])}</span>
          </>
        )}
      </div>

      <div className="dt-table dt-table--fill">
        <div className="dt-columns">
          <table className="dt-grid">
            <colgroup>
              <col style={{ width: `${GROUP_COL_WIDTH}px` }} />
              {dataColumns.map((col) => (
                <col key={col.key} style={{ width: `calc((100% - ${GROUP_COL_WIDTH}px) / ${dataColumns.length})` }} />
              ))}
            </colgroup>
            <thead>
              <tr className="dt-header-row">
                {columnsForLevel.map((col) => {
                  if (col.key === 'group') {
                    return (
                      <th key={col.key} className="dt-header dt-header--group">
                        <span className="dt-header-content">{col.label}</span>
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
                          <button type="button"
                            className={`dt-filter-toggle ${isFilterOpen || filters[col.key] ? 'is-active' : ''}`}
                            aria-label={`Filter ${col.label}`} aria-pressed={isFilterOpen}
                            onClick={() => toggleFilter(col.key)}>
                            <FilterIcon />
                          </button>
                          <span className="dt-divider" />
                        </div>
                      </div>
                    </th>
                  )
                })}
              </tr>
              {anyFilterOpen && (
                <tr className="dt-filter-row">
                  {columnsForLevel.map((col) => (
                    <th key={col.key} className="dt-filter-cell">
                      {col.key !== 'group' && openFilters[col.key] && (
                        <input className="dt-filter-input" type="text" placeholder={`Filter ${col.label}…`}
                          value={filters[col.key] || ''}
                          onChange={(e) => setFilters((p) => ({ ...p, [col.key]: e.target.value }))} />
                      )}
                    </th>
                  ))}
                </tr>
              )}
            </thead>
            <tbody>
              {Array.from({ length: end - start }, (_, idx) => {
                const i = start + idx

                if (level === 2) {
                  const item = leafItem(path[0], path[1], i)
                  return (
                    <tr className="dt-row" key={item.id}>
                      <td className="dt-cell dt-cell--group-spacer" style={{ paddingLeft: 12 }} />
                      {dataColumns.map((col) => (
                        <td key={col.key} className="dt-cell"><span className="dt-cell-text">{item[col.key]}</span></td>
                      ))}
                    </tr>
                  )
                }

                const label = level === 0 ? topLabel(i) : subLabel(i)
                const childCount = level === 0 ? SUBGROUPS : LEAF_ITEMS
                const onOpen = () =>
                  navigate(level === 0 ? [i] : [path[0], i])

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
                        <span className="dt-group-value">{label}</span>
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

        <div className="dt-footer">
          <div className="dt-page-size">
            <span className="dt-page-size-label">
              {level === 0 ? 'Groups' : level === 1 ? 'Sub-groups' : 'Items'} per page
            </span>
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
    </main>
  )
}
