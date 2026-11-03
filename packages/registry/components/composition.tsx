/**
 * The composition every Kvant part is built on, for parts of your own: `render` swaps the tag, props and handlers
 * merge, className joins, ref reaches the final tag, state turns into data-* attributes (`{ selected }` → `data-selected`).
 */
export { mergeProps } from '@base-ui/react/merge-props';
export { useRender } from '@base-ui/react/use-render';
