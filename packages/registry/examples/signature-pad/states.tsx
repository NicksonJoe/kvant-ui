import { SignatureCard, SignaturePad } from '@/kvant';

const accepted = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="120" viewBox="0 0 360 120" fill="none" stroke="#1f232a" stroke-linecap="round" stroke-linejoin="round"><path d="M14 86c10-30 26-62 38-60 12 2-6 54-14 66-6 9 4-24 24-36 16-9 10 22 20 22 10 0 16-30 28-30 9 0 0 26 10 26 12 0 18-40 34-42 14-2 0 40 12 40 14 0 22-30 40-30 12 0 2 24 16 24 18 0 30-22 48-30" stroke-width="3.5"/><path d="M40 104c60-6 150-10 250-14" stroke-width="3"/></svg>',
)}`;

export default function SignaturePadStates() {
  return (
    <div className="grid w-full max-w-160 gap-8 sm:grid-cols-2">
      <SignaturePad label="Подпись курьера" disabled description="Сначала отметьте полученные позиции" />
      <div className="flex flex-col gap-1">
        <span className="pb-0.5 text-label-sm font-medium text-fg-2">Подпись получателя</span>
        <SignatureCard src={accepted} name="Ирина Котова" time="2 ноября 2026, 14:32" />
      </div>
    </div>
  );
}
