import type { CategoryMeta } from '../types';
import nodeCanvas from './node-canvas';
import canvasEditor from './canvas-editor';
import canvasNode from './canvas-node';
import stepPalette from './step-palette';
import canvasInsertMenu from './canvas-insert-menu';
import canvasInspector from './canvas-inspector';
import canvasRun from './canvas-run';
import canvasReview from './canvas-review';
import canvasCollab from './canvas-collab';

const category: CategoryMeta = {
  id: 'canvas',
  title: 'Канвас',
  description: 'Редактор автоматизаций: поверхность, узлы, порты, связи, палитра шагов и инспектор.',
  components: [nodeCanvas, canvasEditor, canvasNode, stepPalette, canvasInsertMenu, canvasInspector, canvasRun, canvasReview, canvasCollab],
};

export default category;
