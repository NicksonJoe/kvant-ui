import { useState } from 'react';
import { Image, Lightbox } from '@/kvant';

const scan = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1100"><rect width="800" height="1100" fill="#fff"/><rect x="80" y="90" width="320" height="28" rx="6" fill="#1f2b44"/><rect x="80" y="170" width="640" height="14" rx="7" fill="#c9cfda"/><rect x="80" y="205" width="560" height="14" rx="7" fill="#c9cfda"/><rect x="80" y="240" width="600" height="14" rx="7" fill="#c9cfda"/><rect x="80" y="900" width="220" height="60" rx="8" fill="#e8f0fd"/></svg>',
)}`;

const act = [{ src: scan, alt: 'Скан акта № 318 с подписью клиента', name: 'Акт 318.pdf.png' }];

export default function LightboxSingle() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" aria-label="Открыть скан акта № 318" onClick={() => setOpen(true)} className="w-40 rounded-sm">
        <Image src={scan} alt="" ratio="4:3" radius="sm" className="pointer-events-none" />
      </button>
      <Lightbox items={act} open={open} onOpenChange={setOpen} />
    </>
  );
}
