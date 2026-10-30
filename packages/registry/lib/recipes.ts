/** Shared class recipes for floating lists (Menu, Select, Combobox). */
export const popupSurface = 'kv-popup min-w-55 rounded-lg bg-overlay p-1 text-fg-1 shadow-overlay outline-none';

/** Geometry and states of a list row; pair with `listItemTone` (or another tone). */
export const listItem =
  'relative flex h-8 cursor-default select-none items-center gap-2.5 rounded-md px-2.5 text-body-sm outline-none pointer-coarse:h-11 ' +
  'data-highlighted:bg-fill-2 data-disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:stroke-[1.75]';

export const listItemTone = 'text-fg-1 [&>svg]:text-fg-2';

export const listGroupLabel = 'px-2.5 pt-1.5 pb-1 text-caption font-medium text-fg-3 select-none';

export const listSeparator = 'mx-1 my-1 h-px bg-separator';

/** Positioners float above page chrome. */
export const positioner = 'z-50 outline-none';
