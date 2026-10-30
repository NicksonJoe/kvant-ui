import { RadioGroup, RadioItem } from '@/kvant';

export default function RadioGroupVertical() {
  return (
    <RadioGroup label="Отчёт по воронке" defaultValue="weekly" className="w-80 max-w-full">
      <RadioItem value="daily" description="Сводка в 9:00 по московскому времени">
        Каждый день
      </RadioItem>
      <RadioItem value="weekly" description="По понедельникам, за прошлую неделю">
        Раз в неделю
      </RadioItem>
      <RadioItem value="monthly" description="Первого числа, с графиками по менеджерам">
        Раз в месяц
      </RadioItem>
    </RadioGroup>
  );
}
