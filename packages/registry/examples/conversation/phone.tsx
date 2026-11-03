import { useEffect, useRef, useState } from 'react';
import { AgentAvatar, CloseButton, Conversation, ConversationTurn, FocusTrap, Message, Portal, PromptInput, Stream } from '@/kvant';

const GREETING = 'Сегодня у вас три встречи и два просроченных счёта: «Ока» — 86 000 ₽ и «Парус» — 120 000 ₽. Напомнить клиентам?';

// Mounted with the panel: the field takes focus right after FocusTrap has placed it, as on desktop.
function PanelComposer({ onSubmit }: { onSubmit: (text: string) => void }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    box.current?.querySelector('textarea')?.focus();
  }, []);
  return (
    <div ref={box} className="shrink-0 px-3 pb-[max(12px,env(safe-area-inset-bottom))]">
      <PromptInput placeholder="Спросите или поручите задачу…" onSubmit={onSubmit} />
    </div>
  );
}

// On a phone the agent panel takes the whole screen and works as a modal: focus stays inside until it is closed.
export default function ConversationPhone() {
  const [open, setOpen] = useState(false);
  const [asked, setAsked] = useState<string[]>([]);

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className="kv-pressable inline-flex h-control-md items-center gap-2 rounded-full bg-control pr-4 pl-1 text-label-md font-medium text-fg-1 shadow-control hover:bg-control-hover"
      >
        <AgentAvatar size={28} />
        Открыть агента
      </button>
      {open ? (
        <Portal layer="modal">
          <FocusTrap
            role="dialog"
            aria-modal="true"
            aria-label="Агент Норды"
            onKeyDown={(event) => {
              if (event.key === 'Escape') setOpen(false);
            }}
            className="fixed inset-0 flex flex-col bg-overlay pt-[env(safe-area-inset-top)] text-fg-1"
          >
            <div className="flex h-14 shrink-0 items-center gap-2 border-b border-separator pr-3 pl-4">
              <p className="text-body-sm font-semibold">Агент Норды</p>
              <span className="inline-flex h-[22px] items-center rounded-full bg-fill-2 px-2 text-caption font-medium text-fg-2">Студия Север</span>
              <CloseButton className="ml-auto" onClick={() => setOpen(false)} />
            </div>
            <Conversation aria-label="Разговор с агентом" variant="agent" className="flex-1">
              <ConversationTurn>
                <Stream state="done" text={GREETING} />
              </ConversationTurn>
              {asked.map((text, index) => (
                <Message key={index} direction="outgoing">
                  {text}
                </Message>
              ))}
            </Conversation>
            <PanelComposer onSubmit={(text) => setAsked((list) => [...list, text])} />
          </FocusTrap>
        </Portal>
      ) : null}
    </>
  );
}
