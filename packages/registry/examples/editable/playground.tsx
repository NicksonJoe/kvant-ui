import { Editable } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  initial: {
    defaultValue: 'Ребрендинг «Студии Север»',
    'aria-label': 'Название проекта',
    savedMessage: 'Сохранено · видно всей команде',
  },
  render: (p) => (
    <span className="text-heading-xs font-semibold">
      <Editable
        // remount when the starting text changes: it is uncontrolled
        key={p.text('defaultValue')}
        defaultValue={p.text('defaultValue')}
        aria-label={p.text('aria-label') || 'Название'}
        placeholder={p.text('placeholder')}
        savedMessage={p.text('savedMessage') || undefined}
        disabled={p.bool('disabled')}
      />
    </span>
  ),
  code: (p) => `<Editable${p.attrs(['defaultValue', 'aria-label', 'placeholder', 'savedMessage', 'disabled'])} onValueCommit={rename} />`,
};

export default playground;
