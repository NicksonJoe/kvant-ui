import { useState } from 'react';
import { Button, cropImageToDataUrl, ImageCropper, ImageCropperPreview, ImageCropperRotate, ImageCropperStage, ImageCropperZoom, useImageCropper, type ImageCrop } from '@/kvant';

const portrait = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="2080" height="1360" viewBox="0 0 520 340"><rect width="520" height="340" fill="#e6e0f7"/><circle cx="265" cy="129" r="59" fill="#b9a5ec"/><circle cx="265" cy="347" r="135" fill="#9a80e2"/><circle cx="432" cy="56" r="32" fill="#3f8f4a"/></svg>',
)}`;

function Footer({ onSave }: { onSave: (crop: ImageCrop) => void }) {
  const { crop, pick, reset, busy } = useImageCropper();
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-4">
      <Button variant="ghost" disabled={busy} onClick={pick}>
        Другое фото
      </Button>
      <div className="flex gap-2">
        <Button variant="secondary" disabled={busy} onClick={reset}>
          Отмена
        </Button>
        <Button loading={busy} disabled={!crop} onClick={() => crop && onSave(crop)}>
          {busy ? 'Сохраняем' : 'Сохранить'}
        </Button>
      </div>
    </div>
  );
}

export default function ImageCropperAvatar() {
  const [busy, setBusy] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);

  const save = async (crop: ImageCrop) => {
    setBusy(true);
    const [src] = await Promise.all([cropImageToDataUrl(crop, { width: 512 }), new Promise((resolve) => setTimeout(resolve, 600))]);
    setAvatar(src);
    setBusy(false);
  };

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <ImageCropper src={portrait} shape="circle" busy={busy} onApply={save} className="w-full max-w-130 overflow-hidden rounded-2xl bg-overlay shadow-modal">
        <div className="flex h-15 items-center pr-4 pl-6 text-body-lg font-semibold text-fg-1">Фото профиля</div>
        <ImageCropperStage className="h-[300px] sm:h-[340px]" />
        <div className="flex items-center gap-4 border-b border-separator px-6 py-4">
          <ImageCropperZoom />
          <ImageCropperRotate />
        </div>
        <div className="flex flex-wrap items-end gap-5 border-b border-separator px-6 py-5">
          <ImageCropperPreview size={64} />
          <ImageCropperPreview size={40} />
          <ImageCropperPreview size={24} />
          <div className="flex min-w-40 grow flex-col gap-0.5 pb-5.5">
            <span className="text-label-sm font-medium text-fg-1">Так фото увидят другие</span>
            <span className="text-caption text-fg-3">В чате, в списке сотрудников и в упоминаниях</span>
          </div>
        </div>
        <Footer onSave={save} />
      </ImageCropper>
      {avatar ? <img src={avatar} alt="Новое фото профиля" className="size-20 rounded-full shadow-raised" /> : null}
    </div>
  );
}
