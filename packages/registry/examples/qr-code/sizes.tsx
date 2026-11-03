import { QrCode } from '@/kvant';

const value = 'https://norda.cloud/d/4821';

export default function QrCodeSizes() {
  return (
    <div className="flex flex-wrap items-end gap-10">
      {(
        [
          ['sm', 'sm 96 · в строке'],
          ['md', 'md 144 · поповер'],
          ['lg', 'lg 200 · карточка и диалог'],
        ] as const
      ).map(([size, caption]) => (
        <figure key={size} className="flex flex-col items-center gap-2.5">
          <QrCode value={value} size={size} aria-label="QR-код: сделка № 4821" />
          <figcaption className="font-mono text-overline text-fg-3">{caption}</figcaption>
        </figure>
      ))}
    </div>
  );
}
