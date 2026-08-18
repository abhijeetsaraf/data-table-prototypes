import {
  Fragment, memo, useCallback, useLayoutEffect, useMemo, useRef, useState,
} from 'react'
import ScenarioShell from '../components/ScenarioShell.jsx'
import {
  ChevronDown, ChevronLeft, ChevronRight, PageFirst, PageLast, CloseIcon,
  TruncatingCell, useColumnResize, useColumnVisibility, ColGroup, GridHead,
} from '../components/tableKit.jsx'
import {
  columns as allColumns, defaultWidths, PAGE_SIZES, MICRO_PAGE_SIZE, INDENT_STEP,
  flatMembers,
} from '../components/groupingModel.js'

// ---------------------------------------------------------------------------
// Variant: Command Palette (A3) + Nested Accordion (B4) — Sticky Stacking Pills
//
// An extended version of the Command Palette + Nested Accordion experience:
//
//   • Data is the real ~5000-member dataset — grouping derives a real tree from
//     the same rows, so counts reconcile and pagination is genuinely exercised.
//
//   • Sticky stacking breadcrumb: as you scroll the accordion, a single sticky
//     bar (styled exactly like the group-by split breadcrumb, minus the ✕)
//     pins to the top of the scroll area and accumulates ONE PILL PER ANCESTOR
//     of whatever section currently sits under the header. Scroll a child's
//     header up under the bar and its pill is appended to its parent's; scroll
//     past a whole branch and the deeper pills pop off. This is the classic
//     "stacked sticky group headers" collapsed into one compact pill trail.
//
//   • Micro-pagers only appear where a node actually spans more than one page.
// ---------------------------------------------------------------------------

// Generate a run of concrete leaf options ("List 1", "List 2", …) for the
// searchable catalog (discovery flavor); these collapse to a single bucket when
// grouped by, per the parent's "treat the whole thing as one group" semantics.
const genLeaves = (prefix, idPrefix, n) =>
  Array.from({ length: n }, (_, i) => ({
    id: `${idPrefix}-${i + 1}`,
    name: `${prefix} ${i + 1}`,
    kind: 'single',
  }))

// Hierarchical group-by catalog. `dimension` nodes fan out into their real
// value buckets (grouped over the real rows); `single` nodes collapse to one
// bucket when grouped by.
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

// Build a nested tree from an ordered token list over the REAL rows. Dimension
// tokens split rows by their field value; single tokens wrap all rows in one
// labelled bucket. Leaf nodes carry the real member rows so counts reconcile.
function buildRealTokenTree(rows, tokens) {
  const build = (subset, depth) => {
    if (depth === tokens.length) return { isLeaf: true, members: subset }
    const token = tokens[depth]
    if (token.kind === 'dimension') {
      const buckets = new Map()
      for (const row of subset) {
        const value = row[token.dim]
        if (!buckets.has(value)) buckets.set(value, [])
        buckets.get(value).push(row)
      }
      const children = [...buckets.keys()]
        .sort((a, b) => String(a).localeCompare(String(b)))
        .map((label) => {
          const members = buckets.get(label)
          return { label, count: members.length, child: build(members, depth + 1) }
        })
      return { isLeaf: false, children }
    }
    // Single token → one bucket containing all rows at this level.
    return {
      isLeaf: false,
      children: [{ label: token.name, count: subset.length, child: build(subset, depth + 1) }],
    }
  }
  return build(rows, 0)
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

// A single group-header row. Memoized so that a scroll-driven pill update (which
// re-renders the parent) only re-renders the header rows whose props actually
// changed — in practice just the pinned top-level header and the one it replaces.
// All callbacks are passed as stable references from the parent so the shallow
// prop compare can bail for every unchanged header.
const GroupHeaderRow = memo(function GroupHeaderRow({
  pathKey, depth, dataLevel, label, indent, open, entryCount, colSpan,
  showPager, childLabel, micro, microPageCount, itemTotal,
  isTopPinned, pills, toggleNode, setMicro, scrollToPill,
}) {
  const displayCount =
    isTopPinned && pills && pills.length ? pills[pills.length - 1].count : entryCount

  return (
    <tr
      className={`dt-group-row dt-nest${isTopPinned ? ' is-pinned-trail' : ''}`}
      data-level={dataLevel}
      data-stack-depth={depth}
      data-stack-key={pathKey}
      data-stack-label={label}
      data-stack-count={entryCount}
    >
      <td className="dt-group-cell" colSpan={colSpan}>
        <div className="dt-group-header" style={{ paddingLeft: indent }}>
          <div className="dt-group-header-start">
            <button type="button" className="dt-group-toggle"
              aria-expanded={open} aria-label={open ? 'Collapse group' : 'Expand group'}
              onClick={() => toggleNode(pathKey, depth)}>
              <span className={`dt-group-chevron ${open ? 'is-open' : ''}`}><ChevronRight /></span>
            </button>
            {isTopPinned && pills ? (
              <div className="dt-split-main dt-stack-crumbs">
                {pills.map((pill, j) => {
                  const isCurrent = j === pills.length - 1
                  return (
                    <Fragment key={`${pill.depth}-${pill.label}`}>
                      {j > 0 && <span className="dt-split-sep"><ChevronRight /></span>}
                      <button
                        type="button"
                        className={`dt-split-crumb ${isCurrent ? 'is-current' : ''}`}
                        onClick={() => scrollToPill(pill)}
                        title={pill.label}
                      >
                        {pill.label}
                      </button>
                    </Fragment>
                  )
                })}
              </div>
            ) : (
              <TruncatingCell text={label} className="dt-strong" />
            )}
            <span className="dt-group-count">{displayCount}</span>
          </div>
          {showPager && (
            <HeaderPager label={childLabel} page={micro} pageCount={microPageCount}
              total={itemTotal} pageSize={MICRO_PAGE_SIZE}
              onGoTo={(p) => setMicro(pathKey, p, microPageCount)} />
          )}
        </div>
      </td>
    </tr>
  )
})

// A single leaf (member) row. Memoized so it is skipped entirely on scroll-driven
// re-renders — its props (the row object, the stable column list, indent, stripe)
// never change while scrolling.
const LeafRow = memo(function LeafRow({ item, dataColumns, leafIndent, alt }) {
  return (
    <tr className={`dt-row ${alt ? 'dt-row--alt' : ''}`}>
      <td className="dt-cell dt-cell--group-spacer" style={{ paddingLeft: leafIndent }} />
      {dataColumns.map((col) => (
        <td key={col.key} className="dt-cell">
          <TruncatingCell text={item[col.key]} />
        </td>
      ))}
    </tr>
  )
})

export default function RowGroupingCommandNestedStacked() {
  const [sort, setSort] = useState({ key: null, dir: 'asc' })
  const [openFilters, setOpenFilters] = useState({})
  const [filters, setFilters] = useState({})
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const { widths, startResize } = useColumnResize(defaultWidths)
  const { columns, dataColumns } = useColumnVisibility('row-grouping-command-nested-stacked', allColumns)

  // Committed group-by sequence (tokens) vs. the draft being assembled.
  const [tokens, setTokens] = useState([])
  const [draft, setDraft] = useState([])

  // Nested-accordion state: per-node open overrides + per-node micro pages.
  const [expandDepth, setExpandDepth] = useState(2)
  const [openMap, setOpenMap] = useState({})
  const [microMap, setMicroMap] = useState({})

  const grouped = tokens.length > 0
  const tree = useMemo(
    () => (grouped ? buildRealTokenTree(flatMembers, tokens) : null),
    [tokens, grouped],
  )

  const toggleSort = (key) =>
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: 'asc' }
      if (prev.dir === 'asc') return { key, dir: 'desc' }
      return { key: null, dir: 'asc' }
    })
  const toggleFilter = (key) => setOpenFilters((p) => ({ ...p, [key]: !p[key] }))

  const isOpen = (pathKey, depth) => openMap[pathKey] ?? depth < expandDepth
  const toggleNode = useCallback(
    (pathKey, depth) =>
      setOpenMap((prev) => ({ ...prev, [pathKey]: !(prev[pathKey] ?? depth < expandDepth) })),
    [expandDepth],
  )

  const getMicro = (key) => microMap[key] || 1
  const setMicro = useCallback(
    (key, value, count) =>
      setMicroMap((p) => ({ ...p, [key]: Math.min(Math.max(1, value), count) })),
    [],
  )

  const changeExpandDepth = (next) => {
    setExpandDepth(next)
    setOpenMap({})
  }

  const resetGroupState = () => {
    setOpenMap({})
    setMicroMap({})
    setPage(1)
  }
  const createGroups = (order) => {
    setTokens(order)
    setExpandDepth(order.length) // auto-expand every level so the stack is deep
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

  // -------------------------------------------------------------------------
  // Sticky stacking pill bar
  // A scroll-driven breadcrumb: measure every group-header row's Y within the
  // scroll content, then on scroll find the deepest header pinned under the
  // sticky column header and reconstruct its ancestor chain into pills.
  // -------------------------------------------------------------------------
  const scrollRef = useRef(null)
  const headersRef = useRef([])
  const headHRef = useRef(47)
  const rafRef = useRef(0)
  const [pills, setPills] = useState([])

  const computePills = useCallback(() => {
    const c = scrollRef.current
    const list = headersRef.current
    if (!c || list.length === 0) {
      setPills((prev) => (prev.length ? [] : prev))
      return
    }
    // A header has "scrolled past" (behind the sticky column header) once its
    // content-Y sits above the header's bottom edge — that's when it collapses
    // into a pill. Using a strict compare keeps a group out of the bar while
    // its own header is still showing in its natural row position.
    const line = c.scrollTop + headHRef.current
    // Binary search: last header that has scrolled past the bar line.
    let lo = 0
    let hi = list.length - 1
    let k = -1
    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      if (list[mid].y < line) {
        k = mid
        lo = mid + 1
      } else {
        hi = mid - 1
      }
    }
    if (k < 0) {
      setPills((prev) => (prev.length ? [] : prev))
      return
    }
    // Walk back from the pinned header collecting one entry per ancestor depth.
    const stack = []
    let need = list[k].depth
    for (let j = k; j >= 0 && need >= 0; j--) {
      if (list[j].depth === need) {
        stack[need] = list[j]
        need -= 1
      }
    }
    const next = stack.filter(Boolean)
    setPills((prev) => {
      if (
        prev.length === next.length &&
        prev.every((p, i) => p.label === next[i].label && p.y === next[i].y)
      ) {
        return prev
      }
      return next
    })
  }, [])

  const measure = useCallback(() => {
    const c = scrollRef.current
    if (!c) return
    const cRect = c.getBoundingClientRect()
    const thead = c.querySelector('thead')
    if (thead) headHRef.current = thead.getBoundingClientRect().height || 47
    // Publish the column-header height so the pinned top-level group header can
    // stick right below it via CSS (top: var(--dt-head-h)) without JS layout.
    c.style.setProperty('--dt-head-h', `${headHRef.current}px`)
    const list = []
    c.querySelectorAll('tr[data-stack-depth]').forEach((el) => {
      const r = el.getBoundingClientRect()
      list.push({
        depth: Number(el.dataset.stackDepth),
        key: el.dataset.stackKey,
        label: el.dataset.stackLabel,
        count: Number(el.dataset.stackCount),
        y: r.top - cRect.top + c.scrollTop,
      })
    })
    headersRef.current = list
    computePills()
  }, [computePills])

  const onScroll = useCallback(() => {
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0
      computePills()
    })
  }, [computePills])

  // Re-measure whenever the rendered rows could have changed.
  useLayoutEffect(() => {
    measure()
  }, [measure, grouped, tokens, openMap, microMap, currentPage, pageSize, expandDepth, widths, activeColumns.length, openFilters])

  useLayoutEffect(() => {
    const onResize = () => measure()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [measure])

  const scrollToPill = useCallback((pill) => {
    const c = scrollRef.current
    if (!c) return
    c.scrollTo({ top: Math.max(0, pill.y - headHRef.current + 1), behavior: 'smooth' })
  }, [])

  // Recursively push accordion rows for one group entry and its open subtree.
  const renderEntry = (entry, path, depth, out) => {
    const pathKey = path.join('.')
    const open = isOpen(pathKey, depth)
    const indent = 12 + depth * INDENT_STEP
    const childIsLeaf = entry.child.isLeaf
    const items = childIsLeaf ? entry.child.members : entry.child.children
    const itemTotal = items.length
    const micro = getMicro(pathKey)
    const microPageCount = Math.max(1, Math.ceil(itemTotal / MICRO_PAGE_SIZE))
    const s = (micro - 1) * MICRO_PAGE_SIZE
    const e = Math.min(s + MICRO_PAGE_SIZE, itemTotal)
    const childName = depth + 1 < tokens.length ? tokens[depth + 1].name : 'Member'

    // When this top-level group is the one currently pinned under the column
    // header, host the ancestor breadcrumb inside its own (sticky) header row —
    // the descendants that have scrolled past collapse into pills right after
    // the parent's chevron, replacing a separate floating bar.
    const isTopPinned = depth === 0 && pills.length > 0 && pills[0].key === pathKey

    out.push(
      <GroupHeaderRow
        key={`h-${pathKey}`}
        pathKey={pathKey}
        depth={depth}
        dataLevel={Math.min(depth, 3)}
        label={entry.label}
        indent={indent}
        open={open}
        entryCount={entry.count}
        colSpan={activeColumns.length}
        showPager={open && microPageCount > 1}
        childLabel={plural(childName)}
        micro={micro}
        microPageCount={microPageCount}
        itemTotal={itemTotal}
        isTopPinned={isTopPinned}
        pills={isTopPinned ? pills : null}
        toggleNode={toggleNode}
        setMicro={setMicro}
        scrollToPill={scrollToPill}
      />,
    )

    if (!open) return

    if (childIsLeaf) {
      const leafIndent = 12 + (depth + 1) * INDENT_STEP
      for (let k = 0; k < e - s; k++) {
        const item = entry.child.members[s + k]
        out.push(
          <LeafRow
            key={`m-${pathKey}-${s + k}`}
            item={item}
            dataColumns={dataColumns}
            leafIndent={leafIndent}
            alt={(s + k) % 2 === 1}
          />,
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
      title="Row Grouping — Command Palette + Nested Accordion (Sticky Pills)"
      description="The nested multi-level accordion over the real ~5000-row dataset, with a sticky breadcrumb that stacks a pill per ancestor as you scroll each branch."
      groupBy={grouped ? tokens.map((t) => t.name) : undefined}
      columns={allColumns}
      tableId="row-grouping-command-nested-stacked"
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
      <div className="dt-table dt-table--fill dt-table--stack">
        <div className="dt-columns" ref={scrollRef} onScroll={onScroll}>
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

        {pageCount > 1 && (
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
        )}
      </div>
    </ScenarioShell>
  )
}
