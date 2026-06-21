# Grow App monetization v1

## Что уже работает в клиенте

- Магазин с тремя типами ценности: стартовый набор, монеты роста, косметика.
- Контекстный оффер после первой продажи, а не при первом запуске.
- Переход к маленькому пакету, когда игроку не хватает ускорения.
- Заказ дня в клубе.
- Серия входов на семь дней.
- Серверные промокоды вместо ключа, зашитого в JavaScript.
- События аналитики: открытие магазина, просмотр товара, начало/отмена/успех покупки, урожай, продажа, заказ дня.
- Клиент облачного сохранения.
- Серверное списание монет роста с идемпотентным журналом операций.
- Косметические темы, которые реально применяются в игре.

## Критическое правило

Клиент не начисляет покупку только потому, что `openInvoice` вернул `paid`. Сначала backend должен получить Telegram `successful_payment`, записать покупку и ответить через `/api/stars/verify`. Это защищает баланс от подмены в браузере.

## Переменные Vite

```env
VITE_STARS_INVOICE_ENDPOINT=https://YOUR-WORKER/api/stars/invoice
VITE_STARS_VERIFY_ENDPOINT=https://YOUR-WORKER/api/stars/verify
VITE_PROMO_REDEEM_ENDPOINT=https://YOUR-WORKER/api/promo/redeem
VITE_PLAYER_PROFILE_ENDPOINT=https://YOUR-WORKER/api/player/profile
VITE_PREMIUM_SPEND_ENDPOINT=https://YOUR-WORKER/api/player/spend
VITE_PLAYER_PROGRESS_ENDPOINT=https://YOUR-WORKER/api/player/progress
VITE_ANALYTICS_ENDPOINT=https://YOUR-WORKER/api/analytics/events
```

## Backend

Файл `backend-reference/cloudflare-worker.js` — отдельный Worker, а не часть React-сборки.

Нужны bindings:

- secret `TELEGRAM_BOT_TOKEN`;
- secret `TELEGRAM_WEBHOOK_SECRET`;
- KV namespace `GROWAPP_KV`;
- D1 database `GROWAPP_DB` для платного кошелька;
- optional `ALLOWED_ORIGIN`;
- `TERMS_URL` и `SUPPORT_CONTACT` для команд `/terms` и `/paysupport`.

Перед деплоем примени схему кошелька:

```bash
wrangler d1 execute growapp-db --file=./backend-reference/d1-schema.sql
```

Пример конфигурации лежит в `backend-reference/wrangler.example.toml`.

Webhook бота должен указывать на:

```text
https://YOUR-WORKER/telegram/webhook
```

При установке webhook передай тот же `secret_token`, который хранится в `TELEGRAM_WEBHOOK_SECRET`.

## Что нельзя принимать от клиента

- баланс монет роста;
- список купленных продуктов;
- косметические права;
- факт успешной оплаты;
- повторное использование промокода;
- списание монет роста за ускорение и обновление магазина.

Обычный игровой прогресс можно синхронизировать, но платёжные поля Worker специально вырезает из клиентского snapshot.

## Продукты v1

| ID | Цена | Содержимое |
|---|---:|---|
| `starter-kit` | 49 Stars | 80 монет роста, 3 раствора, янтарная тема |
| `growth-pocket` | 29 Stars | 30 монет роста |
| `growth-stash` | 99 Stars | 130 монет роста |
| `growth-vault` | 249 Stars | 380 монет роста |
| `amber-lab` | 79 Stars | постоянная тема |
| `violet-haze` | 129 Stars | редкая постоянная тема |

Обычные монеты намеренно не продаются: это сохраняет выращивание и клуб как основную игру.


## Почему кошелёк вынесен в D1

`localStorage` и клиентский snapshot можно изменить вручную. Баланс монет роста хранится в D1, а каждое начисление и списание записывается в `wallet_ledger` с уникальным ID. Триггеры базы:

- не позволяют балансу уйти ниже нуля;
- применяют одну операцию только один раз;
- безопасно переживают повторный webhook Telegram и повторный клик игрока.

Ежедневные награды и заказ дня дают только обычные монеты и предметы ухода. Платная валюта поступает только из подтверждённой покупки или серверного промокода.


## Перед публикацией

1. Замени `@YOUR_SUPPORT` и URL условий в `wrangler.example.toml`.
2. Установи webhook с `secret_token`.
3. Проверь `/terms`, `/support` и `/paysupport` в боте.
4. Прогони тестовую покупку Telegram Stars.
5. Убедись, что повторный webhook не начисляет товар второй раз.
6. Только после этого переключай платёжную среду на production.


## Личный код разработчика

Код не хранится в React-клиенте и не выдаёт валюту постороннему аккаунту.

1. В `backend-reference/wrangler.example.toml` укажи свой числовой Telegram ID в `OWNER_TELEGRAM_ID`.
2. В каталоге Worker выполни:

```bash
npx wrangler secret put DEVELOPER_ACCESS_CODE
```

3. Введи значение `3141592`.

После этого ключ `3141592` начисляет **100 000 ускорителей**, но только Telegram-аккаунту с указанным `OWNER_TELEGRAM_ID`. Для любого другого пользователя сервер вернёт `DEVELOPER_ONLY`. Код можно применять повторно для тестирования, каждое начисление записывается отдельной операцией в D1.
