import { useMemo, useState } from 'react'
import ScenarioShell from '../components/ScenarioShell.jsx'
import { useColumnVisibility } from '../components/tableKit.jsx'

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------
const allColumns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'team', label: 'Team' },
  { key: 'status', label: 'Status' },
]

// ---------------------------------------------------------------------------
// Dummy data
// ---------------------------------------------------------------------------
const firstNames = [
  'Ava', 'Liam', 'Noah', 'Emma', 'Olivia', 'Mia', 'Ethan', 'Sophia', 'Lucas',
  'Isla', 'Mason', 'Aria', 'Leo', 'Zoe', 'Ella', 'Kai', 'Nora', 'Owen',
  'Ruby', 'Finn', 'Maya', 'Jack', 'Iris', 'Theo',
]
const lastNames = [
  'Carter', 'Reed', 'Bishop', 'Nguyen', 'Patel', 'Ortiz', 'Walsh', 'Sato',
  'Klein', 'Moore', 'Ibarra', 'Frost', 'Diaz', 'Okoro', 'Lund', 'Ali',
]
const roles = ['Admin', 'Editor', 'Viewer', 'Manager', 'Analyst', 'Owner']
const teams = ['Growth', 'Platform', 'Design', 'Sales', 'Support', 'Data']
const statuses = ['Active', 'Invited', 'Suspended', 'Pending']

const data = Array.from({ length: 47 }, (_, i) => {
  const first = firstNames[i % firstNames.length]
  const last = lastNames[(i * 7) % lastNames.length]
  return {
    id: i + 1,
    name: `${first} ${last}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@highspot.com`,
    role: roles[(i * 3) % roles.length],
    team: teams[(i * 5) % teams.length],
    status: statuses[(i * 2) % statuses.length],
  }
})

// ---------------------------------------------------------------------------
// Icons (Polar UI style, 16px)
// ---------------------------------------------------------------------------
function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2 4h12M4.5 8h7M6.5 12h3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ArrowIcon({ direction }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      style={{ transform: direction === 'asc' ? 'rotate(180deg)' : 'none' }}
    >
      <path
        d="M8 3v9m0 0 3.5-3.5M8 12 4.5 8.5"
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

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M10 3 6 8l4 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M6 3l4 5-4 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PageFirst() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M4 3v10M12 3 8 8l4 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PageLast() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M12 3v10M4 3l4 5-4 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const PAGE_SIZES = [10, 20, 50]

export default function BasicTable() {
  const [sort, setSort] = useState({ key: null, dir: 'asc' })
  const [openFilters, setOpenFilters] = useState({})
  const [filters, setFilters] = useState({})
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const { columns } = useColumnVisibility('basic-table', allColumns)

  const toggleSort = (key) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: 'asc' }
      if (prev.dir === 'asc') return { key, dir: 'desc' }
      return { key: null, dir: 'asc' }
    })
  }

  const toggleFilter = (key) => {
    setOpenFilters((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const setFilterValue = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const filtered = useMemo(() => {
    return data.filter((row) =>
      columns.every((col) => {
        const term = (filters[col.key] || '').trim().toLowerCase()
        if (!term) return true
        return String(row[col.key]).toLowerCase().includes(term)
      }),
    )
  }, [filters, columns])

  const sorted = useMemo(() => {
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
  }, [filtered, sort])

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pageRows = sorted.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  )

  const goTo = (p) => setPage(Math.min(Math.max(1, p), pageCount))

  const anyFilterOpen = columns.some((col) => openFilters[col.key])

  return (
    <ScenarioShell
      title="Basic Table"
      description="Polar UI data table with sorting, per-column filtering, page size selection, and pagination."
      columns={allColumns}
      tableId="basic-table"
    >
      <div className="dt-table">
        <div className="dt-columns">
          <table className="dt-grid">
            <colgroup>
              {columns.map((col) => (
                <col key={col.key} style={{ width: `${100 / columns.length}%` }} />
              ))}
            </colgroup>
            <thead>
              <tr className="dt-header-row">
                {columns.map((col) => {
                  const isSorted = sort.key === col.key
                  const isFilterOpen = !!openFilters[col.key]
                  return (
                    <th key={col.key} className="dt-header">
                      <div className="dt-header-items">
                        <button
                          type="button"
                          className="dt-header-start"
                          onClick={() => toggleSort(col.key)}
                        >
                          <span className="dt-header-content">{col.label}</span>
                          <span
                            className={`dt-sort ${isSorted ? 'is-active' : ''}`}
                          >
                            <ArrowIcon direction={isSorted ? sort.dir : 'desc'} />
                          </span>
                        </button>
                        <div className="dt-header-end">
                          <button
                            type="button"
                            className={`dt-filter-toggle ${
                              isFilterOpen || filters[col.key] ? 'is-active' : ''
                            }`}
                            aria-label={`Filter ${col.label}`}
                            aria-pressed={isFilterOpen}
                          >
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
                      {openFilters[col.key] && (
                        <input
                          className="dt-filter-input"
                          type="text"
                          placeholder={`Filter ${col.label}…`}
                          value={filters[col.key] || ''}
                          onChange={(e) => setFilterValue(col.key, e.target.value)}
                        />
                      )}
                    </th>
                  ))}
                </tr>
              )}
            </thead>
            <tbody>
              {pageRows.map((row, idx) => (
                <tr
                  key={row.id}
                  className={`dt-row ${idx % 2 === 1 ? 'dt-row--alt' : ''}`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="dt-cell">
                      <span className="dt-cell-text">{row[col.key]}</span>
                    </td>
                  ))}
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr className="dt-row">
                  <td className="dt-cell dt-empty" colSpan={columns.length}>
                    <span className="dt-cell-text">No matching rows</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pageCount > 1 && (
        <div className="dt-footer">
          <div className="dt-page-size">
            <span className="dt-page-size-label">Items per page</span>
            <div className="dt-select">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <span className="dt-select-chevron">
                <ChevronDown />
              </span>
            </div>
          </div>

          <div className="dt-pagination">
            <button
              type="button"
              className="dt-page-btn"
              aria-label="First page"
              disabled={currentPage === 1}
              onClick={() => goTo(1)}
            >
              <PageFirst />
            </button>
            <button
              type="button"
              className="dt-page-btn"
              aria-label="Previous page"
              disabled={currentPage === 1}
              onClick={() => goTo(currentPage - 1)}
            >
              <ChevronLeft />
            </button>

            <span className="dt-page-label">Page</span>
            <div className="dt-number-field">
              <input
                type="number"
                min={1}
                max={pageCount}
                value={currentPage}
                onChange={(e) => goTo(Number(e.target.value))}
              />
            </div>
            <span className="dt-page-count">of {pageCount}</span>

            <button
              type="button"
              className="dt-page-btn"
              aria-label="Next page"
              disabled={currentPage === pageCount}
              onClick={() => goTo(currentPage + 1)}
            >
              <ChevronRight />
            </button>
            <button
              type="button"
              className="dt-page-btn"
              aria-label="Last page"
              disabled={currentPage === pageCount}
              onClick={() => goTo(pageCount)}
            >
              <PageLast />
            </button>
          </div>
        </div>
        )}
      </div>
    </ScenarioShell>
  )
}
