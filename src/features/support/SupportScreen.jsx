import { useState } from "react";

import {
  getTelegramUserId,
  triggerTelegramHaptic,
  triggerTelegramNotification,
} from "../../core/telegram";
import {
  createStarsInvoice,
  isStarsPaymentConfigured,
  openStarsInvoice,
} from "./starsPayments";
import CurrencyCoinPile from "./CurrencyCoinPile";
import {
  G_COIN_PACKAGES,
  formatStoreNumber,
} from "./storePackages";

import "./SupportScreen.css";

const PROMO_KEY = "3141592";
const PROMO_REWARD = 100;

function normalizePromoKey(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function createPromoStorageKey() {
  let playerId = "browser-player";

  try {
    playerId = String(getTelegramUserId() || playerId);
  } catch {
    // В обычном браузере используем локальный профиль.
  }

  return `growapp-support-promo-${PROMO_KEY}-${playerId}`;
}

function readPromoRedeemed(storageKey) {
  try {
    return window.localStorage.getItem(storageKey) === "1";
  } catch {
    return false;
  }
}

function CoinBurst({ premium = false }) {
  return (
    <span className={`currency-burst ${premium ? "currency-burst--premium" : ""}`} aria-hidden="true">
      {Array.from({ length: 12 }, (_, index) => (
        <i key={index} style={{ "--burst-index": index }} />
      ))}
    </span>
  );
}

export default function SupportScreen({
  premiumCoins = 0,
  onPremiumCoinsAdded,
  onClose,
  onOpenCoinStore,
}) {
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [successPackage, setSuccessPackage] = useState(null);
  const [promoStorageKey] = useState(createPromoStorageKey);
  const [promoCode, setPromoCode] = useState("");
  const [promoRedeemed, setPromoRedeemed] = useState(() =>
    readPromoRedeemed(promoStorageKey),
  );
  const [promoStatus, setPromoStatus] = useState(() =>
    readPromoRedeemed(promoStorageKey) ? "redeemed" : "idle",
  );
  const [promoMessage, setPromoMessage] = useState(() =>
    readPromoRedeemed(promoStorageKey)
      ? "Ключ уже применён. Награда была начислена на этот аккаунт."
      : "",
  );

  const configured = isStarsPaymentConfigured();
  const safeBalance = Math.max(0, Math.floor(Number(premiumCoins) || 0));

  const closePurchaseModal = () => {
    if (status === "loading") return;
    setSelectedPackage(null);
    setStatus("idle");
    setMessage("");
  };

  const saveSuccessfulPurchase = (pack) => {
    onPremiumCoinsAdded?.(pack.coins);
  };

  const handlePromoSubmit = (event) => {
    event.preventDefault();

    if (promoRedeemed) {
      triggerTelegramHaptic("light");
      setPromoStatus("redeemed");
      setPromoMessage(
        "Ключ уже применён. Награда была начислена на этот аккаунт.",
      );
      return;
    }

    const normalizedCode = normalizePromoKey(promoCode);

    if (!normalizedCode) {
      triggerTelegramNotification("error");
      setPromoStatus("error");
      setPromoMessage("Сначала введи ключ.");
      return;
    }

    if (normalizedCode !== PROMO_KEY) {
      triggerTelegramNotification("error");
      setPromoStatus("error");
      setPromoMessage("Такой ключ не найден. Проверь цифры и попробуй снова.");
      return;
    }

    try {
      window.localStorage.setItem(promoStorageKey, "1");
    } catch {
      // Награда всё равно начислится в текущей сессии.
    }

    onPremiumCoinsAdded?.(PROMO_REWARD);
    setPromoRedeemed(true);
    setPromoStatus("success");
    setPromoMessage(`Ключ принят. На баланс начислено +${PROMO_REWARD} G-монет.`);
    setPromoCode("");
    triggerTelegramNotification("success");
  };

  const handlePurchase = async () => {
    if (!selectedPackage || status === "loading") return;

    setStatus("loading");
    setMessage("");

    if (!configured) {
      setStatus("error");
      setMessage("Сервер Telegram Stars пока не подключён.");
      return;
    }

    try {
      const invoiceUrl = await createStarsInvoice({
        stars: selectedPackage.stars,
        premiumCoins: selectedPackage.coins,
        packageId: selectedPackage.id,
      });
      const paymentStatus = await openStarsInvoice(invoiceUrl);

      if (paymentStatus === "paid") {
        saveSuccessfulPurchase(selectedPackage);
        setSuccessPackage(selectedPackage);
        setSelectedPackage(null);
        setStatus("success");
        setMessage("");
        return;
      }

      if (paymentStatus === "cancelled") {
        setStatus("idle");
        setMessage("Покупка отменена. Stars не списывались.");
        return;
      }

      if (paymentStatus === "failed") {
        setStatus("error");
        setMessage("Telegram не смог провести покупку.");
        return;
      }

      setStatus("idle");
      setMessage("Окно оплаты закрыто без списания Stars.");
    } catch (error) {
      console.error("Не удалось открыть Stars invoice:", error);
      setStatus("error");
      setMessage("Не удалось открыть оплату. Проверь подключение сервера.");
    }
  };

  return (
    <main className="currency-store currency-store--premium currency-store--clean">
      <div className="currency-store__glow currency-store__glow--one" aria-hidden="true" />
      <div className="currency-store__glow currency-store__glow--two" aria-hidden="true" />

      <div className="currency-store__scroll">
        <nav className="currency-store__switch" aria-label="Выбор валютного магазина">
          <button type="button" className="active" aria-current="page">
            <span className="currency-mini-coin currency-mini-coin--g" aria-hidden="true" />
            G-монеты
          </button>
          <button type="button" onClick={onOpenCoinStore}>
            <span className="currency-mini-coin currency-mini-coin--gold" aria-hidden="true" />
            Обычные
          </button>
        </nav>

        <section className="currency-balance-overview currency-balance-overview--premium currency-balance-overview--compact">
          <div className="currency-balance-overview__coin currency-balance-overview__coin--premium" aria-hidden="true">
            <span />
          </div>
          <div className="currency-balance-overview__copy">
            <small>ТВОЙ БАЛАНС</small>
            <strong>{formatStoreNumber(safeBalance)} <em>G</em></strong>
          </div>
        </section>

        <h2 className="currency-store__package-heading">Выберите пакет</h2>

        <section className="currency-package-grid currency-package-grid--clean" aria-label="Пакеты G-монет">
          {G_COIN_PACKAGES.map((pack, index) => (
            <button
              key={pack.id}
              type="button"
              className={`currency-package currency-package--clean currency-package--${pack.theme}`}
              style={{ "--pack-index": index }}
              onClick={() => {
                setSelectedPackage(pack);
                setStatus("idle");
                setMessage("");
              }}
            >
              <span className="currency-package__badge currency-package__badge--centered">{pack.badge}</span>
              <CurrencyCoinPile type="premium" count={pack.visualCoins} />
              <span className="currency-package__ribbon">{pack.benefit}</span>
              <span className="currency-package__amount">{formatStoreNumber(pack.coins)}</span>
              <span className="currency-package__currency">G-МОНЕТ</span>
              <span className="currency-package__title">{pack.title}</span>
              <span className="currency-package__subtitle">{pack.subtitle}</span>
              <span className="currency-package__price">
                <b>{pack.stars}</b>
                <span aria-hidden="true">★</span>
              </span>
            </button>
          ))}
        </section>

        <section
          className={`currency-promo-key currency-promo-key--${promoStatus}`}
          aria-labelledby="currency-promo-title"
        >
          <div className="currency-promo-key__shine" aria-hidden="true" />

          <div className="currency-promo-key__heading">
            <div className="currency-promo-key__emblem" aria-hidden="true">
              <span className="currency-mini-coin currency-mini-coin--g" />
              <i>+</i>
            </div>
            <div>
              <small>БОНУСНЫЙ ДОСТУП</small>
              <h2 id="currency-promo-title">Ввести ключ</h2>
              <p>Активируй ключ района и получи награду на баланс.</p>
            </div>
          </div>

          <form className="currency-promo-key__form" onSubmit={handlePromoSubmit}>
            <label className="currency-promo-key__field">
              <span>Ключ</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                enterKeyHint="done"
                maxLength={16}
                value={promoCode}
                disabled={promoRedeemed}
                placeholder={promoRedeemed ? "Ключ применён" : "Введите цифры"}
                onChange={(event) => {
                  setPromoCode(event.target.value.slice(0, 16));
                  if (promoStatus === "error") {
                    setPromoStatus("idle");
                    setPromoMessage("");
                  }
                }}
              />
            </label>

            <button
              type="submit"
              className="currency-promo-key__apply"
              disabled={promoRedeemed}
            >
              {promoRedeemed ? (
                <>
                  <span aria-hidden="true">✓</span>
                  Применено
                </>
              ) : (
                <>
                  Применить
                  <span className="currency-mini-coin currency-mini-coin--g" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          {promoMessage && (
            <div
              className={`currency-promo-key__message currency-promo-key__message--${promoStatus}`}
              role="status"
            >
              <span aria-hidden="true">{promoStatus === "error" ? "!" : "✓"}</span>
              <p>{promoMessage}</p>
            </div>
          )}
        </section>
      </div>

      <footer className="currency-store__footer">
        <button type="button" className="currency-store__close" onClick={onClose}>
          Закрыть
        </button>
      </footer>

      {selectedPackage && (
        <div className="currency-dialog-layer" role="presentation" onClick={closePurchaseModal}>
          <section
            className="currency-dialog currency-dialog--premium"
            role="dialog"
            aria-modal="true"
            aria-labelledby="gcoin-purchase-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="currency-dialog__x"
              onClick={closePurchaseModal}
              disabled={status === "loading"}
              aria-label="Закрыть окно покупки"
            >
              ×
            </button>

            <div className="currency-dialog__hero" aria-hidden="true">
              <span className="currency-dialog__coin currency-dialog__coin--premium" />
              <span className="currency-dialog__orbit" />
            </div>

            <small className="currency-dialog__eyebrow">{selectedPackage.badge}</small>
            <h2 id="gcoin-purchase-title">{selectedPackage.title}</h2>
            <p>На баланс будет начислено <b>{formatStoreNumber(selectedPackage.coins)} G-монет</b>.</p>

            <div className="currency-dialog__receipt">
              <span>Пакет</span>
              <strong>{formatStoreNumber(selectedPackage.coins)} G</strong>
              <span>К оплате</span>
              <strong>{selectedPackage.stars} ★</strong>
            </div>

            {message && (
              <div className={`currency-dialog__message currency-dialog__message--${status}`} role="status">
                {message}
              </div>
            )}

            <div className="currency-dialog__actions">
              <button type="button" className="currency-dialog__cancel" onClick={closePurchaseModal} disabled={status === "loading"}>
                Отмена
              </button>
              <button type="button" className="currency-dialog__confirm" onClick={handlePurchase} disabled={status === "loading" || !configured}>
                {status === "loading" ? "Открываем Telegram…" : `Купить за ${selectedPackage.stars} ★`}
              </button>
            </div>
          </section>
        </div>
      )}

      {successPackage && (
        <div className="currency-success-layer" role="status">
          <section className="currency-success-card currency-success-card--premium">
            <CoinBurst premium />
            <div className="currency-success-card__coin currency-success-card__coin--premium" aria-hidden="true" />
            <small>ПОКУПКА УСПЕШНА</small>
            <h2>+{formatStoreNumber(successPackage.coins)} G</h2>
            <p>G-монеты уже добавлены на баланс.</p>
            <button type="button" onClick={() => setSuccessPackage(null)}>Отлично</button>
          </section>
        </div>
      )}
    </main>
  );
}
