import { useMemo, useState } from "react";

import {
  createStarsInvoice,
  isStarsPaymentConfigured,
  openStarsInvoice,
} from "./starsPayments";
import {
  PREMIUM_CURRENCY,
  starsToPremiumCoins,
} from "../../core/economy/premiumCurrency";

import "./SupportScreen.css";

const PRESETS = [25, 50, 100, 250];
const MIN_STARS = 1;
const MAX_STARS = 2500;
const PURCHASED_STARS_KEY = "growapp-premium-stars-total";

function clampAmount(value) {
  const numeric = Math.round(Number(value) || MIN_STARS);
  return Math.min(MAX_STARS, Math.max(MIN_STARS, numeric));
}

function readPurchasedStars() {
  try {
    return Math.max(0, Number(localStorage.getItem(PURCHASED_STARS_KEY)) || 0);
  } catch {
    return 0;
  }
}

export default function SupportScreen({
  premiumCoins = 0,
  onPremiumCoinsAdded,
  onGoBack,
}) {
  const [amount, setAmount] = useState(100);
  const [purchasedStars, setPurchasedStars] = useState(readPurchasedStars);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const configured = isStarsPaymentConfigured();
  const coinAmount = useMemo(() => starsToPremiumCoins(amount), [amount]);

  const saveSuccessfulPurchase = (paidStars, receivedCoins) => {
    const nextTotal = purchasedStars + paidStars;
    setPurchasedStars(nextTotal);
    onPremiumCoinsAdded?.(receivedCoins);

    try {
      localStorage.setItem(PURCHASED_STARS_KEY, String(nextTotal));
    } catch {
      // Игра продолжает работать без локального хранилища.
    }
  };

  const handlePurchase = async () => {
    const normalizedAmount = clampAmount(amount);
    const normalizedCoins = starsToPremiumCoins(normalizedAmount);
    setAmount(normalizedAmount);
    setStatus("loading");
    setMessage("");

    if (!configured) {
      setStatus("error");
      setMessage("Сервер создания Telegram-счёта пока не подключён.");
      return;
    }

    try {
      const invoiceUrl = await createStarsInvoice({
        stars: normalizedAmount,
        premiumCoins: normalizedCoins,
      });
      const paymentStatus = await openStarsInvoice(invoiceUrl);

      if (paymentStatus === "paid") {
        saveSuccessfulPurchase(normalizedAmount, normalizedCoins);
        setStatus("success");
        setMessage(`Начислено ${normalizedCoins} G-монет.`);
        return;
      }

      if (paymentStatus === "cancelled") {
        setStatus("idle");
        setMessage("Платёж отменён — Stars не списывались.");
        return;
      }

      if (paymentStatus === "failed") {
        setStatus("error");
        setMessage("Telegram не смог провести платёж.");
        return;
      }

      setStatus("idle");
      setMessage("Окно оплаты закрыто без списания Stars.");
    } catch (error) {
      console.error("Не удалось открыть Stars invoice:", error);
      setStatus("error");
      setMessage("Не удалось открыть оплату. Проверь invoice endpoint.");
    }
  };

  return (
    <main className="support-screen">
      <header className="support-screen__header">
        <button type="button" className="support-screen__back" onClick={onGoBack}>
          ← Район
        </button>

        <div className="support-screen__eyebrow">Grow Street · Telegram Stars</div>
        <h1>Банк G-монет</h1>
        <p>
          G-монеты ускоряют ожидание: ими можно моментально вырастить растение
          или вызвать новую поставку в лавку Зорика.
        </p>
      </header>

      <section className="support-card support-card--identity">
        <div className="support-card__badge">◆</div>
        <div>
          <span className="support-card__label">Твой баланс</span>
          <strong>{Math.max(0, Math.floor(Number(premiumCoins) || 0))} G</strong>
          <small>1 ⭐ = {PREMIUM_CURRENCY.coinsPerStar} G · куплено за всё время: {purchasedStars} ⭐</small>
        </div>
      </section>

      <section className="support-card">
        <div className="support-card__topline">
          <div>
            <span className="support-card__label">Получишь</span>
            <strong>{coinAmount} G</strong>
          </div>
          <span className="support-card__limit">за {amount} ⭐</span>
        </div>

        <div className="support-presets">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className={amount === preset ? "active" : ""}
              onClick={() => setAmount(preset)}
            >
              {starsToPremiumCoins(preset)} G
              <small>{preset} ⭐</small>
            </button>
          ))}
        </div>

        <label className="support-custom">
          <span>Своя сумма в Stars</span>
          <input
            type="number"
            min={MIN_STARS}
            max={MAX_STARS}
            value={amount}
            onChange={(event) => setAmount(clampAmount(event.target.value))}
          />
        </label>

        <input
          className="support-range"
          type="range"
          min={MIN_STARS}
          max="500"
          step="1"
          value={Math.min(amount, 500)}
          onChange={(event) => setAmount(Number(event.target.value))}
        />

        <button
          type="button"
          className="support-pay"
          disabled={status === "loading" || !configured}
          onClick={handlePurchase}
        >
          {status === "loading"
            ? "Открываем Telegram…"
            : configured
              ? `Купить ${coinAmount} G за ${amount} ⭐`
              : "Оплата временно недоступна"}
        </button>

        {message && (
          <div className={`support-message support-message--${status}`} role="status">
            {message}
          </div>
        )}
      </section>

      <section className="support-card support-card--roadmap">
        <span className="support-card__label">На что тратить</span>
        <div className="support-roadmap">
          <span>⚡ Моментальный урожай</span>
          <span>↻ Новая поставка</span>
          <span>🔒 Новые ускорения позже</span>
          <span>◆ Баланс не пропадает</span>
        </div>
      </section>
    </main>
  );
}
