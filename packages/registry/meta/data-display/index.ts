import type { CategoryMeta } from '../types';
import card from './card';
import list from './list';
import table from './table';
import dataTable from './data-table';
import dataList from './data-list';
import avatar from './avatar';
import badge from './badge';
import indicator from './indicator';
import tag from './tag';
import kbd from './kbd';
import accordion from './accordion';
import carousel from './carousel';
import marquee from './marquee';
import timeline from './timeline';
import chart from './chart';
import animatedNumber from './animated-number';
import codeBlock from './code-block';
import qrCode from './qr-code';
import timer from './timer';
import scheduler from './scheduler';
import kanban from './kanban';
import infiniteScroll from './infinite-scroll';
import sortableList from './sortable-list';
import jsonViewer from './json-viewer';
import relativeTime from './relative-time';
import swipeActions from './swipe-actions';
import gantt from './gantt';

const category: CategoryMeta = {
  id: 'data-display',
  title: 'Данные',
  description: 'Карточки, списки, таблицы, бейджи, графики и медиа.',
  components: [card, list, table, dataTable, dataList, avatar, badge, indicator, tag, kbd, accordion, carousel, marquee, timeline, chart, animatedNumber, codeBlock, qrCode, timer, scheduler, kanban, infiniteScroll, sortableList, jsonViewer, relativeTime, swipeActions, gantt],
};

export default category;
