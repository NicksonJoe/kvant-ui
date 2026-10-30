import { NativeSelect } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  render: (p) => (
    <NativeSelect
      aria-label="Валюта счёта"
      defaultValue="rub"
      size={p.pick('size', ['sm', 'md', 'lg'] as const)}
      invalid={p.bool('invalid')}
      disabled={p.bool('disabled')}
      required={p.bool('required')}
      className="w-72 max-w-full"
    >
      <option value="rub">Россия, рубль</option>
      <option value="kzt">Казахстан, тенге</option>
      <option value="byn">Беларусь, рубль</option>
      <option value="amd">Армения, драм</option>
    </NativeSelect>
  ),
  code: (p) => `<NativeSelect aria-label="Валюта счёта" defaultValue="rub"${p.attrs(['size', 'invalid', 'disabled', 'required'])}>
  <option value="rub">Россия, рубль</option>
  <option value="kzt">Казахстан, тенге</option>
  <option value="byn">Беларусь, рубль</option>
  <option value="amd">Армения, драм</option>
</NativeSelect>`,
};

export default playground;
