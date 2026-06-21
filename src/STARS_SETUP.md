# Telegram Stars: безопасное подключение

Grow App использует двухэтапную схему:

1. React запрашивает invoice по `VITE_STARS_INVOICE_ENDPOINT`.
2. Backend проверяет Telegram Mini App `initData` и создаёт `createInvoiceLink` с валютой `XTR`.
3. Mini App открывает ссылку через `Telegram.WebApp.openInvoice`.
4. Bot webhook отвечает на `pre_checkout_query` не позднее десяти секунд.
5. Товар выдаётся только после webhook-сообщения `successful_payment`.
6. React вызывает `VITE_STARS_VERIFY_ENDPOINT` и получает подтверждённые entitlements/баланс.

Нельзя хранить токен бота в Vite env. Переменные `VITE_*` попадают в публичный JavaScript.

Готовый каркас Worker: `backend-reference/cloudflare-worker.js`.
