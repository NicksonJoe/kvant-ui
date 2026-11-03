import { Button, Container, Grid, GridItem, Section, Stack } from '@/kvant';

const features = [
  ['Заявки в одном месте', 'Сайт, почта, мессенджеры и звонки попадают в одну воронку — ничего не теряется между каналами.'],
  ['Документы сами', 'Счёт, акт и договор собираются из сделки в один клик и уходят клиенту с подписью.'],
  ['Агент Норды', 'Напоминает о забытых сделках, предлагает следующий шаг и пишет черновики писем.'],
];

export default function LayoutLanding() {
  return (
    <div className="w-full overflow-hidden rounded-xl bg-background shadow-[0_0_0_1px_var(--color-hairline)]">
      <header className="border-b border-separator bg-surface-1">
        <Container className="flex h-16 items-center justify-between">
          <span className="text-[17px]/[22px] font-semibold text-fg-1">Норда</span>
          <Button size="sm">Попробовать</Button>
        </Container>
      </header>
      <Section spacing="hero" aria-labelledby="layout-landing-title">
        <Grid className="items-center">
          <GridItem span={{ base: 'full', lg: 7 }}>
            <Stack gap={6}>
              <Stack gap={3}>
                <h1 id="layout-landing-title" className="text-display-sm font-semibold text-fg-1">
                  CRM для студий и агентств
                </h1>
                <p className="max-w-[48ch] text-body-lg text-fg-2">От первой заявки до закрывающих документов — без таблиц и пересылки файлов.</p>
              </Stack>
              <Stack direction="row" gap={2} wrap>
                <Button size="lg">Попробовать бесплатно</Button>
                <Button size="lg" variant="secondary">
                  Посмотреть демо
                </Button>
              </Stack>
            </Stack>
          </GridItem>
          <GridItem span={{ base: 'full', lg: 5 }}>
            <div aria-hidden className="aspect-[4/3] rounded-2xl bg-fill-1" />
          </GridItem>
        </Grid>
      </Section>
      <Section spacing="landing" className="bg-surface-1" aria-label="Возможности">
        <Grid>
          {features.map(([title, text]) => (
            <GridItem key={title} span={{ base: 'full', md: 4, lg: 4 }}>
              <Stack gap={2}>
                <h2 className="text-heading-sm font-semibold text-fg-1">{title}</h2>
                <p className="text-body-md text-fg-2">{text}</p>
              </Stack>
            </GridItem>
          ))}
        </Grid>
      </Section>
    </div>
  );
}
