# Telegram Stars setup

The UI works in a safe demo mode during `npm run dev`.

For real Telegram Stars payments, configure:

```env
VITE_STARS_INVOICE_ENDPOINT=https://your-server.example.com/api/stars/invoice
```

The endpoint receives:

```json
{
  "amount": 50,
  "productId": "growapp-supporter",
  "payload": "growapp-support-50-..."
}
```

It must validate the `X-Telegram-Init-Data` header, call Telegram Bot API `createInvoiceLink` with `currency: "XTR"`, and return:

```json
{
  "invoiceUrl": "https://t.me/$..."
}
```

For Stars, omit `provider_token`. The bot backend must also handle `pre_checkout_query`, confirm it with `answerPreCheckoutQuery`, process `successful_payment`, store `telegram_payment_charge_id`, and support `/paysupport` and refunds.

Never put the bot token in `src`, Vite environment variables, or browser code.
