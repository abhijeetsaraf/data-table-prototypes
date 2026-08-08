import { Fragment, useMemo, useState } from 'react'
import ScenarioShell from '../components/ScenarioShell.jsx'
import {
  ChevronDown, ChevronLeft, ChevronRight, PageFirst, PageLast, CloseIcon,
  TruncatingCell, useColumnResize, useColumnVisibility, ColGroup, GridHead,
} from '../components/tableKit.jsx'
import {
  columns as allColumns, defaultWidths, PAGE_SIZES, MICRO_PAGE_SIZE, INDENT_STEP,
  FLAT_COUNT, LEVEL_BY_KEY, flatMembers, leafItem,
} from '../components/groupingModel.js'

// ---------------------------------------------------------------------------
// Variant: Command Palette (A3) + Nested Accordion (B4)
//
// Two recommended ideas combined into a single experience:
//
//   A3 — the group-by picker is a SEARCHABLE hierarchical menu. Hundreds of
//   dimensions live in a 3-deep taxonomy (Bookmark ▸ List/Spots ▸ List n …).
//   A search box collapses "drill three flyouts" into "type a few letters +
//   click", and a browsable tree is there for discovery. Picks assemble into
//   an ordered sequence, committed with "Create groups".
//
//   B4 — the result is a NESTED multi-level accordion. Every level is visible
//   at once (all business units under APAC, not just the first leaf), each with
//   its own micro-pager. A hybrid "auto-expand depth" caps how many levels open
//   by default so height stays bounded; deeper levels expand on click.
// ---------------------------------------------------------------------------

const STATUS_VALUES = ['Active', 'Invited', 'Suspended', 'Pending']

// Generate a run of concrete leaf options ("List 1", "List 2", …). These are
// selectable as a single group per the chosen parent semantics.
const genLeaves = (prefix, idPrefix, n) =>
  Array.from({ length: n }, (_, i) => ({
    id: `${idPrefix}-${i + 1}`,
    name: `${prefix} ${i + 1}`,
    kind: 'single',
  }))

// Hierarchical group-by catalog. `dimension` nodes fan out into their real
// value buckets; `single` nodes (parents and concrete leaves) collapse to one
// bucket when grouped by — matching "treat the whole parent as a single group".
const CATALOG = [
  { id: 'region', name: 'Region', kind: 'dimension', dim: 'region' },
  { id: 'unit', name: 'Business unit', kind: 'dimension', dim: 'unit' },
  { id: 'team', name: 'Team', kind: 'dimension', dim: 'team' },
  { id: 'role', name: 'Role', kind: 'dimension', dim: 'role' },
  { id: 'status', name: 'Status', kind: 'dimension', dim: 'status' },
  {
    id: 'bookmark', name: 'Bookmark', kind: 'single', children: [
      { id: 'bm-list', name: 'List', kind: 'single', children: genLeaves('List', 'list', 72) },
      { id: 'bm-spots', name: 'Spots', kind: 'single', children: genLeaves('Spot', 'spot', 56) },
    ],
  },
  { id: 'tag', name: 'Tag', kind: 'single', children: genLeaves('Tag', 'tag', 88) },
  { id: 'folder', name: 'Folder', kind: 'single', children: genLeaves('Folder', 'folder', 84) },
]

// Flattened search index: every node with the trail of its ancestors' names.
const SEARCH_INDEX = []
;(function walk(nodes, trail) {
  for (const n of nodes) {
    SEARCH_INDEX.push({ node: n, trail })
    if (n.children) walk(n.children, [...trail, n.name])
  }
})(CATALOG, [])

const dimValues = (dim) => {
  if (dim === 'status') return STATUS_VALUES
  const L = LEVEL_BY_KEY[dim]
  return Array.from({ length: L.count }, (_, i) => L.label(i))
}

// The value buckets a token contributes at its level.
const bucketLabels = (token) =>
  token.kind === 'dimension' ? dimValues(token.dim) : [token.name]

// Build a nested tree from an ordered token list, distributing a member count
// down each level so counts reconcile exactly (parent = sum of children).
function buildSyntheticTree(tokens, rootCount) {
  const build = (count, depth) => {
    if (depth === tokens.length) return { isLeaf: true, count }
    const labels = bucketLabels(tokens[depth])
    const b = Math.min(labels.length, Math.max(1, count))
    const base = Math.floor(count / b)
    const rem = count % b
    const children = []
    for (let i = 0; i < b; i++) {
      const c = base + (i < rem ? 1 : 0)
      children.push({ label: labels[i], count: c, child: build(c, depth + 1) })
    }
    return { isLeaf: false, children }
  }
  return build(rootCount, 0)
}

const sameTokens = (a, b) =>
  a.length === b.length && a.every((n, i) => n.id === b[i].id)

const plural = (name) => (name.endsWith('s') ? name : `${name}s`)

// ---------------------------------------------------------------------------
// Command-palette group-by builder (rendered into the shell's left panel)
// ---------------------------------------------------------------------------
function CommandPaletteBuilder({ draft, setDraft, tokens, onCreate, onReset }) {
  const [query, setQuery] = useState('')
  const [treeOpen, setTreeOpen] = useState({})

  const draftIds = useMemo(() => new Set(draft.map((d) => d.id)), [draft])
  const addNode = (node) => {
    if (draftIds.has(node.id)) return
    setDraft((prev) => [...prev, node])
  }

  const q = query.trim().toLowerCase()
  const results = q
    ? SEARCH_INDEX.filter((e) => e.node.name.toLowerCase().includes(q)).slice(0, 60)
    : null

  const createDisabled = draft.length === 0 || sameTokens(draft, tokens)
  const resetDisabled = draft.length === 0 && tokens.length === 0

  const renderTree = (nodes, depth) =>
    nodes.map((n) => {
      const hasChildren = !!n.children
      const open = !!treeOpen[n.id]
      const added = draftIds.has(n.id)
      return (
        <Fragment key={n.id}>
          <div className="dt-gb-node" style={{ paddingLeft: depth * 14 }}>
            {hasChildren ? (
              <button
                type="button"
                className="dt-gb-node-toggle"
                aria-expanded={open}
                aria-label={open ? `Collapse ${n.name}` : `Expand ${n.name}`}
                onClick={() => setTreeOpen((p) => ({ ...p, [n.id]: !p[n.id] }))}
              >
                <span className={`dt-group-chevron ${open ? 'is-open' : ''}`}><ChevronRight /></span>
              </button>
            ) : (
              <span className="dt-gb-node-spacer" />
            )}
            <button
              type="button"
              className={`dt-gb-node-add ${added ? 'is-added' : ''}`}
              disabled={added}
              onClick={() => addNode(n)}
              title={added ? 'Already in sequence' : `Group by ${n.name}`}
            >
              <span className="dt-gb-node-name">{n.name}</span>
              {hasChildren && <span className="dt-gb-node-kind">group</span>}
            </button>
          </div>
          {hasChildren && open && renderTree(n.children, depth + 1)}
        </Fragment>
      )
    })

  return (
    <>
      <h2 className="dt-controls-heading">Group by</h2>
      <p className="dt-gb-hint">
        Search hundreds of dimensions or browse the menu, add them in the order you want
        to nest them, then create the groups.
      </p>

      {draft.length > 0 && (
        <div className="dt-split dt-gb-split" role="group" aria-label="Group by sequence">
          <div className="dt-split-main">
            {draft.map((node, j) => {
              const isLast = j === draft.length - 1
              if (!isLast) {
                return (
                  <Fragment key={node.id}>
                    {j > 0 && <span className="dt-split-sep"><ChevronRight /></span>}
                    <button type="button" className="dt-split-crumb"
                      onClick={() => setDraft(draft.slice(0, j + 1))}>
                      {node.name}
                    </button>
                  </Fragment>
                )
              }
              return (
                <Fragment key={node.id}>
                  {j > 0 && <span className="dt-split-sep"><ChevronRight /></span>}
                  <span className="dt-gb-last">
                    <button type="button" className="dt-split-crumb is-current" disabled>
                      {node.name}
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

      <input
        className="dt-gb-search"
        type="text"
        placeholder="Search dimensions…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search grouping dimensions"
      />

      <div className="dt-gb-scroll">
        {results ? (
          results.length > 0 ? (
            <div className="dt-gb-results">
              {results.map(({ node, trail }) => (
                <button
                  key={node.id}
                  type="button"
                  className={`dt-gb-result ${draftIds.has(node.id) ? 'is-added' : ''}`}
                  disabled={draftIds.has(node.id)}
                  onClick={() => addNode(node)}
                >
                  <span className="dt-gb-result-name">{node.name}</span>
                  {trail.length > 0 && (
                    <span className="dt-gb-result-path">{trail.join(' \u203a ')}</span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <p className="dt-gb-empty">No dimensions match “{query}”.</p>
          )
        ) : (
          <div className="dt-gb-tree">{renderTree(CATALOG, 0)}</div>
        )}
      </div>

      <div className="dt-gb-actions">
        <button type="button" className="dt-gb-reset" disabled={resetDisabled} onClick={onReset}>
          Reset
        </button>
        <button type="button" className="dt-gb-apply" disabled={createDisabled}
          onClick={() => onCreate(draft)}>
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

export default function RowGroupingCommandNested() {
  const [sort, setSort] = useState({ key: null, dir: 'asc' })
  const [openFilters, setOpenFilters] = useState({})
  const [filters, setFilters] = useState({})
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const { widths, startResize } = useColumnResize(defaultWidths)
  const { columns, dataColumns } = useColumnVisibility('row-grouping-command-nested', allColumns)

  // Committed group-by sequence (tokens) vs. the draft being assembled.
  const [tokens, setTokens] = useState([])
  const [draft, setDraft] = useState([])

  // Nested-accordion state: per-node open overrides + per-node micro pages.
  // `expandDepth` is the hybrid cap — how many levels auto-open by default.
  const [expandDepth, setExpandDepth] = useState(2)
  const [openMap, setOpenMap] = useState({})
  const [microMap, setMicroMap] = useState({})

  const grouped = tokens.length > 0
  const tree = useMemo(() => buildSyntheticTree(tokens, FLAT_COUNT), [tokens])

  const toggleSort = (key) =>
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: 'asc' }
      if (prev.dir === 'asc') return { key, dir: 'desc' }
      return { key: null, dir: 'asc' }
    })
  const toggleFilter = (key) => setOpenFilters((p) => ({ ...p, [key]: !p[key] }))

  const isOpen = (pathKey, depth) => openMap[pathKey] ?? depth < expandDepth
  const toggleNode = (pathKey, depth) =>
    setOpenMap((prev) => ({ ...prev, [pathKey]: !(prev[pathKey] ?? depth < expandDepth) }))

  const getMicro = (key) => microMap[key] || 1
  const setMicro = (key, value, count) =>
    setMicroMap((p) => ({ ...p, [key]: Math.min(Math.max(1, value), count) }))

  const changeExpandDepth = (next) => {
    setExpandDepth(next)
    setOpenMap({}) // let the new default take over cleanly
  }

  const resetGroupState = () => {
    setOpenMap({})
    setMicroMap({})
    setPage(1)
  }
  const createGroups = (order) => {
    setTokens(order)
    setExpandDepth(order.length) // always auto-expand every level down to the leaf
    resetGroupState()
  }
  const resetAll = () => {
    setDraft([])
    setTokens([])
    setExpandDepth(2)
    resetGroupState()
  }

  // Flat (ungrouped) rows for the default state.
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
  }, [filters, sort, dataColumns])

  const activeColumns = grouped ? columns : dataColumns
  const minWidth = activeColumns.reduce((sum, col) => sum + widths[col.key], 0)

  const total = grouped ? tree.children.length : flatRows.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, pageCount)
  const startG = (currentPage - 1) * pageSize
  const endG = Math.min(startG + pageSize, total)
  const goToMain = (p) => setPage(Math.min(Math.max(1, p), pageCount))

  // Recursively push accordion rows for one group entry and its open subtree.
  const renderEntry = (entry, path, depth, out) => {
    const pathKey = path.join('.')
    const open = isOpen(pathKey, depth)
    const indent = 12 + depth * INDENT_STEP
    const childIsLeaf = entry.child.isLeaf
    const items = childIsLeaf ? null : entry.child.children
    const itemTotal = childIsLeaf ? entry.count : items.length
    const micro = getMicro(pathKey)
    const microPageCount = Math.max(1, Math.ceil(itemTotal / MICRO_PAGE_SIZE))
    const s = (micro - 1) * MICRO_PAGE_SIZE
    const e = Math.min(s + MICRO_PAGE_SIZE, itemTotal)
    const childName = depth + 1 < tokens.length ? tokens[depth + 1].name : 'Member'

    out.push(
      <tr key={`h-${pathKey}`} className="dt-group-row dt-nest" data-level={Math.min(depth, 3)}>
        <td className="dt-group-cell" colSpan={activeColumns.length}>
          <div className="dt-group-header" style={{ paddingLeft: indent }}>
            <div className="dt-group-header-start">
              <button type="button" className="dt-group-toggle"
                aria-expanded={open} aria-label={open ? 'Collapse group' : 'Expand group'}
                onClick={() => toggleNode(pathKey, depth)}>
                <span className={`dt-group-chevron ${open ? 'is-open' : ''}`}><ChevronRight /></span>
              </button>
              <TruncatingCell text={entry.label} className="dt-strong" />
              <span className="dt-group-count">{entry.count}</span>
            </div>
            {open && (
              <HeaderPager label={plural(childName)} page={micro} pageCount={microPageCount}
                total={itemTotal} pageSize={MICRO_PAGE_SIZE}
                onGoTo={(p) => setMicro(pathKey, p, microPageCount)} />
            )}
          </div>
        </td>
      </tr>,
    )

    if (!open) return

    if (childIsLeaf) {
      const leafIndent = 12 + (depth + 1) * INDENT_STEP
      for (let k = 0; k < e - s; k++) {
        const ii = s + k
        const item = leafItem(path, ii)
        out.push(
          <tr key={`m-${pathKey}-${ii}`} className={`dt-row ${ii % 2 === 1 ? 'dt-row--alt' : ''}`}>
            <td className="dt-cell dt-cell--group-spacer" style={{ paddingLeft: leafIndent }} />
            {dataColumns.map((col) => (
              <td key={col.key} className="dt-cell">
                <TruncatingCell text={item[col.key]} />
              </td>
            ))}
          </tr>,
        )
      }
    } else {
      for (let k = 0; k < e - s; k++) {
        const idx = s + k
        renderEntry(items[idx], [...path, idx], depth + 1, out)
      }
    }
  }

  const groupedRows = []
  if (grouped) {
    for (let gi = startG; gi < endG; gi++) {
      renderEntry(tree.children[gi], [gi], 0, groupedRows)
    }
  }

  return (
    <ScenarioShell
      fill
      title="Row Grouping — Command Palette + Nested Accordion"
      description="Search a hundreds-deep group-by menu (A3), then read the result as a nested multi-level accordion where every level stays visible (B4)."
      groupBy={grouped ? tokens.map((t) => t.name) : undefined}
      columns={allColumns}
      tableId="row-grouping-command-nested"
      controlsDefaultOpen={false}
      panelExtras={
        <CommandPaletteBuilder
          draft={draft}
          setDraft={setDraft}
          tokens={tokens}
          onCreate={createGroups}
          onReset={resetAll}
        />
      }
      controls={
        grouped ? (
          <div className="dt-control">
            <span className="dt-control-text">
              <span className="dt-control-label">Auto-expand depth</span>
              <span className="dt-control-desc">
                How many levels open by default. Deeper levels expand on click.
              </span>
            </span>
            <div className="dt-select dt-select--sm">
              <select value={expandDepth} onChange={(e) => changeExpandDepth(Number(e.target.value))}>
                {Array.from({ length: tokens.length + 1 }, (_, i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
              <span className="dt-select-chevron"><ChevronDown /></span>
            </div>
          </div>
        ) : undefined
      }
    >
      <div className="dt-table dt-table--fill">
        <div className="dt-columns">
          <table className={`dt-grid ${grouped ? 'dt-grid--pin' : ''}`} style={{ width: '100%', minWidth: `${minWidth}px` }}>
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

              {grouped && groupedRows}
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
