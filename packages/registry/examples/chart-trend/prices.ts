// Shared price data for the price examples: 31 trading days of October and 120 closes for the reversal charts
const wave = (i: number) => 6 * Math.sin(i / 5) + 3 * Math.sin(i / 2.3) + i * 0.45;
const round = (value: number) => Math.round(value * 10) / 10;

export const october = Array.from({ length: 31 }, (_, i) => {
  const open = round(100 + wave(i));
  const close = round(100 + wave(i + 1));
  const reach = 0.6 + ((i * 7) % 5) * 0.5;
  return {
    label: `${String(i + 1).padStart(2, '0')}.10`,
    open,
    close,
    high: round(Math.max(open, close) + reach),
    low: round(Math.min(open, close) - reach * 0.8),
  };
});

export const closes = Array.from({ length: 120 }, (_, i) => round(100 + 9 * Math.sin(i / 11) + 4 * Math.sin(i / 4) + i * 0.08));
export const closeDates = Array.from({ length: 120 }, (_, i) => new Date(2026, 4, 1 + i).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }));
export const rub = (value: number) => `${value.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} ₽`;
