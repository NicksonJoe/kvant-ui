import { Button, toast } from '@/kvant';

export default function ToastTypes() {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <Button variant="secondary" onClick={() => toast.add({ type: 'success', title: 'Сделка сохранена' })}>
        Успех
      </Button>
      <Button
        variant="secondary"
        onClick={() => toast.add({ type: 'warning', title: 'Срок сдачи завтра', description: 'Айдентика для пекарни' })}
      >
        Предупреждение
      </Button>
      <Button
        variant="secondary"
        onClick={() => toast.add({ type: 'danger', title: 'Не удалось отправить счёт', description: 'Проверьте почту клиента' })}
      >
        Ошибка
      </Button>
      <Button variant="secondary" onClick={() => toast.add({ type: 'info', title: 'Обновили тарифы', description: 'С 1 ноября' })}>
        Информация
      </Button>
    </div>
  );
}
