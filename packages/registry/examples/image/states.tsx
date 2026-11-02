import { Image } from '@/kvant';

const cover = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="#9ec0f2"/><circle cx="300" cy="260" r="120" fill="#fbf3dc"/><rect y="400" width="800" height="200" fill="#2f5fae"/><path d="M430 400a90 70 0 0 1 180 0z" fill="#1f2b44"/></svg>',
)}`;

export default function ImageStates() {
  return (
    <div className="grid w-full max-w-xl grid-cols-2 items-start gap-6">
      <Image src={cover} alt="Обложка книги «Кит и звёзды»" ratio="4:3" radius="md" caption="Загружено" />
      <Image src="/missing/cover-v2.png" alt="Обложка, вторая версия" ratio="4:3" radius="md" caption="Файл не найден — можно повторить" />
    </div>
  );
}
