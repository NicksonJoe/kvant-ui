// Per-viewer storage: the draft that survives a reload and «Мои блоки». Storage can be blocked or edited by
// hand, so every read is validated and every failure leaves the composer working.
import { useState } from 'react';
import { BLOCK_NAME } from './codegen';
import { CHILDREN, makeNode, withFreshIds, type ComposerNode } from './model';
import { parseDoc, toFile, type ComposerFile } from './serialize';

const DRAFT_KEY = 'kvant-playground-draft';
const BLOCKS_KEY = 'kvant-playground-blocks';

export interface SavedBlock {
  name: string;
  title: string;
  description: string;
  file: ComposerFile;
}

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // private mode or full storage: the draft simply is not kept
  }
}

export function loadDraft(): ComposerNode | null {
  const raw = read(DRAFT_KEY);
  try {
    return raw ? parseDoc(raw) : null;
  } catch {
    return null;
  }
}

export function saveDraft(root: ComposerNode): void {
  write(DRAFT_KEY, toFile(root));
}

function loadBlocks(): SavedBlock[] {
  const raw = read(BLOCKS_KEY);
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((entry: unknown): SavedBlock[] => {
    if (typeof entry !== 'object' || entry === null) return [];
    const { name, title, description, file } = entry as Record<string, unknown>;
    if (typeof name !== 'string' || !BLOCK_NAME.test(name) || typeof title !== 'string' || typeof description !== 'string') return [];
    try {
      return [{ name, title, description, file: toFile(parseDoc(file)) }];
    } catch {
      return [];
    }
  });
}

/** «Мои блоки»: saving under an existing name replaces that block. */
export function useSavedBlocks(): [readonly SavedBlock[], (block: SavedBlock) => void, (name: string) => void] {
  const [blocks, setBlocks] = useState(loadBlocks);
  const update = (next: SavedBlock[]) => {
    setBlocks(next);
    write(BLOCKS_KEY, next);
  };
  return [
    blocks,
    (block) => update([block, ...blocks.filter((item) => item.name !== block.name)]),
    (name) => update(blocks.filter((item) => item.name !== name)),
  ];
}

/** What a template or a saved page adds to the canvas: its only block, or all of them in a stack. */
export function blockContent(page: ComposerNode): ComposerNode {
  const blocks = page.slots[CHILDREN] ?? [];
  const only = blocks.length === 1 ? blocks[0] : undefined;
  return withFreshIds(only ?? { ...makeNode('stack', page.props), slots: { [CHILDREN]: blocks } });
}
