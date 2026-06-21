# GrowApp — ИИ-торг в клубе

## Что уже работает

- Покупатель сам называет в одном диалоговом облаке товар, количество, качество и цену.
- Игрок выбирает короткую реплику: просить выше, согласиться или закончить разговор.
- Кнопка **«Сказать по-своему»** отправляет собственную фразу игрока.
- Торг не ограничен фиксированным числом раундов: цену можно просить поднять снова, пока покупатель не уйдёт или не достигнет своего потолка.
- Интерес покупателя отображается словами и четырьмя делениями, без процентов.
- Если подходящего товара нет, появляется один понятный ответ **«Нет такого товара. Следующий клиент.»**
- Цена, шанс ухода и итог сделки рассчитываются кодом. OpenAI генерирует только живую формулировку реплик.
- Если функция или OpenAI временно недоступны, автоматически включаются локальные реплики и торговля продолжает работать.

## Файлы

- `src/features/club/ClubScreen.jsx` — новый интерфейс и логика сцены.
- `src/features/club/ClubScreen.css` — мобильный дизайн 9:16.
- `src/features/club/clubAiClient.js` — запрос к серверу и локальный fallback.
- `src/features/club/clubMarket.js` — сохранение ИИ-состояния покупателя.
- `functions/index.js` — Firebase HTTPS Function.
- `functions/tradeEngine.js` — серверные правила цены, интереса и ухода.
- `firebase.json` — rewrite `/api/club-dialogue` на функцию.

## Подключение OpenAI

В корне Firebase-проекта:

```bash
npm install -g firebase-tools
firebase login
firebase use growapptelegram
cd functions
npm install
cd ..
firebase functions:secrets:set OPENAI_API_KEY
```

После команды вставь API-ключ OpenAI. Ключ хранится в Firebase Secret Manager и не попадает в React-код.

Деплой:

```bash
firebase deploy --only functions:clubDialogue,hosting
```

Для проекта используется модель `gpt-5.4-mini`. При необходимости модель можно заменить переменной окружения `OPENAI_CLUB_MODEL` в Cloud Functions.

## Локальная проверка функции

Создай файл `functions/.secret.local`:

```text
OPENAI_API_KEY=твой_ключ
```

Затем:

```bash
firebase emulators:start --only functions,hosting
```

При запуске Vite отдельно можно указать прямой адрес эмулятора в корневом `.env.local`:

```text
VITE_CLUB_AI_ENDPOINT=http://127.0.0.1:5001/growapptelegram/europe-west1/clubDialogue
```

Для продакшена переменная не нужна: фронт обращается к `/api/club-dialogue`, а Firebase Hosting перенаправляет запрос на функцию.

## Важно при объединении с существующим firebase.json

Если в проекте уже есть `firebase.json`, не стирай другие настройки. Добавь в существующий массив `hosting.rewrites` правило **до** rewrite на `index.html`:

```json
{
  "source": "/api/club-dialogue",
  "function": {
    "functionId": "clubDialogue",
    "region": "europe-west1"
  }
}
```

## Быстрый тест серверной экономики

```bash
cd functions
npm test
```
