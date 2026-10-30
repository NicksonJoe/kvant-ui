import { Meter } from '@/kvant';

export default function MeterQuotas() {
  return (
    <div className="grid w-full max-w-[720px] gap-8 sm:grid-cols-3">
      <Meter label="Хранилище" value={42} valueLabel="4,2 из 10 ГБ" status="42 % · места достаточно" />
      <Meter label="Места в тарифе" value={72} valueLabel="18 из 25" status="72 % · осталось 7 мест" />
      <Meter label="Письма за октябрь" value={93} valueLabel="9 300 из 10 000" status="93 % · при 100 % рассылки остановятся" />
    </div>
  );
}
