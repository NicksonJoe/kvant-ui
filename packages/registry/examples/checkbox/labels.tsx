import { Checkbox } from '@/kvant';

export default function CheckboxLabels() {
  return (
    <div className="flex flex-col gap-3">
      <Checkbox defaultChecked>Напомнить за день до встречи</Checkbox>
      <Checkbox>Отправить копию на почту</Checkbox>
      <Checkbox disabled>Синхронизировать с Google Календарём</Checkbox>
    </div>
  );
}
