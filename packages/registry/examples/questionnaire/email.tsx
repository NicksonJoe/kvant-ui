import { useState } from 'react';
import { Questionnaire, type Question, type QuestionnaireAnswers } from '@/kvant';

const questions: Question[] = [
  {
    id: 'tone',
    title: 'Каким тоном написать?',
    label: 'Тон письма',
    required: true,
    options: [
      { value: 'friendly', label: 'Дружелюбный' },
      { value: 'formal', label: 'Деловой' },
      { value: 'short', label: 'Коротко, по делу' },
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
      { value: 'dates', label: 'Сроки запуска' },
    ],
  },
  {
    id: 'sign',
    title: 'От чьего имени отправить?',
    label: 'Подпись',
    options: [
      { value: 'me', label: 'От меня' },
      { value: 'team', label: 'От команды «Норды»' },
      { value: 'manager', label: 'От менеджера проекта', disabled: true },
    ],
  },
];

export default function QuestionnaireEmail() {
  const [answers, setAnswers] = useState<QuestionnaireAnswers | null>(null);

  return (
    <div className="flex w-full max-w-[640px] flex-col gap-3">
      <Questionnaire title="Пара уточнений, чтобы письмо попало в точку" questions={questions} onComplete={setAnswers} />
      <p role="status" className="min-h-5 text-body-sm text-fg-3">
        {answers ? `Агент получил ответы на ${Object.keys(answers).length} вопроса и пишет письмо.` : null}
      </p>
    </div>
  );
}
