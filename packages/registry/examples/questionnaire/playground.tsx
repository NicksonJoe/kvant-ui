import { Questionnaire, type Question } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const tone: Question = {
  id: 'tone',
  title: 'Каким тоном написать?',
  label: 'Тон письма',
  options: [
    { value: 'friendly', label: 'Дружелюбный' },
    { value: 'formal', label: 'Деловой' },
  ],
};
const sign: Question = {
  id: 'sign',
  title: 'От чьего имени отправить?',
  label: 'Подпись',
  options: [
    { value: 'me', label: 'От меня' },
    { value: 'team', label: 'От команды' },
  ],
};

const playground: Playground = {
  initial: { title: 'Пара уточнений, чтобы письмо попало в точку' },
  controls: [
    { name: 'multiple', type: 'boolean', default: true, description: 'Второй вопрос: несколько ответов.' },
    { name: 'required', type: 'boolean', default: false, description: 'Второй вопрос: обязательный.' },
    { name: 'custom', type: 'boolean', default: true, description: 'Второй вопрос: «Свой вариант».' },
  ],
  render: (p) => {
    const mention: Question = {
      id: 'mention',
      title: 'Что упомянуть в письме?',
      label: 'Упомянуть',
      hint: p.bool('multiple') ? 'Можно выбрать несколько' : 'Один вариант',
      multiple: p.bool('multiple'),
      required: p.bool('required'),
      custom: p.bool('custom'),
      options: [
        { value: 'discount', label: 'Скидку 10 %' },
        { value: 'plans', label: 'Новые тарифы' },
        { value: 'review', label: 'Отзыв клиента' },
        { value: 'dates', label: 'Сроки запуска' },
      ],
    };
    return (
      <Questionnaire
        // a new question set starts the questionnaire over
        key={`${p.bool('multiple')}-${p.bool('required')}-${p.bool('custom')}`}
        className="w-full max-w-[640px]"
        title={p.text('title')}
        footnote={p.text('footnote')}
        questions={[tone, mention, sign]}
        defaultAnswers={{ tone: ['friendly'] }}
        onComplete={() => {}}
      />
    );
  },
  code: (p) => `<Questionnaire title="${p.text('title')}"${p.attrs(['footnote'])} questions={questions} onComplete={send} />`,
};

export default playground;
