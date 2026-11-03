import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RichTextEditor, RichTextEditorStatus, type MentionPerson } from '..';
import {
  createRichTextHistory,
  deleteBackward,
  deleteForward,
  deleteSelection,
  emptyRichText,
  formatAt,
  insertFragment,
  insertMention,
  insertText,
  normalizeHref,
  normalizeRichText,
  parseRichTextHTML,
  plainTextToRichText,
  recordRichTextHistory,
  redoRichText,
  richTextMentions,
  richTextToHTML,
  richTextToPlainText,
  safeHref,
  sealRichTextHistory,
  setBlockType,
  setLink,
  sliceRichText,
  splitBlock,
  toggleBlockType,
  toggleMark,
  undoRichText,
  type RichTextBlock,
  type RichTextBlockType,
  type RichTextInline,
  type RichTextMark,
  type RichTextPoint,
  type RichTextSelection,
  type RichTextState,
  type RichTextText,
  type RichTextValue,
} from '../lib/rich-text';

const t = (text: string, ...marks: RichTextMark[]): RichTextText => (marks.length > 0 ? { type: 'text', text, marks } : { type: 'text', text });
const link = (text: string, href: string, ...marks: RichTextMark[]): RichTextText => ({ ...t(text, ...marks), href });
const mention = (id: string, label: string): RichTextInline => ({ type: 'mention', id, label });
const block =
  (type: RichTextBlockType) =>
  (...content: (string | RichTextInline)[]): RichTextBlock => ({ type, content: content.map((part) => (typeof part === 'string' ? t(part) : part)) });
const p = block('paragraph');
const h = block('heading');
const li = block('bullet');
const ol = block('ordered');
const quote = block('quote');
const at = (blockIndex: number, offset: number): RichTextPoint => ({ block: blockIndex, offset });
const caret = (blockIndex: number, offset: number): RichTextSelection => ({ anchor: at(blockIndex, offset), focus: at(blockIndex, offset) });
const range = (b1: number, o1: number, b2: number, o2: number): RichTextSelection => ({ anchor: at(b1, o1), focus: at(b2, o2) });
const state = (doc: RichTextValue, selection: RichTextSelection): RichTextState => ({ doc, selection });

const deal: RichTextValue = [
  h('Поставка для «Северного ветра»'),
  p('Клиент подтвердил объём ', t('на 1,2 млн ₽', 'bold'), ' и просит отгрузку ', t('до 15 ноября', 'italic'), '. Условия — в ', link('договоре № 418', 'https://norda.cloud/deals/418'), '.'),
  li('Счёт выставить до пятницы'),
  li('Согласовать окно разгрузки со складом'),
  quote('«Если успеем к 15-му, берём ещё две партии» — Игорь, закупки'),
  p('Артикул в 1С: ', t('NRD-2041-SV', 'code')),
  ol('Отгрузка'),
];

describe('rich text model', () => {
  it('merges neighbour runs with the same format, drops empty ones and orders marks', () => {
    expect(
      normalizeRichText([p(t('а', 'italic', 'bold'), t('б', 'bold', 'italic'), t(''), 'в', t('г'), link('д', 'https://a.ru'), link('е', 'https://a.ru'))]),
    ).toEqual([p(t('аб', 'bold', 'italic'), 'вг', link('де', 'https://a.ru'))]);
  });

  it('always keeps one block', () => {
    expect(normalizeRichText([])).toEqual([p()]);
    expect(emptyRichText()).toEqual([p()]);
  });

  it('reads as plain text: blocks by lines, mentions as «@Имя»', () => {
    expect(richTextToPlainText([p('Привет, ', mention('maria', 'Мария Ким'), '!'), li('пункт'), p('a\nb')])).toBe('Привет, @Мария Ким!\nпункт\na\nb');
  });

  it('lists the people mentioned once, in order', () => {
    expect(richTextMentions([p(mention('maria', 'Мария'), ' и ', mention('ilya', 'Илья')), p(mention('maria', 'Мария'))])).toEqual(['maria', 'ilya']);
  });
});

describe('richTextToHTML', () => {
  it('writes the deal note with blocks, marks, a link, a list, a quote and inline code', () => {
    expect(richTextToHTML(deal)).toBe(
      '<h2>Поставка для «Северного ветра»</h2>' +
        '<p>Клиент подтвердил объём <strong>на 1,2 млн ₽</strong> и просит отгрузку <em>до 15 ноября</em>. Условия — в ' +
        '<a href="https://norda.cloud/deals/418" target="_blank" rel="noopener noreferrer">договоре № 418</a>.</p>' +
        '<ul><li>Счёт выставить до пятницы</li><li>Согласовать окно разгрузки со складом</li></ul>' +
        '<blockquote><p>«Если успеем к 15-му, берём ещё две партии» — Игорь, закупки</p></blockquote>' +
        '<p>Артикул в 1С: <code>NRD-2041-SV</code></p>' +
        '<ol><li>Отгрузка</li></ol>',
    );
  });

  it('nests every mark inside the link in one fixed order', () => {
    expect(richTextToHTML([p(link('x', 'https://a.ru', 'code', 'strike', 'underline', 'italic', 'bold'))])).toBe(
      '<p><a href="https://a.ru/" target="_blank" rel="noopener noreferrer"><strong><em><u><s><code>x</code></s></u></em></strong></a></p>',
    );
  });

  it('groups neighbour quote blocks into one blockquote and splits lists of different kinds', () => {
    expect(richTextToHTML([quote('a'), quote('b'), li('c'), ol('d'), li('e')])).toBe(
      '<blockquote><p>a</p><p>b</p></blockquote><ul><li>c</li></ul><ol><li>d</li></ol><ul><li>e</li></ul>',
    );
  });

  it('escapes text and attribute values', () => {
    expect(richTextToHTML([p(`<script>alert("x")</script> & '`, mention('a"b', '<b>'))])).toBe(
      '<p>&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;<span data-mention-id="a&quot;b">@&lt;b&gt;</span></p>',
    );
  });

  it('writes soft breaks as <br> and keeps empty lines visible', () => {
    expect(richTextToHTML([p('a\nb'), p(), p('c\n')])).toBe('<p>a<br>b</p><p><br></p><p>c<br><br></p>');
  });

  it('marks mention chips as one uneditable piece only inside the editor', () => {
    expect(richTextToHTML([p(mention('maria', 'Мария Ким'))], { editable: true })).toBe(
      '<p><span data-mention-id="maria" contenteditable="false">@Мария Ким</span></p>',
    );
  });

  it('drops an unsafe href that reached the model, keeping the text', () => {
    expect(richTextToHTML([p(link('нажми', 'javascript:alert(1)'))])).toBe('<p>нажми</p>');
  });

  it('wraps what is past the limit, counting a line per block', () => {
    expect(richTextToHTML([p('Hello world')], { editable: true, limit: 5 })).toBe('<p>Hello<span data-over=""> world</span></p>');
    expect(richTextToHTML([p('ab'), p(t('cd', 'bold'))], { editable: true, limit: 4 })).toBe('<p>ab</p><p><strong>c<span data-over="">d</span></strong></p>');
  });
});

describe('parseRichTextHTML', () => {
  const people = (id: string) => (id === 'maria' ? 'Мария Ким' : undefined);

  it('reads back what richTextToHTML writes', () => {
    const doc = [...deal, p('с ', mention('maria', 'Мария Ким'), ' и\nпереносом'), p(), p(link('почта', 'mailto:a@norda.cloud', 'bold'))];
    expect(parseRichTextHTML(richTextToHTML(doc), { mention: people })).toEqual(normalizeRichText(doc));
  });

  it('cleans Google Docs markup: the bold wrapper with font-weight normal, styles on spans', () => {
    expect(
      parseRichTextHTML(
        '<meta charset="utf-8"><b style="font-weight:normal;" id="docs-internal-guid-1"><p dir="ltr"><span style="font-weight:700">Жирный</span><span style="font-style:italic"> курсив</span><span style="text-decoration:underline"> подчёркнутый</span><span style="text-decoration:line-through"> зачёркнутый</span></p></b>',
      ),
    ).toEqual([p(t('Жирный', 'bold'), t(' курсив', 'italic'), t(' подчёркнутый', 'underline'), t(' зачёркнутый', 'strike'))]);
  });

  it('flattens nested lists and paragraphs inside list items', () => {
    expect(parseRichTextHTML('<ul><li><p>Один</p></li><li>Два<ul><li>Вложенный</li></ul></li></ul><ol><li>Три</li></ol>')).toEqual([
      li('Один'),
      li('Два'),
      li('Вложенный'),
      ol('Три'),
    ]);
  });

  it('maps every heading level to the one heading and quote paragraphs to quote blocks', () => {
    expect(parseRichTextHTML('<h1>Раз</h1><h3>Два</h3><blockquote><p>Цитата</p>хвост</blockquote>')).toEqual([h('Раз'), h('Два'), quote('Цитата'), quote('хвост')]);
  });

  it('reads <div> and <br> lines, collapses HTML whitespace', () => {
    expect(parseRichTextHTML('<div>  Много \n  пробелов  </div><div>a<br>b</div>')).toEqual([p('Много пробелов'), p('a\nb')]);
  });

  it('keeps line breaks of <pre> as inline code', () => {
    expect(parseRichTextHTML('<pre>a  b\nc</pre>')).toEqual([p(t('a  b\nc', 'code'))]);
  });

  it('turns a chip into a mention only for a known person', () => {
    const html = '<p><span data-mention-id="maria">@Мария Ким</span> <span data-mention-id="ghost">@Кто-то</span></p>';
    expect(parseRichTextHTML(html, { mention: people })).toEqual([p(mention('maria', 'Мария Ким'), ' @Кто-то')]);
    expect(parseRichTextHTML(html)).toEqual([p('@Мария Ким @Кто-то')]);
  });

  it('reads plain text line by line', () => {
    expect(plainTextToRichText('Первая\r\nВторая\n\nЧетвёртая')).toEqual([p('Первая'), p('Вторая'), p(), p('Четвёртая')]);
  });
});

describe('XSS: pasted HTML keeps only text and allowed formatting', () => {
  const out = (html: string) => richTextToHTML(parseRichTextHTML(html));

  it('drops <script> with its text', () => {
    expect(parseRichTextHTML('<p>a<script>alert(1)</script>b</p>')).toEqual([p('ab')]);
    expect(out('<script>alert(1)</script><p>ok</p>')).toBe('<p>ok</p>');
  });

  it('drops images and every on* handler', () => {
    expect(out('<img src=x onerror="window.__kvXss=1">текст<a href="https://a.ru" onclick="alert(1)" onmouseover="alert(2)">ссылка</a>')).toBe(
      '<p>текст<a href="https://a.ru/" target="_blank" rel="noopener noreferrer">ссылка</a></p>',
    );
    expect((window as Window & { __kvXss?: number }).__kvXss).toBeUndefined();
  });

  it.each([
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    ' java\tscript:alert(1)',
    'java\nscript:alert(1)',
    '&#106;avascript:alert(1)',
    '&#x6A;avascript&#58;alert(1)',
    'vbscript:msgbox(1)',
    'data:text/html,<script>alert(1)</script>',
    'file:///etc/passwd',
    '//evil.example/x',
    '/relative/path',
  ])('keeps the text of a link to «%s», drops the link', (href) => {
    const html = out(`<a href="${href}">нажми</a>`);
    expect(html).toBe('<p>нажми</p>');
  });

  it('drops <style>, style, class and id attributes', () => {
    expect(out('<style>p{color:red}</style><p style="color:red;background:url(javascript:alert(1))" class="x" id="y">a</p>')).toBe('<p>a</p>');
  });

  it('drops iframe, object, embed, svg, math, template, noscript and form controls with their content', () => {
    expect(
      out(
        '<iframe srcdoc="<script>alert(1)</script>">x</iframe><object data="x">o</object><embed src="x"><svg onload="alert(1)"><text>y</text></svg>' +
          '<math><mi>m</mi></math><template><p>z</p></template><noscript>n</noscript><textarea>t</textarea><select><option>s</option></select><p>ok</p>',
      ),
    ).toBe('<p>ok</p>');
  });

  it('keeps http(s), mailto and tel links with quotes encoded', () => {
    expect(out('<a href="mailto:ivan@norda.cloud">почта</a> <a href="tel:+74950000000">звонок</a>')).toBe(
      '<p><a href="mailto:ivan@norda.cloud" target="_blank" rel="noopener noreferrer">почта</a> <a href="tel:+74950000000" target="_blank" rel="noopener noreferrer">звонок</a></p>',
    );
    const tricky = out('<a href="https://a.ru/?q=&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;">x</a>');
    expect(tricky).not.toContain('<script');
    expect(tricky).not.toContain('"><');
  });

  it('keeps markup typed as text as text', () => {
    const doc = parseRichTextHTML('<p>&lt;img src=x onerror=alert(1)&gt;</p>');
    expect(doc).toEqual([p('<img src=x onerror=alert(1)>')]);
    expect(richTextToHTML(doc)).toBe('<p>&lt;img src=x onerror=alert(1)&gt;</p>');
  });

  it('drops hidden elements and control characters', () => {
    expect(parseRichTextHTML('<p>a<span hidden>скрыто</span><span style="display:none">тоже</span>b\u0000\u0007\uFFFC</p>')).toEqual([p('ab')]);
  });
});

describe('links', () => {
  it.each([
    ['https://norda.cloud/a', 'https://norda.cloud/a'],
    ['HTTP://norda.cloud', 'http://norda.cloud/'],
    ['mailto:a@norda.cloud', 'mailto:a@norda.cloud'],
    ['tel:+74950000000', 'tel:+74950000000'],
  ])('safeHref keeps %s', (href, result) => {
    expect(safeHref(href)).toBe(result);
  });

  it.each(['javascript:alert(1)', 'ftp://norda.cloud', '/deals/418', '', 'data:text/plain,a'])('safeHref rejects «%s»', (href) => {
    expect(safeHref(href)).toBeNull();
  });

  it.each([
    ['norda.cloud/deals/418', 'https://norda.cloud/deals/418'],
    [' https://norda.cloud ', 'https://norda.cloud/'],
    ['ivan@norda.cloud', 'mailto:ivan@norda.cloud'],
    ['+7 (495) 000-00-00', 'tel:+74950000000'],
  ])('normalizeHref reads «%s» as %s', (input, result) => {
    expect(normalizeHref(input)).toBe(result);
  });

  it.each(['просто текст', 'javascript:alert(1)', ''])('normalizeHref rejects «%s»', (input) => {
    expect(normalizeHref(input)).toBeNull();
  });
});

describe('editing commands', () => {
  it('types with the format of the character before the caret', () => {
    const next = insertText(state([p(t('жир', 'bold'), ' текст')], caret(0, 3)), 'ный');
    expect(next.doc).toEqual([p(t('жирный', 'bold'), ' текст')]);
    expect(next.selection).toEqual(caret(0, 6));
  });

  it('does not stretch a link or inline code typed at their end, but continues inside', () => {
    expect(insertText(state([p(link('ссылка', 'https://a.ru'))], caret(0, 6)), '!').doc).toEqual([p(link('ссылка', 'https://a.ru'), '!')]);
    expect(insertText(state([p(link('ссылка', 'https://a.ru'))], caret(0, 3)), '-').doc).toEqual([p(link('ссы-лка', 'https://a.ru'))]);
    expect(insertText(state([p(t('NRD', 'code'))], caret(0, 3)), ' ').doc).toEqual([p(t('NRD', 'code'), ' ')]);
  });

  it('typing into an empty list item, quote or heading keeps the block', () => {
    expect(insertText(state([li('один'), li()], caret(1, 0)), 'два').doc).toEqual([li('один'), li('два')]);
    expect(insertText(state([h()], caret(0, 0)), 'Итоги').doc).toEqual([h('Итоги')]);
    expect(insertMention(state([quote('@')], caret(0, 1)), at(0, 0), { id: 'maria', label: 'Мария Ким' }).doc).toEqual([quote(mention('maria', 'Мария Ким'), ' ')]);
  });

  it('types with an explicit format (marks switched on at a collapsed caret)', () => {
    expect(insertText(state([p('a')], caret(0, 1)), 'b', { marks: ['bold'] }).doc).toEqual([p('a', t('b', 'bold'))]);
  });

  it('replaces a selection across blocks, the first block keeps its type', () => {
    const next = insertText(state([h('Заголовок'), li('пункт')], range(0, 3, 1, 2)), '—');
    expect(next.doc).toEqual([h('Заг—нкт')]);
    expect(next.selection).toEqual(caret(0, 4));
  });

  it('deletes a whole grapheme and a whole mention with one Backspace', () => {
    expect(deleteBackward(state([p('ок👍🏽')], caret(0, 6)), 'char').doc).toEqual([p('ок')]);
    const chip = deleteBackward(state([p('для ', mention('maria', 'Мария'), ' ')], caret(0, 5)), 'char');
    expect(chip.doc).toEqual([p('для  ')]);
    expect(chip.selection).toEqual(caret(0, 4));
  });

  it('Backspace at the start of a list item, quote or heading turns it into text', () => {
    for (const type of ['bullet', 'ordered', 'quote', 'heading'] as const) {
      expect(deleteBackward(state([p('a'), block(type)('пункт')], caret(1, 0)), 'char').doc).toEqual([p('a'), p('пункт')]);
    }
  });

  it('Backspace at the start of a paragraph joins it to the block above', () => {
    const next = deleteBackward(state([li('один'), p('два')], caret(1, 0)), 'char');
    expect(next.doc).toEqual([li('одиндва')]);
    expect(next.selection).toEqual(caret(0, 4));
    expect(deleteBackward(state([p('a')], caret(0, 0)), 'char').doc).toEqual([p('a')]);
  });

  it('Delete at the end of a block pulls the next one up', () => {
    expect(deleteForward(state([p('a'), li('b')], caret(0, 1)), 'char').doc).toEqual([p('ab')]);
    expect(deleteForward(state([p('ab')], caret(0, 0)), 'char').doc).toEqual([p('b')]);
  });

  it('deletes words back and forward', () => {
    expect(deleteBackward(state([p('Счёт выставить ')], caret(0, 15)), 'word').doc).toEqual([p('Счёт ')]);
    expect(deleteForward(state([p('Счёт выставить')], caret(0, 4)), 'word').doc).toEqual([p('Счёт')]);
  });

  it('deletes a selection and puts the caret at its start', () => {
    const next = deleteSelection(state([p('abc'), p('def')], range(1, 1, 0, 1)));
    expect(next.doc).toEqual([p('aef')]);
    expect(next.selection).toEqual(caret(0, 1));
  });

  it('Enter splits a paragraph and keeps the formatting of both halves', () => {
    const next = splitBlock(state([p(t('жирный', 'bold'), ' текст')], caret(0, 3)));
    expect(next.doc).toEqual([p(t('жир', 'bold')), p(t('ный', 'bold'), ' текст')]);
    expect(next.selection).toEqual(caret(1, 0));
  });

  it('Enter in a list item makes the next item; in an empty item leaves the list', () => {
    expect(splitBlock(state([li('один')], caret(0, 4))).doc).toEqual([li('один'), li()]);
    expect(splitBlock(state([li('один'), li()], caret(1, 0))).doc).toEqual([li('один'), p()]);
    expect(splitBlock(state([quote()], caret(0, 0))).doc).toEqual([p()]);
  });

  it('Enter at the end of a heading continues with text', () => {
    expect(splitBlock(state([h('Итоги')], caret(0, 5))).doc).toEqual([h('Итоги'), p()]);
    expect(splitBlock(state([h('Итоги')], caret(0, 2))).doc).toEqual([h('Ит'), h('оги')]);
  });

  it('toggles a mark: adds it to a partly formatted range, removes it when all of it has it', () => {
    const partly = toggleMark(state([p(t('ab', 'bold'), 'cd')], range(0, 1, 0, 3)), 'bold');
    expect(partly.doc).toEqual([p(t('abc', 'bold'), 'd')]);
    expect(toggleMark(partly, 'bold').doc).toEqual([p(t('a', 'bold'), 'bcd')]);
    expect(toggleMark(state([p('ab')], caret(0, 1)), 'bold').doc).toEqual([p('ab')]);
  });

  it('formats across blocks and leaves mentions as they are', () => {
    const next = toggleMark(state([p('ab', mention('maria', 'Мария')), p('cd')], range(0, 1, 1, 1)), 'italic');
    expect(next.doc).toEqual([p('a', t('b', 'italic'), mention('maria', 'Мария')), p(t('c', 'italic'), 'd')]);
  });

  it('toggles a block type for every block of the selection', () => {
    const list = toggleBlockType(state([p('a'), p('b'), p('c')], range(0, 0, 1, 1)), 'bullet');
    expect(list.doc).toEqual([li('a'), li('b'), p('c')]);
    expect(toggleBlockType(list, 'bullet').doc).toEqual([p('a'), p('b'), p('c')]);
    expect(setBlockType(state([li('a')], caret(0, 0)), 'ordered').doc).toEqual([ol('a')]);
  });

  it('sets, edits and removes a link', () => {
    const linked = setLink(state([p('Условия в договоре')], range(0, 10, 0, 18)), 'https://norda.cloud/deals/418');
    expect(linked.doc).toEqual([p('Условия в ', link('договоре', 'https://norda.cloud/deals/418'))]);
    expect(setLink({ ...linked, selection: caret(0, 12) }, 'https://norda.cloud/deals/419').doc).toEqual([p('Условия в ', link('договоре', 'https://norda.cloud/deals/419'))]);
    expect(setLink({ ...linked, selection: caret(0, 12) }, null).doc).toEqual([p('Условия в договоре')]);
  });

  it('inserts the address as a linked text when nothing is selected', () => {
    const next = setLink(state([p('См. ')], caret(0, 4)), 'https://norda.cloud/deals/418');
    expect(next.doc).toEqual([p('См. ', link('norda.cloud/deals/418', 'https://norda.cloud/deals/418'))]);
    expect(next.selection).toEqual(caret(0, 25));
  });

  it('replaces «@мар» with a mention chip and a space', () => {
    const next = insertMention(state([p('Передать @мар')], caret(0, 13)), at(0, 9), { id: 'marina', label: 'Марина Соколова' });
    expect(next.doc).toEqual([p('Передать ', mention('marina', 'Марина Соколова'), ' ')]);
    expect(next.selection).toEqual(caret(0, 11));
  });

  it('reports the format at the selection for the toolbar', () => {
    expect(formatAt(state([p(t('ab', 'bold', 'italic'), t('c', 'bold'))], range(0, 0, 0, 3)))).toEqual({ marks: ['bold'], block: 'paragraph' });
    expect(formatAt(state([li(link('x', 'https://a.ru'))], caret(0, 1)))).toEqual({ marks: [], block: 'bullet', href: 'https://a.ru' });
    expect(formatAt(state([p(t('ab', 'code'))], caret(0, 1)))).toEqual({ marks: ['code'], block: 'paragraph' });
  });

  it('copies a slice and pastes several blocks into the middle of a list item', () => {
    const copied = sliceRichText([p('ab', t('cd', 'bold')), h('ef')], range(0, 1, 1, 1));
    expect(copied).toEqual([p('b', t('cd', 'bold')), h('e')]);
    const pasted = insertFragment(state([li('12')], caret(0, 1)), [p('x'), p('y'), p('z')]);
    expect(pasted.doc).toEqual([li('1x'), p('y'), p('z2')]);
    expect(pasted.selection).toEqual(caret(2, 1));
  });

  it('pasted blocks keep their own type when they land in an empty block', () => {
    expect(insertFragment(state([p()], caret(0, 0)), [h('Итоги'), p('Обсудили')]).doc).toEqual([h('Итоги'), p('Обсудили')]);
    expect(insertFragment(state([p()], caret(0, 0)), [quote('Цитата')]).doc).toEqual([quote('Цитата')]);
    expect(insertFragment(state([li('12')], caret(0, 0)), [p('x'), p('y')]).doc).toEqual([li('x'), p('y12')]);
    expect(insertFragment(state([li('один'), li()], caret(1, 0)), [p('просто текст')]).doc).toEqual([li('один'), li('просто текст')]);
  });

  it('pastes one block inline, keeping the current block type', () => {
    expect(insertFragment(state([h('ab')], caret(0, 1)), [p(t('x', 'bold'))]).doc).toEqual([h('a', t('x', 'bold'), 'b')]);
  });
});

describe('history', () => {
  const s0 = state([p('')], caret(0, 0));
  const s1 = state([p('a')], caret(0, 1));
  const s2 = state([p('ab')], caret(0, 2));

  it('groups typing within a second into one step', () => {
    let history = recordRichTextHistory(createRichTextHistory(), s0, 'insert', 1000);
    history = recordRichTextHistory(history, s1, 'insert', 1500);
    const undone = undoRichText(history, s2);
    expect(undone?.state).toEqual(s0);
  });

  it('starts a new step after a pause and when the kind of edit changes', () => {
    let history = recordRichTextHistory(createRichTextHistory(), s0, 'insert', 1000);
    history = recordRichTextHistory(history, s1, 'insert', 2500);
    expect(undoRichText(history, s2)?.state).toEqual(s1);
    let mixed = recordRichTextHistory(createRichTextHistory(), s0, 'insert', 1000);
    mixed = recordRichTextHistory(mixed, s1, 'delete', 1100);
    expect(undoRichText(mixed, s2)?.state).toEqual(s1);
    let formatting = recordRichTextHistory(createRichTextHistory(), s0, 'other', 1000);
    formatting = recordRichTextHistory(formatting, s1, 'other', 1100);
    expect(undoRichText(formatting, s2)?.state).toEqual(s1);
  });

  it('redoes what was undone, and a new edit clears redo', () => {
    const history = recordRichTextHistory(createRichTextHistory(), s1, 'other', 1000);
    const undone = undoRichText(history, s2);
    if (!undone) throw new Error('nothing to undo');
    expect(undone.state).toEqual(s1);
    const redone = redoRichText(undone.history, undone.state);
    expect(redone?.state).toEqual(s2);
    expect(redoRichText(recordRichTextHistory(undone.history, s1, 'other', 3000), s0)).toBeNull();
    expect(undoRichText(createRichTextHistory(), s0)).toBeNull();
  });

  it('a caret moved by the person ends the typing step', () => {
    let history = recordRichTextHistory(createRichTextHistory(), s0, 'insert', 1000);
    history = sealRichTextHistory(history);
    history = recordRichTextHistory(history, s1, 'insert', 1100);
    expect(undoRichText(history, s2)?.state).toEqual(s1);
  });

  it('keeps the last 100 steps', () => {
    let history = createRichTextHistory();
    for (let index = 0; index < 150; index++) history = recordRichTextHistory(history, state([p(String(index))], caret(0, 0)), 'other', index * 10_000);
    expect(history.undo).toHaveLength(100);
    expect(history.undo[0]?.state.doc).toEqual([p('50')]);
  });
});

const people: MentionPerson[] = [
  { id: 'marina', name: 'Марина Соколова', role: 'Менеджер по продажам' },
  { id: 'maria', name: 'Мария Ким', role: 'Бухгалтер' },
  { id: 'ilya', name: 'Илья Громов', role: 'Дизайнер' },
];

/** Puts the DOM selection over `[start, end)` of the first text node that contains `text`. */
function selectText(root: HTMLElement, text: string, start = 0, end = text.length) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const index = node.textContent?.indexOf(text) ?? -1;
    if (index < 0) continue;
    const selection = document.getSelection();
    const selected = document.createRange();
    selected.setStart(node, index + start);
    selected.setEnd(node, index + end);
    selection?.removeAllRanges();
    selection?.addRange(selected);
    document.dispatchEvent(new Event('selectionchange'));
    return;
  }
  throw new Error(`no text «${text}»`);
}

function clipboard(data: Record<string, string>) {
  return { getData: (type: string) => data[type] ?? '', setData: vi.fn(), types: Object.keys(data) };
}

describe('RichTextEditor', () => {
  it('renders the full toolbar and the document', () => {
    render(<RichTextEditor aria-label="Описание сделки" defaultValue={deal} />);
    const toolbar = screen.getByRole('toolbar', { name: 'Форматирование' });
    for (const name of ['Жирный', 'Курсив', 'Подчёркнутый', 'Зачёркнутый', 'Заголовок', 'Маркированный список', 'Нумерованный список', 'Цитата', 'Ссылка', 'Код', 'Отменить', 'Повторить']) {
      expect(toolbar.querySelector(`[aria-label="${name}"]`), name).not.toBeNull();
    }
    expect(screen.getByRole('button', { name: /Тип блока/ }).textContent).toContain('Заголовок');
    const box = screen.getByRole('textbox', { name: 'Описание сделки' });
    expect(box.getAttribute('contenteditable')).toBe('true');
    expect(box.getAttribute('aria-multiline')).toBe('true');
    expect(box.innerHTML).toBe(richTextToHTML(deal, { editable: true }));
  });

  it('types text from the keyboard and reports the value', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<RichTextEditor aria-label="Заметка" onValueChange={onValueChange} />);
    const box = screen.getByRole('textbox', { name: 'Заметка' });
    await user.click(box);
    await user.keyboard('Счёт{Enter}готов');
    expect(onValueChange).toHaveBeenLastCalledWith([p('Счёт'), p('готов')]);
    expect(box.innerHTML).toBe('<p>Счёт</p><p>готов</p>');
  });

  it('⌘B makes the selection bold, the toolbar shows it, ⌘Z takes it back', async () => {
    const onValueChange = vi.fn();
    render(<RichTextEditor aria-label="Заметка" defaultValue={[p('первая партия')]} onValueChange={onValueChange} />);
    const box = screen.getByRole('textbox', { name: 'Заметка' });
    act(() => box.focus());
    act(() => selectText(box, 'первая'));
    fireEvent.keyDown(box, { key: 'b', code: 'KeyB', metaKey: true });
    expect(onValueChange).toHaveBeenLastCalledWith([p(t('первая', 'bold'), ' партия')]);
    expect(screen.getAllByRole('button', { name: 'Жирный' }).some((button) => button.getAttribute('aria-pressed') === 'true')).toBe(true);
    fireEvent.keyDown(box, { key: 'z', code: 'KeyZ', metaKey: true });
    expect(onValueChange).toHaveBeenLastCalledWith([p('первая партия')]);
    fireEvent.keyDown(box, { key: 'z', code: 'KeyZ', metaKey: true, shiftKey: true });
    expect(onValueChange).toHaveBeenLastCalledWith([p(t('первая', 'bold'), ' партия')]);
  });

  it('works on a Russian layout: shortcuts read the key position', () => {
    const onValueChange = vi.fn();
    render(<RichTextEditor aria-label="Заметка" defaultValue={[p('текст')]} onValueChange={onValueChange} />);
    const box = screen.getByRole('textbox', { name: 'Заметка' });
    act(() => box.focus());
    act(() => selectText(box, 'текст'));
    fireEvent.keyDown(box, { key: 'ш', code: 'KeyI', ctrlKey: true });
    expect(onValueChange).toHaveBeenLastCalledWith([p(t('текст', 'italic'))]);
    fireEvent.keyDown(box, { key: '*', code: 'Digit8', metaKey: true, shiftKey: true });
    expect(onValueChange).toHaveBeenLastCalledWith([li(t('текст', 'italic'))]);
    fireEvent.keyDown(box, { key: '&', code: 'Digit7', metaKey: true, shiftKey: true });
    expect(onValueChange).toHaveBeenLastCalledWith([ol(t('текст', 'italic'))]);
  });

  it('a toolbar button keeps the selection and applies to it', () => {
    const onValueChange = vi.fn();
    render(<RichTextEditor aria-label="Заметка" defaultValue={[p('Счёт'), p('Окно')]} onValueChange={onValueChange} />);
    const box = screen.getByRole('textbox', { name: 'Заметка' });
    act(() => box.focus());
    act(() => selectText(box, 'Окно', 1, 2));
    const button = screen.getAllByRole('button', { name: 'Маркированный список' })[0];
    if (!button) throw new Error('no list button');
    fireEvent.mouseDown(button);
    fireEvent.click(button);
    expect(onValueChange).toHaveBeenLastCalledWith([p('Счёт'), li('Окно')]);
  });

  it('cleans pasted HTML: no script, no handlers, no javascript: links', () => {
    const onValueChange = vi.fn();
    render(<RichTextEditor aria-label="Заметка" onValueChange={onValueChange} />);
    const box = screen.getByRole('textbox', { name: 'Заметка' });
    act(() => box.focus());
    fireEvent.paste(box, {
      clipboardData: clipboard({
        'text/html':
          '<p onclick="alert(1)">Привет <b>жирный</b><script>alert(1)</script><img src=x onerror=alert(1)><a href="javascript:alert(1)">ссылка</a><iframe src="https://evil.example"></iframe><a href="https://norda.cloud">норда</a></p>',
        'text/plain': 'Привет жирный ссылка норда',
      }),
    });
    expect(box.querySelector('script, img, iframe, [onclick], [onerror], [style]')).toBeNull();
    expect([...box.querySelectorAll('a')].map((anchor) => anchor.getAttribute('href'))).toEqual(['https://norda.cloud/']);
    expect(onValueChange).toHaveBeenLastCalledWith([p('Привет ', t('жирный', 'bold'), 'ссылка', link('норда', 'https://norda.cloud/'))]);
  });

  it('pastes plain text with line breaks as paragraphs', () => {
    const onValueChange = vi.fn();
    render(<RichTextEditor aria-label="Заметка" onValueChange={onValueChange} />);
    const box = screen.getByRole('textbox', { name: 'Заметка' });
    act(() => box.focus());
    fireEvent.paste(box, { clipboardData: clipboard({ 'text/plain': 'Первая\nВторая' }) });
    expect(onValueChange).toHaveBeenLastCalledWith([p('Первая'), p('Вторая')]);
  });

  it('opens people on «@», Enter inserts a chip that one Backspace removes', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<RichTextEditor aria-label="Комментарий" people={people} onValueChange={onValueChange} />);
    const box = screen.getByRole('textbox', { name: 'Комментарий' });
    await user.click(box);
    await user.keyboard('Передать @мар');
    expect(screen.getByRole('listbox', { name: 'Люди' })).toBeDefined();
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([expect.stringContaining('Марина Соколова'), expect.stringContaining('Мария Ким')]);
    expect(box.getAttribute('aria-expanded')).toBe('true');
    await user.keyboard('{Enter}');
    expect(screen.queryByRole('listbox', { name: 'Люди' })).toBeNull();
    expect(box.querySelector('[data-mention-id="marina"]')?.textContent).toBe('@Марина Соколова');
    expect(onValueChange).toHaveBeenLastCalledWith([p('Передать ', mention('marina', 'Марина Соколова'), ' ')]);
    await user.keyboard('{Backspace}{Backspace}');
    expect(onValueChange).toHaveBeenLastCalledWith([p('Передать ')]);
  });

  it('«/» opens block types for the current line', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<RichTextEditor aria-label="Заметка" onValueChange={onValueChange} />);
    const box = screen.getByRole('textbox', { name: 'Заметка' });
    await user.click(box);
    await user.keyboard('/цит');
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['Цитата']);
    await user.keyboard('{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith([quote()]);
  });

  it('shows the placeholder only while empty', () => {
    render(<RichTextEditor aria-label="Заметка" placeholder="Опишите, о чём договорились" />);
    const box = screen.getByRole('textbox', { name: 'Заметка' });
    expect(box.getAttribute('data-placeholder')).toBe('Опишите, о чём договорились');
    expect(box.hasAttribute('data-empty')).toBe(true);
    expect(box.getAttribute('aria-placeholder')).toBe('Опишите, о чём договорились');
  });

  it('counts characters, warns from 90 % and explains how much to cut', () => {
    const { rerender } = render(<RichTextEditor aria-label="Заметка" value={[p('a'.repeat(318))]} maxLength={2000} />);
    expect(screen.getByText(/^318 \/ 2\s000$/).getAttribute('data-limit')).toBeNull();
    rerender(<RichTextEditor aria-label="Заметка" value={[p('a'.repeat(9))]} maxLength={10} />);
    expect(screen.getByText('9 / 10').getAttribute('data-limit')).toBe('near');
    rerender(<RichTextEditor aria-label="Заметка" value={[p('a'.repeat(12))]} maxLength={10} />);
    expect(screen.getByText('12 / 10').getAttribute('data-limit')).toBe('over');
    const box = screen.getByRole('textbox', { name: 'Заметка' });
    expect(box.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText('Сократите текст на 2 символа')).toBeDefined();
    expect(box.querySelector('[data-over]')?.textContent).toBe('aa');
  });

  it('read-only: no toolbar, the text can be selected but not edited', () => {
    render(<RichTextEditor aria-label="Заметка" defaultValue={deal} readOnly status={<RichTextEditorStatus state="locked">Сделка закрыта · правка недоступна</RichTextEditorStatus>} />);
    expect(screen.queryByRole('toolbar')).toBeNull();
    const box = screen.getByRole('textbox', { name: 'Заметка' });
    expect(box.getAttribute('contenteditable')).toBe('false');
    expect(box.getAttribute('aria-readonly')).toBe('true');
    expect(box.querySelector('a')?.getAttribute('href')).toBe('https://norda.cloud/deals/418');
    expect(screen.getByText('Сделка закрыта · правка недоступна')).toBeDefined();
  });

  it('disabled: the toolbar is off and the text cannot be edited', () => {
    render(<RichTextEditor aria-label="Заметка" disabled />);
    const box = screen.getByRole('textbox', { name: 'Заметка' });
    expect(box.getAttribute('contenteditable')).toBe('false');
    expect(box.getAttribute('aria-disabled')).toBe('true');
    const bold = screen.getAllByRole('button', { name: 'Жирный' })[0];
    expect(bold?.hasAttribute('disabled') || bold?.getAttribute('aria-disabled') === 'true').toBe(true);
  });

  it('invalid: marked for assistive tech and drawn with a danger frame', () => {
    const { container } = render(<RichTextEditor aria-label="Заметка" invalid />);
    expect(screen.getByRole('textbox', { name: 'Заметка' }).getAttribute('aria-invalid')).toBe('true');
    expect(container.querySelector('[data-slot="rich-text-editor"]')?.hasAttribute('data-invalid')).toBe(true);
  });

  it('labels the field with `label`', () => {
    render(<RichTextEditor label="Описание сделки" />);
    expect(screen.getByRole('textbox', { name: 'Описание сделки' })).toBeDefined();
  });

  it('compact: ⌘Enter and the arrow send the comment, an empty one cannot be sent', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<RichTextEditor variant="compact" aria-label="Комментарий" placeholder="Комментарий к сделке…" onSubmit={onSubmit} />);
    const send = screen.getByRole('button', { name: 'Отправить' });
    expect(send.hasAttribute('disabled') || send.getAttribute('aria-disabled') === 'true').toBe(true);
    const box = screen.getByRole('textbox', { name: 'Комментарий' });
    await user.click(box);
    await user.keyboard('Проверь остатки');
    fireEvent.keyDown(box, { key: 'Enter', code: 'Enter', metaKey: true });
    expect(onSubmit).toHaveBeenLastCalledWith([p('Проверь остатки')]);
    await user.click(screen.getByRole('button', { name: 'Отправить' }));
    expect(onSubmit).toHaveBeenCalledTimes(2);
  });

  it('compact: a text submit button and an attach button when asked', () => {
    const onAttach = vi.fn();
    render(<RichTextEditor variant="compact" aria-label="Заметка" defaultValue={[p('a')]} submitLabel="Сохранить" onSubmit={() => {}} onAttach={onAttach} />);
    expect(screen.getByRole('button', { name: 'Сохранить' }).textContent).toBe('Сохранить');
    fireEvent.click(screen.getByRole('button', { name: 'Прикрепить файл' }));
    expect(onAttach).toHaveBeenCalled();
  });

  it('replaces the document when a controlled value changes', () => {
    const { rerender } = render(<RichTextEditor aria-label="Заметка" value={[p('Первая')]} />);
    const box = screen.getByRole('textbox', { name: 'Заметка' });
    rerender(<RichTextEditor aria-label="Заметка" value={emptyRichText()} />);
    expect(box.innerHTML).toBe('<p><br></p>');
  });
});

describe('RichTextEditorStatus', () => {
  it('says saved, saving, failed with a retry, and locked', () => {
    const onRetry = vi.fn();
    render(
      <>
        <RichTextEditorStatus state="saved">Сохранено в 14:32</RichTextEditorStatus>
        <RichTextEditorStatus state="saving">Сохраняем…</RichTextEditorStatus>
        <RichTextEditorStatus state="error" onRetry={onRetry}>
          Не сохранилось · нет сети
        </RichTextEditorStatus>
        <RichTextEditorStatus state="locked">Только чтение</RichTextEditorStatus>
      </>,
    );
    for (const text of ['Сохранено в 14:32', 'Сохраняем…', 'Не сохранилось · нет сети', 'Только чтение']) expect(screen.getByText(text)).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(onRetry).toHaveBeenCalled();
    expect(document.querySelectorAll('[data-slot="rich-text-editor-status"]')).toHaveLength(4);
  });
});
