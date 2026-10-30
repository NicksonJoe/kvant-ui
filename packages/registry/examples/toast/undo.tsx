import { Archive } from 'lucide-react';
import { Button, toast } from '@/kvant';

export default function ToastUndo() {
  const archive = () => {
    const id = toast.add({
      title: 'Сделка в архиве',
      description: 'Айдентика для пекарни',
      actionProps: {
        children: 'Отменить',
        onClick: () => {
          toast.close(id);
          toast.add({ type: 'success', title: 'Сделка вернулась' });
        },
      },
    });
  };

  return (
    <Button variant="secondary" leadingIcon={<Archive />} onClick={archive}>
      В архив
    </Button>
  );
}
