import { useMemo, useState } from "react";

import {
  createStarsInvoice,
  isStarsDemoMode,
  isStarsPaymentConfigured,
  openStarsInvoice,
} from "./starsPayments";

import "./SupportScreen.css";

const PRESETS = [25, 50, 100, 250];
const MIN_STARS = 1;
const MAX_STARS = 2500;
const SUPPORT_TOTAL_KEY = "growapp-support-stars-total";

function clampAmount(value) {
  const numeric = Math.round(Number(value) || MIN_STARS);
  return Math.min(MAX_STARS, Math.max(MIN_STARS, numeric));
}

function readSupportTotal() {
  try {
    return Math.max(
      0,
      Number(localStorage.getItem(SUPPORT_TOTAL_KEY)) || 0,
    );
  } catch {
    return 0;
  }
}

function getSupportTitle(total) {
  if (total >= 1000) return "Легенда района";
  if (total >= 500) return "Покровитель Джо";
  if (total >= 250) return "Друг проекта";
  if (total >= 100) return "Свой человек";
  if (total > 0) return "Первый сторонник";
  return "Новый житель";
}

export default function SupportScreen({ onGoBack }) {
  const [amount, setAmount] = useState(50);
  const [supportTotal, setSupportTotal] = useState(readSupportTotal);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const demoMode = isStarsDemoMode();
  const configured = isStarsPaymentConfigured();
  const supportTitle = useMemo(
    () => getSupportTitle(supportTotal),
    [supportTotal],
  );

  const saveSuccessfulSupport = (paidAmount) => {
    const nextTotal = supportTotal + paidAmount;
    setSupportTotal(nextTotal);

    try {
      localStorage.setItem(SUPPORT_TOTAL_KEY, String(nextTotal));
    } catch {
      // В приватном режиме локальное сохранение может быть недоступно.
    }
  };

  const handleSupport = async () => {
    const normalizedAmount = clampAmount(amount);
    setAmount(normalizedAmount);
    setStatus("loading");
    setMessage("");

    if (demoMode && !configured) {
      window.setTimeout(() => {
        saveSuccessfulSupport(normalizedAmount);
        setStatus("success");
        setMessage(
          `Тест успешно пройден: ${normalizedAmount} ⭐. Реальные Stars не списывались.`,
        );
      }, 450);
      return;
    }

    if (!configured) {
      setStatus("error");
      setMessage(
        "Интерфейс готов, но сервер создания Telegram-счёта ещё не подключён.",
      );
      return;
    }

    try {
      const invoiceUrl = await createStarsInvoice(normalizedAmount);
      const paymentStatus = await openStarsInvoice(invoiceUrl);

      if (paymentStatus === "paid") {
        saveSuccessfulSupport(normalizedAmount);
        setStatus("success");
        setMessage(
          `Спасибо! Поддержка на ${normalizedAmount} ⭐ принята.`,
        );
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
      setMessage(
        "Не удалось открыть оплату. Проверь подключение серверного invoice endpoint.",
      );
    }
  };

  return (
    <main className="support-screen">
      <header className="support-screen__header">
        <button
          type="button"
          className="support-screen__back"
          onClick={onGoBack}
        >
          ← Назад
        </button>

        <div className="support-screen__eyebrow">GrowApp · Telegram Stars</div>
        <h1>Поддержать разработку</h1>
        <p>
          Помоги району расти. Поддержка не даёт преимущества в игре —
          только статус раннего участника и нашу огромную благодарность.
        </p>
      </header>

      <section className="support-card support-card--identity">
        <div className="support-card__badge">⭐</div>
        <div>
          <span className="support-card__label">Твой статус</span>
          <strong>{supportTitle}</strong>
          <small>Поддержано: {supportTotal} Stars</small>
        </div>
      </section>

      <section className="support-card">
        <div className="support-card__topline">
          <div>
            <span className="support-card__label">Выбери сумму</span>
            <strong>{amount} ⭐</strong>
          </div>
          <span className="support-card__limit">1–2500</span>
        </div>

        <div className="support-presets">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className={amount === preset ? "active" : ""}
              onClick={() => setAmount(preset)}
            >
              {preset} ⭐
            </button>
          ))}
        </div>

        <label className="support-custom">
          <span>Своя сумма</span>
          <input
            type="number"
            min={MIN_STARS}
            max={MAX_STARS}
            value={amount}
            onChange={(event) =>
              setAmount(clampAmount(event.target.value))
            }
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
          disabled={status === "loading"}
          onClick={handleSupport}
        >
          {status === "loading"
            ? "Открываем Telegram…"
            : demoMode && !configured
              ? `DEV · проверить ${amount} ⭐`
              : `Поддержать на ${amount} ⭐`}
        </button>

        {message && (
          <div
            className={`support-message support-message--${status}`}
            role="status"
          >
            {message}
          </div>
        )}

        {demoMode && !configured && (
          <p className="support-card__note">
            Сейчас включён безопасный тест: кнопка показывает весь сценарий,
            но реальные Stars не списывает.
          </p>
        )}
      </section>

      <section className="support-card support-card--roadmap">
        <span className="support-card__label">На что идёт поддержка</span>
        <div className="support-roadmap">
          <span>🎨 Новый арт</span>
          <span>🔊 Звуки и музыка</span>
          <span>🌱 Новые растения</span>
          <span>☁️ Серверные сохранения</span>
        </div>
      </section>
    </main>
  );
}
