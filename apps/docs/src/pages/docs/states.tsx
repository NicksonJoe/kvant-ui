import { getComponent, isReady } from '@/kvant/meta';
import { CodeBlock } from '../../components/CodeBlock';
import { StateMatrix } from '../../components/StateMatrix';
import type { DocPageDef } from './types';
import { Prose, SpecList } from './widgets';

const button = getComponent('button');

export const states: DocPageDef = {
  slug: 'states',
  title: 'Состояния и фокус',
  lead: 'Каждый нажимаемый компонент показывает покой, наведение, нажатие, фокус и отключение плюс свои состояния: загрузку, ошибку, выбор.',
  boards: ['Q7-0', 'TGW-0'],
  sections: [
    {
      id: 'names',
      title: 'Названия',
      content: (
        <SpecList
          items={[
            ['покой', 'Исходный вид'],
            ['наведение', 'Только мышь и трекпад: на касании наведения нет'],
            ['нажатие', 'Фон на шаг темнее и масштаб 0,97'],
            ['фокус', 'Кольцо 2 px цвета ring с отступом 2 px — только при навигации с клавиатуры'],
            ['отключено', 'Прозрачность 50 %, без отклика'],
            ['загрузка', 'Спиннер вместо иконки, aria-busy, ширина и фокус сохраняются'],
            ['ошибка', 'Рамка danger, текст ошибки с иконкой, одна встряска'],
            ['выбрано · открыто', 'Акцентная заливка, мягкий фон, нажатый фон триггера'],
          ]}
        />
      ),
    },
    {
      id: 'matrix',
      title: 'Матрица кнопки',
      content: button && isReady(button) ? <StateMatrix meta={button} /> : null,
    },
    {
      id: 'focus',
      title: 'Кольцо фокуса',
      content: (
        <Prose>
          <p>
            У всех нажимаемых — <code>outline: 2px solid var(--color-ring)</code> с отступом 2 px. У полей ввода кольцо сплошное: рамка ring и
            ещё 1 px тени, без полупрозрачного ореола. Мышиное нажатие кольца не показывает — только <code>:focus-visible</code>.
          </p>
        </Prose>
      ),
    },
    {
      id: 'forced',
      title: 'Принудительные состояния',
      content: (
        <div className="flex max-w-3xl flex-col gap-3">
          <Prose>
            <p>
              Для документации и тестов наведение, нажатие и фокус можно включить атрибутом на интерактивном элементе. Как и настоящие
              :hover и :active, состояние доходит до предков элемента.
            </p>
          </Prose>
          <CodeBlock
            lang="html"
            code={'<button data-force-hover>…</button>\n<button data-force-pressed>…</button>\n<input data-force-focus />'}
          />
        </div>
      ),
    },
  ],
};
