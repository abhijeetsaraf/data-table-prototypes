// ---------------------------------------------------------------------------
// Shared grouping data model
//
// A single deterministic synthetic hierarchy shared by every Row Grouping
// scenario. The hierarchy is 5 levels deep: four grouping dimensions plus a
// leaf (member) row.
//
//   Level 0: Region          (grouped by "Region")
//   Level 1: Business unit    (grouped by "Business unit")
//   Level 2: Team             (grouped by "Team")
//   Level 3: Role             (grouped by "Role")
//   Level 4: Member           (leaf items)
//
// The grouping dimensions are NOT data columns — the data columns (Name,
// Title, Email, Description, Status, Last active) are unrelated dummy fields
// with intentionally varied content length so truncation + tooltips are
// exercised.
//
// Data source: a single deterministic flat list of ~5000 members (see
// FLAT_COUNT below). Every scenario derives its hierarchy from these same
// rows via `buildGroupTree`, so the flat and grouped views always reconcile
// and the counts are real (parent = sum of children). The list is generated
// with a small integer hash so the four dimensions are well-mixed and
// de-correlated — you get a realistic spread across regions/units/teams/roles
// rather than a repeating cycle.
// ---------------------------------------------------------------------------

export const GROUP_COL_WIDTH = 300
export const MICRO_PAGE_SIZE = 10
export const INDENT_STEP = 22
export const PAGE_SIZES = [10, 20, 50]

// --- Dimension value pools ---------------------------------------------------
const regions = [
  'North America', 'EMEA', 'APAC', 'LATAM', 'Middle East & Africa', 'Oceania',
  'Central Europe', 'Nordics', 'Iberia', 'Benelux', 'Greater China',
  'India & South Asia', 'Sub-Saharan Africa', 'Andean',
]
const units = [
  'Commercial', 'Enterprise', 'Public Sector', 'SMB', 'Strategic',
  'Mid-Market', 'Named Accounts', 'Channel & Partnerships', 'Healthcare',
  'Financial Services', 'Retail & CPG', 'Manufacturing',
]
const teams = [
  'Growth', 'Platform', 'Design', 'Sales', 'Support', 'Data', 'Revenue',
  'Success', 'Ops', 'Research', 'Marketing', 'Enablement', 'Security',
  'Finance', 'Legal', 'People',
]
const roles = [
  'Admin', 'Editor', 'Viewer', 'Manager', 'Analyst', 'Owner', 'Reviewer',
  'Contributor', 'Approver', 'Auditor', 'Lead', 'Coordinator', 'Specialist',
  'Architect', 'Strategist', 'Director', 'Associate', 'Principal',
]

const wrapLabel = (arr, i) => {
  const base = arr[i % arr.length]
  const round = Math.floor(i / arr.length)
  return round > 0 ? `${base} ${round + 1}` : base
}

// --- Level descriptors -------------------------------------------------------
// `count` is how many distinct values exist in each dimension's pool. (The
// real per-node child count is derived from the data via `buildGroupTree` and
// varies by parent; these descriptors just carry each dimension's name/labels.)
export const LEVELS = [
  { key: 'region', name: 'Region', count: regions.length, label: (i) => wrapLabel(regions, i) },
  { key: 'unit', name: 'Business unit', count: units.length, label: (i) => wrapLabel(units, i) },
  { key: 'team', name: 'Team', count: teams.length, label: (i) => wrapLabel(teams, i) },
  { key: 'role', name: 'Role', count: roles.length, label: (i) => wrapLabel(roles, i) },
]
export const LEAF_COUNT = 40
export const GROUP_LEVEL_COUNT = LEVELS.length // 4 grouping levels (+1 leaf level)
export const groupByDims = LEVELS.map((l) => l.name)

// The canonical top-to-bottom grouping order used by the fixed-hierarchy
// scenarios (Region › Business unit › Team › Role › Member).
export const DEFAULT_ORDER = LEVELS.map((l) => l.key)

export const levelLabel = (level, index) => LEVELS[level].label(index)
export const levelName = (level) =>
  level < GROUP_LEVEL_COUNT ? LEVELS[level].name : 'Member'
export const levelTotal = (level) =>
  level < GROUP_LEVEL_COUNT ? LEVELS[level].count : LEAF_COUNT
// How many children a node at `level` has (i.e. the count one level deeper).
export const childCountAt = (level) => levelTotal(level + 1)

// --- Order-aware helpers -----------------------------------------------------
// The scenarios above use a fixed hierarchy order. The "custom" scenario lets a
// user pick which dimensions to group by and in what sequence, so these helpers
// resolve a level by its position in a caller-supplied `order` (an array of
// dimension keys) instead of the module-level LEVELS order. Because each
// dimension's label/count is parent-independent, reordering is just a lookup.
export const LEVEL_BY_KEY = Object.fromEntries(LEVELS.map((l) => [l.key, l]))
export const orderedLevelName = (order, depth) =>
  depth < order.length ? LEVEL_BY_KEY[order[depth]].name : 'Member'
export const orderedLevelLabel = (order, depth, index) =>
  LEVEL_BY_KEY[order[depth]].label(index)
export const orderedLevelTotal = (order, depth) =>
  depth < order.length ? LEVEL_BY_KEY[order[depth]].count : LEAF_COUNT
export const orderedChildCountAt = (order, depth) =>
  orderedLevelTotal(order, depth + 1)

// --- Columns -----------------------------------------------------------------
// Each data column carries a default pixel width used to seed the resizable
// col widths. The "group" column holds the hierarchical group names and is
// `fixed` (always shown, never offered in the column-visibility control).
// Data columns default to visible; set `defaultVisible: false` on any of them
// to make it opt-in.
export const columns = [
  { key: 'group', label: 'Group', width: GROUP_COL_WIDTH, fixed: true },
  { key: 'name', label: 'Name', width: 150 },
  { key: 'title', label: 'Title', width: 190 },
  { key: 'email', label: 'Email', width: 230 },
  { key: 'description', label: 'Description', width: 300 },
  { key: 'status', label: 'Status', width: 120 },
  { key: 'lastActive', label: 'Last active', width: 130 },
]
export const dataColumns = columns.slice(1)

export const defaultWidths = Object.fromEntries(
  columns.map((c) => [c.key, c.width]),
)

// --- Leaf (member) content pools ---------------------------------------------
const firstNames = [
  'Ava', 'Liam', 'Noah', 'Emma', 'Olivia', 'Mia', 'Ethan', 'Sophia', 'Lucas',
  'Isla', 'Mason', 'Aria', 'Leo', 'Zoe', 'Ella', 'Kai', 'Nora', 'Owen',
  'Ruby', 'Finn', 'Maya', 'Jack', 'Iris', 'Theo', 'Amara', 'Diego', 'Priya',
  'Hana', 'Mateo', 'Yuki', 'Omar', 'Freya', 'Sana', 'Caleb', 'Lena', 'Rohan',
  'Nina', 'Adeel', 'Talia', 'Ivan', 'Rosa', 'Kofi', 'Elif', 'Bao',
]
const lastNames = [
  'Carter', 'Reed', 'Bishop', 'Nguyen', 'Patel', 'Ortiz', 'Walsh', 'Sato',
  'Klein', 'Moore', 'Ibarra', 'Frost', 'Diaz', 'Okoro', 'Lund', 'Ali',
  'Novak', 'Haddad', 'Rossi', 'Mwangi', 'Fischer', 'Cruz', 'Andersen',
  'Kimura', 'Bianchi', 'Costa', 'Nair', 'Petrov', 'Silva', 'Dubois', 'Kaur',
  'Abbas',
]

// Titles range from very short to long so the Title column truncates at its
// default width and reveals more as it is resized wider.
const titles = [
  'Owner',
  'Analyst',
  'Account Executive',
  'Senior Product Designer',
  'Staff Software Engineer',
  'Regional Sales Director, Strategic Enterprise Accounts',
  'VP of Revenue Operations',
  'Customer Success Manager',
  'Lead Data Scientist, Experimentation & Growth Platform',
  'Support Specialist',
  'Principal Solutions Architect, Public Sector',
  'Enablement Program Coordinator',
  'Head of Design',
  'Engineering Manager',
  'Product Marketing Manager',
  'Field Sales Representative',
  'Director of Revenue Operations, Global',
  'Security Engineer',
  'People Operations Partner',
  'Financial Analyst, FP&A',
  'Solutions Consultant',
  'Chief of Staff to the CRO',
  'Senior Technical Program Manager, Platform Reliability',
  'Growth Marketing Associate',
]

// Descriptions deliberately span one word to multiple sentences.
const descriptions = [
  'Primary contact.',
  'On leave until next quarter.',
  'New hire — currently onboarding.',
  'Point of contact for escalations and after-hours incidents.',
  'Handles onboarding and renewals for a book of mid-market accounts.',
  'Owns the quarterly reporting pipeline and coordinates cross-functional reviews with stakeholders across the platform organization.',
  'Recently transitioned from the design systems team; currently ramping on the new analytics surface and shadowing two senior engineers.',
  'Manages a portfolio of strategic enterprise accounts spanning multiple regions, with responsibility for renewal forecasting, executive relationships, and expansion opportunities across the full customer lifecycle.',
  'Leads a distributed team focused on ingestion reliability, data quality monitoring, and the migration of legacy batch jobs to the streaming platform.',
  'Coordinates release notes and changelog communication for every product area shipped this cycle.',
  'Backup approver.',
  'Drives the accessibility audit workstream and partners with design to close outstanding contrast and focus-order defects before GA.',
  'Covering for a colleague on parental leave.',
  'Owns partner enablement content and certification tracking for the channel program.',
  'Runs the weekly pipeline review and maintains the forecast model.',
  'Escalation owner for tier-1 incidents in the region.',
  'Shadowing the enterprise segment ahead of a territory expansion next half.',
  'Maintains the data catalog and reviews access requests for sensitive tables.',
  'Interim lead while the role is backfilled; keeping the roadmap unblocked in the meantime.',
  'Handles procurement and vendor security reviews for the business unit.',
  'Focused on activation and time-to-value for the self-serve funnel.',
  'Long-tenured account owner with deep relationships across the executive team and a track record of multi-year renewals.',
  'Part-time contributor supporting the localization effort.',
  'Recently promoted; now owns a small team and the reporting cadence.',
]

const statuses = ['Active', 'Invited', 'Suspended', 'Pending', 'Archived']
const lastActive = [
  'Just now', '2h ago', '5h ago', '1d ago', '3d ago', '1w ago', '2w ago',
  '1mo ago', '3mo ago', '6mo ago',
]

// ---------------------------------------------------------------------------
// Flat dataset + real grouping
//
// A single deterministic flat list of members, each carrying the four grouping
// dimensions as fields plus the data columns. Every scenario uses this list:
// the default (ungrouped) view lists these rows directly, and applying a
// Group By derives the hierarchy from these same rows — so the flat and
// grouped views always reconcile.
// ---------------------------------------------------------------------------
export const FLAT_COUNT = 5000

// Small deterministic integer hash → well-distributed index selection. Using a
// distinct `salt` per field decorrelates the dimensions so combinations spread
// realistically across the whole hierarchy instead of repeating on a cycle.
const hashPick = (i, salt, len) => {
  let x = ((i + 1) * 2654435761) ^ ((salt + 1) * 40503)
  x ^= x >>> 13
  x = Math.imul(x, 0x5bd1e995)
  x ^= x >>> 15
  return (x >>> 0) % len
}

export const flatMembers = Array.from({ length: FLAT_COUNT }, (_, i) => {
  const first = firstNames[hashPick(i, 11, firstNames.length)]
  const last = lastNames[hashPick(i, 23, lastNames.length)]
  return {
    id: `m-${i}`,
    region: regions[hashPick(i, 1, regions.length)],
    unit: units[hashPick(i, 2, units.length)],
    team: teams[hashPick(i, 3, teams.length)],
    role: roles[hashPick(i, 4, roles.length)],
    name: `${first} ${last}`,
    title: titles[hashPick(i, 5, titles.length)],
    email: `${first.toLowerCase()}.${last.toLowerCase()}${i % 97}@highspot.com`,
    description: descriptions[hashPick(i, 6, descriptions.length)],
    status: statuses[hashPick(i, 7, statuses.length)],
    lastActive: lastActive[hashPick(i, 8, lastActive.length)],
  }
})

// Build a nested group tree from flat rows, grouping by `orderKeys` in order.
// Leaf nodes carry their members; group nodes carry sorted children with the
// member count beneath each. Child order is stable (alphabetical) so drill
// indices stay valid across renders.
export function buildGroupTree(rows, orderKeys) {
  const build = (subset, depth) => {
    if (depth === orderKeys.length) {
      return { isLeaf: true, members: subset }
    }
    const key = orderKeys[depth]
    const buckets = new Map()
    for (const row of subset) {
      const value = row[key]
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
  return build(rows, 0)
}

// --- Tree navigation helpers -------------------------------------------------
// `path` is an array of child indices from the root. `treeNodeAt` returns the
// node reached by following that path; `treeLabelsAt` returns the label at each
// step. Both mirror the local helpers the custom scenario has always used, now
// shared so every scenario navigates a real tree the same way.
export function treeNodeAt(tree, path) {
  let node = tree
  for (const idx of path) node = node.children[idx].child
  return node
}

export function treeLabelsAt(tree, path) {
  const labels = []
  let node = tree
  for (const idx of path) {
    const c = node.children[idx]
    labels.push(c.label)
    node = c.child
  }
  return labels
}

// Deterministic leaf item from a full 4-index group path + item index. Retained
// for backwards compatibility; scenarios that derive the tree from real rows
// read members directly from the leaf node instead.
export function leafItem(parentPath, ii) {
  const [r = 0, u = 0, t = 0, ro = 0] = parentPath
  const seed = r * 1103 + u * 151 + t * 17 + ro * 7 + ii
  const first = firstNames[(seed * 13 + ii * 7) % firstNames.length]
  const last = lastNames[(seed * 5 + ii * 3) % lastNames.length]
  return {
    id: `${parentPath.join('-')}-${ii}`,
    name: `${first} ${last}`,
    title: titles[(seed + ii * 2) % titles.length],
    email: `${first.toLowerCase()}.${last.toLowerCase()}${ii % 9}@highspot.com`,
    description: descriptions[(seed * 3 + ii) % descriptions.length],
    status: statuses[(seed + ii) % statuses.length],
    lastActive: lastActive[(seed * 2 + ii) % lastActive.length],
  }
}
