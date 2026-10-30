import { ChevronDown, ChevronUp, Download, FileUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button, IconButton, Tabs, TabsList, TabsPanel, TabsTab, Tooltip, cn } from '@/kvant';
import { CodeBlock } from '../components/CodeBlock';
import { generateCode, installCommand } from './codegen';
import type { ComposerNode } from './model';
import { stringifyDoc } from './serialize';

const TABS = ['code', 'install', 'json'] as const;
type Tab = (typeof TABS)[number];

/** Saves text as a file through a temporary link. */
export function download(fileName: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  // the download has started by the time the next task runs
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export interface ExportPanelProps {
  root: ComposerNode;
  open: boolean;
  onOpenChange(open: boolean): void;
  onImport(): void;
}

/** Live code of the canvas: JSX with imports, the install command and the document JSON. */
export function ExportPanel({ root, open, onOpenChange, onImport }: ExportPanelProps) {
  const [tab, setTab] = useState<Tab>('code');
  const code = useMemo(() => generateCode(root), [root]);
  const command = useMemo(() => installCommand(root), [root]);
  const json = useMemo(() => stringifyDoc(root), [root]);
  const panel = 'min-h-0 flex-1 overflow-hidden';
  const fill = 'h-full rounded-none shadow-none';

  return (
    <section aria-label="Экспорт" className={cn('flex shrink-0 flex-col border-t border-separator bg-surface-1', open && 'h-72')}>
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(TABS.find((item) => item === value) ?? 'code')}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="flex h-11 shrink-0 items-center gap-2 pr-2 pl-3">
          <TabsList aria-label="Экспорт" variant="pills">
            <TabsTab value="code" onClick={() => onOpenChange(true)}>
              Код
            </TabsTab>
            <TabsTab value="install" onClick={() => onOpenChange(true)}>
              Установка
            </TabsTab>
            <TabsTab value="json" onClick={() => onOpenChange(true)}>
              JSON
            </TabsTab>
          </TabsList>
          <div className="flex-1" />
          <Tooltip content={open ? 'Свернуть' : 'Развернуть'}>
            <IconButton
              size="sm"
              aria-label={open ? 'Свернуть панель кода' : 'Развернуть панель кода'}
              aria-expanded={open}
              icon={open ? <ChevronDown /> : <ChevronUp />}
              onClick={() => onOpenChange(!open)}
            />
          </Tooltip>
        </div>
        {open ? (
          <>
            <TabsPanel value="code" className={panel}>
              <CodeBlock flush code={code} title="Block.tsx" className={fill} maxHeight={288 - 88} />
            </TabsPanel>
            <TabsPanel value="install" className={cn(panel, 'flex flex-col gap-3 overflow-y-auto border-t border-separator p-4')}>
              {command ? (
                <>
                  <CodeBlock lang="bash" code={command} title="Компоненты Kvant для этого холста" />
                  <p className="max-w-[72ch] text-body-xs text-fg-3">
                    Если Kvant ещё не подключён, сначала выполните <code className="font-mono text-fg-2">npx kvant-ui init</code>. Иконки — из
                    lucide-react, он ставится вместе с компонентами.
                  </p>
                </>
              ) : (
                <p className="text-body-sm text-fg-3">На холсте только раскладка и текст — компоненты Kvant ставить не нужно.</p>
              )}
            </TabsPanel>
            <TabsPanel value="json" className={cn(panel, 'flex flex-col')}>
              <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-separator px-4 py-2">
                <p className="mr-auto text-caption text-fg-3">Документ Playground: его можно сохранить и открыть снова через «Импорт».</p>
                <Button variant="ghost" size="sm" leadingIcon={<FileUp />} onClick={onImport}>
                  Импорт
                </Button>
                <Button variant="secondary" size="sm" leadingIcon={<Download />} onClick={() => download('playground.json', json)}>
                  Скачать
                </Button>
              </div>
              <CodeBlock flush code={json} title="playground.json" className={cn(fill, 'min-h-0 flex-1')} maxHeight={288 - 88 - 49} />
            </TabsPanel>
          </>
        ) : null}
      </Tabs>
    </section>
  );
}
