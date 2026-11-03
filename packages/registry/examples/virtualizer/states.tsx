import { RefreshCw, Search } from 'lucide-react';
import { useState } from 'react';
import { Avatar, Button, EmptyState, SegmentedControl, VirtualList } from '@/kvant';

const TOTAL = 100;
// rows that came before the failed page
const LOADED = 3;
const PAGE = 50;

function Client({ index }: { index: number }) {
  const name = `Клиент ${index + 1}`;
  return (
    <div className="flex h-full items-center gap-3 border-b border-separator px-5">
      <Avatar name={name} size={32} />
      <span className="flex-1 truncate text-label-md font-medium text-fg-1">{name}</span>
    </div>
  );
}

export default function VirtualizerStates() {
  const [state, setState] = useState<'loading' | 'empty' | 'error'>('loading');
  const [retrying, setRetrying] = useState(false);
  const [recovered, setRecovered] = useState(false);

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <SegmentedControl
        aria-label="Состояние списка"
        value={state}
        onValueChange={(value) => {
          setState(value);
          setRecovered(false);
        }}
        options={[
          { value: 'loading', label: 'Загрузка' },
          { value: 'empty', label: 'Пусто' },
          { value: 'error', label: 'Ошибка страницы' },
        ]}
        className="self-start"
      />
      <VirtualList
        aria-label="Клиенты"
        className="h-[280px] overflow-hidden rounded-xl bg-surface-1 shadow-raised"
        count={state === 'empty' ? 0 : TOTAL}
        loading={state === 'loading'}
        empty={
          <EmptyState
            icon={<Search />}
            title="Нет клиентов на «Щ»"
            description="Сбросьте фильтр или поищите по телефону."
            actions={
              <Button variant="secondary" size="sm" onClick={() => setState('loading')}>
                Сбросить фильтр
              </Button>
            }
          />
        }
        renderRow={(index) => {
          // the second page did not come: its first row carries the error, the rest wait as placeholders
          if (index < LOADED || recovered) return <Client index={index} />;
          if (index > LOADED) return null;
          return (
            <div className="flex h-full items-center justify-center gap-3 bg-danger-soft px-5 text-body-sm text-danger-soft-fg">
              Не удалось загрузить {PAGE} клиентов
              <Button
                variant="secondary"
                size="sm"
                leadingIcon={<RefreshCw />}
                loading={retrying}
                onClick={() => {
                  setRetrying(true);
                  setTimeout(() => {
                    setRetrying(false);
                    setRecovered(true);
                  }, 600);
                }}
              >
                Повторить
              </Button>
            </div>
          );
        }}
      />
    </div>
  );
}
