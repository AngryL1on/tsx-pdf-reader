# PDF Reader

Клиентское приложение для просмотра PDF и комментариев, привязанных к странице и точке на странице. Архитектура — [Feature-Sliced Design (FSD)](https://feature-sliced.design/). UI — [Material UI (MUI)](https://mui.com/material-ui/). Рендер PDF — [react-pdf](https://github.com/wojtekmaj/react-pdf).

## Требования

- Node.js 20+ (рекомендуется LTS)
- npm 10+

## Установка и запуск

```bash
npm install
npm run dev
```

Откройте в браузере адрес из вывода Vite (обычно `http://localhost:5173`).

В режиме разработки REST-запросы перехватываются [MSW](https://mswjs.io/) (см. ниже). Для продакшена поднимите свой backend с тем же контрактом API или настройте прокси.

### Скрипты

| Команда                     | Назначение                                                                           |
|-----------------------------|--------------------------------------------------------------------------------------|
| `npm run dev`               | Разработка с HMR (перед стартом подтягивается `public/sample.pdf`, если отсутствует) |
| `npm run ensure-sample-pdf` | Скачать демо-PDF в `public/sample.pdf` при необходимости                             |
| `npm run build`             | Проверка TypeScript и production-сборка                                              |
| `npm run preview`           | Локальный просмотр собранного `dist/`                                                |
| `npm run lint`              | ESLint                                                                               |
| `npm run typecheck`         | Только `tsc --noEmit`                                                                |

### Переменные окружения

Скопируйте пример и при необходимости измените значения:

```bash
cp .env.example .env
```

- `VITE_API_BASE_URL` — базовый URL API (по умолчанию `/api`). Запросы идут на `{VITE_API_BASE_URL}/documents` и т.д.

## Структура проекта (FSD)

Слои в каталоге `src/`:

| Слой        | Назначение                                                             |
|-------------|------------------------------------------------------------------------|
| `app/`      | Провайдеры (MUI, React Query, роутер), глобальные стили, bootstrap MSW |
| `pages/`    | Страницы маршрутов: список документов, просмотр документа              |
| `widgets/`  | Крупные блоки UI (рабочая область PDF + боковая панель комментариев)   |
| `features/` | Пользовательские сценарии (создание комментария, мутации)              |
| `entities/` | Бизнес-сущности: документ, комментарий, API и React Query              |
| `shared/`   | Универсальный REST-клиент, утилиты, моки MSW, конфиг                   |

Алиас импорта: `@/` → `src/`.

## REST API и моки

### Контракт API

База: `VITE_API_BASE_URL` (в dev с MSW это `/api`).

| Метод    | Путь                              | Описание                                       |
|----------|-----------------------------------|------------------------------------------------|
| `GET`    | `/documents`                      | Список документов                              |
| `GET`    | `/documents/:documentId`          | Метаданные документа (`id`, `title`, `pdfUrl`) |
| `GET`    | `/documents/:documentId/comments` | Комментарии документа                          |
| `POST`   | `/documents/:documentId/comments` | Создать комментарий                            |
| `PATCH`  | `/comments/:commentId`            | Изменить текст комментария                     |
| `DELETE` | `/comments/:commentId`            | Удалить комментарий                            |

Тело создания комментария (`POST`):

```json
{
  "pageIndex": 0,
  "relX": 0.42,
  "relY": 0.18,
  "text": "Текст комментария"
}
```

Координаты `relX` / `relY` — доля ширины и высоты **видимой страницы** (0…1), чтобы позиция не зависела от масштаба.

Опциональные заголовки для мока «текущего пользователя» при создании комментария:

- `X-User-Id`
- `X-User-Name`

### Мок-данные

Статические примеры лежат в:

- `src/shared/mocks/data/documents.json`
- `src/shared/mocks/data/comments.json`

Обработчики MSW (`src/shared/mocks/handlers.ts`) клонируют эти данные в память и обновляют их при `POST` / `PATCH` / `DELETE` до перезагрузки страницы.

### PDF и CORS

Поле `pdfUrl` сначала загружается обычным `fetch` в основном потоке (`usePdfFileData`), затем в react-pdf передаётся **`{ data: Uint8Array }`**, чтобы pdf.js не делал повторный сетевой запрос (иначе при включённом MSW часто ломается загрузка из worker). Внешние URL по-прежнему требуют CORS. Для демо в моках указан **`/sample.pdf`** — файл **`public/sample.pdf`**. Перед `npm run dev` и `npm run build` выполняется **`npm run ensure-sample-pdf`**, если файла нет. Относительные пути учитывают `base` в Vite (`resolvePdfSrc`).

**Версия pdf.js:** в `package.json` зафиксирован `pdfjs-dist` той же версии, что у `react-pdf`, а воркер подключается через `import '…pdf.worker.min.mjs?url'`. Иначе основной код и worker из разных минорных версий дают ошибку «файл загружен, но не открывается».

### Универсальный HTTP-клиент

Фабрика `createRestClient` в `src/shared/api/restClient.ts` создаёт объект с методами `get`, `post`, `patch`, `delete` относительно базового URL. Сущности (`entities/*/api`) используют его для вызовов backend; при смене окружения достаточно задать `VITE_API_BASE_URL` и отключить MSW в проде.

## Подключение реального backend

1. Реализуйте эндпоинты в соответствии с таблицей выше.
2. Укажите `VITE_API_BASE_URL` (например `https://api.example.com/v1`).
3. MSW запускается только в `import.meta.env.DEV` (`src/app/bootstrapMocks.ts`); в production запросы пойдут на ваш сервер. Настройте CORS и отдачу `pdfUrl` с разрешённым доступом для браузера.

## Сборка

```bash
npm run build
```

Результат в каталоге `dist/`. Раздавайте его как статику; для SPA настройте fallback на `index.html`.
