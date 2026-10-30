import { Steps } from '@/kvant';

export default function StepsCompact() {
  return (
    <Steps
      variant="compact"
      current={2}
      className="w-full max-w-sm"
      steps={[{ title: 'Компания' }, { title: 'Реквизиты', error: 'ИНН не найден' }, { title: 'Тариф' }, { title: 'Оплата' }]}
    />
  );
}
