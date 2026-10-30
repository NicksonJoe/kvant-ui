import { Card, CardHeader } from '@/kvant';

const variants = [
  ['raised', 'На фоне страницы'],
  ['flat', 'Внутри панели'],
  ['outline', 'Только кольцо'],
  ['interactive', 'Нажимается целиком'],
] as const;

export default function CardVariants() {
  return (
    <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
      {variants.map(([variant, description]) => (
        <Card key={variant} variant={variant} padding="compact">
          <CardHeader title={variant} description={description} />
        </Card>
      ))}
    </div>
  );
}
