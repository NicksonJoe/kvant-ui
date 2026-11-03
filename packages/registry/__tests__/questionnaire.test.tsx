import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Questionnaire, initialQuestionnaire, questionnaireStep, type Question, type QuestionnaireState } from '..';

const questions: Question[] = [
  {
    id: 'tone',
    title: 'Каким тоном написать?',
    label: 'Тон письма',
    required: true,
    options: [
      { value: 'friendly', label: 'Дружелюбный' },
      { value: 'formal', label: 'Деловой' },
    ],
  },
  {
    id: 'mention',
    title: 'Что упомянуть в письме?',
    label: 'Упомянуть',
    hint: 'Можно выбрать несколько',
    multiple: true,
    custom: true,
    options: [
      { value: 'discount', label: 'Скидку 10 %' },
      { value: 'plans', label: 'Новые тарифы' },
      { value: 'review', label: 'Отзыв клиента' },
      { value: 'dates', label: 'Сроки запуска', disabled: true },
    ],
  },
  {
    id: 'sign',
    title: 'Чья подпись?',
    label: 'Подпись',
    options: [
      { value: 'me', label: 'Моя' },
      { value: 'team', label: 'Команды' },
    ],
  },
];

const run = (...actions: Parameters<typeof questionnaireStep>[2][]): QuestionnaireState =>
  actions.reduce((state, action) => questionnaireStep(questions, state, action), initialQuestionnaire(questions));

/* ---------- pure logic ---------- */

describe('questionnaireStep', () => {
  it('starts on the first question with nothing answered', () => {
    expect(initialQuestionnaire(questions)).toEqual({ step: 0, answers: {}, extra: {}, answered: [], error: null });
  });

  it('single choice keeps one value; choosing again replaces it', () => {
    expect(run({ type: 'toggle', value: 'friendly' }, { type: 'toggle', value: 'formal' }).answers.tone).toEqual(['formal']);
  });

  it('multiple choice toggles values on and off', () => {
    const state = run(
      { type: 'toggle', value: 'friendly' },
      { type: 'next' },
      { type: 'toggle', value: 'discount' },
      { type: 'toggle', value: 'plans' },
      { type: 'toggle', value: 'discount' },
    );
    expect(state.answers.mention).toEqual(['plans']);
  });

  it('a disabled option and an unknown value are ignored', () => {
    const state = run({ type: 'toggle', value: 'friendly' }, { type: 'next' }, { type: 'toggle', value: 'dates' }, { type: 'toggle', value: 'nope' });
    expect(state.answers.mention ?? []).toEqual([]);
  });

  it('a required question does not let go without an answer', () => {
    const state = run({ type: 'next' });
    expect(state.step).toBe(0);
    expect(state.error).toBe('Выберите вариант');
    expect(run({ type: 'skip' }).step).toBe(0);
  });

  it('choosing clears the error', () => {
    expect(run({ type: 'next' }, { type: 'toggle', value: 'formal' }).error).toBeNull();
  });

  it('next and skip move on; an optional question can be skipped empty', () => {
    const state = run({ type: 'toggle', value: 'friendly' }, { type: 'next' }, { type: 'skip' });
    expect(state.step).toBe(2);
    expect(state.answered).toEqual(['tone', 'mention']);
    expect(state.answers.mention).toEqual([]);
  });

  it('skip drops what was chosen in the question', () => {
    const state = run({ type: 'toggle', value: 'friendly' }, { type: 'next' }, { type: 'toggle', value: 'plans' }, { type: 'skip' });
    expect(state.answers.mention).toEqual([]);
  });

  it('after the last question the step is past the end', () => {
    const state = run({ type: 'toggle', value: 'friendly' }, { type: 'next' }, { type: 'next' }, { type: 'toggle', value: 'me' }, { type: 'next' });
    expect(state.step).toBe(3);
    expect(state.answered).toEqual(['tone', 'mention', 'sign']);
  });

  it('edit goes back to an answered question and next returns to the first unanswered one', () => {
    let state = run({ type: 'toggle', value: 'friendly' }, { type: 'next' }, { type: 'edit', index: 0 });
    expect(state.step).toBe(0);
    state = questionnaireStep(questions, state, { type: 'toggle', value: 'formal' });
    state = questionnaireStep(questions, state, { type: 'next' });
    expect(state.step).toBe(1);
    expect(state.answers.tone).toEqual(['formal']);
  });

  it('editing after the end comes back to the end', () => {
    let state = run({ type: 'toggle', value: 'friendly' }, { type: 'next' }, { type: 'next' }, { type: 'next' }, { type: 'edit', index: 1 });
    expect(state.step).toBe(1);
    state = questionnaireStep(questions, state, { type: 'next' });
    expect(state.step).toBe(3);
  });

  it('edit of an unanswered question is ignored', () => {
    expect(run({ type: 'edit', index: 2 }).step).toBe(0);
  });

  it('a custom option is added and chosen; blank is an error; a repeat chooses the existing one', () => {
    let state = run({ type: 'toggle', value: 'friendly' }, { type: 'next' }, { type: 'add', label: '  Кейс «Белой лодки» ' });
    expect(state.extra.mention).toEqual([{ value: 'Кейс «Белой лодки»', label: 'Кейс «Белой лодки»' }]);
    expect(state.answers.mention).toEqual(['Кейс «Белой лодки»']);
    state = questionnaireStep(questions, state, { type: 'add', label: '   ' });
    expect(state.error).toBe('Напишите вариант');
    state = questionnaireStep(questions, state, { type: 'add', label: 'новые ТАРИФЫ' });
    expect(state.error).toBeNull();
    expect(state.extra.mention).toHaveLength(1);
    expect(state.answers.mention).toEqual(['Кейс «Белой лодки»', 'plans']);
  });

  it('a custom option on a single-choice question replaces the choice', () => {
    const single: Question[] = [{ id: 'q', title: 'q', custom: true, options: [{ value: 'a', label: 'А' }] }];
    let state = questionnaireStep(single, initialQuestionnaire(single), { type: 'toggle', value: 'a' });
    state = questionnaireStep(single, state, { type: 'add', label: 'Своё' });
    expect(state.answers.q).toEqual(['Своё']);
  });

  it('starts from given answers', () => {
    const state = initialQuestionnaire(questions, { tone: ['formal'] });
    expect(state.answers.tone).toEqual(['formal']);
    expect(state.answered).toEqual(['tone']);
    expect(state.step).toBe(1);
  });
});

/* ---------- component ---------- */

const card = (props: Partial<Parameters<typeof Questionnaire>[0]> = {}) => (
  <Questionnaire title="Пара уточнений, чтобы письмо попало в точку" questions={questions} onComplete={() => {}} {...props} />
);
const option = (name: string) => {
  const element = screen.queryAllByRole('radio').concat(screen.queryAllByRole('checkbox')).find((item) => item.textContent === name);
  if (!element) throw new Error(`no option ${name}`);
  return element;
};

describe('Questionnaire', () => {
  it('header: agent face, title, «1 из 3» and three progress bars', () => {
    render(card());
    expect(screen.getByText('Пара уточнений, чтобы письмо попало в точку')).toBeDefined();
    expect(document.querySelector('[data-slot=agent-avatar]')).not.toBeNull();
    expect(screen.getByText('1 из 3')).toBeDefined();
    const bars = document.querySelectorAll('[data-slot=questionnaire-progress] > span');
    expect(Array.from(bars).map((bar) => bar.getAttribute('data-done'))).toEqual(['true', null, null]);
  });

  it('single choice: a radio group named by the question', () => {
    render(card());
    const group = screen.getByRole('radiogroup', { name: 'Каким тоном написать?' });
    expect(within(group).getAllByRole('radio')).toHaveLength(2);
    fireEvent.click(option('Дружелюбный'));
    expect(option('Дружелюбный').getAttribute('aria-checked')).toBe('true');
    fireEvent.click(option('Деловой'));
    expect(option('Дружелюбный').getAttribute('aria-checked')).toBe('false');
    expect(option('Деловой').getAttribute('aria-checked')).toBe('true');
  });

  it('arrows move between options and choose in a single-choice group', () => {
    render(card());
    option('Дружелюбный').focus();
    fireEvent.keyDown(option('Дружелюбный'), { key: 'ArrowRight' });
    expect(document.activeElement).toBe(option('Деловой'));
    expect(option('Деловой').getAttribute('aria-checked')).toBe('true');
  });

  it('a required question without an answer shows why and does not move on', () => {
    render(card());
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
    const group = screen.getByRole('radiogroup');
    expect(group.getAttribute('aria-invalid')).toBe('true');
    const error = screen.getByText('Выберите вариант');
    expect(group.getAttribute('aria-describedby')).toContain(error.id);
    expect(document.activeElement).toBe(option('Дружелюбный'));
    expect(screen.queryByRole('button', { name: 'Пропустить' })).toBeNull();
  });

  it('an answered question folds into a row with «Изменить»; the next one opens', () => {
    render(card());
    fireEvent.click(option('Дружелюбный'));
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
    const row = document.querySelector('[data-slot=questionnaire-answer]');
    expect(row?.textContent).toContain('Тон письма: Дружелюбный');
    expect(screen.getByText('2 из 3')).toBeDefined();
    expect(screen.getByRole('group', { name: 'Что упомянуть в письме?' })).toBeDefined();
    expect(screen.getByText('Можно выбрать несколько')).toBeDefined();
    expect(document.activeElement?.textContent).toBe('Что упомянуть в письме?');
  });

  it('multiple choice: checkboxes, «Выбрано 2», skip for an optional question', () => {
    render(card({ defaultAnswers: { tone: ['friendly'] } }));
    fireEvent.click(option('Скидку 10 %'));
    fireEvent.click(option('Новые тарифы'));
    expect(option('Скидку 10 %').getAttribute('aria-checked')).toBe('true');
    expect(screen.getByText('Выбрано 2 · ответы можно поменять до отправки')).toBeDefined();
    expect(option('Сроки запуска').getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Пропустить' }));
    const rows = document.querySelectorAll('[data-slot=questionnaire-answer]');
    expect(rows[1]?.textContent).toContain('Упомянуть: не указано');
  });

  it('nothing chosen: the footnote alone, with a capital letter', () => {
    render(card({ defaultAnswers: { tone: ['friendly'] } }));
    expect(screen.getByText('Ответы можно поменять до отправки')).toBeDefined();
  });

  it('«Свой вариант» opens a field: Enter adds and chooses, Escape closes', () => {
    render(card({ defaultAnswers: { tone: ['friendly'] } }));
    fireEvent.click(screen.getByRole('button', { name: 'Свой вариант' }));
    const field = screen.getByRole('textbox', { name: 'Свой вариант' });
    expect(document.activeElement).toBe(field);
    fireEvent.change(field, { target: { value: 'Кейс «Белой лодки»' } });
    fireEvent.keyDown(field, { key: 'Enter' });
    expect(option('Кейс «Белой лодки»').getAttribute('aria-checked')).toBe('true');
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Свой вариант' }));
    fireEvent.click(screen.getByRole('button', { name: 'Свой вариант' }));
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Свой вариант' }), { key: 'Escape' });
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('an empty custom option says what is missing', () => {
    render(card({ defaultAnswers: { tone: ['friendly'] } }));
    fireEvent.click(screen.getByRole('button', { name: 'Свой вариант' }));
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Свой вариант' }), { key: 'Enter' });
    expect(screen.getByText('Напишите вариант')).toBeDefined();
    expect(screen.getByRole('textbox', { name: 'Свой вариант' }).getAttribute('aria-invalid')).toBe('true');
  });

  it('«Изменить» reopens an answered question', () => {
    render(card({ defaultAnswers: { tone: ['friendly'] } }));
    fireEvent.click(screen.getByRole('button', { name: 'Изменить: Тон письма' }));
    expect(screen.getByRole('radiogroup', { name: 'Каким тоном написать?' })).toBeDefined();
    expect(screen.getByText('1 из 3')).toBeDefined();
    expect(document.activeElement).toBe(option('Дружелюбный'));
  });

  it('the last question says «Готово»; then all answers fold and onComplete gets them', () => {
    const onComplete = vi.fn();
    render(card({ onComplete, defaultAnswers: { tone: ['friendly'], mention: ['plans'] } }));
    fireEvent.click(option('Моя'));
    fireEvent.click(screen.getByRole('button', { name: 'Готово' }));
    expect(onComplete).toHaveBeenCalledWith({ tone: ['friendly'], mention: ['plans'], sign: ['me'] });
    expect(document.querySelectorAll('[data-slot=questionnaire-answer]')).toHaveLength(3);
    expect(screen.getByText('3 из 3')).toBeDefined();
    expect(screen.queryByRole('button', { name: /Продолжить|Готово/ })).toBeNull();
    const done = document.querySelector('[data-slot=questionnaire]');
    expect(done?.getAttribute('data-complete')).toBe('true');
  });

  it('changing an answer after the end completes again with the new answers', () => {
    const onComplete = vi.fn();
    render(card({ onComplete, defaultAnswers: { tone: ['friendly'], mention: ['plans'], sign: ['me'] } }));
    fireEvent.click(screen.getByRole('button', { name: 'Изменить: Подпись' }));
    fireEvent.click(option('Команды'));
    fireEvent.click(screen.getByRole('button', { name: 'Готово' }));
    expect(onComplete).toHaveBeenLastCalledWith({ tone: ['friendly'], mention: ['plans'], sign: ['team'] });
  });

  it('the custom chip is not there when the question does not allow it', () => {
    render(card());
    expect(screen.queryByRole('button', { name: 'Свой вариант' })).toBeNull();
  });
});
