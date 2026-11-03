import { useState } from 'react';
import {
  Button,
  cropImageToDataUrl,
  ImageCropper,
  ImageCropperAspect,
  ImageCropperFlip,
  ImageCropperRotate,
  ImageCropperStage,
  ImageCropperZoom,
  useImageCropper,
  type ImageCrop,
} from '@/kvant';

const cover = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="1800" viewBox="0 0 560 420"><rect width="560" height="420" fill="#fce6d4"/><circle cx="348" cy="118" r="48" fill="#cf6a2c"/><circle cx="120" cy="510" r="260" fill="#f3c9a6"/><circle cx="500" cy="570" r="280" fill="#e9ae84"/></svg>',
)}`;

function Footer({ onApply }: { onApply: (crop: ImageCrop) => void }) {
  const { crop, reset, busy } = useImageCropper();
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-4">
      <Button variant="ghost" disabled={!crop || busy} onClick={reset}>
        Сбросить
      </Button>
      <div className="flex gap-2">
        <Button variant="secondary" disabled={busy} onClick={reset}>
          Отмена
        </Button>
        <Button loading={busy} disabled={!crop} onClick={() => crop && onApply(crop)}>
          {busy ? 'Сохраняем' : 'Применить'}
        </Button>
      </div>
    </div>
  );
}

export default function ImageCropperCover() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ src: string; label: string } | null>(null);

  const apply = async (crop: ImageCrop) => {
    setBusy(true);
    const [src] = await Promise.all([cropImageToDataUrl(crop, { width: 1200 }), new Promise((resolve) => setTimeout(resolve, 600))]);
    setResult({ src, label: `${crop.width} × ${crop.height} → 1200 × ${Math.round((1200 * crop.height) / crop.width)}` });
    setBusy(false);
  };

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <ImageCropper
        src={cover}
        defaultAspect={4 / 3}
        minResult={{ width: 1200, height: 900 }}
        busy={busy}
        onApply={apply}
        className="w-full max-w-190 overflow-hidden rounded-2xl bg-overlay shadow-modal"
      >
        <div className="flex h-15 items-center pr-4 pl-6 text-body-lg font-semibold text-fg-1">Обложка карточки товара</div>
        <ImageCropperStage />
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-separator px-6 py-4">
          <ImageCropperAspect />
          <ImageCropperZoom className="max-w-60" />
          <div className="flex items-center gap-0.5">
            <ImageCropperRotate />
            <ImageCropperFlip />
          </div>
        </div>
        <Footer onApply={apply} />
      </ImageCropper>
      {result ? (
        <figure className="flex flex-col items-center gap-2">
          <img src={result.src} alt="Обложка после обрезки" className="w-60 rounded-md shadow-raised" />
          <figcaption className="text-caption text-fg-3 tabular-nums">{result.label}</figcaption>
        </figure>
      ) : null}
    </div>
  );
}
