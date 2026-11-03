import { Check, CircleAlert, CircleCheck, Plus } from 'lucide-react';
import { Fragment, useId, useLayoutEffect, useRef, useState, type ComponentProps, type FocusEvent, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Button } from './button';
import { AgentAvatar } from './conversation';
import { FocusGroup } from './focus-management';
import { VisuallyHidden } from './visually-hidden';

/* ---------- Pure logic ---------- */

export interface QuestionOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface Question {
  id: string;
  /** The question itself: «Что упомянуть в письме?». */
  title: string;
  /** Short name for the answered row: «Тон письма: Дружелюбный» (default: the title). */
  label?: string;
  /** Under the question: «Можно выбрать несколько». */
  hint?: string;
  /** Several answers (checkboxes) instead of one (radios). */
  multiple?: boolean;
  /** Without an answer it cannot be passed; otherwise «Пропустить» is offered. */
  required?: boolean;
  /** «Свой вариант»: the user types an option of their own. */
  custom?: boolean;
  options: readonly QuestionOption[];
}

export type QuestionnaireAnswers = Readonly<Record<string, readonly string[]>>;

export interface QuestionnaireState {
  /** Index of the open question; `questions.length` once everything is answered. */
  step: number;
  answers: QuestionnaireAnswers;
  /** Options the user typed, per question. */
  extra: Readonly<Record<string, readonly QuestionOption[]>>;
  /** Questions passed with «Продолжить» or «Пропустить», in that order. */
  answered: readonly string[];
  error: string | null;
}

export type QuestionnaireAction =
  | { type: 'toggle'; value: string }
  | { type: 'add'; label: string }
  | { type: 'next' }
  | { type: 'skip' }
  | { type: 'edit'; index: number };

/** The next question without an answer after `after`, then from the start; past the end when there is none. */
function firstOpen(questions: readonly Question[], answered: readonly string[], after = -1): number {
  const open = (index: number) => {
    const question = questions[index];
    return question !== undefined && !answered.includes(question.id);
  };
  for (let index = after + 1; index < questions.length; index++) if (open(index)) return index;
  for (let index = 0; index <= after; index++) if (open(index)) return index;
  return questions.length;
}

const optionsOf = (question: Question, state: QuestionnaireState) => [...question.options, ...(state.extra[question.id] ?? [])];

export function initialQuestionnaire(questions: readonly Question[], answers: QuestionnaireAnswers = {}): QuestionnaireState {
  const answered = questions.filter((question) => answers[question.id] !== undefined).map((question) => question.id);
  const extra: Record<string, QuestionOption[]> = {};
  for (const question of questions) {
    const own = (answers[question.id] ?? []).filter((value) => !question.options.some((option) => option.value === value));
    if (own.length) extra[question.id] = own.map((value) => ({ value, label: value }));
  }
  return { step: firstOpen(questions, answered), answers: { ...answers }, extra, answered, error: null };
}

/** One user action on the questionnaire: choose, add an own option, go on, skip, go back to an answer. */
export function questionnaireStep(questions: readonly Question[], state: QuestionnaireState, action: QuestionnaireAction): QuestionnaireState {
  if (action.type === 'edit') {
    const target = questions[action.index];
    return target && state.answered.includes(target.id) ? { ...state, step: action.index, error: null } : state;
  }
  const question = questions[state.step];
  if (!question) return state;
  const current = state.answers[question.id] ?? [];
  const answer = (values: readonly string[], extra = state.extra) => ({ ...state, extra, answers: { ...state.answers, [question.id]: values }, error: null });
  const move = (values: readonly string[]) => {
    const answered = state.answered.includes(question.id) ? state.answered : [...state.answered, question.id];
    return { ...answer(values), answered, step: firstOpen(questions, answered, state.step) };
  };

  switch (action.type) {
    case 'toggle': {
      const option = optionsOf(question, state).find((item) => item.value === action.value);
      if (!option || option.disabled) return state;
      if (!question.multiple) return answer([option.value]);
      return answer(current.includes(option.value) ? current.filter((value) => value !== option.value) : [...current, option.value]);
    }
    case 'add': {
      const label = action.label.trim();
      if (!label) return { ...state, error: 'Напишите вариант' };
      // a repeat chooses the option that is already there and never unchooses it
      const same = optionsOf(question, state).find((item) => item.label.toLocaleLowerCase('ru') === label.toLocaleLowerCase('ru'));
      const value = same?.value ?? label;
      const extra = same ? state.extra : { ...state.extra, [question.id]: [...(state.extra[question.id] ?? []), { value, label }] };
      return answer(question.multiple ? (current.includes(value) ? current : [...current, value]) : [value], extra);
    }
    case 'next':
      if (question.required && !current.length) return { ...state, error: question.multiple ? 'Выберите хотя бы один вариант' : 'Выберите вариант' };
      return move(current);
    case 'skip':
      return question.required ? state : move([]);
  }
}

/* ---------- Parts ---------- */

const drawn = '[&_path]:[stroke-dasharray:23] [&_path]:transition-[stroke-dashoffset] [&_path]:duration-(--duration-quick) [&_path]:ease-out starting:[&_path]:[stroke-dashoffset:23]';

const chip = 'kv-pressable inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full text-body-xs/4 font-medium aria-disabled:pointer-events-none aria-disabled:opacity-50';
const chipOff = 'bg-control px-3 text-fg-1 shadow-control hover:bg-control-hover active:bg-control-pressed active:shadow-control-pressed';
const chipOn = 'bg-accent-soft pr-3 pl-2.5 text-accent-soft-fg shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-accent)_35%,transparent)] hover:bg-accent-soft-hover';

function AnswerRow({ name, value, onEdit }: { name: string; value: string; onEdit: () => void }) {
  return (
    <div
      data-slot="questionnaire-answer"
      className="flex min-h-10 shrink-0 items-center gap-2.5 rounded-md bg-fill-1 py-1.5 pr-1 pl-3 transition-opacity duration-(--duration-base) ease-standard starting:opacity-0"
    >
      <CircleCheck aria-hidden className="size-4 shrink-0 stroke-[1.75] text-success" />
      <p className="min-w-0 flex-1 text-body-sm text-fg-2">
        {name}: {value ? <span className="font-medium text-fg-1">{value}</span> : <span className="text-fg-3">не указано</span>}
      </p>
      <button
        type="button"
        aria-label={`Изменить: ${name}`}
        onClick={onEdit}
        className="kv-pressable h-7 shrink-0 rounded-full px-2.5 text-caption font-medium text-fg-2 hover:bg-fill-2 hover:text-fg-1 active:bg-fill-3"
      >
        Изменить
      </button>
    </div>
  );
}

const ARROWS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']);

export interface QuestionnaireProps extends Omit<ComponentProps<'div'>, 'title' | 'children'> {
  /** What the agent asks for: «Пара уточнений, чтобы письмо попало в точку». */
  title: ReactNode;
  questions: readonly Question[];
  /** Answers known before: those questions start folded. */
  defaultAnswers?: QuestionnaireAnswers;
  /** After the last question, and again after any answer is changed. */
  onComplete: (answers: QuestionnaireAnswers) => void;
  /** After «Выбрано N» in the footer. */
  footnote?: string;
}

/**
 * Clarifying questions of the agent: one question at a time with choice chips, answered ones fold into rows and
 * stay editable. Chips move by arrows; a required question says why it cannot be passed.
 */
export function Questionnaire({
  title,
  questions,
  defaultAnswers,
  onComplete,
  footnote = 'ответы можно поменять до отправки',
  className,
  ...props
}: QuestionnaireProps) {
  const [state, setState] = useState(() => initialQuestionnaire(questions, defaultAnswers));
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLParagraphElement>(null);
  const customButton = useRef<HTMLButtonElement>(null);
  // where focus goes after the render an action caused
  const focusNext = useRef<'heading' | 'choice' | 'custom' | 'root' | null>(null);
  const arrowed = useRef(false);
  // Enter and Esc already closed the field: its blur must not add the draft again
  const closed = useRef(false);
  const id = useId();
  const done = state.step >= questions.length;
  const question = questions[state.step];

  useLayoutEffect(() => {
    const target = focusNext.current;
    focusNext.current = null;
    if (target === 'heading') heading.current?.focus();
    else if (target === 'custom') customButton.current?.focus();
    else if (target === 'root') root.current?.focus();
    else if (target === 'choice') {
      const choices = Array.from(root.current?.querySelectorAll<HTMLElement>('[role=radio], [role=checkbox]') ?? []).filter(
        (element) => element.getAttribute('aria-disabled') !== 'true',
      );
      (choices.find((element) => element.getAttribute('aria-checked') === 'true') ?? choices[0])?.focus();
    }
  });

  const dispatch = (action: QuestionnaireAction) => {
    const next = questionnaireStep(questions, state, action);
    setState(next);
    if (next.step !== state.step) {
      setAdding(false);
      setDraft('');
      focusNext.current = next.step >= questions.length ? 'root' : action.type === 'edit' ? 'choice' : 'heading';
    } else if (next.error && action.type === 'next') focusNext.current = 'choice';
    if (next.step >= questions.length && next.step !== state.step) {
      onComplete(Object.fromEntries(questions.filter((item) => next.answered.includes(item.id)).map((item) => [item.id, next.answers[item.id] ?? []])));
    }
  };

  const closeDraft = () => {
    closed.current = true;
    setAdding(false);
    setDraft('');
    focusNext.current = 'custom';
  };

  const shown = done ? questions.length : state.step + 1;
  const name = (item: Question) => item.label ?? item.title;
  const valueOf = (item: Question) => {
    const options = optionsOf(item, state);
    return (state.answers[item.id] ?? []).map((value) => options.find((option) => option.value === value)?.label ?? value).join(', ');
  };

  const renderQuestion = (open: Question) => {
    const chosen = state.answers[open.id] ?? [];
    const titleId = `${id}-title`;
    const hintId = `${id}-hint`;
    const errorId = `${id}-error`;
    const describedBy = [open.hint ? hintId : '', state.error ? errorId : ''].filter(Boolean).join(' ') || undefined;
    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      arrowed.current = !open.multiple && ARROWS.has(event.key);
    };
    // a radio group: the arrows choose as they move
    const handleFocus = (event: FocusEvent<HTMLDivElement>) => {
      if (!arrowed.current) return;
      arrowed.current = false;
      const value = event.target.getAttribute('data-value');
      if (value !== null && event.target.getAttribute('role') === 'radio') dispatch({ type: 'toggle', value });
    };
    return (
      <div
        key={state.step}
        data-slot="questionnaire-question"
        className="flex flex-col gap-3 transition-[opacity,translate] duration-(--duration-base) ease-out starting:translate-x-(--shift-lg) starting:opacity-0"
      >
        <div className="flex flex-col gap-0.5">
          <p ref={heading} id={titleId} tabIndex={-1} className="text-body-md font-semibold text-fg-1 outline-none">
            {open.title}
          </p>
          {open.hint ? (
            <p id={hintId} className="text-body-xs text-fg-3">
              {open.hint}
            </p>
          ) : null}
        </div>
        <FocusGroup
          role={open.multiple ? 'group' : 'radiogroup'}
          aria-labelledby={titleId}
          aria-describedby={describedBy}
          aria-invalid={state.error ? true : undefined}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          className="flex flex-wrap gap-2"
        >
          {optionsOf(open, state).map((option) => {
            const on = chosen.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                role={open.multiple ? 'checkbox' : 'radio'}
                aria-checked={on}
                aria-disabled={option.disabled || undefined}
                data-value={option.value}
                onClick={() => dispatch({ type: 'toggle', value: option.value })}
                className={cn(chip, on ? chipOn : chipOff)}
              >
                {on ? <Check aria-hidden className={cn('size-3.5 shrink-0 stroke-[2.25]', drawn)} /> : null}
                {option.label}
              </button>
            );
          })}
          {open.custom ? (
            adding ? (
              <input
                // focus goes into the field the user has just opened
                autoFocus
                aria-label="Свой вариант"
                aria-invalid={state.error ? true : undefined}
                aria-describedby={state.error ? errorId : undefined}
                value={draft}
                placeholder="Свой вариант"
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    dispatch({ type: 'add', label: draft });
                    if (draft.trim()) closeDraft();
                  } else if (event.key === 'Escape') {
                    // Esc closes the field, not the panel around the questionnaire
                    event.stopPropagation();
                    closeDraft();
                  }
                }}
                onBlur={() => {
                  if (closed.current) return;
                  if (draft.trim()) dispatch({ type: 'add', label: draft });
                  setAdding(false);
                  setDraft('');
                }}
                className="h-8 w-44 rounded-full border border-input bg-field px-3 text-body-xs/4 font-medium text-fg-1 outline-none placeholder:text-fg-3 focus:border-ring focus:shadow-[0_0_0_1px_var(--color-ring)] aria-invalid:border-danger"
              />
            ) : (
              <button
                ref={customButton}
                type="button"
                onClick={() => {
                  closed.current = false;
                  setAdding(true);
                }}
                className="kv-pressable inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-dashed border-input pr-3 pl-2.5 text-body-xs/4 font-medium text-fg-2 hover:bg-fill-1 hover:text-fg-1 active:bg-fill-2 [&_svg]:size-3.5 [&_svg]:stroke-2"
              >
                <Plus aria-hidden />
                Свой вариант
              </button>
            )
          ) : null}
        </FocusGroup>
        {state.error ? (
          <p id={errorId} className="flex items-center gap-1.5 text-caption text-danger-soft-fg">
            <CircleAlert aria-hidden className="size-3.5 shrink-0 stroke-2" />
            {state.error}
          </p>
        ) : null}
      </div>
    );
  };

  // consecutive answered rows sit 6 apart; the open question stands alone
  const blocks: ReactNode[] = [];
  let rows: ReactNode[] = [];
  const flush = () => {
    if (rows.length) blocks.push(<div key={`rows-${blocks.length}`} className="flex flex-col gap-1.5">{rows}</div>);
    rows = [];
  };
  questions.forEach((item, index) => {
    if (index === state.step && question) {
      flush();
      blocks.push(<Fragment key="question">{renderQuestion(question)}</Fragment>);
    } else if (state.answered.includes(item.id)) {
      rows.push(<AnswerRow key={item.id} name={name(item)} value={valueOf(item)} onEdit={() => dispatch({ type: 'edit', index })} />);
    }
  });
  flush();

  const count = question ? (state.answers[question.id] ?? []).length : 0;
  const note = [count ? `Выбрано ${count}` : '', footnote].filter(Boolean).join(' · ');
  const footer = note.charAt(0).toLocaleUpperCase('ru') + note.slice(1);
  const finishing = question !== undefined && questions.every((item) => item.id === question.id || state.answered.includes(item.id));

  return (
    <div
      ref={root}
      data-slot="questionnaire"
      data-complete={done || undefined}
      tabIndex={-1}
      className={cn('flex flex-col gap-5 rounded-xl bg-surface-1 px-6 pt-5 pb-6 shadow-raised outline-none', className)}
      {...props}
    >
      {/* in a narrow column the progress wraps under the title instead of squeezing it */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <AgentAvatar size={32} />
        <p className="min-w-40 flex-1 text-body-sm font-semibold text-fg-1">{title}</p>
        <div className="flex shrink-0 items-center gap-2">
          <VisuallyHidden>Вопрос</VisuallyHidden>
          <span className="text-caption font-medium text-fg-3 tabular-nums">
            {shown} из {questions.length}
          </span>
          <span data-slot="questionnaire-progress" aria-hidden className="flex gap-[3px]">
            {questions.map((item, index) => (
              <span
                key={item.id}
                data-done={index < shown || undefined}
                className={cn('h-1 w-4 rounded-full transition-colors duration-(--duration-base) ease-standard', index < shown ? 'bg-accent' : 'bg-fill-3')}
              />
            ))}
          </span>
        </div>
      </div>
      {blocks}
      {question ? (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <p className="min-w-48 flex-1 text-caption text-fg-3">{footer}</p>
          {question.required ? null : (
            <Button variant="ghost" size="sm" onClick={() => dispatch({ type: 'skip' })}>
              Пропустить
            </Button>
          )}
          <Button size="sm" onClick={() => dispatch({ type: 'next' })}>
            {finishing ? 'Готово' : 'Продолжить'}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
