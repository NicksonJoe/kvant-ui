import type { CategoryMeta } from '../types';
import toast from './toast';
import alert from './alert';
import progress from './progress';
import spinner from './spinner';
import skeleton from './skeleton';
import emptyState from './empty-state';
import meter from './meter';
import navigationProgress from './navigation-progress';

const category: CategoryMeta = {
  id: 'feedback',
  title: 'Обратная связь',
  description: 'Уведомления, прогресс, загрузка и пустые состояния.',
  components: [toast, alert, progress, spinner, skeleton, emptyState, meter, navigationProgress],
};

export default category;
