import { ArrowDown, ArrowUp, BookOpen, ChevronRight, CopyPlus, Plus, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Button, IconButton, Kbd, Menu, MenuContent, MenuItem, MenuTrigger, SegmentedControl, Tooltip } from '@/kvant';
import { initialValues, type ForcedState, type PropValue } from '@/kvant/meta';
import { Controls, editableProps } from '../components/Controls';
import { createNode, getSpec, type SlotSpec } from './catalog';
import { CHILDREN, ROOT_ID, ancestors, type ComposerNode } from './model';
import { ICONS, ICON_NAMES, isIconName } from './primitives';

const MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent);
export const MOD = MAC ? '⌘' : 'Ctrl+';
export const ALT = MAC ? '⌥' : 'Alt+';

const STATE_LABELS: Record<ForcedState | 'rest', string> = { rest: 'Покой', hover: 'Наведение', pressed: 'Нажатие', focus: 'Фокус' };

/** What usually goes into a named slot. */
const SLOT_ITEMS = [
  { type: 'icon', label: 'Иконка' },
  { type: 'text', label: 'Текст' },
  { type: 'button', label: 'Кнопка' },
  { type: 'icon-button', label: 'Кнопка-иконка' },
  { type: 'badge', label: 'Бейдж' },
  { type: 'avatar', label: 'Аватар' },
  { type: 'input', label: 'Поле ввода' },
] as const;

export function nodeLabel(node: ComposerNode): string {
  if (node.id === ROOT_ID) return 'Страница';
  const title = getSpec(node.type)?.title ?? node.type;
  const text = node.type === 'text' ? node.props.text : node.type === 'icon' ? node.props.name : undefined;
  return typeof text === 'string' && text ? `${title}: ${text.length > 24 ? `${text.slice(0, 24)}…` : text}` : title;
}

export interface InspectorProps {
  root: ComposerNode;
  node: ComposerNode;
  onSelect(id: string): void;
  /** `merge` joins consecutive edits of one field into one undo step. */
  onProps(patch: Readonly<Record<string, PropValue | undefined>>, merge: string): void;
  onState(state: ForcedState | undefined): void;
  onAdd(slot: string, node: ComposerNode): void;
  onShift(delta: -1 | 1): void;
  onDuplicate(): void;
  onDelete(): void;
}

/** Props from the meta (and the layout props of primitives), slots, the forced state and the node actions. */
export function Inspector({ root, node, onSelect, onProps, onState, onAdd, onShift, onDuplicate, onDelete }: InspectorProps) {
  const spec = getSpec(node.type);
  if (!spec) return null;
  const isRoot = node.id === ROOT_ID;
  const path = ancestors(root, node.id);
  const values = { ...initialValues(spec.props), ...node.props };
  const slots = spec.slots.filter((slot) => spec.kind !== 'primitive' || slot.name !== CHILDREN);
  const signature = spec.kind === 'composable' ? `<${spec.exportName}>` : spec.kind === 'leaf' ? `<${spec.meta.propsOf ?? spec.meta.source.exports[0] ?? spec.meta.id}>` : node.type;

  return (
    <div className="flex flex-col gap-6 p-5">
      <div className="flex flex-col gap-3">
        {path.length > 0 ? (
          <nav aria-label="Путь к элементу">
            <ol className="flex flex-wrap items-center gap-0.5 text-caption text-fg-3">
              {path.map((item) => (
                <li key={item.id} className="flex items-center gap-0.5">
                  <button type="button" onClick={() => onSelect(item.id)} className="rounded-full px-1.5 py-0.5 hover:bg-fill-1 hover:text-fg-1">
                    {nodeLabel(item)}
                  </button>
                  <ChevronRight aria-hidden className="size-3" />
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <h2 className="truncate text-heading-xs font-semibold text-fg-1">{isRoot ? 'Страница' : spec.title}</h2>
            <p className="truncate font-mono text-caption text-fg-3">{isRoot ? 'Корень: стек на всю рамку' : signature}</p>
          </div>
          {isRoot ? null : (
            <div className="flex shrink-0 items-center">
              <Tooltip content="Выше" shortcut={`${ALT}↑`}>
                <IconButton size="sm" aria-label="Переставить выше" icon={<ArrowUp />} onClick={() => onShift(-1)} />
              </Tooltip>
              <Tooltip content="Ниже" shortcut={`${ALT}↓`}>
                <IconButton size="sm" aria-label="Переставить ниже" icon={<ArrowDown />} onClick={() => onShift(1)} />
              </Tooltip>
              <Tooltip content="Дублировать" shortcut={`${MOD}D`}>
                <IconButton size="sm" aria-label="Дублировать" icon={<CopyPlus />} onClick={onDuplicate} />
              </Tooltip>
              <Tooltip content="Удалить" shortcut="⌫">
                <IconButton size="sm" variant="danger-soft" aria-label="Удалить" icon={<Trash2 />} onClick={onDelete} />
              </Tooltip>
            </div>
          )}
        </div>
      </div>

      {node.type === 'icon' ? (
        <Group title="Иконка">
          <IconPicker value={String(values.name)} onChange={(name) => onProps({ name }, `${node.id}:name`)} />
        </Group>
      ) : null}

      <Group title={spec.kind === 'primitive' ? 'Раскладка и свойства' : 'Свойства'}>
        {editableProps(spec.props).length > 0 ? (
          <Controls props={spec.props} values={values} onChange={(name, value) => onProps({ [name]: value }, `${node.id}:${name}`)} />
        ) : (
          <p className="text-body-xs text-fg-3">Простых свойств нет: компонент показан как в документации.</p>
        )}
      </Group>

      {slots.length > 0 ? (
        <Group title="Слоты" note="Перетащите элемент в слот на холсте или добавьте его отсюда.">
          {slots.map((slot) => (
            <SlotRow key={slot.name} slot={slot} nodes={node.slots[slot.name] ?? []} onSelect={onSelect} onAdd={(child) => onAdd(slot.name, child)} />
          ))}
        </Group>
      ) : null}

      {spec.states.length > 0 ? (
        <Group title="Состояние" note="Только на холсте — в код не попадает.">
          <SegmentedControl<ForcedState | 'rest'>
            aria-label="Состояние на холсте"
            className="w-full [&>[data-slot=segment]]:flex-1 [&>[data-slot=segment]]:px-1.5"
            value={node.state ?? 'rest'}
            onValueChange={(value) => onState(value === 'rest' ? undefined : value)}
            options={(['rest', ...spec.states] as const).map((value) => ({ value, label: STATE_LABELS[value] }))}
          />
        </Group>
      ) : null}

      {spec.kind === 'primitive' ? null : (
        <Link to={`/components/${spec.meta.id}`} className="inline-flex items-center gap-1.5 self-start text-label-sm text-accent-soft-fg hover:underline">
          <BookOpen aria-hidden className="size-4" />
          Документация компонента
        </Link>
      )}

      <Group title="Клавиши">
        <dl className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 text-caption text-fg-3">
          <Shortcut keys={['↑', '↓']} action="соседний элемент (на холсте)" />
          <Shortcut keys={[`${ALT}↑`, `${ALT}↓`]} action="переставить" />
          <Shortcut keys={[`${MOD}D`]} action="дублировать" />
          <Shortcut keys={['⌫']} action="удалить" />
          <Shortcut keys={[`${MOD}Z`, `⇧${MOD}Z`]} action="отменить, вернуть" />
          <Shortcut keys={['Esc']} action="выбрать родителя" />
        </dl>
      </Group>
    </div>
  );
}

function Group({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-separator pt-5">
      <div className="flex flex-col gap-1">
        <h3 className="text-label-md font-semibold text-fg-1">{title}</h3>
        {note ? <p className="text-caption text-fg-3">{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Shortcut({ keys, action }: { keys: readonly string[]; action: string }) {
  return (
    <>
      <dt className="flex gap-1">
        {keys.map((key) => (
          <Kbd key={key}>{key}</Kbd>
        ))}
      </dt>
      <dd>{action}</dd>
    </>
  );
}

function SlotRow({ slot, nodes, onSelect, onAdd }: { slot: SlotSpec; nodes: readonly ComposerNode[]; onSelect(id: string): void; onAdd(node: ComposerNode): void }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-caption text-fg-2">
          {slot.name}
          {slot.required ? <span className="text-danger-soft-fg" title="Обязательный слот"> *</span> : null}
        </span>
        <Menu>
          <MenuTrigger render={<Button variant="ghost" size="xs" leadingIcon={<Plus />} aria-label={`Добавить в слот ${slot.name}`} />}>Добавить</MenuTrigger>
          <MenuContent align="end">
            {SLOT_ITEMS.map((item) => (
              <MenuItem key={item.type} onClick={() => onAdd(createNode(item.type))}>
                {item.label}
              </MenuItem>
            ))}
          </MenuContent>
        </Menu>
      </div>
      {nodes.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {nodes.map((child) => (
            <button
              key={child.id}
              type="button"
              onClick={() => onSelect(child.id)}
              className="max-w-full truncate rounded-full bg-fill-1 px-2.5 py-1 text-caption text-fg-2 hover:bg-fill-2 hover:text-fg-1"
            >
              {nodeLabel(child)}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-caption text-fg-3">{slot.description}</p>
      )}
    </div>
  );
}

function IconPicker({ value, onChange }: { value: string; onChange(name: string): void }) {
  return (
    <div role="group" aria-label="Иконка" className="grid grid-cols-8 gap-1">
      {ICON_NAMES.map((name) => {
        const Icon = ICONS[name];
        const current = isIconName(value) && value === name;
        return (
          <Tooltip key={name} content={name}>
            <button
              type="button"
              aria-label={name}
              aria-pressed={current}
              onClick={() => onChange(name)}
              className="grid aspect-square place-items-center rounded-lg text-fg-2 transition-colors duration-(--duration-micro) hover:bg-fill-1 hover:text-fg-1 aria-pressed:bg-accent-soft aria-pressed:text-accent-soft-fg"
            >
              <Icon aria-hidden className="size-4" />
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}
