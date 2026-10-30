import { useState } from 'react';
import {
  Button,
  Checkbox,
  Field,
  Form,
  FormActions,
  FormErrorSummary,
  Input,
  InputAddon,
  Select,
  TagsInput,
  Textarea,
  toast,
  type FormError,
} from '@/kvant';

const clients = [
  { value: 'sever', label: 'Студия «Север»' },
  { value: 'orbita', label: 'Орбита Лаб' },
  { value: 'zerno', label: 'Кофейня «Зерно»' },
] as const;
type ClientId = (typeof clients)[number]['value'];

export default function FormProject() {
  const [client, setClient] = useState<ClientId | null>(null);
  const [budget, setBudget] = useState('0');
  const [errors, setErrors] = useState<readonly FormError[]>([]);
  const [attempt, setAttempt] = useState(0);
  const failed = (name: string) => errors.some((error) => error.name === name);

  return (
    <Form
      className="w-full max-w-160"
      onSubmit={(event) => {
        event.preventDefault();
        const next: FormError[] = [];
        if (!client) next.push({ name: 'client', label: 'Клиент', message: 'выберите из списка или создайте нового' });
        if (!(Number(budget.replace(/\s/g, '').replace(',', '.')) > 0)) {
          next.push({ name: 'budget', label: 'Бюджет', message: 'укажите сумму больше нуля' });
        }
        setErrors(next);
        // A new key makes the summary take focus again on every failed attempt.
        setAttempt((count) => count + 1);
        if (next.length === 0) toast.add({ title: 'Проект создан', description: 'Он появится в воронке и в календаре команды', type: 'success' });
      }}
    >
      <FormErrorSummary
        key={attempt}
        errors={errors}
        title={errors.length === 2 ? 'Проверьте два поля — без них проект не создать' : 'Проверьте одно поле — без него проект не создать'}
      />
      <Field label="Название проекта">
        <Input name="title" defaultValue="Ребрендинг и сайт для «Студии Север»" />
      </Field>
      <Field label="Клиент" error={failed('client') ? 'Выберите клиента из списка или создайте нового' : undefined}>
        <Select name="client" options={clients} value={client} onValueChange={setClient} placeholder="Выберите клиента" />
      </Field>
      <Field label="Бюджет" error={failed('budget') ? 'Укажите сумму больше нуля' : undefined} className="max-w-60">
        <Input name="budget" inputMode="decimal" value={budget} onValueChange={setBudget} suffix={<InputAddon>₽</InputAddon>} />
      </Field>
      <Field label="Описание" optional>
        <Textarea
          name="description"
          maxLength={500}
          defaultValue="Новый фирменный стиль, сайт на шесть страниц и шаблоны для соцсетей. Первая встреча с клиентом — 5 ноября в офисе на Новодмитровской."
        />
      </Field>
      <Field description="Без отметки проект останется черновиком и не попадёт в календарь">
        <Checkbox name="agreed">Бюджет и сроки согласованы с клиентом</Checkbox>
      </Field>
      <Field label="Команда">
        <TagsInput name="team" defaultValue={['Анна Северова', 'Илья Ким']} suggestions={['Мария Орлова', 'Денис Волков']} placeholder="Добавить участника" />
      </Field>
      <FormActions
        sticky
        status={
          <>
            <span aria-hidden className="size-2 shrink-0 rounded-full bg-warning" />
            Не сохранено
            {errors.length > 0 ? <span className="text-fg-3">· {errors.length === 1 ? '1 ошибка' : `${errors.length} ошибки`}</span> : null}
          </>
        }
      >
        <Button variant="ghost" onClick={() => setErrors([])}>
          Отмена
        </Button>
        <Button type="submit">Создать проект</Button>
      </FormActions>
    </Form>
  );
}
