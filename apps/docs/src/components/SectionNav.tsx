import { Search } from 'lucide-react';
import { Fragment, useState } from 'react';
import { Input, Switch } from '@/kvant';
import { categories, isReady } from '@/kvant/meta';
import { navComponents } from '../lib/registry';
import { DOC_GROUPS, docPath } from '../pages/docs';
import { NavGroupTitle, NavItem } from './NavItem';

export function DocsNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Документация" className="flex flex-col">
      {DOC_GROUPS.map((group) => (
        <div key={group.title} className="flex flex-col gap-0.5 first:[&>div:first-child]:pt-0">
          <NavGroupTitle>{group.title}</NavGroupTitle>
          {group.pages.map((page) => (
            <NavItem key={page.slug} to={docPath(page.slug)} end onNavigate={onNavigate}>
              {page.title}
            </NavItem>
          ))}
        </div>
      ))}
    </nav>
  );
}

export function ComponentsNav({ onNavigate }: { onNavigate?: () => void }) {
  const [query, setQuery] = useState('');
  const [readyOnly, setReadyOnly] = useState(false);
  const needle = query.trim().toLocaleLowerCase('ru');
  const groups = categories
    .map((category) => ({
      category,
      items: navComponents(category).filter(
        (meta) =>
          (!readyOnly || isReady(meta)) &&
          (!needle || meta.title.toLocaleLowerCase('ru').includes(needle) || meta.id.includes(needle)),
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <nav aria-label="Компоненты" className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 px-1">
        <Input
          size="sm"
          aria-label="Фильтр компонентов"
          placeholder="Фильтр"
          prefix={<Search />}
          value={query}
          onValueChange={setQuery}
          onClear={() => setQuery('')}
        />
        <Switch checked={readyOnly} onCheckedChange={setReadyOnly} className="px-2 text-label-sm text-fg-2">
          Только готовые
        </Switch>
      </div>
      <div className="flex flex-col">
        <NavItem to="/components" end onNavigate={onNavigate}>
          Все компоненты
        </NavItem>
        {groups.map(({ category, items }) => {
          const ready = category.components.filter(isReady).length;
          return (
            <div key={category.id} className="flex flex-col gap-0.5">
              <NavGroupTitle
                aside={
                  <span className="text-caption text-fg-3 tabular-nums" title={`Готово ${ready} из ${category.components.length}`}>
                    {ready}/{category.components.length}
                  </span>
                }
              >
                {category.title}
              </NavGroupTitle>
              {items.map((meta, index) => (
                <Fragment key={meta.id}>
                  {!isReady(meta) && (index === 0 || isReady(items[index - 1] ?? meta)) ? (
                    <span className="px-3 pt-2 pb-0.5 text-[11px]/4 text-fg-3">скоро</span>
                  ) : null}
                  <NavItem to={`/components/${meta.id}`} muted={!isReady(meta)} onNavigate={onNavigate}>
                    <span className="truncate">{meta.title}</span>
                  </NavItem>
                </Fragment>
              ))}
            </div>
          );
        })}
        {groups.length === 0 ? <p className="px-3 pt-4 text-body-xs text-fg-3">Ничего не найдено</p> : null}
      </div>
    </nav>
  );
}
