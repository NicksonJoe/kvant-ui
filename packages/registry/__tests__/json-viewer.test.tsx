import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { diffLines, diffWords, flattenJson, JsonDiff, jsonPath, JsonViewer, parseJson, type JsonValue } from '..';

const first = { name: 'Илья Громов', phone: '+7 900 123-45-67' };
const deal: JsonValue = {
  id: 1042,
  title: 'Сайт и CRM-интеграция',
  amount: 640000,
  closed: false,
  lostReason: null,
  client: {
    name: 'Орбита Лаб',
    contacts: [
      first,
      { name: 'Анна Северова', phone: '+7 900 765-43-21', role: 'бухгалтер' },
    ],
  },
  history: Array.from({ length: 12 }, (_, index) => ({ at: `2026-10-${String(index + 1).padStart(2, '0')}`, stage: 'negotiation' })),
};

const opened = ['$', '$.client', '$.client.contacts', '$.client.contacts[0]'];

describe('jsonPath', () => {
  it('writes JSONPath with dots for plain keys and brackets for indexes and other keys', () => {
    expect(jsonPath([])).toBe('$');
    expect(jsonPath(['client', 'contacts', 0, 'phone'])).toBe('$.client.contacts[0].phone');
    expect(jsonPath(['first name'])).toBe("$['first name']");
    expect(jsonPath(["it's", 'Имя'])).toBe("$['it\\'s']['Имя']");
  });
});

describe('parseJson', () => {
  it('parses a valid document', () => {
    expect(parseJson('{"a": [1, true, null]}')).toEqual({ ok: true, value: { a: [1, true, null] } });
  });

  it.each([
    ['{\n  "amount": 640000,\n  "closed": false,,\n}', 3, 19, 'лишняя запятая'],
    ['{"a": 1,}', 1, 8, 'лишняя запятая'],
    ['[1, 2,]', 1, 6, 'лишняя запятая'],
    ['{"a" 1}', 1, 6, 'нет двоеточия'],
    ['{"a": 1 "b": 2}', 1, 9, 'нет запятой'],
    ["{'a': 1}", 1, 2, 'кавычки должны быть двойными'],
    ['{"a": "x', 1, 7, 'строка не закрыта'],
    ['{"a": tru}', 1, 7, 'неизвестное слово «tru»'],
    ['{"a": 1} x', 1, 10, 'лишний текст после документа'],
    ['{"a":', 1, 6, 'документ обрывается'],
    ['{a: 1}', 1, 2, 'ключ без кавычек'],
    ['{"a": 01}', 1, 7, 'неверное число'],
    ['// note\n{}', 1, 1, 'комментарии в JSON не допускаются'],
    ['', 1, 1, 'документ пустой'],
  ])('%j → line %i, column %i: %s', (text, line, column, reason) => {
    const result = parseJson(text);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toEqual({ line, column, reason });
  });
});

describe('flattenJson', () => {
  it('gives an opening and a closing row for expanded containers and one row for collapsed ones', () => {
    const rows = flattenJson(deal, new Set(opened));
    expect(rows).toHaveLength(18);
    expect(rows.map((row) => `${row.kind}:${row.path}`).slice(0, 8)).toEqual([
      'open:$',
      'value:$.id',
      'value:$.title',
      'value:$.amount',
      'value:$.closed',
      'value:$.lostReason',
      'open:$.client',
      'value:$.client.name',
    ]);
    const second = rows.find((row) => row.path === '$.client.contacts[1]');
    expect(second).toMatchObject({ kind: 'collapsed', depth: 3, key: 1, size: 3, position: 2, setSize: 2 });
    expect(rows.at(-2)).toMatchObject({ kind: 'collapsed', path: '$.history', size: 12 });
    expect(rows.at(-1)).toMatchObject({ kind: 'close', path: '$', depth: 0 });
  });
});

const before = [
  'title: Сайт и CRM-интеграция',
  'stage: negotiation',
  'amount: 580000',
  'owner: Илья Громов',
  ...Array.from({ length: 18 }, (_, index) => `field${index + 5}: значение ${index + 5}`),
  'discount: 5 %',
  'due: 2026-11-21',
].join('\n');
const after = before.replace('stage: negotiation', 'stage: contract').replace('amount: 580000', 'amount: 640000').replace('discount: 5 %', 'prepayment: 50 %');

describe('diffLines', () => {
  it('numbers both sides and pairs a changed line with its new version when they are alike', () => {
    const lines = diffLines(before, after);
    const changed = lines.filter((line) => line.kind !== 'same');
    expect(changed.map((line) => `${line.kind} ${line.old ?? '·'}/${line.new ?? '·'} ${line.text}`)).toEqual([
      'removed 2/· stage: negotiation',
      'added ·/2 stage: contract',
      'removed 3/· amount: 580000',
      'added ·/3 amount: 640000',
      'removed 23/· discount: 5 %',
      'added ·/23 prepayment: 50 %',
    ]);
    expect(changed.map((line) => line.paired)).toEqual([true, true, true, true, false, false]);
  });

  it('treats lines that differ only in spaces as the same', () => {
    const lines = diffLines('a: 1\nb:  2', 'a: 1\n  b: 2');
    expect(lines.every((line) => line.kind === 'same')).toBe(true);
    expect(diffLines('a: 1\nb:  2', 'a: 1\n  b: 2', { ignoreWhitespace: false }).some((line) => line.kind !== 'same')).toBe(true);
  });
});

describe('diffWords', () => {
  it('marks only the words that changed', () => {
    expect(diffWords('stage: negotiation', 'stage: contract')).toEqual({
      before: [
        { text: 'stage: ', changed: false },
        { text: 'negotiation', changed: true },
      ],
      after: [
        { text: 'stage: ', changed: false },
        { text: 'contract', changed: true },
      ],
    });
  });
});

const clipboard = { writeText: vi.fn<(text: string) => Promise<void>>() };
beforeEach(() => {
  clipboard.writeText.mockReset();
  clipboard.writeText.mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboard });
});
afterEach(() => {
  vi.useRealTimers();
});

const item = (name: string) => screen.getAllByRole('treeitem').find((row) => row.getAttribute('data-path') === name) as HTMLElement;

describe('JsonViewer', () => {
  it('draws the tree with levels, counts, typed values and collapsed nodes', () => {
    render(<JsonViewer value={deal} title="webhook · deal.updated" defaultExpanded={opened} />);
    const tree = screen.getByRole('tree', { name: 'webhook · deal.updated' });
    expect(within(tree).getAllByRole('treeitem')).toHaveLength(14);
    expect(item('$').textContent).toBe('{7 ключей');
    expect(item('$').getAttribute('aria-expanded')).toBe('true');
    expect(item('$.client.contacts[0].phone').getAttribute('aria-level')).toBe('5');
    expect(item('$.title').querySelector('[data-type=string]')?.textContent).toBe('"Сайт и CRM-интеграция"');
    expect(item('$.amount').querySelector('[data-type=number]')?.textContent).toBe('640000');
    expect(item('$.closed').querySelector('[data-type=boolean]')?.textContent).toBe('false');
    expect(item('$.lostReason').querySelector('[data-type=null]')?.textContent).toBe('null');
    expect(item('$.client.contacts[1]').textContent).toBe('1:{…} 3 ключа');
    expect(item('$.history').getAttribute('aria-expanded')).toBe('false');
    expect(item('$.history').textContent).toBe('"history":[…] 12 элементов');
  });

  it('opens a collapsed node by a click on its summary', () => {
    render(<JsonViewer value={deal} defaultExpanded={opened} />);
    fireEvent.click(within(item('$.history')).getByText('[…] 12 элементов'));
    expect(item('$.history').getAttribute('aria-expanded')).toBe('true');
    expect(item('$.history[11]')).toBeDefined();
  });

  it('moves with the arrows: ↓ ↑ between rows, → opens and enters, ← closes and goes to the parent, * opens the level', () => {
    render(<JsonViewer value={deal} defaultExpanded={opened} />);
    item('$').focus();
    fireEvent.keyDown(item('$'), { key: 'ArrowDown' });
    expect(document.activeElement).toBe(item('$.id'));
    fireEvent.keyDown(item('$.id'), { key: 'ArrowUp' });
    expect(document.activeElement).toBe(item('$'));

    item('$.client.contacts[1]').focus();
    fireEvent.keyDown(item('$.client.contacts[1]'), { key: 'ArrowRight' });
    expect(item('$.client.contacts[1]').getAttribute('aria-expanded')).toBe('true');
    fireEvent.keyDown(item('$.client.contacts[1]'), { key: 'ArrowRight' });
    expect(document.activeElement).toBe(item('$.client.contacts[1].name'));
    fireEvent.keyDown(item('$.client.contacts[1].name'), { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(item('$.client.contacts[1]'));
    fireEvent.keyDown(item('$.client.contacts[1]'), { key: 'ArrowLeft' });
    expect(item('$.client.contacts[1]').getAttribute('aria-expanded')).toBe('false');

    item('$.client').focus();
    fireEvent.keyDown(item('$.client'), { key: '*' });
    expect(item('$.history').getAttribute('aria-expanded')).toBe('true');
  });

  it('selects a row, shows its path below and copies it with «Путь»', async () => {
    render(<JsonViewer value={deal} defaultExpanded={opened} />);
    fireEvent.click(item('$.client.contacts[0].phone'));
    expect(item('$.client.contacts[0].phone').getAttribute('aria-selected')).toBe('true');
    const footer = document.querySelector('[data-slot=json-viewer-path]') as HTMLElement;
    expect(footer.textContent).toContain('$.client.contacts[0].phone');
    await act(async () => fireEvent.click(within(item('$.client.contacts[0].phone')).getByRole('button', { name: 'Скопировать путь' })));
    expect(clipboard.writeText).toHaveBeenLastCalledWith('$.client.contacts[0].phone');
    expect(footer.textContent).toContain('Путь скопирован');
  });

  it('copies the value with ⌘C and the path with ⇧⌘C', async () => {
    render(<JsonViewer value={deal} defaultExpanded={opened} />);
    const phone = item('$.client.contacts[0].phone');
    phone.focus();
    await act(async () => fireEvent.keyDown(phone, { key: 'c', metaKey: true }));
    expect(clipboard.writeText).toHaveBeenLastCalledWith('+7 900 123-45-67');
    expect(document.querySelector('[data-slot=json-viewer-path]')?.textContent).toContain('Значение скопировано');
    await act(async () => fireEvent.keyDown(phone, { key: 'C', metaKey: true, shiftKey: true }));
    expect(clipboard.writeText).toHaveBeenLastCalledWith('$.client.contacts[0].phone');
    await act(async () => fireEvent.keyDown(item('$.client.contacts[0]'), { key: 'c', ctrlKey: true }));
    expect(clipboard.writeText).toHaveBeenLastCalledWith(JSON.stringify(first, null, 2));
  });

  it('expands and collapses everything from the header', () => {
    render(<JsonViewer value={deal} defaultExpanded={['$']} />);
    fireEvent.click(screen.getByRole('button', { name: 'Развернуть всё' }));
    expect(item('$.history[3]').getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Свернуть всё' }));
    expect(screen.getAllByRole('treeitem')).toHaveLength(8);
  });

  it('shows the document as text', () => {
    render(<JsonViewer value={{ a: 1, b: 'x' }} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Текст' }));
    const text = document.querySelector('[data-slot=json-viewer-text]') as HTMLElement;
    expect(text.textContent).toBe('1{2  "a": 1,3  "b": "x"4}');
  });

  it('points at a broken document and opens it as text', () => {
    render(<JsonViewer value={'{\n  "amount": 640000,\n  "closed": false,,\n}'} />);
    const error = document.querySelector('[data-slot=json-viewer-error]') as HTMLElement;
    expect(error.textContent).toContain('Не JSON: строка 3, символ 19 — лишняя запятая');
    const marked = document.querySelector('[data-error-line]') as HTMLElement;
    expect(marked.textContent).toBe('3  "closed": false,,');
    expect(marked.querySelector('[data-slot=json-viewer-error-char]')?.textContent).toBe(',');
    fireEvent.click(screen.getByRole('button', { name: 'Как текст' }));
    expect(document.querySelector('[data-slot=json-viewer-text]')).not.toBeNull();
  });

  it('shows only the top level of a file over 1 MB and opens nodes on request', () => {
    const big = { meta: { source: 'export' }, rows: Array.from({ length: 3000 }, (_, index) => ({ id: index, note: 'x'.repeat(380) })) };
    render(<JsonViewer value={JSON.stringify(big)} />);
    expect(document.querySelector('[data-slot=json-viewer-notice]')?.textContent).toBe('Файл 1,1 МБПоказан верхний уровень, узлы раскрываются по запросу');
    expect(screen.queryByRole('button', { name: 'Развернуть всё' })).toBeNull();
    expect(item('$.meta').getAttribute('aria-expanded')).toBe('false');
  });

  it('switches to a virtual list over 5 000 nodes', () => {
    const many = Array.from({ length: 6000 }, (_, index) => index);
    render(<JsonViewer value={many} />);
    expect(document.querySelector('[data-slot=virtual-list]')).not.toBeNull();
    expect(document.querySelectorAll('[data-json-row]').length).toBeLessThan(200);
  });

  it('shows a skeleton while loading', () => {
    render(<JsonViewer value={{}} loading />);
    expect(document.querySelector('[data-slot=json-viewer]')?.getAttribute('aria-busy')).toBe('true');
    expect(document.querySelector('[data-slot=json-viewer-skeleton]')).not.toBeNull();
    expect(screen.queryByRole('tree')).toBeNull();
  });
});

describe('JsonDiff', () => {
  it('shows one column by default: two line numbers, signs and changed words', () => {
    render(<JsonDiff before={before} after={after} title="deal-1042.yaml" />);
    expect(document.querySelector('[data-slot=json-diff-stats]')?.textContent).toBe('+3−3');
    const removed = document.querySelector('[data-kind=removed]') as HTMLElement;
    expect(removed.textContent).toBe('2−stage: negotiation');
    expect(removed.querySelector('[data-slot=json-diff-word]')?.textContent).toBe('negotiation');
    const added = document.querySelectorAll('[data-kind=added]');
    expect(added[2]?.querySelector('[data-slot=json-diff-word]')).toBeNull();
  });

  it('folds unchanged runs longer than 6 lines down to 3 lines of context and unfolds on click', () => {
    render(<JsonDiff before={before} after={after} />);
    const fold = screen.getByRole('button', { name: /Показать 13 строк/ });
    expect(fold.textContent).toContain('@@ 7–19 @@');
    expect(screen.queryByText('field7: значение 7')).toBeNull();
    fireEvent.click(fold);
    expect(screen.getAllByText('field7: значение 7').length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /Показать/ })).toBeNull();
  });

  it('puts the versions side by side with a hatched empty side for unpaired lines', () => {
    render(<JsonDiff before={before} after={after} defaultView="split" />);
    expect(screen.getByRole('button', { name: /Показать 13 строк без изменений/ }).textContent).toContain('7–19');
    const rows = document.querySelectorAll('[data-slot=json-diff-row]');
    const paired = Array.from(rows).find((row) => row.textContent?.includes('negotiation')) as HTMLElement;
    expect(paired.textContent).toBe('2−stage: negotiation2+stage: contract');
    expect(document.querySelectorAll('[data-slot=json-diff-empty]')).toHaveLength(2);
  });

  it('switches the view from the header', () => {
    render(<JsonDiff before={before} after={after} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Рядом' }));
    expect(document.querySelectorAll('[data-slot=json-diff-empty]')).toHaveLength(2);
  });

  it('says the versions are the same, with only spaces hidden', () => {
    render(<JsonDiff before={{ a: 1 }} after={'{\n    "a": 1\n}'} />);
    expect(document.querySelector('[data-slot=json-diff-same]')?.textContent).toBe('Версии совпадаютИзменились только пробелы — они скрыты');
    render(<JsonDiff before={{ a: 1 }} after={{ a: 1 }} />);
    expect(screen.getByText('Ни одной изменённой строки')).toBeDefined();
  });

  it('shows the first changes of a large diff and loads all on request', () => {
    render(<JsonDiff before={before} after={after} maxChanges={2} />);
    expect(document.querySelector('[data-slot=json-diff-limit]')?.textContent).toBe('Изменений много — 6 строкПоказаны первые 2Загрузить всё');
    expect(document.querySelectorAll('[data-kind=removed], [data-kind=added]')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Загрузить всё' }));
    expect(document.querySelectorAll('[data-kind=removed], [data-kind=added]')).toHaveLength(6);
  });

  it('shows a skeleton while loading', () => {
    render(<JsonDiff before="" after="" loading />);
    expect(document.querySelector('[data-slot=json-diff]')?.getAttribute('aria-busy')).toBe('true');
    expect(document.querySelector('[data-slot=json-diff-skeleton]')).not.toBeNull();
  });
});
