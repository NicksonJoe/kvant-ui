// Kvant registry metadata: one typed meta per component. Docs, the playground and the future composer read only this.
import actions from './actions';
import charts from './charts';
import chatAi from './chat-ai';
import content from './content';
import dataDisplay from './data-display';
import feedback from './feedback';
import forms from './forms';
import navigation from './navigation';
import overlays from './overlays';
import pickers from './pickers';
import selection from './selection';
import type { CategoryMeta, ComponentMeta, ReadyComponentMeta } from './types';
import utilities from './utilities';

export * from './paper';
export * from './playground';
export * from './types';

export const categories: readonly CategoryMeta[] = [
  actions,
  forms,
  selection,
  pickers,
  navigation,
  overlays,
  feedback,
  dataDisplay,
  charts,
  content,
  chatAi,
  utilities,
];

export const components: readonly ComponentMeta[] = categories.flatMap((category) => category.components);

export function isReady(meta: ComponentMeta): meta is ReadyComponentMeta {
  return meta.status !== 'planned';
}

export function getComponent(id: string): ComponentMeta | undefined {
  return components.find((meta) => meta.id === id);
}

export function getCategory(id: string): CategoryMeta | undefined {
  return categories.find((category) => category.id === id);
}
