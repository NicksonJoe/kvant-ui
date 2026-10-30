import type { CategoryMeta } from '../types';
import checkbox from './checkbox';
import radioGroup from './radio-group';
import switchMeta from './switch';
import choiceCard from './choice-card';
import segmentedControl from './segmented-control';
import slider from './slider';
import angleSlider from './angle-slider';
import rating from './rating';

const category: CategoryMeta = {
  id: 'selection',
  title: 'Выбор',
  description: 'Флажки, радиокнопки, переключатели, сегменты, слайдеры и оценка.',
  components: [checkbox, radioGroup, switchMeta, choiceCard, segmentedControl, slider, angleSlider, rating],
};

export default category;
