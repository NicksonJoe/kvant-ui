import type { TreeSelectNode } from '@/kvant';

export const regions: TreeSelectNode[] = [
  {
    id: 'cfo',
    label: 'Центральный ФО',
    children: [
      {
        id: 'msk',
        label: 'Москва',
        children: [
          { id: 'msk-north', label: 'Северный' },
          { id: 'msk-south', label: 'Южный' },
          { id: 'msk-vnukovo', label: 'Внуково-Карго' },
        ],
      },
      {
        id: 'mo',
        label: 'Московская обл.',
        children: [
          { id: 'mo-sergiev', label: 'Сергиев Посад' },
          { id: 'mo-serpukhov', label: 'Серпухов' },
          { id: 'mo-podolsk', label: 'Подольск' },
          { id: 'mo-khimki', label: 'Химки' },
          { id: 'mo-kolomna', label: 'Коломна' },
          { id: 'mo-dmitrov', label: 'Дмитров' },
        ],
      },
      {
        id: 'tula',
        label: 'Тула',
        children: [
          { id: 'tula-center', label: 'Тула · центр' },
          { id: 'tula-north', label: 'Тула · север' },
        ],
      },
      { id: 'yar', label: 'Ярославль' },
    ],
  },
  {
    id: 'szfo',
    label: 'Северо-Западный ФО',
    children: [
      { id: 'spb', label: 'Санкт-Петербург' },
      { id: 'kgd', label: 'Калининград' },
      { id: 'sergievka', label: 'Сергиевка · склад' },
      { id: 'murmansk', label: 'Мурманск' },
      { id: 'pskov', label: 'Псков' },
    ],
  },
  {
    id: 'ufo',
    label: 'Уральский ФО',
    children: [
      { id: 'ekb', label: 'Екатеринбург' },
      { id: 'chel', label: 'Челябинск' },
      { id: 'tyumen', label: 'Тюмень' },
    ],
  },
  {
    id: 'pfo',
    label: 'Приволжский ФО',
    children: [
      { id: 'kzn', label: 'Казань' },
      { id: 'nn', label: 'Нижний Новгород' },
      { id: 'samara', label: 'Самара' },
    ],
  },
];
