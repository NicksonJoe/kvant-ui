import { TagsInput } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const known = ['дизайн-система', 'дизайн-ревью', 'брендинг', 'сайт', 'упаковка', 'срочно', 'презентация'];

const playground: Playground = {
  render: (p) => (
    <TagsInput
      aria-label="Теги проекта"
      defaultValue={['брендинг', 'сайт', 'срочно', 'упаковка']}
      suggestions={known}
      placeholder={p.text('placeholder')}
      visibleTags={p.text('visibleTags') ? p.num('visibleTags') : undefined}
      max={p.text('max') ? p.num('max') : undefined}
      invalid={p.bool('invalid')}
      disabled={p.bool('disabled')}
      className="w-76 max-w-full"
    />
  ),
  code: (p) =>
    `<TagsInput${p.attrs(['placeholder', 'visibleTags', 'max', 'invalid', 'disabled'])} defaultValue={['брендинг', 'сайт', 'срочно', 'упаковка']} suggestions={known} />`,
};

export default playground;
