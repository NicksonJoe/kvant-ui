import { Field, NativeSelect } from '@/kvant';

export default function NativeSelectCurrency() {
  return (
    <Field label="Валюта счёта" description="Клиент увидит суммы в этой валюте" className="w-72 max-w-full">
      <NativeSelect defaultValue="rub">
        <optgroup label="Чаще всего">
          <option value="rub">Россия, рубль</option>
          <option value="kzt">Казахстан, тенге</option>
        </optgroup>
        <optgroup label="Другие">
          <option value="byn">Беларусь, рубль</option>
          <option value="amd">Армения, драм</option>
          <option value="uzs">Узбекистан, сум</option>
        </optgroup>
      </NativeSelect>
    </Field>
  );
}
