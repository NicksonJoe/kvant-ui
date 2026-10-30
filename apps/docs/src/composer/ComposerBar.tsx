import {
  BookmarkPlus,
  Ellipsis,
  Eye,
  FileUp,
  Link2,
  Monitor,
  Moon,
  PanelLeft,
  PanelRight,
  Redo2,
  SlidersHorizontal,
  Smartphone,
  Sun,
  Tablet,
  Trash2,
  Undo2,
} from 'lucide-react';
import { Link } from 'react-router';
import {
  Button,
  DEFAULT_THEME,
  IconButton,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
  SegmentedControl,
  Select,
  ToggleButton,
  Tooltip,
} from '@/kvant';
import { EnvironmentPanel } from '../components/EnvironmentPanel';
import { Logo } from '../components/Logo';
import { ACCENT_NAMES, resolvedMode, useEnvironment } from '../lib/environment';
import { MOD } from './Inspector';

export const VIEWPORTS = ['402', '768', '1440'] as const;
export type Viewport = (typeof VIEWPORTS)[number];
export const ZOOMS = ['fit', '50', '75', '100', '125', '150'] as const;
export type Zoom = (typeof ZOOMS)[number];

const VIEWPORT_ICONS = { '402': <Smartphone aria-hidden className="size-3.5" />, '768': <Tablet aria-hidden className="size-3.5" />, '1440': <Monitor aria-hidden className="size-3.5" /> };

export interface ComposerBarProps {
  desktop: boolean;
  canUndo: boolean;
  canRedo: boolean;
  canClear: boolean;
  onUndo(): void;
  onRedo(): void;
  onClear(): void;
  viewport: Viewport;
  onViewport(viewport: Viewport): void;
  zoom: Zoom;
  onZoom(zoom: Zoom): void;
  preview: boolean;
  onPreview(preview: boolean): void;
  onImport(): void;
  onShare(): void;
  onSaveBlock(): void;
  onPalette(): void;
  onInspector(): void;
}

/** The Playground's own bar: history, environment, viewport and zoom, preview and export. */
export function ComposerBar(props: ComposerBarProps) {
  const { desktop, canUndo, canRedo, canClear, onUndo, onRedo, onClear, viewport, onViewport, zoom, onZoom, preview, onPreview } = props;

  return (
    <header className="flex h-14 shrink-0 items-center gap-1.5 border-b border-separator bg-surface-1 px-3">
      {desktop ? null : <IconButton size="sm" aria-label="Палитра" icon={<PanelLeft />} onClick={props.onPalette} />}
      <Link to="/docs" className="flex shrink-0 items-center gap-2 rounded-full pr-1 text-label-lg font-semibold text-fg-1" aria-label="Kvant — к документации">
        <Logo />
        <span className="max-sm:hidden">Kvant</span>
      </Link>
      <span aria-hidden className="text-fg-4 max-sm:hidden">
        /
      </span>
      <h1 className="text-label-lg font-semibold text-fg-1 max-sm:hidden">Playground</h1>

      <div className="ml-2 flex items-center">
        <Tooltip content="Отменить" shortcut={`${MOD}Z`}>
          <IconButton size="sm" aria-label="Отменить" icon={<Undo2 />} disabled={!canUndo} onClick={onUndo} />
        </Tooltip>
        <Tooltip content="Вернуть" shortcut={`⇧${MOD}Z`}>
          <IconButton size="sm" aria-label="Вернуть" icon={<Redo2 />} disabled={!canRedo} onClick={onRedo} />
        </Tooltip>
        <Tooltip content="Очистить холст">
          <IconButton size="sm" aria-label="Очистить холст" icon={<Trash2 />} disabled={!canClear} onClick={onClear} />
        </Tooltip>
      </div>

      <div className="flex-1" />

      <SegmentedControl<Viewport>
        aria-label="Ширина экрана"
        size="sm"
        className="max-md:hidden"
        value={viewport}
        onValueChange={onViewport}
        options={VIEWPORTS.map((value) => ({
          value,
          label: (
            <>
              {VIEWPORT_ICONS[value]}
              {value}
            </>
          ),
        }))}
      />
      <Select<Zoom>
        aria-label="Масштаб"
        size="sm"
        className="w-32 max-lg:hidden"
        value={zoom}
        onValueChange={(next) => onZoom(next ?? 'fit')}
        options={ZOOMS.map((value) => ({ value, label: value === 'fit' ? 'По ширине' : `${value} %` }))}
      />
      <Tooltip content={preview ? 'Вернуться к правке' : 'Просмотр: компоненты живые, без рамок выбора'}>
        <ToggleButton size="sm" icon={<Eye />} pressed={preview} onPressedChange={onPreview} className="max-sm:hidden">
          Просмотр
        </ToggleButton>
      </Tooltip>

      <EnvironmentControls />

      <div className="ml-1 flex items-center gap-1.5 max-md:hidden">
        <Button variant="ghost" size="sm" leadingIcon={<FileUp />} onClick={props.onImport}>
          Импорт
        </Button>
        <Tooltip content="Ссылка с холстом внутри — откроется у любого">
          <Button variant="secondary" size="sm" leadingIcon={<Link2 />} onClick={props.onShare}>
            Поделиться
          </Button>
        </Tooltip>
        <Button size="sm" leadingIcon={<BookmarkPlus />} onClick={props.onSaveBlock}>
          Сохранить как блок
        </Button>
      </div>
      <Menu>
        <MenuTrigger render={<IconButton size="sm" aria-label="Ещё действия" icon={<Ellipsis />} className="md:hidden" />} />
        <MenuContent align="end">
          <MenuItem icon={<Eye />} onClick={() => onPreview(!preview)}>
            {preview ? 'Вернуться к правке' : 'Просмотр'}
          </MenuItem>
          <MenuItem icon={<FileUp />} onClick={props.onImport}>
            Импорт
          </MenuItem>
          <MenuItem icon={<Link2 />} onClick={props.onShare}>
            Поделиться
          </MenuItem>
          <MenuItem icon={<BookmarkPlus />} onClick={props.onSaveBlock}>
            Сохранить как блок
          </MenuItem>
        </MenuContent>
      </Menu>
      {desktop ? null : <IconButton size="sm" aria-label="Инспектор" icon={<PanelRight />} onClick={props.onInspector} />}
    </header>
  );
}

/** Theme, mode, font, shape and density for the canvas (and the whole site, like the docs «Среда»). */
function EnvironmentControls() {
  const [theme, setTheme] = useEnvironment();
  const mode = resolvedMode(theme);

  return (
    <div className="flex items-center">
      <Tooltip content={mode === 'dark' ? 'Светлый режим' : 'Тёмный режим'}>
        <IconButton
          size="sm"
          aria-label={mode === 'dark' ? 'Включить светлый режим' : 'Включить тёмный режим'}
          icon={mode === 'dark' ? <Sun /> : <Moon />}
          onClick={() => setTheme({ mode: mode === 'dark' ? 'light' : 'dark' })}
        />
      </Tooltip>
      <Popover>
        <PopoverTrigger
          render={<Button variant="ghost" size="sm" leadingIcon={<SlidersHorizontal />} aria-label={`Среда: тема ${ACCENT_NAMES[theme.accent]}`} />}
        >
          <span data-accent={theme.accent} data-mode={mode} aria-hidden className="size-3 rounded-full bg-accent max-sm:hidden" />
          <span className="max-xl:hidden">{ACCENT_NAMES[theme.accent]}</span>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80">
          <div className="flex items-center justify-between">
            <PopoverTitle>Среда</PopoverTitle>
            <Button variant="link" size="sm" onClick={() => setTheme(DEFAULT_THEME)}>
              Сбросить
            </Button>
          </div>
          <EnvironmentPanel />
        </PopoverContent>
      </Popover>
    </div>
  );
}
