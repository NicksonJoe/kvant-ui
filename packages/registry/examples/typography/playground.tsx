import type { ReactNode } from 'react';
import { Prose } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const BLOCKS = ['headings', 'lists', 'quote'] as const;
type Block = (typeof BLOCKS)[number];

const content: Record<Block, { node: ReactNode; code: string }> = {
  headings: {
    node: (
      <>
        <h1>Онлайн-запись</h1>
        <p>Клиенты записываются сами, а Норда напоминает о визите за день.</p>
        <h2>Как включить</h2>
        <p>
          Откройте <a href="#settings">настройки</a> и включите запись для нужных услуг.
        </p>
      </>
    ),
    code: `  <h1>Онлайн-запись</h1>
  <p>Клиенты записываются сами, а Норда напоминает о визите за день.</p>
  <h2>Как включить</h2>
  <p>Откройте <a href="/settings">настройки</a> и включите запись для нужных услуг.</p>`,
  },
  lists: {
    node: (
      <>
        <h3>Что понадобится</h3>
        <ul>
          <li>Список услуг с длительностью.</li>
          <li>Расписание мастеров.</li>
        </ul>
        <ol>
          <li>Добавьте услуги.</li>
          <li>Отметьте рабочие часы.</li>
        </ol>
      </>
    ),
    code: `  <h3>Что понадобится</h3>
  <ul>
    <li>Список услуг с длительностью.</li>
    <li>Расписание мастеров.</li>
  </ul>
  <ol>
    <li>Добавьте услуги.</li>
    <li>Отметьте рабочие часы.</li>
  </ol>`,
  },
  quote: {
    node: (
      <>
        <blockquote>
          <p>Половина записей теперь приходит ночью, пока студия закрыта.</p>
          <footer>Анна Соколова, владелица студии</footer>
        </blockquote>
        <p>
          Ссылку на запись найдёте в поле <code>booking_url</code>.
        </p>
      </>
    ),
    code: `  <blockquote>
    <p>Половина записей теперь приходит ночью, пока студия закрыта.</p>
    <footer>Анна Соколова, владелица студии</footer>
  </blockquote>
  <p>Ссылку на запись найдёте в поле <code>booking_url</code>.</p>`,
  },
};

const playground: Playground = {
  controls: [{ name: 'blocks', type: 'enum', options: BLOCKS, default: 'headings', description: 'Какие блоки показать: заголовки и ссылка, списки, цитата и код в строке.' }],
  render: (p) => <Prose className="w-full">{content[p.pick('blocks', BLOCKS)].node}</Prose>,
  code: (p) => `<Prose>
${content[p.pick('blocks', BLOCKS)].code}
</Prose>`,
};

export default playground;
