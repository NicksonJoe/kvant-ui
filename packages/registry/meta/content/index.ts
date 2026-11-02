import type { CategoryMeta } from '../types';
import typography from './typography';
import icon from './icon';
import image from './image';
import separator from './separator';
import scrollArea from './scroll-area';
import layout from './layout';
import resizable from './resizable';
import videoPlayer from './video-player';
import audioPlayer from './audio-player';

const category: CategoryMeta = {
  id: 'content',
  title: 'Контент и раскладка',
  description: 'Типографика, иконки, изображения, разделители и раскладка.',
  components: [typography, icon, image, separator, scrollArea, layout, resizable, videoPlayer, audioPlayer],
};

export default category;
