# Telegram Stars → G-монеты

Для оплаты через Telegram Stars укажи endpoint:

```env
VITE_STARS_INVOICE_ENDPOINT=https://your-server.example.com/api/stars/invoice
```

Клиент отправляет:

```json
{
  "amount": 100,
  "productId": "growapp-premium-coins",
  "premiumCoins": 1000,
  "payload": "growapp-premium-100-1000-..."
}
```

Endpoint обязан:

1. Проверить `X-Telegram-Init-Data`.
2. Не доверять значению `premiumCoins` от клиента — пересчитать пакет на сервере.
3. Создать invoice link через Telegram Bot API с `currency: "XTR"`.
4. Вернуть:

```json
{
  "invoiceUrl": "https://t.me/$..."
}
```

Для Stars `provider_token` не нужен. Backend также должен обработать `pre_checkout_query`, подтвердить его через `answerPreCheckoutQuery`, принять `successful_payment`, сохранить `telegram_payment_charge_id` и начислить G-монеты на серверный аккаунт игрока.

Текущая сборка начисляет валюту после статуса `paid` в локальное сохранение — это удобно для теста интерфейса, но перед публичным релизом баланс и начисление должны стать серверными. Токен бота нельзя хранить в `src`, Vite env или браузерном коде.
