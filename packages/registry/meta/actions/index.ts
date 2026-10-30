import type { CategoryMeta } from '../types';
import button from './button';
import buttonGroup from './button-group';
import toggleButton from './toggle-button';
import toggleGroup from './toggle-group';
import fab from './fab';
import link from './link';
import copyButton from './copy-button';

const category: CategoryMeta = {
  id: 'actions',
  title: 'Действия',
  description: 'Кнопки и всё, что запускает действие или переключает режим.',
  components: [button, buttonGroup, toggleButton, toggleGroup, fab, link, copyButton],
};

export default category;
