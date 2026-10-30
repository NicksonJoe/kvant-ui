import { FileCode, FlaskConical, RotateCcw } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import {
  Badge,
  Button,
  Kbd,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
  buttonClasses,
} from '@/kvant';
import {
  FORCED_STATES,
  createPropReader,
  getComponent,
  initialValues,
  isReady,
  type PropMeta,
  type ReadyComponentMeta,
} from '@/kvant/meta';
import { Anatomy } from '../components/Anatomy';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { CodeBlock } from '../components/CodeBlock';
import { Controls } from '../components/Controls';
import { MotionReplay, MotionTable, MotionTokens } from '../components/Motion';
import { PaperLink } from '../components/PaperLink';
import { PrevNext } from '../components/PrevNext';
import { CompareSwitch, PreviewToolbar, Stage } from '../components/Stage';
import { StateMatrix } from '../components/StateMatrix';
import { StatusBadge } from '../components/StatusBadge';
import type { TocItem } from '../components/Toc';
import { PageShell } from '../layouts/SidebarLayout';
import { categoryOf, getPlayground, loadComponentSource, loadExampleSource, neighbours, renderExample, withImports } from '../lib/registry';
import { motionTokenNames } from '../lib/tokens';
import { NotFound } from './NotFound';
import { PlannedPage } from './PlannedPage';

const TABS = [
  { id: 'examples', title: 'Примеры' },
  { id: 'states', title: 'Состояния' },
  { id: 'anatomy', title: 'Анатомия' },
  { id: 'motion', title: 'Движение' },
  { id: 'api', title: 'API' },
  { id: 'a11y', title: 'Доступность' },
  { id: 'code', title: 'Код' },
  { id: 'install', title: 'Установка' },
] as const;
type TabId = (typeof TABS)[number]['id'];

const isTab = (value: string | null): value is TabId => TABS.some((tab) => tab.id === value);

export function ComponentRoute() {
  const { id = '' } = useParams();
  const meta = getComponent(id);
  if (!meta) return <NotFound />;
  return isReady(meta) ? <ReadyPage key={meta.id} meta={meta} /> : <PlannedPage key={meta.id} meta={meta} />;
}

function tocFor(meta: ReadyComponentMeta, tab: TabId): TocItem[] {
  const items: TocItem[] = [{ id: 'preview', title: 'Превью' }];
  const tabTitle = TABS.find((item) => item.id === tab)?.title ?? '';
  items.push({ id: 'tabs', title: tabTitle });
  const sub = (id: string, title: string): TocItem => ({ id, title, level: 3 });
  if (tab === 'examples') items.push(...meta.examples.map((example) => sub(`example-${example.id}`, example.title)));
  if (tab === 'states') {
    if (meta.matrix) items.push(sub('states-matrix', 'Матрица'));
    items.push(sub('states-list', 'Описание'));
  }
  if (tab === 'anatomy') items.push(sub('anatomy-parts', 'Части'));
  if (tab === 'motion') {
    if (isInteractive(meta)) items.push(sub('motion-replay', 'Живой образец'));
    items.push(sub('motion-table', 'Параметры'));
    if (motionTokenNames(meta.motion).length > 0) items.push(sub('motion-tokens', 'Токены'));
  }
  if (tab === 'code') items.push(sub('code-source', meta.source.file));
  if (tab === 'api') {
    items.push(...apiParts(meta).map((part) => sub(`api-${part.name}`, part.name)));
    items.push(sub('api-slots', 'Слоты'));
  }
  if (tab === 'a11y') items.push(sub('a11y-keyboard', 'Клавиатура'), sub('a11y-notes', 'Экранный диктор'));
  if (tab === 'install') items.push(sub('install-cli', 'Командой'), sub('install-deps', 'Зависимости'), sub('install-manual', 'Вручную'));
  return items;
}

function ReadyPage({ meta }: { meta: ReadyComponentMeta }) {
  const [params, setParams] = useSearchParams();
  const requested = params.get('tab');
  const tab: TabId = isTab(requested) ? requested : 'examples';
  const category = categoryOf(meta);
  const { prev, next } = neighbours(meta);

  return (
    <PageShell toc={tocFor(meta, tab)}>
      <header className="flex flex-col gap-4">
        <Breadcrumbs items={[{ label: 'Компоненты', to: '/components' }, { label: category.title, to: `/components#category-${category.id}` }, { label: meta.title }]} />
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-display-sm font-semibold text-fg-1">{meta.title}</h1>
          <StatusBadge status={meta.status} />
        </div>
        <p className="max-w-[72ch] text-body-lg text-fg-2">{meta.description}</p>
        <div className="flex flex-wrap gap-2">
          <PaperLink meta={meta} />
          <Link to="?tab=code#code-source" className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
            <FileCode />
            Исходник
          </Link>
          <Link to={`/playground?c=${meta.id}`} className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
            <FlaskConical />
            Открыть в Playground
          </Link>
        </div>
      </header>

      <LivePreview meta={meta} />

      <Tabs value={tab} onValueChange={(value) => setParams({ tab: String(value) }, { replace: true, preventScrollReset: true })}>
        <div id="tabs" className="-mx-1 overflow-x-auto px-1">
          <TabsList aria-label="Разделы компонента">
            {TABS.map((item) => (
              <TabsTab key={item.id} value={item.id}>
                {item.title}
              </TabsTab>
            ))}
          </TabsList>
        </div>
        <TabsPanel value="examples" className="pt-4">
          <div className="flex flex-col gap-10">
            {meta.examples.map((example) => (
              <ExampleBlock key={example.id} componentId={meta.id} exampleId={example.id} title={example.title} description={example.description} />
            ))}
          </div>
        </TabsPanel>
        <TabsPanel value="states" className="pt-4">
          <StatesTab meta={meta} />
        </TabsPanel>
        <TabsPanel value="anatomy" className="pt-4">
          <AnatomyTab meta={meta} />
        </TabsPanel>
        <TabsPanel value="motion" className="pt-4">
          <MotionTab meta={meta} />
        </TabsPanel>
        <TabsPanel value="api" className="pt-4">
          <ApiTab meta={meta} />
        </TabsPanel>
        <TabsPanel value="a11y" className="pt-4">
          <A11yTab meta={meta} />
        </TabsPanel>
        <TabsPanel value="code" className="pt-4">
          <SourceTab meta={meta} />
        </TabsPanel>
        <TabsPanel value="install" className="pt-4">
          <InstallTab meta={meta} />
        </TabsPanel>
      </Tabs>

      <PrevNext prev={prev} next={next} />
    </PageShell>
  );
}

function LivePreview({ meta }: { meta: ReadyComponentMeta }) {
  const playground = getPlayground(meta.id);
  const props = [...meta.props, ...(playground?.controls ?? [])];
  const [values, setValues] = useState(() => initialValues(props, playground?.initial));
  if (!playground) return null;
  const read = createPropReader(props, values);

  return (
    <section id="preview" aria-label="Превью" className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-2xl bg-surface-1 shadow-raised lg:flex">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-separator px-4 py-2.5">
            <span className="text-label-md font-medium text-fg-1">Превью</span>
            <PreviewToolbar />
          </div>
          <Stage className="min-h-80 flex-1 p-6 sm:p-10">{playground.render(read)}</Stage>
        </div>
        <div className="flex flex-col gap-4 border-t border-separator p-5 lg:w-72 lg:shrink-0 lg:border-t-0 lg:border-l">
          <div className="flex items-center justify-between gap-2">
            <span className="text-label-md font-medium text-fg-1">Свойства</span>
            <Button variant="ghost" size="xs" leadingIcon={<RotateCcw />} onClick={() => setValues(initialValues(props, playground.initial))}>
              Сбросить
            </Button>
          </div>
          <Controls props={props} values={values} onChange={(name, value) => setValues((current) => ({ ...current, [name]: value }))} />
        </div>
      </div>
      <CodeBlock code={withImports(playground.code(read))} title="Код примера" />
    </section>
  );
}

function SectionTitle({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h3 id={id} className="text-heading-sm font-semibold text-fg-1">
      {children}
    </h3>
  );
}

/** Raw source loaded on demand (Vite `?raw`); null until it arrives. */
function useSource(key: string, load: (key: string) => Promise<string>): string | null {
  const [loaded, setLoaded] = useState<{ key: string; text: string } | null>(null);
  useEffect(() => {
    let current = true;
    load(key).then(
      (text) => {
        if (current) setLoaded({ key, text });
      },
      () => undefined,
    );
    return () => {
      current = false;
    };
  }, [key, load]);
  return loaded?.key === key ? loaded.text : null;
}

const loadExample = (key: string) => {
  const [componentId = '', exampleId = ''] = key.split('/');
  return loadExampleSource(componentId, exampleId);
};

function ExampleBlock({ componentId, exampleId, title, description }: { componentId: string; exampleId: string; title: string; description?: string }) {
  const source = useSource(`${componentId}/${exampleId}`, loadExample);
  return (
    <section aria-labelledby={`example-${exampleId}`} className="flex flex-col gap-3">
      <SectionTitle id={`example-${exampleId}`}>{title}</SectionTitle>
      {description ? <p className="max-w-[72ch] text-body-sm text-fg-2">{description}</p> : null}
      <div className="overflow-hidden rounded-2xl bg-surface-1 shadow-raised">
        <Stage className="min-h-56 p-6 sm:p-10">{renderExample(componentId, exampleId)}</Stage>
        {source ? <CodeBlock flush code={source} title={`${exampleId}.tsx`} maxHeight={360} /> : null}
      </div>
    </section>
  );
}

function StatesTab({ meta }: { meta: ReadyComponentMeta }) {
  return (
    <div className="flex flex-col gap-8">
      {meta.matrix ? (
        <section aria-labelledby="states-matrix" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionTitle id="states-matrix">Матрица</SectionTitle>
            <CompareSwitch />
          </div>
          <p className="max-w-[72ch] text-body-sm text-fg-2">
            Каждая ячейка — живой компонент. Наведение, нажатие и фокус включены атрибутами <code className="font-mono text-caption">data-force-*</code>, остальное — свойствами.
          </p>
          <StateMatrix meta={meta} />
        </section>
      ) : null}
      <section aria-labelledby="states-list" className="flex flex-col gap-3">
        <SectionTitle id="states-list">Описание</SectionTitle>
        <Table density="compact" containerClassName="max-w-4xl">
          <TableHeader>
            <TableRow>
              <TableHead>Состояние</TableHead>
              <TableHead>Как выглядит</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {meta.states.map((state) => (
              <TableRow key={state.id}>
                <TableCell className="font-medium whitespace-nowrap">{state.label}</TableCell>
                <TableCell className="py-2.5 text-fg-2">{state.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}

function AnatomyTab({ meta }: { meta: ReadyComponentMeta }) {
  return (
    <section aria-labelledby="anatomy-parts" className="flex flex-col gap-3">
      <SectionTitle id="anatomy-parts">Части</SectionTitle>
      <p className="max-w-[72ch] text-body-sm text-fg-2">
        {meta.anatomyMap
          ? 'Наведите на часть, сфокусируйте её с клавиатуры или закрепите нажатием — на образце появится контур.'
          : 'Части — это элементы с атрибутом data-slot. Наведите на слот, чтобы обвести его на образце.'}
      </p>
      <Anatomy meta={meta} />
    </section>
  );
}

/** Hover, press and focus can be replayed only on a component that has them. */
function isInteractive(meta: ReadyComponentMeta): boolean {
  return meta.states.some((state) => FORCED_STATES.some((forced) => forced === state.id));
}

function MotionTab({ meta }: { meta: ReadyComponentMeta }) {
  const tokens = motionTokenNames(meta.motion);
  return (
    <div className="flex flex-col gap-8">
      {isInteractive(meta) ? (
        <section aria-labelledby="motion-replay" className="flex flex-col gap-3">
          <SectionTitle id="motion-replay">Живой образец</SectionTitle>
          <p className="max-w-[72ch] text-body-sm text-fg-2">
            «Повторить» проигрывает наведение, нажатие, отпускание и фокус. Образец можно трогать и самому, а ×0,25 замедляет все его длительности и
            пружины вчетверо.
          </p>
          <MotionReplay meta={meta} />
        </section>
      ) : null}
      <section aria-labelledby="motion-table" className="flex flex-col gap-3">
        <SectionTitle id="motion-table">Параметры</SectionTitle>
        <MotionTable rows={meta.motion} />
      </section>
      {tokens.length > 0 ? (
        <section aria-labelledby="motion-tokens" className="flex flex-col gap-3">
          <SectionTitle id="motion-tokens">Токены</SectionTitle>
          <p className="max-w-[72ch] text-body-sm text-fg-2">Значения живые: включите сниженное движение в «Среде», и они изменятся.</p>
          <MotionTokens names={tokens} />
        </section>
      ) : null}
    </div>
  );
}

function SourceTab({ meta }: { meta: ReadyComponentMeta }) {
  const source = useSource(meta.source.file, loadComponentSource);
  return (
    <section aria-labelledby="code-source" className="flex flex-col gap-3">
      <SectionTitle id="code-source">Исходник</SectionTitle>
      <p className="max-w-[72ch] text-body-sm text-fg-2">
        Файл <code className="font-mono text-caption">{meta.source.file}</code> целиком: скопируйте его в проект — дальше он ваш.
      </p>
      {source ? <CodeBlock code={source} title={meta.source.file} maxHeight={640} /> : <p className="text-body-sm text-fg-3">Загружаем…</p>}
    </section>
  );
}

function apiParts(meta: ReadyComponentMeta): { name: string; description?: string; props: readonly PropMeta[] }[] {
  return [{ name: meta.propsOf ?? meta.source.exports[0] ?? meta.id, props: meta.props }, ...(meta.parts ?? [])];
}

function typeText(prop: PropMeta): string {
  if (prop.signature) return prop.signature;
  if (prop.options) return prop.options.map((option) => (typeof option === 'number' ? String(option) : `'${option}'`)).join(' | ');
  if (prop.type === 'node') return 'ReactNode';
  if (prop.type === 'function') return '() => void';
  if (prop.type === 'enum') return 'string';
  return prop.type;
}

function PropsTable({ props }: { props: readonly PropMeta[] }) {
  if (props.length === 0) return <p className="text-body-sm text-fg-3">Своих свойств нет — передаются атрибуты элемента.</p>;
  return (
    <Table density="compact">
      <TableHeader>
        <TableRow>
          <TableHead>Свойство</TableHead>
          <TableHead>Тип</TableHead>
          <TableHead>По умолчанию</TableHead>
          <TableHead>Описание</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {props.map((prop) => (
          <TableRow key={prop.name}>
            <TableCell className="py-2.5 align-top font-mono text-caption whitespace-nowrap text-fg-1">
              {prop.name}
              {prop.required ? <span className="text-danger-soft-fg" title="Обязательное">*</span> : null}
            </TableCell>
            <TableCell className="max-w-64 py-2.5 align-top font-mono text-caption break-words text-accent-soft-fg">{typeText(prop)}</TableCell>
            <TableCell className="py-2.5 align-top font-mono text-caption whitespace-nowrap text-fg-2">
              {prop.default === undefined ? '—' : typeof prop.default === 'string' ? `'${prop.default}'` : String(prop.default)}
            </TableCell>
            <TableCell className="min-w-64 py-2.5 align-top text-body-xs text-fg-2">{prop.description}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ApiTab({ meta }: { meta: ReadyComponentMeta }) {
  return (
    <div className="flex flex-col gap-8">
      {apiParts(meta).map((part) => (
        <section key={part.name} aria-labelledby={`api-${part.name}`} className="flex flex-col gap-3">
          <h3 id={`api-${part.name}`} className="font-mono text-heading-xs font-semibold text-fg-1">
            {part.name}
          </h3>
          {part.description ? <p className="max-w-[72ch] text-body-sm text-fg-2">{part.description}</p> : null}
          <PropsTable props={part.props} />
        </section>
      ))}
      <section aria-labelledby="api-slots" className="flex flex-col gap-3">
        <SectionTitle id="api-slots">Слоты</SectionTitle>
        <p className="max-w-[72ch] text-body-sm text-fg-2">
          Атрибут <code className="font-mono text-caption">data-slot</code> — стабильная точка для стилей и тестов.
        </p>
        <Table density="compact" containerClassName="max-w-4xl">
          <TableBody>
            {meta.slots.map((slot) => (
              <TableRow key={slot.name}>
                <TableCell className="font-mono text-caption whitespace-nowrap text-fg-1">{slot.name}</TableCell>
                <TableCell className="py-2.5 text-body-xs text-fg-2">{slot.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}

function A11yTab({ meta }: { meta: ReadyComponentMeta }) {
  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="a11y-keyboard" className="flex flex-col gap-3">
        <SectionTitle id="a11y-keyboard">Клавиатура</SectionTitle>
        {meta.keyboard.length > 0 ? (
          <Table density="compact" containerClassName="max-w-4xl">
            <TableBody>
              {meta.keyboard.map((row) => (
                <TableRow key={row.keys.join(' ')}>
                  <TableCell className="w-56 py-2.5">
                    <span className="flex flex-wrap gap-1">
                      {row.keys.map((key) => (
                        <Kbd key={key}>{key}</Kbd>
                      ))}
                    </span>
                  </TableCell>
                  <TableCell className="py-2.5 text-body-xs text-fg-2">{row.action}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-body-sm text-fg-3">Своих клавиш нет — компонент не принимает фокус.</p>
        )}
      </section>
      <section aria-labelledby="a11y-notes" className="flex flex-col gap-3">
        <SectionTitle id="a11y-notes">Экранный диктор и ARIA</SectionTitle>
        <ul className="flex max-w-[72ch] list-disc flex-col gap-2 pl-5 text-body-sm text-fg-2 marker:text-fg-4">
          {meta.a11y.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function InstallTab({ meta }: { meta: ReadyComponentMeta }) {
  const file = meta.source.file.replace(/^components\//, '').replace(/\.tsx$/, '');
  const names = meta.source.exports.filter((name) => /^[A-Z][a-z]/.test(name)).slice(0, 4);
  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="install-cli" className="flex max-w-3xl flex-col gap-3">
        <SectionTitle id="install-cli">Командой</SectionTitle>
        <div className="flex items-center gap-2">
          <Badge tone="warning" variant="dot">
            CLI в работе
          </Badge>
          <span className="text-body-sm text-fg-3">Пока используйте ручную установку ниже.</span>
        </div>
        <CodeBlock lang="bash" code={`npx kvant-ui add ${meta.id}`} />
      </section>
      <section aria-labelledby="install-deps" className="flex max-w-3xl flex-col gap-3">
        <SectionTitle id="install-deps">Зависимости</SectionTitle>
        {meta.dependencies.npm.length > 0 ? (
          <CodeBlock lang="bash" code={`pnpm add ${meta.dependencies.npm.join(' ')}`} />
        ) : (
          <p className="text-body-sm text-fg-2">Внешних пакетов не нужно — только React.</p>
        )}
        {meta.dependencies.registry.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 text-body-sm text-fg-2">
            Использует компоненты Kvant:
            {meta.dependencies.registry.map((id) => (
              <Link key={id} to={`/components/${id}`} className={buttonClasses({ variant: 'soft', size: 'xs' })}>
                {getComponent(id)?.title ?? id}
              </Link>
            ))}
          </div>
        ) : null}
      </section>
      <section aria-labelledby="install-manual" className="flex max-w-3xl flex-col gap-3">
        <SectionTitle id="install-manual">Вручную</SectionTitle>
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-body-sm text-fg-2 marker:text-fg-3">
          <li>
            Скопируйте <Link to="?tab=code#code-source" className="text-accent-soft-fg underline-offset-3 hover:underline">{meta.source.file}</Link> в{' '}
            <code className="font-mono text-caption">src/kvant/{meta.source.file}</code>.
          </li>
          <li>
            Экспортируйте его из <code className="font-mono text-caption">src/kvant/index.ts</code>.
          </li>
          <li>Импортируйте там, где нужно.</li>
        </ol>
        <CodeBlock code={`// src/kvant/index.ts\nexport * from './components/${file}';\n\n// в приложении\nimport { ${names.join(', ')} } from '@/kvant';`} />
      </section>
    </div>
  );
}
