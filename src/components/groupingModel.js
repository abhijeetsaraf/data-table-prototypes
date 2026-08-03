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
// ---------------------------------------------------------------------------

export const GROUP_COL_WIDTH = 300
export const MICRO_PAGE_SIZE = 10
export const INDENT_STEP = 22
export const PAGE_SIZES = [10, 20, 50]

// --- Dimension value pools ---------------------------------------------------
const regions = [
  'North America', 'EMEA', 'APAC', 'LATAM', 'Middle East & Africa', 'Oceania',
]
const units = [
  'Commercial', 'Enterprise', 'Public Sector', 'SMB', 'Strategic',
  'Mid-Market', 'Named Accounts', 'Channel & Partnerships',
]
const teams = [
  'Growth', 'Platform', 'Design', 'Sales', 'Support', 'Data', 'Revenue',
  'Success', 'Ops', 'Research', 'Marketing', 'Enablement',
]
const roles = [
  'Admin', 'Editor', 'Viewer', 'Manager', 'Analyst', 'Owner', 'Reviewer',
  'Contributor', 'Approver', 'Auditor', 'Lead', 'Coordinator', 'Specialist',
  'Architect', 'Strategist',
]

const wrapLabel = (arr, i) => {
  const base = arr[i % arr.length]
  const round = Math.floor(i / arr.length)
  return round > 0 ? `${base} ${round + 1}` : base
}

// --- Level descriptors -------------------------------------------------------
// `count` is how many nodes exist at that level under any parent.
export const LEVELS = [
  { key: 'region', name: 'Region', count: 24, label: (i) => wrapLabel(regions, i) },
  { key: 'unit', name: 'Business unit', count: 8, label: (i) => wrapLabel(units, i) },
  { key: 'team', name: 'Team', count: 12, label: (i) => wrapLabel(teams, i) },
  { key: 'role', name: 'Role', count: 15, label: (i) => wrapLabel(roles, i) },
]
export const LEAF_COUNT = 40
export const GROUP_LEVEL_COUNT = LEVELS.length // 4 grouping levels (+1 leaf level)
export const groupByDims = LEVELS.map((l) => l.name)

export const levelLabel = (level, index) => LEVELS[level].label(index)
export const levelName = (level) =>
  level < GROUP_LEVEL_COUNT ? LEVELS[level].name : 'Member'
export const levelTotal = (level) =>
  level < GROUP_LEVEL_COUNT ? LEVELS[level].count : LEAF_COUNT
// How many children a node at `level` has (i.e. the count one level deeper).
export const childCountAt = (level) => levelTotal(level + 1)

// --- Columns -----------------------------------------------------------------
// Each data column carries a default pixel width used to seed the resizable
// col widths. The "group" column holds the hierarchical group names.
export const columns = [
  { key: 'group', label: 'Group', width: GROUP_COL_WIDTH },
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
  'Ruby', 'Finn', 'Maya', 'Jack', 'Iris', 'Theo',
]
const lastNames = [
  'Carter', 'Reed', 'Bishop', 'Nguyen', 'Patel', 'Ortiz', 'Walsh', 'Sato',
  'Klein', 'Moore', 'Ibarra', 'Frost', 'Diaz', 'Okoro', 'Lund', 'Ali',
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
]

const statuses = ['Active', 'Invited', 'Suspended', 'Pending']
const lastActive = [
  'Just now', '2h ago', '5h ago', '1d ago', '3d ago', '1w ago', '2w ago',
]

// Deterministic leaf item from a full 4-index group path + item index.
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
