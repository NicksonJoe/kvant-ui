# kvant-ui

Команда библиотеки Kvant: копирует исходный код компонентов в ваш проект. Дальше код принадлежит проекту — правьте как хотите.

Нужны React 19 и Tailwind CSS v4. В проекте на Vite команда `init` поставит и подключит Tailwind сама.

```sh
npx kvant-ui init --theme cobalt --font inter --shape capsule
npx kvant-ui add button dialog
```

```tsx
import { Button } from '@/kvant';
```

## Команды

| Команда | Что делает |
|---|---|
| `kvant-ui init` | Пишет `kvant.json`, копирует стили и `cn`, подключает `@import` в стили проекта, ставит шрифт, ставит тему на `<html>` в `index.html` |
| `kvant-ui add <имя…>` | Копирует компоненты вместе с зависимостями, дописывает экспорт в `src/kvant/index.ts`, ставит недостающие пакеты |
| `kvant-ui add ./блок.json` | Ставит блок, сохранённый в Playground («Сохранить как блок»): файл в `src/kvant/blocks/`, зависимости — из реестра. Подойдёт и URL на `.json` |
| `kvant-ui diff [имя…]` | Показывает, чем ваши файлы отличаются от реестра |
| `kvant-ui list` | Список элементов реестра, ✓ — уже в проекте |

Параметры `init`: `--theme` (graphite, cobalt, iris, aqua, jade, amber, ember, orchid), `--font` (inter, geist), `--shape` (capsule, density), `--dir` (по умолчанию `src/kvant`), `--alias` (`@/kvant`), `--css` (находится сам: `src/index.css` и т. п.).

Изменённые вами файлы `add` не перезаписывает: сообщит и оставит. Заменить версией из реестра — `kvant-ui add button --overwrite` (ваши правки пропадут).

## Откуда берутся компоненты

По умолчанию — `github:NicksonJoe/kvant-ui` (папка `apps/docs/public/r` ветки `main`). Другой источник: `--registry` у любой команды или поле `registry` в `kvant.json`.

- папка: `--registry ../kvant/apps/docs/public/r`;
- URL: `--registry https://example.com/r`;
- GitHub: `--registry github:владелец/репозиторий[/путь][#ветка]`, для приватного репозитория — `GITHUB_TOKEN`.

Формат реестра — [docs/registry-schema.md](../../docs/registry-schema.md).

## Разработка

```sh
pnpm generate                   # токены → styles/*.css → реестр apps/docs/public/r
pnpm --filter kvant-ui test        # модульные тесты
pnpm --filter kvant-ui test:e2e    # новый Vite-проект → init → add button dialog → tsc и сборка
pnpm --filter kvant-ui build       # dist/ для публикации
```

Если в новом проекте Vite остались стили шаблона в `src/index.css` (`button { … }`, цвета `:root`), удалите их: стили вне слоёв перекрывают классы компонентов.
