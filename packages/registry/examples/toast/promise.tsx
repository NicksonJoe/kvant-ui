import { Send } from 'lucide-react';
import { Button, toast } from '@/kvant';

const sendInvoice = () => new Promise<string>((resolve) => setTimeout(() => resolve('olga@hlebnitsa.ru'), 1800));

export default function ToastPromise() {
  return (
    <Button
      leadingIcon={<Send />}
      onClick={() =>
        toast.promise(sendInvoice(), {
          loading: { title: 'Отправляем счёт…' },
          success: (email) => ({ title: 'Счёт отправлен', description: email }),
          error: { title: 'Не удалось отправить счёт' },
        })
      }
    >
      Отправить счёт
    </Button>
  );
}
