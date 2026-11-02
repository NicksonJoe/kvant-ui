import { Image } from '@/kvant';

// a landscape drawn inline, so the example needs no network
const landscape = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900"><rect width="1600" height="900" fill="#a9c8f5"/><circle cx="1120" cy="300" r="140" fill="#fbf3dc"/><path d="M0 620 360 360l300 260 260-190 680 300v250H0z" fill="#5f8fd9"/><rect y="760" width="1600" height="140" fill="#2f5fae"/></svg>',
)}`;

const ratios = [
  { ratio: '1:1', caption: '1:1 · аватар, обложка' },
  { ratio: '4:3', caption: '4:3 · фото с телефона' },
  { ratio: '16:9', caption: '16:9 · видео, превью' },
  { ratio: '21:9', caption: '21:9 · баннер' },
] as const;

export default function ImageRatios() {
  return (
    <div className="grid w-full grid-cols-2 items-start gap-6 sm:grid-cols-4">
      {ratios.map((item) => (
        <Image key={item.ratio} src={landscape} alt="Горы над морем на закате" ratio={item.ratio} radius="md" caption={item.caption} />
      ))}
    </div>
  );
}
