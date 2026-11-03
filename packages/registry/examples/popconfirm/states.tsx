import { FileText, Link2Off, TriangleAlert } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button, Popconfirm, toast } from '@/kvant';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function PopconfirmStates() {
  const [error, setError] = useState<string>();
  const attempts = useRef(0);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Popconfirm
        side="right"
        icon={<TriangleAlert />}
        title="Отправить акт клиенту?"
        description="Акт № 41 уйдёт «Студии Север» на подпись через ЭДО. Письмо не отозвать."
        confirmLabel="Отправить"
        onConfirm={() => toast.add({ type: 'success', title: 'Акт № 41 отправлен' })}
      >
        <Button variant="secondary" leadingIcon={<FileText aria-hidden />}>
          Отправить акт
        </Button>
      </Popconfirm>
      <Popconfirm
        side="left"
        title="Перенести 14 сделок в архив?"
        description="Пропадут из воронки, но останутся в поиске. Отменить можно 7 секунд."
        confirmLabel="В архив"
        onConfirm={async () => {
          await wait(1500);
          toast.add({ title: '14 сделок в архиве', timeout: 7000, actionProps: { children: 'Отменить' } });
        }}
      >
        <Button variant="secondary">В архив 14 сделок</Button>
      </Popconfirm>
      <Popconfirm
        align="center"
        title="Закрыть доступ по ссылке?"
        description="Клиент больше не откроет смету."
        confirmLabel="Закрыть доступ"
        error={error}
        onOpenChange={(open) => open && setError(undefined)}
        onConfirm={async () => {
          await wait(600);
          // every other attempt fails, to show the error and «Повторить»
          attempts.current += 1;
          if (attempts.current % 2 === 1) {
            setError('Нет связи с сервером. Ссылка пока работает.');
            throw new Error('offline');
          }
          toast.add({ title: 'Доступ по ссылке закрыт' });
        }}
      >
        <Button variant="secondary" leadingIcon={<Link2Off aria-hidden />}>
          Закрыть доступ
        </Button>
      </Popconfirm>
    </div>
  );
}
