import { useState } from 'react';
import { AnimatedNumber, Button } from '@/kvant';

export default function AnimatedNumberKpi() {
  const [paid, setPaid] = useState(1_248_500);
  return (
    <div className="flex flex-col items-start gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-label-sm font-medium text-fg-2">Оплачено клиентом</span>
        <AnimatedNumber value={paid} suffix=" ₽" aria-live="polite" className="text-display-sm font-semibold text-fg-1" />
      </div>
      <Button variant="secondary" size="sm" onClick={() => setPaid((value) => value + 63_900)}>
        Пришла оплата 63 900 ₽
      </Button>
    </div>
  );
}
