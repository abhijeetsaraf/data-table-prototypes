import { Fragment, useState } from 'react'
import { Link } from 'react-router-dom'

// ---------------------------------------------------------------------------
// Variant: Header-anchored pager (Option 2)
// Each group's pagination lives inline on its header row (right-aligned) and
// only appears when the group is expanded. No stacked bottom bars.
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
const MICRO_PAGE_SIZE = 10
const INDENT_STEP = 24

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

// ---------------------------------------------------------------------------
// Inline pager anchored to a group header row.
// ---------------------------------------------------------------------------
function HeaderPager({ density, label, page, pageCount, total, onGoTo }) {
  const start = (page - 1) * MICRO_PAGE_SIZE + 1
  const end = Math.min(page * MICRO_PAGE_SIZE, total)
  return (
    <div className={`dt-pager-inline dt-pager-${density}`}>
      <span className="dt-pager-summary">
        {label} {start}–{end} of {total}
      </span>
      <button type="button" className="dt-page-btn" aria-label="First page" disabled={page === 1} onClick={() => onGoTo(1)}>
        <PageFirst />
      </button>
      <button type="button" className="dt-page-btn" aria-label="Previous page" disabled={page === 1} onClick={() => onGoTo(page - 1)}>
        <ChevronLeft />
      </button>
      <span className="dt-pager-page">{page} / {pageCount}</span>
      <button type="button" className="dt-page-btn" aria-label="Next page" disabled={page === pageCount} onClick={() => onGoTo(page + 1)}>
        <ChevronRight />
      </button>
      <button type="button" className="dt-page-btn" aria-label="Last page" disabled={page === pageCount} onClick={() => onGoTo(pageCount)}>
        <PageLast />
      </button>
    </div>
  )
}

const PAGE_SIZES = [10, 20, 50]

export default function RowGroupingHeaderPager() {
  const [sort, setSort] = useState({ key: null, dir: 'asc' })
  const [openFilters, setOpenFilters] = useState({})
  const [filters, setFilters] = useState({})
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  // Single-open: one top group and one sub-group open at a time.
  const [openGroup, setOpenGroup] = useState(null)
  const [openSub, setOpenSub] = useState(null)
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
    setOpenSub(null)
  }
  const toggleSubgroup = (si) => setOpenSub((prev) => (prev === si ? null : si))
  const getMicro = (key) => microPage[key] || 1
  const setMicro = (key, value, count) =>
    setMicroPage((p) => ({ ...p, [key]: Math.min(Math.max(1, value), count) }))

  const topPageCount = Math.max(1, Math.ceil(TOP_GROUPS / pageSize))
  const currentPage = Math.min(page, topPageCount)
  const startG = (currentPage - 1) * pageSize
  const endG = Math.min(startG + pageSize, TOP_GROUPS)
  const goToMain = (p) => setPage(Math.min(Math.max(1, p), topPageCount))
  const anyFilterOpen = dataColumns.some((col) => openFilters[col.key])
  const subMicroCount = Math.max(1, Math.ceil(SUBGROUPS / MICRO_PAGE_SIZE))
  const leafMicroCount = Math.max(1, Math.ceil(LEAF_ITEMS / MICRO_PAGE_SIZE))

  return (
    <main className="dt-scenario dt-scenario--fill">
      <div className="dt-topbar">
        <Link to="/" className="back-link">← Back</Link>
        <h1 className="dt-title">Row Grouping — Header Pager</h1>
        <p className="dt-subtitle">
          Each group's pagination is anchored to its header row (revealed on
          expand), so pagers never stack.
        </p>
        <div className="dt-groupby">
          <span className="dt-groupby-label">Grouped by</span>
          <span className="dt-groupby-chip">Team</span>
          <span className="dt-groupby-arrow">→</span>
          <span className="dt-groupby-chip">Role</span>
        </div>
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
                {columns.map((col) => {
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
                  {columns.map((col) => (
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
              {Array.from({ length: endG - startG }, (_, idx) => {
                const gi = startG + idx
                const gKey = `g${gi}`
                const gOpen = openGroup === gi
                const gMicro = getMicro(gKey)
                const subStart = (gMicro - 1) * MICRO_PAGE_SIZE
                const subEnd = Math.min(subStart + MICRO_PAGE_SIZE, SUBGROUPS)

                return (
                  <Fragment key={gKey}>
                    <tr className="dt-group-row" data-level="0">
                      <td className="dt-group-cell" colSpan={columns.length}>
                        <div className="dt-group-header" style={{ paddingLeft: 12 }}>
                          <button type="button" className="dt-group-toggle-row"
                            aria-expanded={gOpen} onClick={() => toggleGroup(gi)}>
                            <span className={`dt-group-chevron ${gOpen ? 'is-open' : ''}`}><ChevronRight /></span>
                            <span className="dt-group-value">{topLabel(gi)}</span>
                            <span className="dt-group-count">{SUBGROUPS}</span>
                          </button>
                          {gOpen && (
                            <HeaderPager density="sm" label="Sub-groups" page={gMicro}
                              pageCount={subMicroCount} total={SUBGROUPS}
                              onGoTo={(p) => setMicro(gKey, p, subMicroCount)} />
                          )}
                        </div>
                      </td>
                    </tr>

                    {gOpen &&
                      Array.from({ length: subEnd - subStart }, (_, sidx) => {
                        const si = subStart + sidx
                        const sKey = `${gKey}-s${si}`
                        const sOpen = openSub === si
                        const sMicro = getMicro(sKey)
                        const itStart = (sMicro - 1) * MICRO_PAGE_SIZE
                        const itEnd = Math.min(itStart + MICRO_PAGE_SIZE, LEAF_ITEMS)

                        return (
                          <Fragment key={sKey}>
                            <tr className="dt-group-row" data-level="1">
                              <td className="dt-group-cell" colSpan={columns.length}>
                                <div className="dt-group-header" style={{ paddingLeft: 12 + INDENT_STEP }}>
                                  <button type="button" className="dt-group-toggle-row"
                                    aria-expanded={sOpen} onClick={() => toggleSubgroup(si)}>
                                    <span className={`dt-group-chevron ${sOpen ? 'is-open' : ''}`}><ChevronRight /></span>
                                    <span className="dt-group-value">{subLabel(si)}</span>
                                    <span className="dt-group-count">{LEAF_ITEMS}</span>
                                  </button>
                                  {sOpen && (
                                    <HeaderPager density="xs" label="Items" page={sMicro}
                                      pageCount={leafMicroCount} total={LEAF_ITEMS}
                                      onGoTo={(p) => setMicro(sKey, p, leafMicroCount)} />
                                  )}
                                </div>
                              </td>
                            </tr>

                            {sOpen &&
                              Array.from({ length: itEnd - itStart }, (_, iidx) => {
                                const ii = itStart + iidx
                                const item = leafItem(gi, si, ii)
                                return (
                                  <tr className="dt-row" key={item.id}>
                                    <td className="dt-cell dt-cell--group-spacer" style={{ paddingLeft: 12 + INDENT_STEP * 2 }} />
                                    {dataColumns.map((col) => (
                                      <td key={col.key} className="dt-cell">
                                        <span className="dt-cell-text">{item[col.key]}</span>
                                      </td>
                                    ))}
                                  </tr>
                                )
                              })}
                          </Fragment>
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
    </main>
  )
}
