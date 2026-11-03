import type { ReactNode } from 'react';
import { Container, Grid, GridItem, Stack } from '@/kvant';

const kpis = [
  { title: 'Выручка за октябрь', value: '1,3 млн ₽' },
  { title: 'Новые сделки', value: '48' },
  { title: 'Конверсия', value: '23 %' },
  { title: 'Средний чек', value: '27 400 ₽' },
];

function Panel({ title, children, className }: { title: string; children?: ReactNode; className?: string }) {
  return (
    <section aria-label={title} className={`flex h-full flex-col gap-2 rounded-xl bg-surface-1 p-5 shadow-raised ${className ?? ''}`}>
      <h2 className="text-label-md font-medium text-fg-2">{title}</h2>
      {children}
    </section>
  );
}

export default function LayoutDashboard() {
  return (
    <div className="w-full overflow-hidden rounded-xl bg-background py-6 shadow-[0_0_0_1px_var(--color-hairline)]">
      <Container size="xl">
        <Stack gap={6}>
          <h1 className="text-heading-lg font-semibold text-fg-1">Сводка</h1>
          <Grid>
            {kpis.map(({ title, value }) => (
              <GridItem key={title} span={{ base: 2, lg: 3 }}>
                <Panel title={title}>
                  <p className="text-heading-md font-semibold whitespace-nowrap text-fg-1 tabular-nums">{value}</p>
                </Panel>
              </GridItem>
            ))}
            <GridItem span={{ base: 'full', md: 5, lg: 8 }}>
              <Panel title="Воронка продаж" className="min-h-56" />
            </GridItem>
            <GridItem span={{ base: 'full', md: 3, lg: 4 }}>
              <Panel title="Задачи на сегодня" className="min-h-56" />
            </GridItem>
            <GridItem>
              <Panel title="Последние сделки" className="min-h-40" />
            </GridItem>
          </Grid>
        </Stack>
      </Container>
    </div>
  );
}
