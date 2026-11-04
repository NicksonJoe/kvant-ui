import { Download, ImageIcon, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button, Gallery, Popconfirm, toast } from '@/kvant';

const shot = (sky: string, hill: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><rect width="600" height="600" fill="${sky}"/><circle cx="420" cy="170" r="52" fill="${hill}"/><circle cx="130" cy="560" r="280" fill="${hill}" fill-opacity=".18"/><circle cx="520" cy="620" r="280" fill="${hill}" fill-opacity=".18"/></svg>`,
  )}`;

const initial = [
  { src: shot('#d7f7ee', '#249b86'), alt: 'Витрина салона на Тверской', name: 'Витрина.jpg' },
  { src: shot('#ede7fb', '#8e6be0'), alt: 'Зона ожидания клиентов', name: 'Ожидание.jpg' },
  { src: shot('#fbe1ec', '#d9488a'), alt: 'Кресло мастера', name: 'Кресло.jpg' },
  { src: shot('#dcebff', '#3b7be0'), alt: 'Стойка администратора', name: 'Стойка.jpg' },
  { src: shot('#fce6d4', '#e08a3b'), alt: 'Кабинет косметолога', name: 'Кабинет.jpg' },
];

export default function ImageSelect() {
  const [photos, setPhotos] = useState(initial);
  const [selected, setSelected] = useState<readonly number[]>([0, 2, 3]);

  return (
    <div className="w-full max-w-md">
      <Gallery
        items={photos}
        selectable
        selected={selected}
        onSelectedChange={setSelected}
        bulkActions={(chosen, clear) => (
          <>
            <Button size="sm" variant="ghost" leadingIcon={<Download />} onClick={() => toast.add({ title: `Готовим архив: ${chosen.length} фото` })}>
              Скачать
            </Button>
            <Button
              size="sm"
              variant="ghost"
              leadingIcon={<ImageIcon />}
              disabled={chosen.length !== 1}
              onClick={() => toast.add({ type: 'success', title: 'Обложка карточки салона обновлена' })}
            >
              Сделать обложкой
            </Button>
            <Popconfirm
              tone="danger"
              title={`Удалить ${chosen.length} фото?`}
              description="Они пропадут из карточки салона и из каталога."
              confirmLabel="Удалить"
              onConfirm={() => {
                const before = photos;
                setPhotos(photos.filter((_, index) => !chosen.includes(index)));
                clear();
                toast.add({
                  title: `Удалено фото: ${chosen.length}`,
                  timeout: 7000,
                  actionProps: { children: 'Отменить', onClick: () => setPhotos(before) },
                });
              }}
            >
              <Button size="sm" variant="danger-soft" leadingIcon={<Trash2 />}>
                Удалить
              </Button>
            </Popconfirm>
          </>
        )}
      />
    </div>
  );
}
