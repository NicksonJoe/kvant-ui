import { Send } from 'lucide-react';
import { Button, Popconfirm, toast } from '@/kvant';

export default function PopconfirmSend() {
  return (
    <Popconfirm
      title="Отправить счёт № 312 клиенту?"
      description="Письмо со ссылкой на оплату уйдёт на anna@studio-sever.ru."
      confirmLabel="Отправить"
      onConfirm={() => toast.add({ type: 'success', title: 'Счёт № 312 отправлен' })}
    >
      <Button variant="secondary" leadingIcon={<Send aria-hidden />}>
        Отправить счёт
      </Button>
    </Popconfirm>
  );
}
