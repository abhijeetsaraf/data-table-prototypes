// Register prototype scenarios here. Each entry shows up on the home page
// and gets its own route at /{path}.
import BasicTable from './scenarios/BasicTable.jsx'
import RowGrouping from './scenarios/RowGrouping.jsx'
import RowGroupingHeaderPager from './scenarios/RowGroupingHeaderPager.jsx'
import RowGroupingDrillIn from './scenarios/RowGroupingDrillIn.jsx'
import RowGroupingHeaderPagerDrillIn from './scenarios/RowGroupingHeaderPagerDrillIn.jsx'
import RowGroupingAccordionDrillIn from './scenarios/RowGroupingAccordionDrillIn.jsx'
import RowGroupingAccordionDrillInCustom from './scenarios/RowGroupingAccordionDrillInCustom.jsx'
import RowGroupingCommandNested from './scenarios/RowGroupingCommandNested.jsx'

export const scenarios = [
  {
    path: 'basic-table',
    title: 'Basic Table',
    description:
      'Polar UI data table with sorting, filtering, page size, and pagination.',
    component: BasicTable,
  },
  {
    path: 'row-grouping-stacked',
    title: 'Row Grouping — Stacked Micro Pagination',
    description:
      'Hierarchical row groups with nested micro-pagination that steps one density and tone darker per level.',
    component: RowGrouping,
  },
  {
    path: 'row-grouping-header',
    title: 'Row Grouping — Header Pager',
    description:
      'Option 2: each group\u2019s pagination is anchored to its header row, so pagers never stack.',
    component: RowGroupingHeaderPager,
  },
  {
    path: 'row-grouping-drilldown',
    title: 'Row Grouping — Drill In',
    description:
      'Point 5: click a group to navigate into it with a breadcrumb; one level and one pager at a time.',
    component: RowGroupingDrillIn,
  },
  {
    path: 'row-grouping-header-drilldown',
    title: 'Row Grouping — Header Pager + Drill In',
    description:
      'Combination: drilling in populates a split-button row header (Group \u203a Sub-group \u2715) with the level\u2019s pager appended \u2014 only one pager on screen.',
    component: RowGroupingHeaderPagerDrillIn,
  },
  {
    path: 'row-grouping-accordion-drilldown',
    title: 'Row Grouping — Accordion Drill In',
    description:
      'Primary groups keep the standard footer pager; the group accordion header becomes a split-button breadcrumb with the current level\u2019s pager anchored to it as you drill in.',
    component: RowGroupingAccordionDrillIn,
  },
  {
    path: 'row-grouping-accordion-drilldown-custom',
    title: 'Row Grouping — Accordion Drill In (Custom)',
    description:
      'Same accordion drill-in, but the hierarchy is user-defined: pick dimensions in sequence in the left panel and click Create groups. Groups open straight to the last leaf.',
    component: RowGroupingAccordionDrillInCustom,
  },
  {
    path: 'row-grouping-command-nested',
    title: 'Row Grouping \u2014 Command Palette + Nested Accordion',
    description:
      'Recommended combo: a searchable, hundreds-deep group-by menu (A3) that resolves into a nested multi-level accordion where every level stays visible with per-level pagers (B4).',
    component: RowGroupingCommandNested,
  },
]
