import { ChevronRight, File, Folder, FolderOpen } from 'lucide-react';
import { useId, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { useControllable } from '../lib/use-controllable';
import { Spinner } from './spinner';

export interface TreeNode {
  id: string;
  label: string;
  /** Default: a folder for branches (open when expanded), a file for leaves. */
  icon?: ReactNode;
  /** Right side, 12/16 fg-3 tabular: «24», «184 КБ», «Загрузка…». */
  meta?: ReactNode;
  children?: readonly TreeNode[];
  /** Children are being fetched: a spinner replaces the chevron. */
  loading?: boolean;
}

interface VisibleNode {
  node: TreeNode;
  level: number;
  parent: string | null;
  position: number;
  size: number;
}

function visibleNodes(nodes: readonly TreeNode[], expanded: ReadonlySet<string>, level = 1, parent: string | null = null): VisibleNode[] {
  return nodes.flatMap((node, index) => [
    { node, level, parent, position: index + 1, size: nodes.length },
    ...(node.children && expanded.has(node.id) ? visibleNodes(node.children, expanded, level + 1, node.id) : []),
  ]);
}

export interface TreeViewProps extends Omit<ComponentProps<'ul'>, 'children'> {
  'aria-label': string;
  nodes: readonly TreeNode[];
  expanded?: readonly string[];
  defaultExpanded?: readonly string[];
  onExpandedChange?: (ids: readonly string[]) => void;
  selected?: string | null;
  defaultSelected?: string | null;
  onSelectedChange?: (id: string) => void;
}

/**
 * Files and folders. ↑ ↓ move through rows, → opens a branch or enters it, ← closes it or goes to the parent,
 * Home / End jump, Enter selects. Rows 32 high, 24 per level, a guide line through the parent's chevron.
 */
export function TreeView({
  nodes,
  expanded: expandedProp,
  defaultExpanded = [],
  onExpandedChange,
  selected: selectedProp,
  defaultSelected = null,
  onSelectedChange,
  className,
  ...props
}: TreeViewProps) {
  const [expanded, setExpanded] = useControllable(expandedProp, defaultExpanded, onExpandedChange);
  const [selected, setSelected] = useControllable(selectedProp, defaultSelected);
  const [focused, setFocused] = useState<string | null>(null);
  const rows = useRef(new Map<string, HTMLLIElement>());
  const describedBy = useId();

  const open = new Set(expanded);
  const visible = visibleNodes(nodes, open);
  const tabStop = visible.find((item) => item.node.id === focused) ?? visible.find((item) => item.node.id === selected) ?? visible[0];

  const toggle = (id: string, next = !open.has(id)) => setExpanded(next ? [...expanded, id] : expanded.filter((item) => item !== id));
  const select = (id: string) => {
    setSelected(id);
    onSelectedChange?.(id);
  };
  const focus = (id: string | null | undefined) => {
    if (!id) return;
    setFocused(id);
    rows.current.get(id)?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLLIElement>, item: VisibleNode, index: number) => {
    const { node } = item;
    const branch = Boolean(node.children?.length) || node.loading;
    const isOpen = open.has(node.id);
    const actions: Record<string, () => void> = {
      ArrowDown: () => focus(visible[index + 1]?.node.id),
      ArrowUp: () => focus(visible[index - 1]?.node.id),
      Home: () => focus(visible[0]?.node.id),
      End: () => focus(visible[visible.length - 1]?.node.id),
      ArrowRight: () => {
        if (branch && !isOpen) toggle(node.id, true);
        else if (branch && node.children?.[0]) focus(node.children[0].id);
      },
      ArrowLeft: () => {
        if (branch && isOpen) toggle(node.id, false);
        else focus(item.parent);
      },
      Enter: () => select(node.id),
      ' ': () => select(node.id),
    };
    const action = actions[event.key];
    if (!action) return;
    event.preventDefault();
    action();
  };

  return (
    <ul data-slot="tree-view" role="tree" className={cn('flex flex-col', className)} {...props}>
      {visible.map((item, index) => {
        const { node, level } = item;
        const branch = Boolean(node.children?.length) || node.loading;
        const isOpen = open.has(node.id);
        const isSelected = selected === node.id;
        return (
          <li
            key={node.id}
            ref={(element) => {
              if (element) rows.current.set(node.id, element);
              else rows.current.delete(node.id);
            }}
            role="treeitem"
            aria-label={node.label}
            aria-level={level}
            aria-posinset={item.position}
            aria-setsize={item.size}
            aria-expanded={branch ? isOpen : undefined}
            aria-selected={isSelected}
            aria-busy={node.loading || undefined}
            aria-describedby={node.meta ? `${describedBy}-${index}` : undefined}
            tabIndex={node.id === tabStop?.node.id ? 0 : -1}
            onFocus={() => setFocused(node.id)}
            onKeyDown={(event) => onKeyDown(event, item, index)}
            onClick={() => {
              select(node.id);
              if (branch && !node.loading) toggle(node.id);
            }}
            style={{ paddingLeft: 8 + (level - 1) * 24 }}
            className={cn(
              'relative flex h-8 shrink-0 cursor-default select-none items-center gap-1.5 rounded-full pr-3 text-body-sm text-fg-1 hover:bg-fill-1 active:bg-fill-2',
              'aria-selected:bg-accent-soft aria-selected:font-medium aria-selected:text-accent-soft-fg',
              // rows of an opened branch fade in; hover colour stays instant-ish
              '[transition:background-color_var(--duration-micro)_var(--ease-hover),opacity_var(--duration-base)_var(--ease-standard)] starting:opacity-0',
            )}
          >
            {/* guide lines of the ancestors, through the centre of their chevrons */}
            {Array.from({ length: level - 1 }, (_, depth) => (
              <span key={depth} aria-hidden className="absolute inset-y-0 w-px bg-separator" style={{ left: 16 + depth * 24 }} />
            ))}
            <span aria-hidden className="grid w-4 shrink-0 place-items-center text-fg-3">
              {node.loading ? (
                <Spinner size={16} className="size-3.5" />
              ) : branch ? (
                <ChevronRight className={cn('size-3.5 stroke-[1.75] transition-[rotate] duration-(--duration-quick) ease-out', isOpen && 'rotate-90')} />
              ) : null}
            </span>
            <span aria-hidden className="grid shrink-0 place-items-center text-fg-2 [&_svg]:size-4 [&_svg]:stroke-[1.75] in-aria-selected:text-accent-soft-fg">
              {node.icon ?? (branch ? isOpen ? <FolderOpen /> : <Folder /> : <File />)}
            </span>
            <span className={cn('min-w-0 flex-1 truncate', branch && 'font-medium')}>{node.label}</span>
            {node.meta ? (
              <span id={`${describedBy}-${index}`} className="shrink-0 text-caption text-fg-3 tabular-nums">
                {node.meta}
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
