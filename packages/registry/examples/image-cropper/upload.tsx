import { ImageCropper, ImageCropperAspect, ImageCropperRotate, ImageCropperStage, ImageCropperZoom } from '@/kvant';

export default function ImageCropperUpload() {
  return (
    <ImageCropper defaultAspect={16 / 9} className="w-full max-w-160 overflow-hidden rounded-2xl bg-overlay shadow-modal">
      <div className="flex h-15 items-center pr-4 pl-6 text-body-lg font-semibold text-fg-1">Шапка профиля компании</div>
      <ImageCropperStage className="h-[260px] sm:h-[360px]" />
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
        <ImageCropperAspect
          options={[
            { label: '16:9', value: 16 / 9 },
            { label: '3:1', value: 3 },
          ]}
        />
        <ImageCropperZoom className="max-w-60" />
        <ImageCropperRotate />
      </div>
    </ImageCropper>
  );
}
