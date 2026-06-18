import { useState } from "react";

import { triggerTelegramHaptic, triggerTelegramNotification } from "../../core/telegram";
import CurrencyCoinPile from "./CurrencyCoinPile";
import {
  COIN_EXCHANGE_PACKAGES,
  formatStoreNumber,
} from "./storePackages";

import "./SupportScreen.css";

function CoinBurst() {
  return (
    <span className="currency-burst currency-burst--gold" aria-hidden="true">
      {Array.from({ length: 12 }, (_, index) => (
        <i key={index} style={{ "--burst-index": index }} />
      ))}
    </span>
  );
}

export default function CoinBankScreen({
  coins = 0,
  premiumCoins = 0,
  onExchange,
  onClose,
  onOpenPremiumStore,
}) {
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [successPackage, setSuccessPackage] = useState(null);

  const safeCoins = Math.max(0, Math.floor(Number(coins) || 0));
  const safePremiumCoins = Math.max(0, Math.floor(Number(premiumCoins) || 0));
  const canAffordSelected = selectedPackage
    ? safePremiumCoins >= selectedPackage.gCost
    : false;

  const handleExchange = () => {
    if (!selectedPackage || !canAffordSelected) return;

    const success = onExchange?.(selectedPackage) !== false;
    if (!success) return;

    triggerTelegramNotification("success");
    setSuccessPackage(selectedPackage);
    setSelectedPackage(null);
  };

  return (
    <main className="currency-store currency-store--coins currency-store--clean">
      <div className="currency-store__glow currency-store__glow--one" aria-hidden="true" />
      <div className="currency-store__glow currency-store__glow--two" aria-hidden="true" />

      <div className="currency-store__scroll">
        <nav className="currency-store__switch" aria-label="Выбор валютного магазина">
          <button type="button" onClick={onOpenPremiumStore}>
            <span className="currency-mini-coin currency-mini-coin--g" aria-hidden="true" />
            G-монеты
          </button>
          <button type="button" className="active active--gold" aria-current="page">
            <span className="currency-mini-coin currency-mini-coin--gold" aria-hidden="true" />
            Обычные
          </button>
        </nav>

        <section className="currency-balance-overview currency-balance-overview--gold currency-balance-overview--wallets">
          <div className="currency-balance-wallet">
            <div className="currency-balance-overview__mini-coin currency-balance-overview__mini-coin--gold" aria-hidden="true" />
            <div className="currency-balance-wallet__copy">
              <small>ТВОЙ БАЛАНС</small>
              <strong>{formatStoreNumber(safeCoins)} <em>монет</em></strong>
            </div>
          </div>
          <div className="currency-balance-wallet currency-balance-wallet--premium">
            <div className="currency-balance-overview__mini-coin currency-balance-overview__mini-coin--premium" aria-hidden="true" />
            <div className="currency-balance-wallet__copy">
              <small>ДОСТУПНО</small>
              <strong>{formatStoreNumber(safePremiumCoins)} <em>G</em></strong>
            </div>
          </div>
        </section>

        <h2 className="currency-store__package-heading currency-store__package-heading--gold">Выберите пакет</h2>

        <section className="currency-package-grid currency-package-grid--clean" aria-label="Пакеты обычных монет">
          {COIN_EXCHANGE_PACKAGES.map((pack, index) => (
            <button
              key={pack.id}
              type="button"
              className={`currency-package currency-package--clean currency-package--coin currency-package--${pack.theme}`}
              style={{ "--pack-index": index }}
              onClick={() => {
                triggerTelegramHaptic("light");
                setSelectedPackage(pack);
              }}
            >
              <span className="currency-package__badge currency-package__badge--centered">{pack.badge}</span>
              <CurrencyCoinPile type="gold" count={pack.visualCoins} />
              <span className="currency-package__ribbon currency-package__ribbon--gold">{pack.benefit}</span>
              <span className="currency-package__amount">{formatStoreNumber(pack.coins)}</span>
              <span className="currency-package__currency">МОНЕТ</span>
              <span className="currency-package__title">{pack.title}</span>
              <span className="currency-package__subtitle">{pack.subtitle}</span>
              <span className="currency-package__price currency-package__price--g">
                <span className="currency-mini-coin currency-mini-coin--g" aria-hidden="true" />
                <b>{pack.gCost}</b>
              </span>
            </button>
          ))}
        </section>
      </div>

      <footer className="currency-store__footer">
        <button type="button" className="currency-store__close currency-store__close--gold" onClick={onClose}>
          Закрыть
        </button>
      </footer>

      {selectedPackage && (
        <div className="currency-dialog-layer" role="presentation" onClick={() => setSelectedPackage(null)}>
          <section
            className="currency-dialog currency-dialog--gold"
            role="dialog"
            aria-modal="true"
            aria-labelledby="coin-exchange-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="currency-dialog__x" onClick={() => setSelectedPackage(null)} aria-label="Закрыть окно обмена">
              ×
            </button>

            <div className="currency-dialog__hero" aria-hidden="true">
              <span className="currency-dialog__coin currency-dialog__coin--gold" />
              <span className="currency-dialog__orbit currency-dialog__orbit--gold" />
            </div>

            <small className="currency-dialog__eyebrow currency-dialog__eyebrow--gold">{selectedPackage.badge}</small>
            <h2 id="coin-exchange-title">{selectedPackage.title}</h2>
            <p>Получить <b>{formatStoreNumber(selectedPackage.coins)} обычных монет</b> прямо сейчас?</p>

            <div className="currency-dialog__receipt">
              <span>Получишь</span>
              <strong>{formatStoreNumber(selectedPackage.coins)} монет</strong>
              <span>Стоимость</span>
              <strong>{selectedPackage.gCost} G</strong>
            </div>

            {!canAffordSelected && (
              <div className="currency-dialog__message currency-dialog__message--error" role="status">
                Не хватает {formatStoreNumber(selectedPackage.gCost - safePremiumCoins)} G-монет.
              </div>
            )}

            <div className="currency-dialog__actions">
              <button type="button" className="currency-dialog__cancel" onClick={() => setSelectedPackage(null)}>
                Отмена
              </button>
              {canAffordSelected ? (
                <button type="button" className="currency-dialog__confirm currency-dialog__confirm--gold" onClick={handleExchange}>
                  Купить за {selectedPackage.gCost} G
                </button>
              ) : (
                <button
                  type="button"
                  className="currency-dialog__confirm currency-dialog__confirm--purchase"
                  onClick={() => {
                    setSelectedPackage(null);
                    onOpenPremiumStore?.();
                  }}
                >
                  <span>Приобрести</span>
                  <span className="currency-mini-coin currency-mini-coin--g" aria-hidden="true" />
                </button>
              )}
            </div>
          </section>
        </div>
      )}

      {successPackage && (
        <div className="currency-success-layer" role="status">
          <section className="currency-success-card currency-success-card--gold">
            <CoinBurst />
            <div className="currency-success-card__coin currency-success-card__coin--gold" aria-hidden="true" />
            <small>ПОКУПКА ЗАВЕРШЕНА</small>
            <h2>+{formatStoreNumber(successPackage.coins)}</h2>
            <p>Монеты уже добавлены в кошелёк.</p>
            <button type="button" className="currency-success-card__button--gold" onClick={() => setSuccessPackage(null)}>
              Забрать
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
