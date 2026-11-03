import { Copy, Download, RefreshCw, ThumbsDown, ThumbsUp } from 'lucide-react';
import { Fragment, useEffect, useRef, useState } from 'react';
import {
  Button,
  Conversation,
  ConversationTurn,
  Message,
  PromptInput,
  Stream,
  StreamAction,
  Trace,
  type StreamState,
  type TraceStepData,
} from '@/kvant';

const ANSWER = [
  'Анна, добрый день! Предлагаем продлить договор на 2027 год со скидкой 10 % — она действует до 15 ноября. В новый год войдут:',
  '- Тарифы с безлимитными правками макетов',
  '- Персональный менеджер на весь проект',
  '- Отчёт по итогам каждого квартала',
  '',
  'Если удобно, созвонимся в четверг и обсудим детали. Пришлю договор сразу после звонка.',
].join('\n');

// The answer arrives in batches of 1–3 words, as a model streams tokens.
const TOKENS = ANSWER.split(/(?<=\s)/);
const BATCH = [2, 1, 3, 2, 1, 2];

const doneSteps: TraceStepData[] = [
  { id: 'deals', title: 'Собрал сделки за октябрь', status: 'done', tool: 'crm.deals.search', detail: '7 сделок · 0,6 с' },
  { id: 'payments', title: 'Сверил оплаты со счетами', status: 'done', tool: 'billing.invoices', detail: '1,1 с' },
  { id: 'file', title: 'Собрал таблицу: оплаты, воронка, просрочки', status: 'done', tool: 'sheets.create', detail: '3 листа' },
];

interface Turn {
  id: string;
  prompt: string;
  state: StreamState;
  shown: number;
}

export default function ConversationAgent() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [liked, setLiked] = useState<'up' | 'down' | null>(null);
  const [inserted, setInserted] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const ids = useRef(0);
  const active = turns.at(-1);
  const busy = active?.state === 'thinking' || active?.state === 'streaming';

  useEffect(() => () => window.clearInterval(timer.current), []);

  const update = (id: string, change: (turn: Turn) => Partial<Turn>) =>
    setTurns((list) => list.map((turn) => (turn.id === id ? { ...turn, ...change(turn) } : turn)));

  const stream = (id: string) => {
    window.clearInterval(timer.current);
    let tick = 0;
    timer.current = window.setInterval(() => {
      tick += 1;
      setTurns((list) =>
        list.map((turn) => {
          if (turn.id !== id) return turn;
          const shown = Math.min(turn.shown + (BATCH[tick % BATCH.length] ?? 1), TOKENS.length);
          if (shown === TOKENS.length) window.clearInterval(timer.current);
          return { ...turn, shown, state: shown === TOKENS.length ? 'done' : 'streaming' };
        }),
      );
    }, 90);
  };

  const ask = (prompt: string) => {
    window.clearInterval(timer.current);
    const id = `t${(ids.current += 1)}`;
    setLiked(null);
    setInserted(false);
    setTurns((list) => [...list.map((turn) => (turn.state === 'streaming' || turn.state === 'thinking' ? { ...turn, state: 'stopped' as const } : turn)), { id, prompt, state: 'thinking', shown: 0 }]);
    timer.current = window.setTimeout(() => stream(id), 1200);
  };

  const stop = (id: string) => {
    window.clearInterval(timer.current);
    update(id, () => ({ state: 'stopped' }));
  };

  return (
    <div className="flex h-[640px] w-full max-w-[560px] flex-col overflow-hidden rounded-[28px] bg-overlay shadow-overlay">
      <div className="flex h-14 shrink-0 items-center gap-2 pr-3 pl-4">
        <p className="text-body-sm font-semibold text-fg-1">Агент Норды</p>
        <span className="inline-flex h-[22px] items-center rounded-full bg-fill-2 px-2 text-caption font-medium text-fg-2">Студия Север</span>
      </div>
      <Conversation aria-label="Агент Норды" variant="agent" busy={busy} className="flex-1">
        <p className="self-center text-caption font-medium text-fg-3">Сегодня, 14:28</p>
        <Message direction="outgoing">Сделай отчёт по обороту за октябрь</Message>
        <ConversationTurn>
          <Trace variant="inline" steps={doneSteps} time="за 14 с" />
          <Stream
            state="done"
            text="В октябре оплачена одна сделка — «Съёмка весеннего каталога» для «Белой лодки» на 310 000 ₽. В работе 6 сделок на 8 424 900 ₽, две ждут шага: «Навигация для ТЦ» — 5 дней, «Сайт для яхт-клуба» — 2 дня."
          >
            <div className="flex flex-col gap-3 rounded-lg bg-surface-1 p-3 shadow-raised">
              <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-success-soft font-mono text-[10px]/3 font-bold tracking-[0.02em] text-success-soft-fg">XLSX</span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="text-body-sm font-medium text-fg-1">Оборот · октябрь 2026.xlsx</p>
                  <p className="text-caption text-fg-3">3 листа · 18 КБ</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pl-13">
                <Button variant="secondary" size="sm" leadingIcon={<Download aria-hidden />}>
                  Скачать
                </Button>
                <Button variant="ghost" size="sm">
                  Открыть
                </Button>
              </div>
            </div>
          </Stream>
        </ConversationTurn>
        {turns.map((turn) => (
          <Fragment key={turn.id}>
            <Message direction="outgoing">{turn.prompt}</Message>
            <ConversationTurn>
              <Stream
                state={turn.state}
                text={TOKENS.slice(0, turn.shown).join('')}
                thinking="Смотрю историю переписки с клиентом…"
                onStop={() => stop(turn.id)}
                onContinue={() => {
                  update(turn.id, () => ({ state: 'streaming' }));
                  stream(turn.id);
                }}
                actions={
                  <>
                    <StreamAction icon={<Copy />} label="Скопировать" onClick={() => void navigator.clipboard?.writeText(ANSWER)} />
                    <StreamAction icon={<RefreshCw />} label="Ответить заново" onClick={() => ask(turn.prompt)} />
                    <StreamAction icon={<ThumbsUp />} label="Хороший ответ" pressed={liked === 'up'} onClick={() => setLiked(liked === 'up' ? null : 'up')} />
                    <StreamAction icon={<ThumbsDown />} label="Плохой ответ" pressed={liked === 'down'} onClick={() => setLiked(liked === 'down' ? null : 'down')} />
                    <span aria-hidden className="mr-2 ml-0.5 h-4 w-px bg-separator" />
                    <Button variant="soft" size="sm" onClick={() => setInserted(true)}>
                      {inserted ? 'Вставлено в письмо' : 'Вставить в письмо'}
                    </Button>
                  </>
                }
              />
            </ConversationTurn>
          </Fragment>
        ))}
      </Conversation>
      <div className="shrink-0 px-3 pb-3">
        <PromptInput placeholder="Спросите или поручите задачу…" defaultValue="Напиши Анне письмо о продлении — коротко, со скидкой" onSubmit={ask} />
      </div>
    </div>
  );
}
