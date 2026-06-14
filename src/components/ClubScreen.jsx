import { useMemo, useState } from "react";
import "./ClubScreen.css";

const REPUTATION_STORAGE_KEY = "growapp-club-reputation";

const PRODUCTS = {
  greenTomato: {
    id: "greenTomato",
    name: "Зелёный томат",
    description:
      "Свежий местный урожай. Берут для коктейлей и странных салатов.",
    icon: "🍅",
    minPrice: 2,
    maxPrice: 5,
  },
  psychomor: {
    id: "psychomor",
    name: "Психомор",
    description:
      "Редкий светящийся плод. В клубе за такое готовы платить.",
    image: "/assets/plants/psychomor/psychomor-stage-3.png",
    minPrice: 7,
    maxPrice: 14,
  },
};

const BUYERS = [
  {
    name: "Лунный курьер",
    phrase: "Заберу быстро. Пока патруль не начал задавать вопросы.",
  },
  {
    name: "Диджей Квазар",
    phrase: "Мне нужно что-то необычное для сегодняшней вечеринки.",
  },
  {
    name: "Бармен Глюк",
    phrase: "Пойдёт в новый напиток. Состав никому не рассказывай.",
  },
  {
    name: "Тётушка Мокка",
    phrase: "Мои постоянники любят свежий товар.",
  },
  {
    name: "Космический турист",
    phrase: "У себя дома я такого точно не найду.",
  },
];

const RARE_BUYERS = [
  {
    name: "Коллекционер Нокс",
    phrase: "Ищу только лучшие экземпляры. За качество доплачу.",
  },
  {
    name: "Доктор Мираж",
    phrase: "Редкий материал. Мне нужен для закрытого исследования.",
  },
];

const CLUB_LEVELS = [
  {
    level: 1,
    title: "Новый знакомый",
    required: 0,
    reward: "Доступ к клубному сбыту",
    description: "Типусиан только присматривается к тебе.",
    icon: "✦",
  },
  {
    level: 2,
    title: "Свой человек",
    required: 50,
    reward: "Откроется новый сорт",
    description: "В клубе начинают узнавать твой урожай.",
    icon: "🌱",
  },
  {
    level: 3,
    title: "Надёжный поставщик",
    required: 150,
    reward: "Больше редких покупателей",
    description: "Типусиан доверяет тебе сделки посерьёзнее.",
    icon: "💎",
  },
  {
    level: 4,
    title: "Звезда клуба",
    required: 300,
    reward: "Особый клубный предмет",
    description: "Твой товар обсуждают даже за закрытыми дверями.",
    icon: "⚡",
  },
  {
    level: 5,
    title: "Легенда района",
    required: 600,
    reward: "Эксклюзивный сорт",
    description: "Лучшие покупатели приходят уже специально к тебе.",
    icon: "👑",
  },
];

function readStoredReputation() {
  try {
    const savedValue = Number(localStorage.getItem(REPUTATION_STORAGE_KEY));
    return Number.isFinite(savedValue) && savedValue >= 0
      ? Math.floor(savedValue)
      : 0;
  } catch {
    return 0;
  }
}

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(items) {
  return items[randomNumber(0, items.length - 1)];
}

function createOffer(product, availableAmount) {
  const isRareBuyer = Math.random() < 0.2;
  const buyer = isRareBuyer
    ? randomItem(RARE_BUYERS)
    : randomItem(BUYERS);
  const basePrice = randomNumber(product.minPrice, product.maxPrice);
  const pricePerItem = isRareBuyer ? Math.ceil(basePrice * 1.5) : basePrice;
  const maximumAmount = Math.min(3, Math.max(0, availableAmount));
  const amount = maximumAmount > 0 ? randomNumber(1, maximumAmount) : 0;

  return {
    productId: product.id,
    buyerName: buyer.name,
    buyerPhrase: buyer.phrase,
    isRareBuyer,
    pricePerItem,
    amount,
    totalPrice: amount * pricePerItem,
  };
}

function getLevelInfo(reputation) {
  let currentLevel = CLUB_LEVELS[0];

  for (const level of CLUB_LEVELS) {
    if (reputation >= level.required) {
      currentLevel = level;
    }
  }

  const currentIndex = CLUB_LEVELS.findIndex(
    (level) => level.level === currentLevel.level,
  );
  const nextLevel = CLUB_LEVELS[currentIndex + 1] || null;

  if (!nextLevel) {
    return {
      currentLevel,
      nextLevel: null,
      progressPercent: 100,
      currentProgress: reputation - currentLevel.required,
      requiredProgress: 0,
    };
  }

  const levelRange = nextLevel.required - currentLevel.required;
  const currentProgress = reputation - currentLevel.required;

  return {
    currentLevel,
    nextLevel,
    progressPercent: Math.max(
      0,
      Math.min(100, (currentProgress / levelRange) * 100),
    ),
    currentProgress,
    requiredProgress: levelRange,
  };
}

function ProductIcon({ product, large = false }) {
  const className = large ? " large" : "";

  if (product.image) {
    return (
      <img
        className={`club-product-image${className}`}
        src={product.image}
        alt={product.name}
        draggable="false"
      />
    );
  }

  return (
    <div className={`club-product-icon${className}`} aria-hidden="true">
      {product.icon}
    </div>
  );
}

function ReputationOverlay({ reputation, onClose }) {
  const levelInfo = getLevelInfo(reputation);

  return (
    <div className="club-reputation-overlay" role="dialog" aria-modal="true">
      <button
        className="club-reputation-backdrop"
        type="button"
        onClick={onClose}
        aria-label="Закрыть"
      />

      <section className="club-reputation-sheet">
        <div className="club-reputation-glow" />

        <header className="club-reputation-header">
          <div>
            <div className="club-reputation-kicker">КЛУБНАЯ ДОРОЖКА</div>
            <h2>Репутация района</h2>
            <p>
              Продавай урожай, повышай доверие клуба и открывай новые
              возможности.
            </p>
          </div>

          <button
            className="club-reputation-close"
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
          >
            ×
          </button>
        </header>

        <div className="club-reputation-summary">
          <div className="club-reputation-emblem">
            {levelInfo.currentLevel.level}
          </div>
          <div className="club-reputation-summary-info">
            <span>Текущий статус</span>
            <strong>{levelInfo.currentLevel.title}</strong>
            <small>{reputation} репутации</small>
          </div>
        </div>

        <div className="club-level-road">
          {CLUB_LEVELS.map((level, index) => {
            const unlocked = reputation >= level.required;
            const current = level.level === levelInfo.currentLevel.level;

            return (
              <article
                className={`club-level-card${unlocked ? " unlocked" : " locked"}${current ? " current" : ""}`}
                key={level.level}
              >
                {index < CLUB_LEVELS.length - 1 && (
                  <div
                    className={`club-level-connector${
                      reputation >= CLUB_LEVELS[index + 1].required
                        ? " completed"
                        : ""
                    }`}
                  />
                )}

                <div className="club-level-orb">
                  <span>{unlocked ? level.icon : "🔒"}</span>
                  <b>{level.level}</b>
                </div>

                <div className="club-level-content">
                  <div className="club-level-topline">
                    <span>УРОВЕНЬ {level.level}</span>
                    <small>{level.required} REP</small>
                  </div>
                  <h3>{level.title}</h3>
                  <p>{level.description}</p>
                  <div className="club-level-reward">
                    <span>{unlocked ? "Открыто" : "Награда"}</span>
                    <strong>{level.reward}</strong>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function ClubScreen({ inventory, setInventory, coins, setCoins, onSaleCompleted, onGoBack }) {
  const [screen, setScreen] = useState("dialog");
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [currentOffer, setCurrentOffer] = useState(null);
  const [resultMessage, setResultMessage] = useState("");
  const [earnedReputation, setEarnedReputation] = useState(0);
  const [isReputationOpen, setIsReputationOpen] = useState(false);
  const [reputation, setReputation] = useState(readStoredReputation);

  const levelInfo = useMemo(() => getLevelInfo(reputation), [reputation]);
  const greenTomatoAmount = inventory?.greenTomato || 0;
  const psychomorAmount = inventory?.psychomor || 0;

  const saveReputation = (nextValue) => {
    const safeValue = Math.max(0, Math.floor(nextValue));
    setReputation(safeValue);

    try {
      localStorage.setItem(REPUTATION_STORAGE_KEY, String(safeValue));
    } catch {
      // В приватном режиме браузер может запретить localStorage.
    }

    window.dispatchEvent(
      new CustomEvent("growapp-club-reputation-change", {
        detail: { reputation: safeValue },
      }),
    );
  };

  const openHarvest = () => {
    setSelectedProductId(null);
    setCurrentOffer(null);
    setResultMessage("");
    setEarnedReputation(0);
    setScreen("inventory");
  };

  const returnToDialog = () => {
    setSelectedProductId(null);
    setCurrentOffer(null);
    setResultMessage("");
    setEarnedReputation(0);
    setScreen("dialog");
  };

  const selectProduct = (productId) => {
    const product = PRODUCTS[productId];
    if (!product) return;

    const availableAmount = inventory?.[productId] || 0;
    if (availableAmount <= 0) return;

    setSelectedProductId(productId);
    setResultMessage("");
    setEarnedReputation(0);
    setCurrentOffer(createOffer(product, availableAmount));
    setScreen("offer");
  };

  const refreshOffer = () => {
    if (!selectedProductId) return;

    const product = PRODUCTS[selectedProductId];
    const availableAmount = inventory?.[selectedProductId] || 0;
    setResultMessage("");
    setCurrentOffer(createOffer(product, availableAmount));
  };

  const sellHarvest = () => {
    if (!selectedProductId || !currentOffer) return;

    const availableAmount = inventory?.[selectedProductId] || 0;

    if (currentOffer.amount <= 0) {
      setResultMessage("У тебя нет этого урожая.");
      return;
    }

    if (availableAmount < currentOffer.amount) {
      setResultMessage("Урожая уже не хватает для этой сделки.");
      return;
    }

    const reputationPerItem = currentOffer.isRareBuyer ? 3 : 2;
    const reputationReward = currentOffer.amount * reputationPerItem;

    setInventory((previousInventory) => ({
      ...previousInventory,
      [selectedProductId]: Math.max(
        0,
        (previousInventory[selectedProductId] || 0) - currentOffer.amount,
      ),
    }));

    setCoins((previousCoins) => previousCoins + currentOffer.totalPrice);
    onSaleCompleted?.({
      itemId: selectedProductId,
      amount: currentOffer.amount,
      coins: currentOffer.totalPrice,
      reputation: reputationReward,
    });
    saveReputation(reputation + reputationReward);
    setEarnedReputation(reputationReward);
    setResultMessage(
      `Продано: ${currentOffer.amount} шт. Получено ${currentOffer.totalPrice} монет.`,
    );
    setCurrentOffer(null);
    setScreen("success");
  };

  const addTestReputation = () => {
    saveReputation(reputation + 25);
  };

  const selectedProduct = selectedProductId
    ? PRODUCTS[selectedProductId]
    : null;

  return (
    <div className="club-screen">
      <img
        className="club-npc club-npc-smoker"
        src="/assets/club/club-dealer.png"
        alt="Типусиан"
        draggable="false"
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />

      <button
        className="club-back-hitbox"
        type="button"
        onClick={onGoBack}
        aria-label="Назад"
      />

      <div className="club-wallet">🪙 {coins}</div>

      <button
        className="club-reputation-bar"
        type="button"
        onClick={() => setIsReputationOpen(true)}
      >
        <div className="club-reputation-level">
          <span>LVL</span>
          <strong>{levelInfo.currentLevel.level}</strong>
        </div>

        <div className="club-reputation-main">
          <div className="club-reputation-labels">
            <strong>{levelInfo.currentLevel.title}</strong>
            <span>
              {levelInfo.nextLevel
                ? `${levelInfo.currentProgress}/${levelInfo.requiredProgress}`
                : "MAX"}
            </span>
          </div>
          <div className="club-reputation-track">
            <div
              className="club-reputation-fill"
              style={{ width: `${levelInfo.progressPercent}%` }}
            />
          </div>
        </div>

        <span className="club-reputation-arrow">›</span>
      </button>

      <button
        className="club-test-reputation"
        type="button"
        onClick={addTestReputation}
      >
        +25 REP
      </button>

      {screen === "dialog" && (
        <section className="club-dialog">
          <div className="club-speaker">Типусиан</div>
          <div className="club-text">
            Йо, земной фермер. Вайб ровный, музыка мягкая, народ ждёт
            свежачок. Принёс что-то интересное?
          </div>

          <div className="club-answers">
            <button
              className="club-answer-button"
              type="button"
              onClick={openHarvest}
            >
              Есть свежий урожай
            </button>
            <button
              className="club-answer-button secondary"
              type="button"
              onClick={() => setIsReputationOpen(true)}
            >
              Посмотреть репутацию
            </button>
          </div>
        </section>
      )}

      {screen === "inventory" && (
        <section className="club-panel">
          <header className="club-panel-header">
            <div>
              <div className="club-panel-kicker">Клубный сбыт</div>
              <div className="club-panel-title">Что продаём?</div>
            </div>
            <button
              className="club-panel-close"
              type="button"
              onClick={returnToDialog}
              aria-label="Закрыть"
            >
              ×
            </button>
          </header>

          <p className="club-panel-description">
            Выбери урожай. Типусиан найдёт случайного покупателя и предложит
            цену.
          </p>

          <div className="club-products-list">
            <button
              className={`club-product-card${
                greenTomatoAmount > 0 ? "" : " disabled"
              }`}
              type="button"
              disabled={greenTomatoAmount <= 0}
              onClick={() => selectProduct("greenTomato")}
            >
              <ProductIcon product={PRODUCTS.greenTomato} />
              <div className="club-product-info">
                <div className="club-product-name">
                  {PRODUCTS.greenTomato.name}
                </div>
                <div className="club-product-description">
                  {PRODUCTS.greenTomato.description}
                </div>
                <div className="club-product-amount">
                  В наличии: {greenTomatoAmount}
                </div>
              </div>
              <div className="club-product-arrow">›</div>
            </button>

            <button
              className={`club-product-card psychomor${
                psychomorAmount > 0 ? "" : " disabled"
              }`}
              type="button"
              disabled={psychomorAmount <= 0}
              onClick={() => selectProduct("psychomor")}
            >
              <ProductIcon product={PRODUCTS.psychomor} />
              <div className="club-product-info">
                <div className="club-product-name">
                  {PRODUCTS.psychomor.name}
                </div>
                <div className="club-product-description">
                  {PRODUCTS.psychomor.description}
                </div>
                <div className="club-product-amount">
                  В наличии: {psychomorAmount}
                </div>
              </div>
              <div className="club-product-arrow">›</div>
            </button>
          </div>

          <button
            className="club-secondary-action"
            type="button"
            onClick={returnToDialog}
          >
            Назад к Типусиану
          </button>
        </section>
      )}

      {screen === "offer" && selectedProduct && currentOffer && (
        <section className="club-panel club-offer-panel">
          <header className="club-panel-header">
            <div>
              <div className="club-panel-kicker">Новое предложение</div>
              <div className="club-panel-title">Покупатель найден</div>
            </div>
            <button
              className="club-panel-close"
              type="button"
              onClick={() => setScreen("inventory")}
              aria-label="Назад"
            >
              ×
            </button>
          </header>

          {currentOffer.isRareBuyer && (
            <div className="club-rare-badge">✦ Редкий покупатель</div>
          )}

          <div className="club-offer-product">
            <ProductIcon product={selectedProduct} large />
            <div className="club-product-info">
              <div className="club-product-name">{selectedProduct.name}</div>
              <div className="club-product-amount">
                В наличии: {inventory?.[selectedProductId] || 0}
              </div>
            </div>
          </div>

          <div className="club-buyer-card">
            <div className="club-buyer-label">Покупатель</div>
            <div className="club-buyer-name">{currentOffer.buyerName}</div>
            <div className="club-buyer-phrase">
              «{currentOffer.buyerPhrase}»
            </div>
          </div>

          <div className="club-offer-stats">
            <div className="club-offer-row">
              <span>Забирает</span>
              <strong>{currentOffer.amount} шт.</strong>
            </div>
            <div className="club-offer-row">
              <span>Цена за штуку</span>
              <strong>{currentOffer.pricePerItem}</strong>
            </div>
            <div className="club-offer-row">
              <span>Репутация</span>
              <strong>
                +{currentOffer.amount * (currentOffer.isRareBuyer ? 3 : 2)}
              </strong>
            </div>
            <div className="club-offer-row total">
              <span>Ты получишь</span>
              <strong>🪙 {currentOffer.totalPrice}</strong>
            </div>
          </div>

          {resultMessage && (
            <div className="club-result-message">{resultMessage}</div>
          )}

          <div className="club-offer-actions">
            <button
              className="club-primary-action"
              type="button"
              onClick={sellHarvest}
            >
              Продать
            </button>
            <button
              className="club-secondary-action"
              type="button"
              onClick={refreshOffer}
            >
              Другой покупатель
            </button>
            <button
              className="club-secondary-action"
              type="button"
              onClick={() => setScreen("inventory")}
            >
              Отмена
            </button>
          </div>
        </section>
      )}

      {screen === "success" && selectedProduct && (
        <section className="club-panel club-success-panel">
          <div className="club-success-icon">✓</div>
          <div className="club-panel-title">Сделка состоялась</div>
          <div className="club-success-message">{resultMessage}</div>

          <div className="club-reputation-earned">
            <span>Клубная репутация</span>
            <strong>+{earnedReputation} REP</strong>
          </div>

          <div className="club-success-product">
            <ProductIcon product={selectedProduct} large />
            <div className="club-product-name">{selectedProduct.name}</div>
          </div>

          <div className="club-offer-actions">
            <button
              className="club-primary-action"
              type="button"
              onClick={() => {
                setCurrentOffer(null);
                setResultMessage("");
                setEarnedReputation(0);
                setScreen("inventory");
              }}
            >
              Продать ещё
            </button>
            <button
              className="club-secondary-action"
              type="button"
              onClick={returnToDialog}
            >
              Вернуться к Типусиану
            </button>
          </div>
        </section>
      )}

      {isReputationOpen && (
        <ReputationOverlay
          reputation={reputation}
          onClose={() => setIsReputationOpen(false)}
        />
      )}
    </div>
  );
}

export default ClubScreen;
