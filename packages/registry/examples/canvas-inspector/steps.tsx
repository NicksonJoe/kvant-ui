import { GitBranch, Send, Sparkles } from 'lucide-react';
import {
  CanvasInspector,
  Field,
  Input,
  InspectorGroup,
  InspectorIcon,
  InspectorList,
  InspectorListItem,
  InspectorNote,
  InspectorOutputs,
  InstructionField,
  PortMark,
  SegmentedControl,
  Select,
  Switch,
} from '@/kvant';

const chip = 'inline-flex h-7 items-center rounded-[7px] bg-fill-2 px-2 text-caption font-medium';

export default function InspectorSteps() {
  return (
    <div className="flex w-full flex-wrap items-start gap-6">
      <CanvasInspector
        variant="card"
        title="Новое сообщение"
        subtitle="Триггер · Telegram · шаг 1"
        icon={
          <InspectorIcon color="var(--color-brand-telegram, oklch(0.685 0.135 232))" solid>
            <Send />
          </InspectorIcon>
        }
        runCount={128}
        onClose={() => {}}
        params={
          <>
            <Field label="Бот">
              <Select aria-label="Бот" defaultValue="norda" options={[{ value: 'norda', label: '@norda_bot' }]} />
            </Field>
            <InspectorGroup label="Откуда">
              <SegmentedControl
                aria-label="Откуда"
                defaultValue="direct"
                options={[
                  { value: 'direct', label: 'Личные' },
                  { value: 'groups', label: 'Группы' },
                  { value: 'all', label: 'Все' },
                ]}
              />
            </InspectorGroup>
            <Field label="Фильтр" description="Пусто — запускаться на любое сообщение">
              <Input defaultValue="слова: сайт, заявка, цена" />
            </Field>
            <Switch defaultChecked>Не реагировать на сотрудников</Switch>
            <InspectorGroup label="Выходы">
              <InspectorOutputs
                aria-label="Выходы"
                outputs={[
                  { name: 'сообщение.текст', type: 'text' },
                  { name: 'клиент', type: 'object' },
                  { name: 'чат', type: 'object' },
                ]}
              />
            </InspectorGroup>
          </>
        }
      />
      <CanvasInspector
        variant="card"
        title="Есть бюджет?"
        subtitle="Условие · шаг 3"
        icon={
          <InspectorIcon color="var(--color-chart-4)">
            <GitBranch />
          </InspectorIcon>
        }
        runCount={24}
        onClose={() => {}}
        params={
          <>
            <InspectorGroup label="Правила" actionLabel="Правило" onAction={() => {}}>
              <InspectorList aria-label="Правила">
                <InspectorListItem className="gap-1.5">
                  <span className="w-6 text-caption font-medium text-fg-3">если</span>
                  <span className={`${chip} font-mono text-overline`}>budget</span>
                  <span className={chip}>не меньше</span>
                  <span className={chip}>50 000</span>
                </InspectorListItem>
                <InspectorListItem className="gap-1.5">
                  <span className="w-6 text-caption font-medium text-fg-3">и</span>
                  <span className={`${chip} font-mono text-overline`}>клиент.тип</span>
                  <span className={chip}>равно</span>
                  <span className={chip}>новый</span>
                </InspectorListItem>
              </InspectorList>
            </InspectorGroup>
            <InspectorGroup label="Срабатывает, если">
              <SegmentedControl
                aria-label="Срабатывает, если"
                defaultValue="all"
                options={[
                  { value: 'all', label: 'все верны' },
                  { value: 'any', label: 'хотя бы одно' },
                ]}
              />
            </InspectorGroup>
            <InspectorGroup label="Ветки">
              <InspectorList aria-label="Ветки">
                <InspectorListItem>
                  <PortMark type="boolean" />
                  <span className="w-7 font-medium">да</span>
                  <span className="text-fg-2">Создать сделку</span>
                </InspectorListItem>
                <InspectorListItem>
                  <PortMark type="boolean" />
                  <span className="w-7 font-medium">нет</span>
                  <span className="text-fg-2">Ответить шаблоном</span>
                </InspectorListItem>
              </InspectorList>
            </InspectorGroup>
            <InspectorNote title="Прошлый запуск — 3 мин назад">budget = 120 000, ветка «да»</InspectorNote>
          </>
        }
      />
      <CanvasInspector
        variant="card"
        title="Разобрать заявку"
        subtitle="Агент Норды · шаг 2"
        icon={
          <InspectorIcon color="var(--color-chart-7)">
            <Sparkles />
          </InspectorIcon>
        }
        runCount={24}
        onClose={() => {}}
        params={
          <>
            <InspectorGroup label="Инструкция">
              <InstructionField aria-label="Инструкция" defaultValue="Найди в {{сообщение.текст}} бюджет, срок и задачу. Если бюджета нет — верни 0." variables={['сообщение.текст']} />
            </InspectorGroup>
            <InspectorGroup label="Выходы" actionLabel="Поле" onAction={() => {}}>
              <InspectorOutputs
                aria-label="Выходы"
                outputs={[
                  { name: 'budget', type: 'number', value: '120 000' },
                  { name: 'deadline', type: 'date', value: '15 декабря' },
                  { name: 'task', type: 'text', value: 'Сайт' },
                ]}
              />
            </InspectorGroup>
          </>
        }
        data={<InspectorNote title="Вход — сообщение Ивана">«Нужен сайт до 15 декабря, бюджет 120 тысяч»</InspectorNote>}
      />
    </div>
  );
}
