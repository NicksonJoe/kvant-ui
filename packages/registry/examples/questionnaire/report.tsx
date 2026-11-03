import { useEffect, useRef, useState } from 'react';
import { Conversation, ConversationTurn, Message, Questionnaire, Stream, type Question, type QuestionnaireAnswers } from '@/kvant';

const questions: Question[] = [
  {
    id: 'include',
    title: 'Что включить в отчёт?',
    label: 'Что включить',
    hint: 'Можно выбрать несколько',
    multiple: true,
    required: true,
    options: [
      { value: 'Оплаты', label: 'Оплаты' },
      { value: 'Воронка', label: 'Воронка' },
      { value: 'Просрочки', label: 'Просрочки' },
      { value: 'Прогноз на ноябрь', label: 'Прогноз на ноябрь' },
    ],
  },
  {
    id: 'format',
    title: 'В каком виде прислать?',
    label: 'Формат',
    required: true,
    options: [
      { value: 'Excel, лист на раздел', label: 'Excel, лист на раздел' },
      { value: 'PDF для руководителя', label: 'PDF для руководителя' },
      { value: 'Текстом в чат', label: 'Текстом в чат' },
    ],
  },
];

const REPORT =
  'В октябре оплачена одна сделка — «Съёмка весеннего каталога» для «Белой лодки» на 310 000 ₽. В работе 6 сделок на 8 424 900 ₽, две ждут шага:\n- «Навигация для ТЦ» — 5 дней\n- «Сайт для яхт-клуба» — 2 дня';
const TOKENS = REPORT.split(/(?<=\s)/);

// The agent asks right in the feed; once the answers are in, it writes the report as a stream.
export default function QuestionnaireReport() {
  const [answers, setAnswers] = useState<QuestionnaireAnswers | null>(null);
  const [shown, setShown] = useState(0);
  const [stopped, setStopped] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearInterval(timer.current), []);

  // 1–2 words every 80ms
  const write = () => {
    timer.current = window.setInterval(() => {
      setShown((value) => {
        const next = Math.min(value + 1 + (value % 2), TOKENS.length);
        if (next === TOKENS.length) window.clearInterval(timer.current);
        return next;
      });
    }, 80);
  };

  const complete = (next: QuestionnaireAnswers) => {
    setAnswers(next);
    setShown(0);
    setStopped(false);
    window.clearInterval(timer.current);
    // a beat of thinking before the first word
    timer.current = window.setTimeout(write, 1000);
  };

  const state = !answers ? null : stopped ? 'stopped' : shown === 0 ? 'thinking' : shown < TOKENS.length ? 'streaming' : 'done';

  return (
    <Conversation aria-label="Агент Норды" variant="agent" busy={state === 'thinking' || state === 'streaming'} className="h-[640px] w-full max-w-[560px] rounded-[28px] bg-overlay shadow-overlay">
      <Message direction="outgoing">Сделай отчёт по обороту за октябрь</Message>
      <ConversationTurn>
        <Stream state="done" text="Соберу. Уточню две вещи, чтобы отчёт был полезным:" />
        <Questionnaire title="Пара уточнений к отчёту" questions={questions} onComplete={complete} />
      </ConversationTurn>
      {state ? (
        <ConversationTurn>
          <Stream
            state={state}
            text={TOKENS.slice(0, shown).join('')}
            thinking={`Собираю: ${(answers?.include ?? []).join(', ').toLocaleLowerCase('ru')}…`}
            onStop={() => {
              window.clearInterval(timer.current);
              setStopped(true);
            }}
            onContinue={() => {
              setStopped(false);
              write();
            }}
          />
        </ConversationTurn>
      ) : null}
    </Conversation>
  );
}
