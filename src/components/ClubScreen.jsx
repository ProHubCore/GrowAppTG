import { useState } from "react";
import "./ClubScreen.css";

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
    image:
      "/assets/plants/psychomor/psychomor-stage-3.png",
    minPrice: 7,
    maxPrice: 14,
  },
};

const BUYERS = [
  {
    name: "Лунный курьер",
    phrase:
      "Заберу быстро. Пока патруль не начал задавать вопросы.",
  },
  {
    name: "Диджей Квазар",
    phrase:
      "Мне нужно что-то необычное для сегодняшней вечеринки.",
  },
  {
    name: "Бармен Глюк",
    phrase:
      "Пойдёт в новый напиток. Состав никому не рассказывай.",
  },
  {
    name: "Тётушка Мокка",
    phrase:
      "Мои постоянники любят свежий товар.",
  },
  {
    name: "Космический турист",
    phrase:
      "У себя дома я такого точно не найду.",
  },
];

const RARE_BUYERS = [
  {
    name: "Коллекционер Нокс",
    phrase:
      "Ищу только лучшие экземпляры. За качество доплачу.",
  },
  {
    name: "Доктор Мираж",
    phrase:
      "Редкий материал. Мне нужен для закрытого исследования.",
  },
];

function randomNumber(min, max) {
  return (
    Math.floor(Math.random() * (max - min + 1)) + min
  );
}

function randomItem(items) {
  return items[randomNumber(0, items.length - 1)];
}

function createOffer(product, availableAmount) {
  const isRareBuyer = Math.random() < 0.2;

  const buyer = isRareBuyer
    ? randomItem(RARE_BUYERS)
    : randomItem(BUYERS);

  const basePrice = randomNumber(
    product.minPrice,
    product.maxPrice
  );

  const pricePerItem = isRareBuyer
    ? Math.ceil(basePrice * 1.5)
    : basePrice;

  const maximumAmount = Math.min(
    3,
    Math.max(0, availableAmount)
  );

  const amount =
    maximumAmount > 0
      ? randomNumber(1, maximumAmount)
      : 0;

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

function ProductIcon({ product, large = false }) {
  if (product.image) {
    return (
      <img
        className={`club-product-image${
          large ? " large" : ""
        }`}
        src={product.image}
        alt={product.name}
        draggable="false"
      />
    );
  }

  return (
    <div
      className={`club-product-icon${
        large ? " large" : ""
      }`}
    >
      {product.icon}
    </div>
  );
}

function ClubScreen({
  inventory,
  setInventory,
  coins,
  setCoins,
  onGoBack,
}) {
  const [screen, setScreen] = useState("dialog");

  const [selectedProductId, setSelectedProductId] =
    useState(null);

  const [currentOffer, setCurrentOffer] =
    useState(null);

  const [resultMessage, setResultMessage] =
    useState("");

  const availableProducts = Object.values(
    PRODUCTS
  ).filter(
    (product) => (inventory?.[product.id] || 0) > 0
  );

  const selectedProduct = selectedProductId
    ? PRODUCTS[selectedProductId]
    : null;

  const resetDeal = () => {
    setSelectedProductId(null);
    setCurrentOffer(null);
    setResultMessage("");
  };

  const openHarvest = () => {
    resetDeal();
    setScreen("inventory");
  };

  const returnToDialog = () => {
    resetDeal();
    setScreen("dialog");
  };

  const selectProduct = (productId) => {
    const product = PRODUCTS[productId];
    const availableAmount = inventory?.[productId] || 0;

    if (!product || availableAmount <= 0) {
      return;
    }

    setSelectedProductId(productId);
    setResultMessage("");
    setCurrentOffer(
      createOffer(product, availableAmount)
    );
    setScreen("offer");
  };

  const refreshOffer = () => {
    if (!selectedProductId) {
      return;
    }

    const product = PRODUCTS[selectedProductId];
    const availableAmount =
      inventory?.[selectedProductId] || 0;

    if (!product || availableAmount <= 0) {
      resetDeal();
      setScreen("inventory");
      return;
    }

    setResultMessage("");
    setCurrentOffer(
      createOffer(product, availableAmount)
    );
  };

  const sellHarvest = () => {
    if (!selectedProductId || !currentOffer) {
      return;
    }

    const availableAmount =
      inventory?.[selectedProductId] || 0;

    if (
      currentOffer.amount <= 0 ||
      availableAmount <= 0
    ) {
      setResultMessage("У тебя нет этого урожая.");
      return;
    }

    if (availableAmount < currentOffer.amount) {
      setResultMessage(
        "Урожая уже не хватает для этой сделки."
      );
      return;
    }

    setInventory((previousInventory) => ({
      ...previousInventory,
      [selectedProductId]: Math.max(
        0,
        (previousInventory[selectedProductId] || 0) -
          currentOffer.amount
      ),
    }));

    setCoins(
      (previousCoins) =>
        previousCoins + currentOffer.totalPrice
    );

    setResultMessage(
      `Продано: ${currentOffer.amount} шт. Получено ${currentOffer.totalPrice} монет.`
    );

    setCurrentOffer(null);
    setScreen("success");
  };

  const openInventoryAfterSale = () => {
    resetDeal();
    setScreen("inventory");
  };

  return (
    <div className="club-screen">
      <img
        className="club-npc club-npc-smoker"
        src="/assets/club-characters/club-alien-smoker-01.png"
        alt="Типусиан"
        draggable="false"
      />

      <button
        type="button"
        className="club-back-hitbox"
        onClick={onGoBack}
        aria-label="Назад в район"
      />

      <div className="club-wallet">
        🪙 {coins}
      </div>

      {screen === "dialog" && (
        <div className="club-dialog">
          <div className="club-speaker">
            Типусиан
          </div>

          <div className="club-text">
            Йо, земной фермер. Вайб ровный,
            музыка мягкая, народ ждёт свежачок.
            Принёс что-то интересное?
          </div>

          <div className="club-answers">
            <button
              type="button"
              className="club-answer-button"
              onClick={openHarvest}
            >
              Есть свежий урожай
            </button>

            <button
              type="button"
              className="club-answer-button secondary"
              onClick={onGoBack}
            >
              Я просто осмотреться
            </button>
          </div>
        </div>
      )}

      {screen === "inventory" && (
        <div className="club-panel">
          <div className="club-panel-header">
            <div>
              <div className="club-panel-kicker">
                Клубный сбыт
              </div>

              <div className="club-panel-title">
                Что продаём?
              </div>
            </div>

            <button
              type="button"
              className="club-panel-close"
              onClick={returnToDialog}
              aria-label="Закрыть"
            >
              ×
            </button>
          </div>

          <div className="club-panel-description">
            Выбери урожай. Типусиан найдёт
            случайного покупателя и предложит цену.
          </div>

          <div className="club-products-list">
            {availableProducts.length > 0 ? (
              availableProducts.map((product) => {
                const amount =
                  inventory?.[product.id] || 0;

                return (
                  <button
                    type="button"
                    key={product.id}
                    className={`club-product-card ${
                      product.id === "psychomor"
                        ? "psychomor"
                        : ""
                    }`}
                    onClick={() =>
                      selectProduct(product.id)
                    }
                  >
                    <ProductIcon product={product} />

                    <div className="club-product-info">
                      <div className="club-product-name">
                        {product.name}
                      </div>

                      <div className="club-product-description">
                        {product.description}
                      </div>

                      <div className="club-product-amount">
                        В наличии: {amount}
                      </div>
                    </div>

                    <div className="club-product-arrow">
                      ›
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="club-empty-state">
                <div className="club-empty-title">
                  Продавать пока нечего
                </div>

                <div className="club-empty-text">
                  Вырасти урожай на плантации и
                  возвращайся к Типусиану.
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            className="club-secondary-action"
            onClick={returnToDialog}
          >
            Назад к Типусиану
          </button>
        </div>
      )}

      {screen === "offer" &&
        selectedProduct &&
        currentOffer && (
          <div className="club-panel club-offer-panel">
            <div className="club-panel-header">
              <div>
                <div className="club-panel-kicker">
                  Новое предложение
                </div>

                <div className="club-panel-title">
                  Покупатель найден
                </div>
              </div>

              <button
                type="button"
                className="club-panel-close"
                onClick={() => setScreen("inventory")}
                aria-label="Назад"
              >
                ×
              </button>
            </div>

            {currentOffer.isRareBuyer && (
              <div className="club-rare-badge">
                ✦ Редкий покупатель
              </div>
            )}

            <div className="club-offer-product">
              <ProductIcon
                product={selectedProduct}
                large
              />

              <div>
                <div className="club-product-name">
                  {selectedProduct.name}
                </div>

                <div className="club-product-amount">
                  В наличии:{" "}
                  {inventory?.[selectedProductId] || 0}
                </div>
              </div>
            </div>

            <div className="club-buyer-card">
              <div className="club-buyer-label">
                Покупатель
              </div>

              <div className="club-buyer-name">
                {currentOffer.buyerName}
              </div>

              <div className="club-buyer-phrase">
                «{currentOffer.buyerPhrase}»
              </div>
            </div>

            <div className="club-offer-stats">
              <div className="club-offer-row">
                <span>Забирает</span>
                <strong>
                  {currentOffer.amount} шт.
                </strong>
              </div>

              <div className="club-offer-row">
                <span>Цена за штуку</span>
                <strong>
                  🪙 {currentOffer.pricePerItem}
                </strong>
              </div>

              <div className="club-offer-row total">
                <span>Ты получишь</span>
                <strong>
                  🪙 {currentOffer.totalPrice}
                </strong>
              </div>
            </div>

            {resultMessage && (
              <div className="club-result-message">
                {resultMessage}
              </div>
            )}

            <div className="club-offer-actions">
              <button
                type="button"
                className="club-primary-action"
                onClick={sellHarvest}
              >
                Продать
              </button>

              <button
                type="button"
                className="club-secondary-action"
                onClick={refreshOffer}
              >
                Другой покупатель
              </button>

              <button
                type="button"
                className="club-secondary-action"
                onClick={() => setScreen("inventory")}
              >
                Отмена
              </button>
            </div>
          </div>
        )}

      {screen === "success" &&
        selectedProduct && (
          <div className="club-panel club-success-panel">
            <div className="club-success-icon">
              ✓
            </div>

            <div className="club-panel-title">
              Сделка состоялась
            </div>

            <div className="club-success-message">
              {resultMessage}
            </div>

            <div className="club-success-product">
              <ProductIcon
                product={selectedProduct}
                large
              />

              <div className="club-product-name">
                {selectedProduct.name}
              </div>
            </div>

            <div className="club-offer-actions">
              <button
                type="button"
                className="club-primary-action"
                onClick={openInventoryAfterSale}
              >
                Продать ещё
              </button>

              <button
                type="button"
                className="club-secondary-action"
                onClick={returnToDialog}
              >
                Вернуться к Типусиану
              </button>
            </div>
          </div>
        )}
    </div>
  );
}

export default ClubScreen;