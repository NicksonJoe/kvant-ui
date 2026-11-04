import { useEffect, useRef, useState } from 'react';
import { AgentEmpty, AgentLauncher, AgentPanel, AgentStatus, Button, Conversation, ConversationTurn, Message, PromptInput, Stream, useAgentShortcut, type AgentLauncherStatus } from '@/kvant';

const suggestions = ['Сделай отчёт по обороту за октябрь', 'Какие сделки зависли и почему?', 'Что у меня сегодня?'];
const ANSWER = 'В работе 6 сделок на 8 424 900 ₽. Две ждут шага: «Навигация для ТЦ» — 5 дней, «Сайт для яхт-клуба» — 2 дня.';

// The whole loop: the launcher opens the panel, ⌘J toggles it, a request runs while the panel is closed and leaves a dot.
export default function AgentDock() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<AgentLauncherStatus>('idle');
  const [asked, setAsked] = useState<string | null>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  useAgentShortcut(() => setOpen((value) => !value));

  const ask = (text: string) => {
    setAsked(text);
    setStatus('working');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus((current) => (current === 'working' ? 'unread' : current)), 2500);
  };
  const show = () => {
    setOpen(true);
    if (status === 'unread') setStatus('idle');
  };

  return (
    <div className="flex min-h-[720px] w-full flex-col items-end justify-end gap-4 rounded-2xl bg-background p-6 shadow-[0_0_0_1px_var(--color-hairline)]">
      {open ? (
        <AgentPanel
          placement="inline"
          workspace="Студия Север"
          returnFocusRef={launcher}
          onClose={() => setOpen(false)}
          composer={<PromptInput placeholder="Спросите или поручите задачу…" sending={status === 'working'} onSubmit={ask} />}
        >
          {asked ? (
            <Conversation aria-label="Агент Норды" variant="agent" busy={status === 'working'}>
              <Message direction="outgoing">{asked}</Message>
              <ConversationTurn>
                <AgentStatus state={status === 'working' ? 'working' : 'done'} time={status === 'working' ? '2 с' : 'за 3 с'} />
                <Stream state={status === 'working' ? 'thinking' : 'done'} text={ANSWER} />
              </ConversationTurn>
            </Conversation>
          ) : (
            <AgentEmpty name="Анна" description="Знаю всё о «Студии Север»: клиентов, сделки, задачи и деньги." suggestions={suggestions} onSelect={ask} />
          )}
        </AgentPanel>
      ) : (
        <Button variant="secondary" size="sm" onClick={() => ask('Какие сделки зависли и почему?')}>
          Поручить в фоне
        </Button>
      )}
      <AgentLauncher ref={launcher} placement="inline" hidden={open} status={status} activity="Ищу зависшие сделки…" onClick={show} />
    </div>
  );
}
