import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ChoiceCard, ChoiceCardGroup, RadioGroup, RadioItem, Rating, Slider, Switch } from '..';

const describedBy = (element: Element) =>
  (element.getAttribute('aria-describedby') ?? '')
    .split(' ')
    .map((id) => document.getElementById(id)?.textContent)
    .join(' ');

describe('RadioGroup', () => {
  it('takes its name from the label, links the error and keeps descriptions out of the option name', () => {
    render(
      <RadioGroup label="Способ оплаты" error="Выберите способ оплаты, чтобы продолжить">
        <RadioItem value="card" description="Visa, Mastercard и Мир">
          Картой онлайн
        </RadioItem>
        <RadioItem value="invoice">По счёту для юрлица</RadioItem>
      </RadioGroup>,
    );
    const group = screen.getByRole('radiogroup', { name: 'Способ оплаты' });
    expect(group.getAttribute('aria-invalid')).toBe('true');
    expect(describedBy(group)).toContain('Выберите способ оплаты, чтобы продолжить');

    const card = screen.getByRole('radio', { name: 'Картой онлайн' });
    expect(describedBy(card)).toBe('Visa, Mastercard и Мир');
  });
});

describe('Switch', () => {
  it('announces the request and ignores clicks while loading', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <Switch loading description="Сохраняем…" onCheckedChange={onCheckedChange}>
        Публичные ссылки на отчёты
      </Switch>,
    );
    const control = screen.getByRole('switch', { name: 'Публичные ссылки на отчёты' });
    expect(control.getAttribute('aria-busy')).toBe('true');
    expect(describedBy(control)).toBe('Сохраняем…');

    await user.click(control);
    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(control.getAttribute('aria-checked')).toBe('false');
  });
});

describe('ChoiceCard', () => {
  it('radio cards: the whole card is the target, the title names it, arrows move the choice', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <ChoiceCardGroup aria-label="Тариф" defaultValue="team" onValueChange={onValueChange}>
        <ChoiceCard value="start" title="Старт" description="Для фрилансеров и студий до 3 человек">
          <p>0 ₽ навсегда</p>
        </ChoiceCard>
        <ChoiceCard value="team" title="Команда" description="Для агентств" />
        <ChoiceCard value="studio" title="Студия" description="Для студий с отделом продаж" disabled />
      </ChoiceCardGroup>,
    );
    expect(screen.getByRole('radiogroup', { name: 'Тариф' })).toBeTruthy();
    const team = screen.getByRole('radio', { name: 'Команда' });
    expect(team.getAttribute('aria-checked')).toBe('true');
    expect(describedBy(team)).toBe('Для агентств');

    await user.click(screen.getByText('0 ₽ навсегда'));
    expect(onValueChange).toHaveBeenLastCalledWith('start');

    await user.keyboard('{ArrowRight}');
    expect(onValueChange).toHaveBeenLastCalledWith('team');
    expect(screen.getByRole('radio', { name: 'Студия' }).getAttribute('aria-disabled')).toBe('true');
  });

  it('checkbox cards toggle independently', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <ChoiceCardGroup multiple aria-label="Возможности" defaultValue={['payments']} onValueChange={onValueChange}>
        <ChoiceCard value="payments" title="Онлайн-оплата" />
        <ChoiceCard value="mailing" title="Рассылки клиентам" />
      </ChoiceCardGroup>,
    );
    expect(screen.getByRole('checkbox', { name: 'Онлайн-оплата' }).getAttribute('aria-checked')).toBe('true');
    await user.click(screen.getByRole('checkbox', { name: 'Рассылки клиентам' }));
    expect(onValueChange).toHaveBeenLastCalledWith(['payments', 'mailing']);
  });
});

describe('Slider', () => {
  const percent = (value: number) => `${value} %`;

  it('steps with arrows (Shift: large step) and reads the formatted value', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Slider label="Скидка по умолчанию" defaultValue={15} max={50} formatValue={percent} onValueChange={onValueChange} />);
    // Edge-aligned thumbs stay hidden until measured and jsdom measures nothing, so the name is checked by hand.
    const thumb = screen.getByRole('slider', { hidden: true });
    expect(document.getElementById(thumb.getAttribute('aria-labelledby') ?? '')?.textContent).toBe('Скидка по умолчанию');
    expect(thumb.getAttribute('aria-valuetext')).toBe('15 %');
    // The value line and the drag tooltip.
    expect(screen.getAllByText('15 %')).toHaveLength(2);

    thumb.focus();
    await user.keyboard('{ArrowRight}');
    expect(onValueChange).toHaveBeenLastCalledWith(16, expect.anything());
    await user.keyboard('{Shift>}{ArrowRight}{/Shift}');
    expect(onValueChange).toHaveBeenLastCalledWith(26, expect.anything());
  });

  it('labels range thumbs «от» and «до»', () => {
    render(<Slider aria-label="Бюджет" defaultValue={[25, 75]} formatValue={percent} />);
    const [from, to] = screen.getAllByRole('slider', { hidden: true });
    expect(from?.getAttribute('aria-valuetext')).toBe('от 25 %');
    expect(to?.getAttribute('aria-valuetext')).toBe('до 75 %');
    expect(from?.getAttribute('aria-label')).toBe('Бюджет');
  });

  it('prints marks under the track and highlights the current one', () => {
    const { container } = render(<Slider aria-label="Вероятность" defaultValue={75} step={25} marks={[0, 25, 50, 75, 100]} />);
    const marks = container.querySelectorAll('[data-slot="slider-mark"]');
    expect(marks).toHaveLength(5);
    expect(marks[3]?.hasAttribute('data-current')).toBe(true);
  });
});

describe('Rating', () => {
  it('is one slider: arrows and Home change the score, a star click sets it, the word names it', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(<Rating aria-label="Оценка проекта" defaultValue={3} showLabel onValueChange={onValueChange} />);
    const rating = screen.getByRole('slider', { name: 'Оценка проекта' });
    expect(rating.getAttribute('aria-valuenow')).toBe('3');
    expect(rating.getAttribute('aria-valuetext')).toBe('3 из 5 — Нормально');

    rating.focus();
    await user.keyboard('{ArrowRight}');
    expect(onValueChange).toHaveBeenLastCalledWith(4);
    expect(screen.getByText('Хорошо')).toBeTruthy();

    await user.keyboard('{Home}');
    expect(onValueChange).toHaveBeenLastCalledWith(1);

    const stars = container.querySelectorAll('[data-star]');
    const fifth = stars[4];
    if (!fifth) throw new Error('no fifth star');
    await user.click(fifth);
    expect(onValueChange).toHaveBeenLastCalledWith(5);
    expect(rating.getAttribute('aria-valuetext')).toBe('5 из 5 — Отлично');
  });

  it('read-only rounds to a half star and reads as an image', () => {
    const { container } = render(<Rating readOnly value={3.4} size="sm" />);
    expect(screen.getByRole('img', { name: 'Оценка 3,5 из 5' })).toBeTruthy();
    expect(container.querySelectorAll('[data-star="half"]')).toHaveLength(1);
  });
});
