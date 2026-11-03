import { ImageCropper, ImageCropperAspect, ImageCropperFlip, ImageCropperRotate, ImageCropperStage, ImageCropperZoom } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const photo = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="1800" viewBox="0 0 560 420"><rect width="560" height="420" fill="#fce6d4"/><circle cx="348" cy="118" r="48" fill="#cf6a2c"/><circle cx="120" cy="510" r="260" fill="#f3c9a6"/><circle cx="500" cy="570" r="280" fill="#e9ae84"/></svg>',
)}`;

const playground: Playground = {
  render: (p) => {
    const shape = p.pick('shape', ['rect', 'circle'] as const);
    return (
      <ImageCropper key={shape} src={photo} shape={shape} busy={p.bool('busy')} className="w-full max-w-190 overflow-hidden rounded-2xl bg-overlay shadow-modal">
        <ImageCropperStage />
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
          {shape === 'rect' ? <ImageCropperAspect /> : null}
          <ImageCropperZoom className="max-w-60" />
          <div className="flex items-center gap-0.5">
            <ImageCropperRotate />
            <ImageCropperFlip />
          </div>
        </div>
      </ImageCropper>
    );
  },
  code: (p) => `<ImageCropper src={photo}${p.attrs(['shape', 'busy'])} onApply={(crop) => cropImage(crop)}>
  <ImageCropperStage />
  <ImageCropperAspect />
  <ImageCropperZoom />
  <ImageCropperRotate />
  <ImageCropperFlip />
</ImageCropper>`,
};

export default playground;
