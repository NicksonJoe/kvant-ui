import { useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Seven z-index values for the whole library. Toast is above dialog so a confirmation shows over the window,
 * tooltip is above everything. 11–39 are left for product layers (floating panels, pinned columns); a new layer
 * takes a value from the scale, not «one above the neighbour», and never 999 or 9999.
 */
export const LAYERS = {
  /** Feed, cards, tables. */
  content: 0,
  /** Sticky headers, navigation bars. */
  sticky: 10,
  /** Menus, dropdown lists, popovers. */
  dropdown: 40,
  /** Scrim under a modal window. */
  overlay: 50,
  /** Dialogs, sheets, the command palette. */
  modal: 60,
  /** Toasts: seen over a dialog too. */
  toast: 70,
  /** Tooltips: always on top. */
  tooltip: 80,
} as const;
export type Layer = keyof typeof LAYERS;

const noSubscribe = () => () => {};

export interface PortalProps {
  /** Place on the z-index scale; the whole portal is one stacking context at that height. */
  layer: Layer;
  /** Where to render (default `<body>`): pass the element that carries a scoped `data-accent` and `data-mode`. */
  container?: Element | null;
  children: ReactNode;
}

/**
 * Renders children at the end of `<body>`, out of every `overflow: hidden`, `transform` and `contain` above them.
 * For layers of your own: Kvant overlays already portal through Base UI.
 */
export function Portal({ layer, container, children }: PortalProps) {
  // false on the server and while hydrating: <body> exists only on the client
  const client = useSyncExternalStore(noSubscribe, () => true, () => false);
  if (!client) return null;
  return createPortal(
    <div data-slot="portal" data-layer={layer} className="relative" style={{ zIndex: LAYERS[layer] }}>
      {children}
    </div>,
    container ?? document.body,
  );
}
