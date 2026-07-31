// Register prototype scenarios here. Each entry shows up on the home page
// and gets its own route at /{path}.
import BasicTable from './scenarios/BasicTable.jsx'
import RowGrouping from './scenarios/RowGrouping.jsx'
import RowGroupingHeaderPager from './scenarios/RowGroupingHeaderPager.jsx'
import RowGroupingSingleOpen from './scenarios/RowGroupingSingleOpen.jsx'
import RowGroupingDrillIn from './scenarios/RowGroupingDrillIn.jsx'

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
    path: 'row-grouping-single',
    title: 'Row Grouping — Single Open',
    description:
      'Point 1: only one group and one sub-group open at a time, capping visible micro-pagers at two.',
    component: RowGroupingSingleOpen,
  },
  {
    path: 'row-grouping-drilldown',
    title: 'Row Grouping — Drill In',
    description:
      'Point 5: click a group to navigate into it with a breadcrumb; one level and one pager at a time.',
    component: RowGroupingDrillIn,
  },
]
