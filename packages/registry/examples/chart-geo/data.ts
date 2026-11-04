import type { GeoBubble, GeoDatum, GeoFlow, GeoLocation, GeoPin, GeoPlace } from '@/kvant';

/** Orders per 10 000 residents, October 2026, by tile region. */
export const regionOrders: GeoDatum[] = Object.entries({
  МУР: 3, СПБ: 46, КАР: 7, АРХ: 6, КОМ: 5, ЯНА: 2, КРЯ: 4, ЯКУ: 6, ЧУК: 1, КЛГ: 8, ЛЕН: 14, НОВ: 4, ВОЛ: 6, КИР: 11, ПЕР: 16,
  ХМА: 4, ТОМ: 7, ИРК: 8, МАГ: 2, КАМ: 3, ПСК: 5, ТВЕ: 9, ЯРО: 8, УДМ: 4, СВЕ: 31, ТЮМ: 9, НСК: 27, КЕМ: 12, БУР: 3, ЗАБ: 5,
  ХАБ: 4, САХ: 6, СМО: 6, МСК: 58, ВЛА: 7, ТАТ: 24, БАШ: 17, ЧЕЛ: 15, ОМС: 9, АЛТ: 6, АМУ: 5, ПРИ: 4, БРЯ: 5, КЛЖ: 4, РЯЗ: 8,
  НИЖ: 18, САМ: 13, ОРЕ: 6, КУР: 7, ВОР: 4, ПЕН: 5, САР: 9, ВЛГ: 3, КРМ: 12, РОС: 19, АСТ: 2, КРД: 33, СТА: 9, ДАГ: 5,
}).map(([id, value]) => ({ id, value }));

/** Repeat orders, % of clients, by Moscow okrug. */
export const okrugRepeat: GeoDatum[] = [
  { id: 'ЦАО', value: 42 },
  { id: 'САО', value: 18 },
  { id: 'СВАО', value: 24 },
  { id: 'ВАО', value: 12 },
  { id: 'ЮВАО', value: 8 },
  { id: 'ЮАО', value: 15 },
  { id: 'ЮЗАО', value: 31 },
  { id: 'ЗАО', value: 27 },
  { id: 'СЗАО', value: 21 },
];

/** Orders per month by city, placed in the centre of its region tile. */
export const cityOrders: GeoBubble[] = [
  { name: 'Москва', region: 'МСК', value: 1840 },
  { name: 'Петербург', region: 'СПБ', value: 920 },
  { name: 'Новосибирск', region: 'НСК', value: 410 },
  { name: 'Екатеринбург', region: 'СВЕ', value: 380 },
  { name: 'Казань', region: 'ТАТ', value: 350 },
  { name: 'Краснодар', region: 'КРД', value: 300 },
  { name: 'Нижний Новгород', region: 'НИЖ', value: 260 },
  { name: 'Ростов-на-Дону', region: 'РОС', value: 240 },
  { name: 'Самара', region: 'САМ', value: 210 },
  { name: 'Челябинск', region: 'ЧЕЛ', value: 190 },
  { name: 'Уфа', region: 'БАШ', value: 170 },
  { name: 'Красноярск', region: 'КРЯ', value: 150 },
  { name: 'Владивосток', region: 'ПРИ', value: 140 },
  { name: 'Хабаровск', region: 'ХАБ', value: 120 },
  { name: 'Иркутск', region: 'ИРК', value: 110 },
];

const pickup = (name: string, lon: number, lat: number): GeoPin => ({ name: `ПВЗ ${name}`, category: 'Пункт выдачи', detail: 'Ежедневно 10:00–21:00', lon, lat });
const shop = (name: string, lon: number, lat: number): GeoPin => ({ name: `Магазин ${name}`, category: 'Магазин', detail: 'Ежедневно 09:00–22:00', lon, lat });

/** Moscow pickup points, shops and warehouses, October 2026. */
export const pickupPoints: GeoPin[] = [
  pickup('Тропарёво', 37.4747, 55.6813),
  pickup('Таганская', 37.6752, 55.748),
  pickup('Тёплый Стан', 37.4964, 55.6487),
  pickup('Перово', 37.749, 55.7375),
  pickup('Останкино', 37.6197, 55.8251),
  pickup('Строгино', 37.4056, 55.7823),
  pickup('Медведково', 37.654, 55.878),
  pickup('Гольяново', 37.7429, 55.8264),
  pickup('Ховрино', 37.5036, 55.8865),
  pickup('Кузьминки', 37.7776, 55.7047),
  pickup('Отрадное', 37.6165, 55.8632),
  pickup('Новогиреево', 37.8104, 55.7832),
  pickup('Коньково', 37.4703, 55.6408),
  pickup('Парк культуры', 37.5976, 55.7249),
  pickup('Киевская', 37.5506, 55.7463),
  pickup('Беломорская', 37.484, 55.8882),
  pickup('Щёлковская', 37.7737, 55.8254),
  pickup('Марьино', 37.7263, 55.6581),
  pickup('Коломенская', 37.6521, 55.6686),
  pickup('Кунцево', 37.4565, 55.749),
  pickup('Белорусская', 37.579, 55.7841),
  pickup('Полянка', 37.6159, 55.7441),
  pickup('Раменки', 37.499, 55.707),
  pickup('Тульская', 37.6417, 55.7026),
  pickup('Войковская', 37.4813, 55.8461),
  pickup('Бутово', 37.5528, 55.606),
  shop('на Ленинском', 37.5765, 55.6858),
  shop('в Текстильщиках', 37.7072, 55.7046),
  shop('на Сущёвском', 37.6263, 55.7894),
  shop('у Красносельской', 37.6636, 55.7805),
  shop('на Чистых прудах', 37.6402, 55.7624),
  shop('на Шаболовке', 37.6154, 55.7),
  shop('на Пролетарской', 37.6615, 55.7221),
  shop('в Чертанове', 37.6157, 55.6146),
  shop('в Свиблове', 37.6676, 55.8174),
  { name: 'Склад «Запад»', category: 'Склад', detail: 'Отгрузка до 18:00', label: true, lon: 37.4345, lat: 55.678 },
  { name: 'Склад «Восток»', category: 'Склад', detail: 'Отгрузка до 18:00', label: true, lon: 37.8114, lat: 55.8286 },
];

/** Pickup points across the country, by region: neighbours collapse into clusters at this scale. */
export const countryPoints: GeoPin[] = (
  [
    ['МСК', 'Москва', 148], ['СПБ', 'Петербург', 64], ['КРД', 'Краснодар', 22], ['СВЕ', 'Екатеринбург', 21], ['НИЖ', 'Нижний Новгород', 18],
    ['НСК', 'Новосибирск', 17], ['РОС', 'Ростов-на-Дону', 15], ['ТАТ', 'Казань', 14], ['САМ', 'Самара', 11], ['ЧЕЛ', 'Челябинск', 9],
    ['БАШ', 'Уфа', 8], ['ВОР', 'Воронеж', 7], ['ПЕР', 'Пермь', 6], ['КРЯ', 'Красноярск', 6], ['ЯРО', 'Ярославль', 5], ['КРМ', 'Симферополь', 5],
    ['ТЮМ', 'Тюмень', 4], ['ОМС', 'Омск', 4], ['ВЛГ', 'Волгоград', 4], ['ИРК', 'Иркутск', 3], ['ПРИ', 'Владивосток', 3], ['СТА', 'Ставрополь', 3],
    ['ХАБ', 'Хабаровск', 2], ['КЛГ', 'Калининград', 2], ['ТОМ', 'Томск', 2], ['АРХ', 'Архангельск', 1], ['МУР', 'Мурманск', 1], ['ЯКУ', 'Якутск', 1],
    ['КАМ', 'Петропавловск-Камчатский', 1],
  ] as const
).flatMap(([region, city, count]) =>
  Array.from({ length: count }, (_, i): GeoPin => ({ name: count > 1 ? `${city}, пункт ${i + 1}` : `${city}, пункт выдачи`, category: 'Пункт выдачи', region })),
);

/** Mulberry32: the same addresses on every render. */
function random(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 4 050 delivery addresses inside MKAD: dense centre, south-west and north-east, a thin spread elsewhere. */
export const deliveryAddresses: GeoLocation[] = (() => {
  const next = random(44);
  const normal = () => Math.sqrt(-2 * Math.log(next() || 1e-9)) * Math.cos(2 * Math.PI * next());
  const areas = [
    { lon: 37.615, lat: 55.752, dLon: 0.05, dLat: 0.02, count: 1500 },
    { lon: 37.5, lat: 55.665, dLon: 0.035, dLat: 0.018, count: 900 },
    { lon: 37.69, lat: 55.865, dLon: 0.06, dLat: 0.018, count: 820 },
    { lon: 37.8, lat: 55.705, dLon: 0.03, dLat: 0.02, count: 380 },
  ];
  const clustered = areas.flatMap((area) => Array.from({ length: area.count }, () => ({ lon: area.lon + normal() * area.dLon, lat: area.lat + normal() * area.dLat })));
  const spread = Array.from({ length: 450 }, () => ({ lon: 37.4 + next() * 0.42, lat: 55.6 + next() * 0.29 }));
  return [...clustered, ...spread];
})();

export const densityLabels: GeoPlace[] = [
  { name: 'Центр', lon: 37.6105, lat: 55.8048 },
  { name: 'Юго-Запад', lon: 37.5109, lat: 55.5935 },
  { name: 'Северо-Восток', lon: 37.7332, lat: 55.8947 },
];

const moscow = { name: 'Москва', region: 'МСК' };
const ekb = { name: 'Екатеринбург', region: 'СВЕ' };
const nsk = { name: 'Новосибирск', region: 'НСК' };
const to = (name: string, region: string) => ({ name, region });

/** Shipments per week from three warehouses, week 44. */
export const shipments: GeoFlow[] = [
  { from: moscow, to: to('Санкт-Петербург', 'СПБ'), value: 420 },
  { from: moscow, to: to('Краснодарский край', 'КРД'), value: 300 },
  { from: moscow, to: to('Нижегородская область', 'НИЖ'), value: 260 },
  { from: moscow, to: to('Ростовская область', 'РОС'), value: 240 },
  { from: moscow, to: to('Татарстан', 'ТАТ'), value: 180 },
  { from: moscow, to: to('Воронежская область', 'ВОР'), value: 140 },
  { from: moscow, to: to('Ярославская область', 'ЯРО'), value: 90 },
  { from: ekb, to: to('Челябинская область', 'ЧЕЛ'), value: 190 },
  { from: ekb, to: to('Башкортостан', 'БАШ'), value: 170 },
  { from: ekb, to: to('Тюменская область', 'ТЮМ'), value: 120 },
  { from: ekb, to: to('Пермский край', 'ПЕР'), value: 110 },
  { from: ekb, to: to('Ханты-Мансийский округ', 'ХМА'), value: 80 },
  { from: nsk, to: to('Красноярский край', 'КРЯ'), value: 150 },
  { from: nsk, to: to('Хабаровский край', 'ХАБ'), value: 120 },
  { from: nsk, to: to('Омская область', 'ОМС'), value: 110 },
  { from: nsk, to: to('Иркутская область', 'ИРК'), value: 110 },
  { from: nsk, to: to('Алтайский край', 'АЛТ'), value: 90 },
  { from: nsk, to: to('Томская область', 'ТОМ'), value: 50 },
];
