# Формат реестра Kvant

Реестр — набор статических JSON-файлов: `index.json` и по файлу на каждый элемент (`button.json`, `styles.json`…). Его читает команда `kvant` (`packages/cli`), больше ему ничего не нужно: подойдёт любой статический хостинг, папка на диске или GitHub.

- В репозитории: `apps/docs/public/r/`. Источник по умолчанию — этот же репозиторий на GitHub: `github:NicksonJoe/kwant`.
- Собирается командой `pnpm generate` из корня: сначала токены (`packages/tokens` → `packages/registry/styles/tokens.css` и `tailwind.css`), затем реестр (`packages/cli/scripts/build-registry.ts`).
- Руками файлы не правят. Тесты `pnpm --filter kvant-ui test` и `pnpm --filter @kvant/tokens test` падают, если сгенерированное отстало от исходников.

## index.json

| Поле | Тип | Что это |
|---|---|---|
| `name` | string | Имя реестра: `kvant` |
| `homepage` | string | `https://ui.norda.cloud` |
| `theme.accents`, `theme.fonts`, `theme.shapes` | string[] | Что принимает `kvant init` в `--theme`, `--font`, `--shape` |
| `theme.defaults` | `{ accent, font, shape }` | Значения по умолчанию: `cobalt`, `inter`, `capsule` |
| `items` | элемент[] | Все элементы в порядке документации; поля как у элемента, но `files` — только список `target` без содержимого |

## Элемент (`<name>.json`)

| Поле | Тип | Что это |
|---|---|---|
| `name` | string | Имя для `kvant add`: латиница, цифры, дефис |
| `type` | `component` \| `lib` \| `style` \| `font` | Компонент, утилита, стили или шрифт |
| `title`, `description` | string | По-русски, из метаданных компонента |
| `dependencies` | string[] | npm-пакеты с диапазоном версий: `@base-ui/react@^1.9.0`. React не входит — он есть в проекте |
| `registryDependencies` | string[] | Элементы Kvant, которые импортирует этот: `["cn", "spinner"]` |
| `files` | `{ target, content, barrel? }[]` | `target` — путь внутри папки Kvant проекта (`components/button.tsx`), `content` — текст файла. `barrel: true` — модуль реэкспортируется из `index.ts` папки Kvant |
| `css` | string[] | Что подключить через `@import` в стили проекта, по порядку. `./styles/tokens.css` — файл в папке Kvant, остальное — пакет (`tailwindcss`, `@fontsource-variable/inter/opsz.css`) |

Пример (сокращён):

```json
{
  "name": "button",
  "type": "component",
  "title": "Кнопка",
  "description": "Запускает действие…",
  "dependencies": ["@base-ui/react@^1.9.0", "lucide-react@^1.63.0"],
  "registryDependencies": ["cn", "spinner"],
  "files": [{ "target": "components/button.tsx", "content": "import …", "barrel": true }],
  "css": []
}
```

Служебные элементы, кроме компонентов: `styles` (токены, мост Tailwind, CSS движения), `cn`, `recipes`, `theme` (хук `useTheme`), `font-inter`, `font-geist`.

## Откуда берутся данные

- Список компонентов, `title`, `description` и файл — из метаданных `packages/registry/meta` (только готовые, без `planned`).
- `registryDependencies` и `dependencies` вычисляются по импортам файла, а не берутся из метаданных: ставится файл целиком, поэтому нужно всё, что он импортирует. Относительный импорт ведёт к элементу-владельцу файла (элемент с тем же именем, что у файла, иначе первый, кто его поставляет).
- Версии пакетов — из `packages/registry/package.json`, шрифтов — из `apps/docs/package.json`.
- `barrel` — у файлов, которые реэкспортирует `packages/registry/index.ts`.
- Несколько элементов могут поставлять один файл (`checkbox`, `radio-group` и `switch` — это `components/checkbox.tsx`); содержимое у них одинаковое.

## Как `kvant add` применяет элементы

1. Загружает элементы и, рекурсивно, их `registryDependencies`; зависимости идут первыми.
2. Пишет каждый файл в `<dir>/<target>` из `kvant.json`. Файл совпадает с реестром — пропускает; отличается — оставляет как есть и сообщает, пока не передан `--overwrite`.
3. Дописывает `export * from './<target>';` в `<dir>/index.ts` для файлов с `barrel` — недостающие строки, остальное не трогает.
4. Добавляет недостающие `@import` из `css` в файл стилей проекта (`css` в `kvant.json`) после уже имеющихся импортов.
5. Ставит пакеты из `dependencies`, которых ещё нет в `package.json`, менеджером проекта (по lock-файлу: pnpm, yarn, bun, npm). Уже установленные версии не меняет.

## Источники реестра

- Папка: `--registry ../kvant/apps/docs/public/r` (путь от корня проекта).
- URL: `--registry https://ui.norda.cloud/r`. Файлы берутся как `<url>/<name>.json`.
- GitHub: `--registry github:владелец/репозиторий[/путь][#ветка]` → `https://raw.githubusercontent.com/владелец/репозиторий/ветка/путь`; путь по умолчанию `apps/docs/public/r`, ветка `main`. По умолчанию — `github:NicksonJoe/kwant`. Для приватного репозитория — переменная `GITHUB_TOKEN` (или `GH_TOKEN`).

Источник, выбранный в `kvant init`, сохраняется в `kvant.json`; `--registry` у других команд его переопределяет.

## Блоки из Playground

«Сохранить как блок» в Playground (`/playground`) выдаёт обычный элемент: `type: "component"`, один файл `blocks/<имя>.tsx` с `barrel: true`, импорты — из соседних файлов компонентов (`../components/button`), в `registryDependencies` — использованные компоненты, в `dependencies` — `lucide-react`, если есть иконки. Дополнительное поле `composer` хранит документ Playground, чтобы «Импорт» открыл блок обратно; `kvant` его не читает.

Ставится аргументом-файлом: `kvant add ./kartochka-sdelki.json` (или URL на `.json`). Файл проверяется как любой элемент реестра, а его `registryDependencies` берутся из источника реестра.

## Проверки (реестр — внешние данные)

- `target` — только относительный путь с прямыми слэшами, без `.` и `..`: файл не может выйти из папки Kvant.
- Имена элементов — `^[a-z0-9]+(-[a-z0-9]+)*$`, поэтому имя не превращается в путь.
- `dependencies` — только имя пакета и диапазон версии: флаги менеджера пакетов не пройдут.
- `css` — только путь или имя пакета, без кавычек и `;`.

## kvant.json

| Поле | Пример | Что это |
|---|---|---|
| `registry` | `github:NicksonJoe/kwant` | Источник реестра |
| `theme`, `font`, `shape` | `cobalt`, `inter`, `capsule` | Выбор при `init`; тема ставится атрибутами `data-accent`, `data-font`, `data-shape` на `<html>` |
| `css` | `src/index.css` | Файл стилей проекта |
| `dir` | `src/kvant` | Куда копируются файлы |
| `aliases.kvant` | `@/kvant` | Как приложение импортирует папку Kvant; алиас настраивается в `tsconfig` и сборщике |
