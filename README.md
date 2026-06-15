# GrowApp

Вертикальная Telegram Mini App на React + Vite. Главный игровой цикл: посадка культуры, рост и уход, сбор урожая, продажа в клубе, покупки у Зорика и задания Марии Ивановны.

## Запуск

```bash
npm install
npm run dev
```

Проверка перед публикацией:

```bash
npm run lint
npm run build
```

Готовая production-сборка создаётся в `dist/`.

## Главные точки расширения

- `src/features/plantation/data/crops.js` — единый каталог культур, цен, стадий, описаний и условий открытия.
- `src/core/assets/assetCatalog.js` — единый каталог путей ко всем изображениям.
- `src/features/maria-ivanovna/` — дом, задания и шкала доверия Марии Ивановны.
- `src/core/migrations/gameStateMigrations.js` — перенос старых сохранений на новые идентификаторы.
- `public/assets/` — чисто разложенные игровые изображения.

Подробности находятся в `src/ARCHITECTURE.md` и `src/ART_REPLACEMENT_GUIDE.md`.

## Сохранения

Прогресс хранится в `localStorage`. При переименовании старых культур, смеси Джо и ветки заданий данные автоматически мигрируют в актуальную структуру. Старый ключ `growapp-joe-quests` читается только для безопасного переноса и больше не используется для новых записей.

## Telegram Stars

Адрес серверного endpoint задаётся через:

```env
VITE_STARS_INVOICE_ENDPOINT=...
```

Локальное значение хранится в `.env.local`, production-значение — в `.env.production`.
