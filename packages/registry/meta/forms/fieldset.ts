import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'fieldset',
  status: 'stable',
  title: 'Группа полей',
  description: 'Связанные поля под общей легендой. Самостоятельная группа на странице — карточка; группы внутри одной карточки делит разделитель.',
  category: 'forms',
  paperBoard: '5B2-0',
  anatomy: ['<fieldset>', 'Легенда 16/24 600', 'Описание 13/18 fg-3', 'Поля через 20 px'],
  related: ['field', 'form', 'card', 'radio-group'],
  source: { file: 'components/form.tsx', exports: ['Fieldset'] },
  dependencies: { npm: ['@base-ui/react'], registry: [] },
  props: [
    { name: 'legend', type: 'string', signature: 'ReactNode', required: true, description: 'Название группы; экранный диктор читает его перед каждым полем.' },
    { name: 'description', type: 'string', signature: 'ReactNode', description: 'Зачем эти поля; попадает в aria-describedby группы.' },
    { name: 'variant', type: 'enum', options: ['card', 'section'], default: 'card', description: 'card — карточка r20 p24; section — группа внутри карточки с разделителем снизу.' },
    { name: 'disabled', type: 'boolean', default: false, description: 'Отключает все поля внутри разом.' },
    { name: 'children', type: 'node', required: true, description: 'Поля Field; два коротких — в ряд через 16 px.', control: false },
  ],
  slots: [{ name: 'fieldset', description: 'Группа; несёт data-variant и data-disabled.' }],
  states: [
    { id: 'rest', label: 'покой', description: 'Легенда fg-1 600, описание fg-3.' },
    { id: 'disabled', label: 'отключено', description: 'Все поля внутри недоступны: прозрачность 50 %, фон surface-2.', props: { disabled: true } },
  ],
  keyboard: [],
  a11y: [
    'Нативный <fieldset> с легендой через aria-labelledby: группа называется, а Tab идёт по полям в порядке чтения.',
    'Группы радиокнопок и флажков всегда собирайте в Fieldset.',
    'disabled отключает поля нативно — отключённые не попадут в отправку формы.',
    'Не вкладывайте карточку в карточку: внутри одной карточки — variant="section".',
  ],
  motion: [{ label: 'Зависимая группа', value: 'раскрывайте её сами: grid-rows 0fr → 1fr, 200 мс · ease-standard и прозрачность' }],
  examples: [
    { id: 'card', title: 'Карточка', description: 'Реквизиты для документов: два коротких поля в ряд и флажок.' },
    { id: 'sections', title: 'Группы в одной карточке', description: 'Контакт и оплата делят одну карточку через разделитель.' },
  ],
};

export default meta;
