import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'presence',
  status: 'beta',
  title: 'Появление и движение',
  description:
    'Presence показывает и убирает свой контент по кривым каталога движения: пока элемент уходит, он остаётся в DOM, и только потом исчезает. Три движения из раздела «Контент»: fade — скелетон сменяется данными, rise — каскад списка при первом показе, collapse — строка, добавленная в уже показанный список. Ставит те же data-starting-style и data-ending-style, что и всплывающие слои Base UI. Меню, подсказки, диалоги, шиты, тосты и аккордеон Kvant уже двигаются сами — Presence для того, что вы показываете и прячете сами.',
  category: 'utilities',
  paperBoard: 'R7F-0',
  anatomy: [
    'Вход: data-starting-style на первый кадр, затем переход к покою',
    'Покой: атрибутов нет',
    'Выход: data-ending-style, элемент ждёт конца своих переходов',
    'fade: opacity 200 мс ease-out, выход 150 мс',
    'rise: y +8 → 0 и opacity 200 мс ease-out, шаг 35 мс до восьмой строки',
    'collapse: высота 0 → по содержимому и opacity 200 мс ease-standard',
    'Удаление строки (rise, collapse): opacity 100 мс, затем высота 150 мс',
    'Сниженное движение: без сдвига, без шага, высота сразу',
  ],
  related: ['skeleton', 'list', 'accordion', 'portal', 'focus-management'],
  source: { file: 'components/presence.tsx', exports: ['Presence'] },
  dependencies: { npm: ['@base-ui/react'], registry: [] },
  props: [
    { name: 'present', type: 'boolean', required: true, description: 'Показан ли контент. На false элемент получает data-ending-style и остаётся, пока не закончатся его переходы.' },
    {
      name: 'motion',
      type: 'enum',
      options: ['fade', 'rise', 'collapse'],
      default: 'fade',
      description:
        'fade — скелетон → контент; rise — каскад списка при первом показе; collapse — новая строка в показанном списке. rise и collapse уходят как удалённая строка и задают высоту своему единственному ребёнку: оформляйте ребёнка, а не сам Presence.',
    },
    {
      name: 'index',
      type: 'number',
      options: [0, 1, 3, 7, 12],
      description: 'Номер строки для rise: задержка 35 мс × номер, с восьмой строки (номер 7) шаг не растёт — весь список готов за 340 мс при пяти строках.',
    },
    { name: 'onExitComplete', type: 'function', signature: '() => void', description: 'После выхода, когда элемента уже нет в DOM: здесь удаляйте строку из данных.' },
    { name: 'render', type: 'node', signature: 'ReactElement | (props) => ReactElement', control: false, description: 'Другой элемент вместо div: render={<li />} для строки списка.' },
    { name: 'children', type: 'node', required: true, control: false, description: 'Контент. Для rise и collapse — один элемент.' },
  ],
  slots: [{ name: 'presence', description: 'Корень: класс kv-presence, data-motion, data-starting-style на входе, data-ending-style на выходе, --kv-i для каскада.' }],
  states: [
    { id: 'rest', label: 'показан', description: 'Атрибутов входа и выхода нет, контент на месте.', props: { present: true } },
    { id: 'open', label: 'вход', description: 'Первый кадр с data-starting-style: opacity 0, для rise — на 8 px ниже, для collapse — высота 0. Со второго кадра — переход к покою.', selector: 'data-starting-style' },
    { id: 'collapsed', label: 'выход', description: 'data-ending-style: opacity 0, для rise и collapse — затем высота 0. Повторный показ во время выхода разворачивает переход с текущего места, без нового входа.', selector: 'data-ending-style' },
    { id: 'empty', label: 'скрыт', description: 'Выход закончился: ничего не рендерится, вызван onExitComplete.', props: { present: false } },
  ],
  keyboard: [],
  a11y: [
    'Скрытый контент удаляется из DOM, а не прячется прозрачностью: диктор и Tab его не находят.',
    'Пока идёт выход, элемент ещё в DOM. Не ставьте на него фокус; если фокус был внутри удаляемой строки, переведите его на соседнюю.',
    'Пока данные грузятся, ставьте aria-busy на общий контейнер скелетона и контента.',
    'Сниженное движение (prefers-reduced-motion или data-reduce-motion) не замораживает интерфейс: прозрачность остаётся 150 мс, пропадают сдвиг, шаг каскада и анимация высоты.',
  ],
  motion: [
    { label: 'fade · вход', value: 'opacity 0 → 1 · 200 мс', easing: 'ease-out', reduced: '150 мс', tokens: ['duration-base'], note: 'Контент проявляется на месте скелетона.' },
    { label: 'fade · выход', value: 'opacity 1 → 0 · 150 мс', easing: 'ease-out', reduced: 'так же', tokens: ['duration-quick'], note: 'Скелетон гаснет на шаг быстрее, чем проявляется текст.' },
    {
      label: 'rise · вход',
      value: 'y +8 → 0, opacity 0 → 1 · 200 мс',
      detail: 'задержка 35 мс × номер строки, номер ≤ 7: пять строк — 340 мс',
      easing: 'ease-out',
      reduced: 'без сдвига и шага — весь список проявляется сразу, opacity 150 мс',
      tokens: ['duration-base', 'shift-md'],
    },
    { label: 'collapse · вход', value: 'высота 0 → по содержимому, opacity 0 → 1 · 200 мс', easing: 'ease-standard', reduced: 'высота сразу, opacity 150 мс', tokens: ['duration-base'], note: 'Соседи съезжают вместе с краем строки.' },
    {
      label: 'Удаление строки',
      value: 'opacity 100 мс, затем высота 150 мс',
      detail: 'rise и collapse; высота стартует после прозрачности',
      easing: 'ease-standard',
      reduced: 'высота сразу',
      tokens: ['duration-fast', 'duration-quick'],
    },
  ],
  examples: [
    { id: 'skeleton', title: 'Скелетон → контент', description: 'Скелетон и записи стоят в одной ячейке сетки: данные проявляются на тех же местах, ничего не прыгает.' },
    { id: 'list', title: 'Каскад, добавление и удаление', description: 'Пять записей приходят с шагом 35 мс, «Добавить» раздвигает список, × убирает строку и удаляет её из данных в onExitComplete.' },
  ],
};

export default meta;
