import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Marquee } from '@/kvant';

const rates = [
  { code: 'USD', value: '92,41', change: '+0,32 %', up: true },
  { code: 'EUR', value: '100,18', change: '−0,11 %', up: false },
  { code: 'CNY', value: '12,74', change: '+0,05 %', up: true },
  { code: 'KZT', value: '0,19', change: '−0,40 %', up: false },
  { code: 'TRY', value: '2,71', change: '−0,62 %', up: false },
  { code: 'AED', value: '25,16', change: '+0,30 %', up: true },
];

export default function MarqueeRates() {
  return (
    <div className="w-full max-w-160 rounded-xl bg-surface-1 py-2 shadow-raised">
      <Marquee aria-label="Курсы валют ЦБ на 3 ноября" duration={30} gap={40} fade={64}>
        {rates.map((rate) => (
          <span key={rate.code} className="flex items-center gap-2 text-body-sm tabular-nums">
            <span className="font-semibold text-fg-1">{rate.code}</span>
            <span className="text-fg-2">{rate.value} ₽</span>
            <span className={`flex items-center gap-0.5 text-caption font-medium ${rate.up ? 'text-success-soft-fg' : 'text-danger-soft-fg'}`}>
              {rate.up ? <ArrowUpRight aria-hidden className="size-3.5" /> : <ArrowDownRight aria-hidden className="size-3.5" />}
              {rate.change}
            </span>
          </span>
        ))}
      </Marquee>
    </div>
  );
}
