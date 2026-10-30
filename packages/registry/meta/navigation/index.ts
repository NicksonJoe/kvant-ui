import type { CategoryMeta } from '../types';
import topbar from './topbar';
import tabBar from './tab-bar';
import sidebar from './sidebar';
import tabs from './tabs';
import breadcrumb from './breadcrumb';
import pagination from './pagination';
import navigationMenu from './navigation-menu';
import menubar from './menubar';
import steps from './steps';
import toolbar from './toolbar';
import commandPalette from './command-palette';
import treeView from './tree-view';
import tableOfContents from './table-of-contents';

const category: CategoryMeta = {
  id: 'navigation',
  title: 'Навигация',
  description: 'Панели, вкладки, крошки, шаги и командная палитра.',
  components: [topbar, tabBar, sidebar, tabs, breadcrumb, pagination, navigationMenu, menubar, steps, toolbar, commandPalette, treeView, tableOfContents],
};

export default category;
