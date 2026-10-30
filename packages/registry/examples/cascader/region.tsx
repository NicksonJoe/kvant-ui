import { Cascader } from '@/kvant';

export default function CascaderRegion() {
  return (
    <Cascader
      aria-label="Город доставки"
      placeholder="Регион и город"
      className="w-80 max-w-full"
      options={[
        {
          value: 'msk',
          label: 'Москва и область',
          children: [
            { value: 'moscow', label: 'Москва' },
            { value: 'khimki', label: 'Химки' },
            { value: 'podolsk', label: 'Подольск' },
          ],
        },
        {
          value: 'spb',
          label: 'Санкт-Петербург и область',
          children: [
            { value: 'spb-city', label: 'Санкт-Петербург' },
            { value: 'gatchina', label: 'Гатчина' },
          ],
        },
        {
          value: 'tatarstan',
          label: 'Татарстан',
          children: [
            { value: 'kazan', label: 'Казань' },
            { value: 'chelny', label: 'Набережные Челны', disabled: true },
          ],
        },
      ]}
    />
  );
}
