import { Prose } from '@/kvant';

const specs = [
  ['Заголовок 1', '28/36 600 −0.002em · сверху 0 · снизу 12'],
  ['Лид', '18/28 400 −0.006em · fg-2 · один на статью'],
  ['Заголовок 2', '20/28 600 −0.007em · сверху 40 · снизу 12'],
  ['Заголовок 3', '16/24 600 −0.009em · сверху 32 · снизу 8'],
  ['Абзац', '16/28 400 −0.007em · fg-1 · между абзацами 16'],
  ['Списки', 'маркер 5 fg-3 · номер 500 tabular · отступ 24 · шаг 8'],
  ['Цитата', '18/28 fg-1 · линия 1 fg-4 · отступ 20 · подпись 13/18 fg-3'],
  ['Код в строке', 'JetBrains Mono 14/20 · fill-2 · r 6 · px 5 · h 22'],
  ['Ссылка', 'accent-soft-fg · линия 1, отступ 3 · наведение accent-hover'],
  ['Сноска', 'номер accent-soft-fg 500 · текст 13/18 fg-3 · линия 48 border'],
];

export default function TypographyArticle() {
  return (
    <div className="flex w-full flex-wrap items-start gap-16">
      <div className="flex w-full max-w-prose flex-col gap-8">
        <div aria-hidden className="flex h-4 items-center gap-2">
          <span className="h-[9px] w-px bg-fg-4" />
          <span className="h-px flex-1 bg-border" />
          <span className="font-mono text-overline font-medium text-fg-3">680 · container-prose</span>
          <span className="h-px flex-1 bg-border" />
          <span className="h-[9px] w-px bg-fg-4" />
        </div>
        <Prose render={<article />}>
          <h1>Как перенести клиентов из таблицы в Норду</h1>
          <p>Импорт занимает пару минут: Норда сама сопоставит колонки, найдёт дубликаты и покажет, что изменится, ещё до загрузки.</p>
          <h2>Подготовьте файл</h2>
          <p>
            Подойдёт CSV или XLSX до 20 МБ. Шаблон с нужными колонками лежит на <a href="#import">странице импорта</a> — скачайте его, если начинаете с нуля.
          </p>
          <p>
            Первая строка — заголовки колонок: <code>name</code>, <code>phone</code>, <code>email</code> и <code>company</code>.
          </p>
          <ul>
            <li>
              Телефоны — в любом формате: Норда приведёт их к виду <span className="whitespace-nowrap">+7 900 123-45-67</span>.
            </li>
            <li>Даты — как 27.10.2026 или 27 октября 2026.</li>
            <li>Пустые ячейки не затрут данные, которые уже есть в карточке клиента.</li>
          </ul>
          <h3>Если клиент уже есть в базе</h3>
          <ol>
            <li>Норда ищет совпадения по телефону и почте.</li>
            <li>Совпавшие строки попадают в список «Возможные дубликаты».</li>
            <li>Для каждой вы выбираете: объединить, пропустить или создать новую карточку.</li>
          </ol>
          <blockquote>
            <p>Мы перенесли 4 300 клиентов из трёх таблиц за один вечер — и ни один контакт не задвоился.</p>
            <footer>Мария Лебедева, руководитель «Студии Север»</footer>
          </blockquote>
          <p>
            Импорт доступен на тарифах «Команда» и «Студия»
            <sup>
              <a href="#article-fn-1" id="article-fnref-1" data-footnote-ref aria-describedby="article-footnotes">
                1
              </a>
            </sup>
            . Отменить его можно в течение 24 часов в разделе «История импорта».
          </p>
          <section data-footnotes>
            <h2 id="article-footnotes" className="sr-only">
              Сноски
            </h2>
            <ol>
              <li id="article-fn-1">На тарифе «Старт» — до 500 строк за один импорт. Остальное Норда предложит загрузить частями.</li>
            </ol>
          </section>
        </Prose>
      </div>
      <div className="flex min-w-[320px] flex-1 flex-col pt-12">
        <dl>
          {specs.map(([name, spec]) => (
            <div key={name} className="flex items-baseline gap-4 border-b border-separator py-2.5">
              <dt className="w-[132px] shrink-0 text-body-xs font-medium text-fg-2">{name}</dt>
              <dd className="flex-1 font-mono text-overline font-medium text-fg-3">{spec}</dd>
            </div>
          ))}
        </dl>
        <p className="pt-4 font-mono text-overline font-medium text-fg-3">
          движение: ссылка — цвет 75ms ease-hover · переход к сноске — прокрутка 250ms ease-standard, подсветка fill-2 гаснет за 1500ms
        </p>
      </div>
    </div>
  );
}
