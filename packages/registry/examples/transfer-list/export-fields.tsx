import { TransferList, type TransferItem } from '@/kvant';

const fields: TransferItem[] = [
  'Номер счёта',
  'Дата счёта',
  'Поставщик',
  'ИНН',
  'КПП',
  'Сумма без НДС',
  'НДС',
  'Сумма с НДС',
  'Статус оплаты',
  'Дата оплаты',
  'Ответственный',
  'Комментарий',
].map((label, index) => ({ id: `field-${index}`, label }));

export default function TransferListExportFields() {
  return (
    <TransferList
      items={fields}
      titles={['Доступные поля', 'Поля в выгрузке']}
      searchPlaceholder="Название поля"
      rows={4}
      empty={{ title: 'Пока ничего не выбрано', description: 'Отметьте поля слева и перенесите сюда' }}
      className="w-full"
    />
  );
}
