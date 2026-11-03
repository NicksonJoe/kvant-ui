import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

declare global {
  // Read by Base UI (see @base-ui/react/global.d.ts).
  var BASE_UI_ANIMATIONS_DISABLED: boolean;
}

// Base UI: skip waiting for CSS animations (jsdom has none anyway).
globalThis.BASE_UI_ANIMATIONS_DISABLED = true;

// jsdom gaps used by Base UI / Floating UI and our components.
class ResizeObserverStub implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
globalThis.ResizeObserver ??= ResizeObserverStub;

window.matchMedia ??= (query: string): MediaQueryList => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
});

Element.prototype.scrollIntoView ??= function scrollIntoView() {};
// Base UI ScrollArea reads it when scrolling stops.
Element.prototype.getAnimations ??= () => [];

afterEach(() => cleanup());
