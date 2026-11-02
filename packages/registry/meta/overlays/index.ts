import type { CategoryMeta } from '../types';
import dialog from './dialog';
import alertDialog from './alert-dialog';
import sheet from './sheet';
import popover from './popover';
import tooltip from './tooltip';
import hoverCard from './hover-card';
import menu from './menu';
import contextMenu from './context-menu';
import floatingPanel from './floating-panel';
import tour from './tour';
import lightbox from './lightbox';
import notificationCenter from './notification-center';
import popconfirm from './popconfirm';
import actionSheet from './action-sheet';

const category: CategoryMeta = {
  id: 'overlays',
  title: 'Оверлеи и меню',
  description: 'Диалоги, шиты, поповеры, подсказки и меню поверх страницы.',
  components: [dialog, alertDialog, sheet, popover, tooltip, hoverCard, menu, contextMenu, floatingPanel, tour, lightbox, notificationCenter, popconfirm, actionSheet],
};

export default category;
