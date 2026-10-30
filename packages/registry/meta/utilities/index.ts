import type { CategoryMeta } from '../types';
import portal from './portal';
import composition from './composition';
import visuallyHidden from './visually-hidden';
import focusManagement from './focus-management';
import presence from './presence';
import themeProvider from './theme-provider';
import virtualizer from './virtualizer';

const category: CategoryMeta = {
  id: 'utilities',
  title: 'Утилиты',
  description: 'Невидимая основа: порталы, фокус, появление, тема и виртуализация.',
  components: [portal, composition, visuallyHidden, focusManagement, presence, themeProvider, virtualizer],
};

export default category;
