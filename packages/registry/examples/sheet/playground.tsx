import { Button, Sheet, SheetBody, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTrigger } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  render: (p) => (
    <Sheet>
      <SheetTrigger render={<Button variant="secondary" />}>Открыть шит</SheetTrigger>
      <SheetContent
        side={p.pick('side', ['right', 'left', 'bottom'] as const)}
        size={p.pick('size', ['md', 'lg'] as const)}
        defaultDetent={p.pick('defaultDetent', ['medium', 'large'] as const)}
      >
        <SheetHeader title="Ольга Миронова" description="Пекарня «Хлебница»" />
        <SheetBody>
          <p className="text-body-sm text-fg-2">Две сделки, последняя — 29 октября.</p>
        </SheetBody>
        <SheetFooter>
          <SheetClose render={<Button />}>Готово</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
  // size works for side sheets, defaultDetent for the bottom one: print only what applies.
  code: (p) => {
    const bottom = p.pick('side', ['right', 'left', 'bottom'] as const) === 'bottom';
    return `<Sheet>
  <SheetTrigger render={<Button variant="secondary" />}>Открыть шит</SheetTrigger>
  <SheetContent${p.attrs(['side', bottom ? 'defaultDetent' : 'size'])}>
    <SheetHeader title="Ольга Миронова" description="Пекарня «Хлебница»" />
    <SheetBody>…</SheetBody>
    <SheetFooter>
      <SheetClose render={<Button />}>Готово</SheetClose>
    </SheetFooter>
  </SheetContent>
</Sheet>`;
  },
};

export default playground;
