import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CanvasEditor, CanvasReadonlyBar, CanvasState } from '../components/canvas-editor';

const base = {
  breadcrumbs: [{ label: 'Автоматизации', href: '/automations' }],
  title: 'Заявка из Telegram → сделка',
};

describe('CanvasEditor', () => {
  it('renders the header: crumbs, title, version, save state and people', () => {
    render(
      <CanvasEditor
        {...base}
        version="Черновик · опубликована v7"
        saved="сохранено только что"
        people={[
          { name: 'Анна Носова', color: 'var(--color-chart-2)' },
          { name: 'Игорь Гусев', color: 'var(--color-chart-6)' },
        ]}
      >
        <div>граф</div>
      </CanvasEditor>,
    );
    expect(screen.getByRole('link', { name: 'Автоматизации' }).getAttribute('href')).toBe('/automations');
    expect(screen.getByText('Заявка из Telegram → сделка').getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('region', { name: 'Заявка из Telegram → сделка' })).toBeTruthy();
    expect(screen.getByText('Черновик · опубликована v7')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe('сохранено только что');
    expect(screen.getByRole('img', { name: 'Анна Носова' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Канвас' }).textContent).toBe('граф');
  });

  it('shows an action only when it has a handler and runs it', async () => {
    const onPublish = vi.fn();
    const onRun = vi.fn();
    render(
      <CanvasEditor {...base} onRun={onRun} onPublish={onPublish}>
        <div />
      </CanvasEditor>,
    );
    expect(screen.queryByRole('button', { name: 'История' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Проверить' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Запустить' }));
    await userEvent.click(screen.getByRole('button', { name: 'Опубликовать' }));
    expect(onRun).toHaveBeenCalledTimes(1);
    expect(onPublish).toHaveBeenCalledTimes(1);
  });

  it('hides the palette and the inspector with their toggles, the canvas stays', async () => {
    const onInspectorOpenChange = vi.fn();
    render(
      <CanvasEditor {...base} palette={<div>палитра</div>} inspector={<div>инспектор</div>} onInspectorOpenChange={onInspectorOpenChange}>
        <div>граф</div>
      </CanvasEditor>,
    );
    expect(screen.getByRole('complementary', { name: 'Палитра шагов' })).toBeTruthy();
    const togglePalette = screen.getByRole('button', { name: 'Палитра шагов' });
    expect(togglePalette.getAttribute('aria-pressed')).toBe('true');
    await userEvent.click(togglePalette);
    expect(screen.queryByText('палитра')).toBeNull();
    expect(togglePalette.getAttribute('aria-pressed')).toBe('false');

    await userEvent.click(screen.getByRole('button', { name: 'Инспектор' }));
    expect(screen.queryByText('инспектор')).toBeNull();
    expect(onInspectorOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByText('граф')).toBeTruthy();
  });

  it('respects controlled zones and has no toggle without the zone', () => {
    render(
      <CanvasEditor {...base} inspector={<div>инспектор</div>} inspectorOpen={false}>
        <div>граф</div>
      </CanvasEditor>,
    );
    expect(screen.queryByText('инспектор')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Палитра шагов' })).toBeNull();
  });
});

describe('CanvasEditor header', () => {
  it('keeps the title readable: full name in title, a minimum width, hides the rest by the editor width', () => {
    render(
      <CanvasEditor {...base} version="Черновик · опубликована v7" saved="сохранено только что" onHistory={vi.fn()} onRun={vi.fn()}>
        <div />
      </CanvasEditor>,
    );
    const title = screen.getByText('Заявка из Telegram → сделка');
    expect(title.getAttribute('title')).toBe('Заявка из Telegram → сделка');
    expect(title.className).toContain('min-w-[120px]');
    expect(title.className).toContain('truncate');
    // container queries, not the window: the editor may sit in a narrow column
    expect(screen.getByText('Черновик · опубликована v7').className).toContain('@max-[1279px]:hidden');
    expect(screen.getByRole('status').className).toContain('@max-[1079px]:hidden');
    expect(screen.getByText('История').className).toContain('@max-[999px]:sr-only');
    expect(screen.getByText('Запустить').className).toContain('@max-[829px]:sr-only');
    expect(screen.getByRole('link', { name: 'Назад: Автоматизации' }).className).toContain('@min-[640px]:hidden');
    expect(document.querySelector('header')?.className).toContain('@container');
    expect(document.querySelector('[data-slot=canvas-editor]')?.innerHTML).not.toMatch(/max-(md|lg|sm):/);
  });

  it('publish with errors shows the count and opens the problems instead', async () => {
    const onPublish = vi.fn();
    const onValidate = vi.fn();
    render(
      <CanvasEditor {...base} errors={3} onValidate={onValidate} onPublish={onPublish}>
        <div />
      </CanvasEditor>,
    );
    const publish = screen.getByRole('button', { name: 'Опубликовать' });
    expect(publish.textContent).toContain('3');
    expect(screen.getByRole('button', { name: 'Опубликовать', description: /3 ошибки мешают публиковать/ })).toBe(publish);
    await userEvent.click(publish);
    expect(onPublish).not.toHaveBeenCalled();
    expect(onValidate).toHaveBeenCalledTimes(1);
  });

  it('says «сохраняем…» while saving', () => {
    render(
      <CanvasEditor {...base} saveState="saving" saved="сохранено только что">
        <div />
      </CanvasEditor>,
    );
    expect(screen.getByRole('status').textContent).toBe('сохраняем…');
  });

  it('offline: warning in the status, run and publish wait for the network', async () => {
    const onRun = vi.fn();
    const onPublish = vi.fn();
    render(
      <CanvasEditor {...base} saveState="offline" onRun={onRun} onPublish={onPublish}>
        <div />
      </CanvasEditor>,
    );
    expect(screen.getByRole('status').textContent).toBe('Нет сети · правки ждут');
    for (const name of ['Запустить', 'Опубликовать']) {
      const button = screen.getByRole('button', { name, description: /Нет сети/ });
      expect(button.getAttribute('aria-disabled')).toBe('true');
      await userEvent.click(button);
    }
    expect(onRun).not.toHaveBeenCalled();
    expect(onPublish).not.toHaveBeenCalled();
  });

  it('failed: «Не сохранено» with retry, run and publish are off', async () => {
    const onRetrySave = vi.fn();
    render(
      <CanvasEditor {...base} saveState="failed" onRetrySave={onRetrySave} onRun={vi.fn()} onPublish={vi.fn()}>
        <div />
      </CanvasEditor>,
    );
    expect(screen.getByRole('status').textContent).toBe('Не сохранено');
    expect(screen.getByRole('button', { name: 'Опубликовать', description: /не сохранены/ }).getAttribute('aria-disabled')).toBe('true');
    await userEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(onRetrySave).toHaveBeenCalledTimes(1);
  });
});

describe('CanvasEditor on a narrow editor', () => {
  afterEach(() => vi.restoreAllMocks());

  it('folds the palette by default and opens zones over the canvas; Esc closes and returns focus', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(720);
    render(
      <CanvasEditor {...base} palette={<button type="button">шаг</button>} inspector={<div>инспектор</div>}>
        <div>граф</div>
      </CanvasEditor>,
    );
    expect(screen.queryByRole('complementary', { name: 'Палитра шагов' })).toBeNull();
    expect(screen.getByRole('complementary', { name: 'Инспектор' }).getAttribute('data-overlay')).toBe('');

    const toggle = screen.getByRole('button', { name: 'Палитра шагов' });
    await userEvent.click(toggle);
    const palette = screen.getByRole('complementary', { name: 'Палитра шагов' });
    expect(palette.getAttribute('data-overlay')).toBe('');
    expect(document.activeElement).toBe(palette);
    await userEvent.keyboard('{Tab}{Escape}');
    expect(screen.queryByRole('complementary', { name: 'Палитра шагов' })).toBeNull();
    expect(document.activeElement).toBe(toggle);
  });

  it('a wide editor keeps the zones in the row', () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1280);
    render(
      <CanvasEditor {...base} palette={<div>палитра</div>}>
        <div />
      </CanvasEditor>,
    );
    expect(screen.getByRole('complementary', { name: 'Палитра шагов' }).hasAttribute('data-overlay')).toBe(false);
  });
});

describe('CanvasState', () => {
  it('empty: start with a trigger or build with Norda', async () => {
    const onAddStep = vi.fn();
    const onBuildWithNorda = vi.fn();
    render(<CanvasState kind="empty" onAddStep={onAddStep} onBuildWithNorda={onBuildWithNorda} />);
    expect(screen.getByRole('heading', { name: 'Начните с триггера' })).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Добавить шаг' }));
    await userEvent.click(screen.getByRole('button', { name: 'Собрать с Нордой' }));
    expect(onAddStep).toHaveBeenCalledTimes(1);
    expect(onBuildWithNorda).toHaveBeenCalledTimes(1);
  });

  it('loading: a skeleton announced as busy', () => {
    render(<CanvasState kind="loading" />);
    const status = screen.getByRole('status');
    expect(status.getAttribute('aria-busy')).toBe('true');
    expect(status.textContent).toBe('Загружаем граф…');
  });

  it('error: retry and a way back to the published version', async () => {
    const onRetry = vi.fn();
    const onOpenVersion = vi.fn();
    render(<CanvasState kind="error" version="v7" onRetry={onRetry} onOpenVersion={onOpenVersion} />);
    expect(screen.getByRole('alert').textContent).toContain('Граф не открылся');
    await userEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    await userEvent.click(screen.getByRole('button', { name: 'Открыть версию v7' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onOpenVersion).toHaveBeenCalledTimes(1);
  });

  it('read-only bar asks for access', async () => {
    const onRequestAccess = vi.fn();
    render(<CanvasReadonlyBar onRequestAccess={onRequestAccess} />);
    expect(screen.getByText('Только просмотр')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Попросить доступ' }));
    expect(onRequestAccess).toHaveBeenCalledTimes(1);
  });
});
