import {
  useEffect,
  useState,
} from "react";

import "./ShopModal.css";

function ShopModal({
  isOpen,
  item,
  coins,
  stock,
  playerSeedCount,
  onBuy,
}) {
  const [
    isPurchaseOpen,
    setIsPurchaseOpen,
  ] = useState(false);

  const [
    selectedAmount,
    setSelectedAmount,
  ] = useState(1);

  const [message, setMessage] =
    useState("");

  const [
    purchaseSuccess,
    setPurchaseSuccess,
  ] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsPurchaseOpen(false);
      setSelectedAmount(1);
      setMessage("");
      setPurchaseSuccess(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (stock <= 0) {
      setSelectedAmount(0);
      return;
    }

    setSelectedAmount((currentAmount) =>
      Math.min(
        Math.max(currentAmount, 1),
        stock
      )
    );
  }, [stock]);

  if (!isOpen || !item) {
    return null;
  }

  const pricePerSeed =
    item.pricePerSeed || 0;

  const totalPrice =
    selectedAmount * pricePerSeed;

  const isSoldOut = stock <= 0;

  const maximumAffordable =
    pricePerSeed > 0
      ? Math.floor(
          coins / pricePerSeed
        )
      : stock;

  const maximumSelectable = Math.min(
    stock,
    Math.max(0, maximumAffordable)
  );

  const openPurchaseWindow = () => {
    setMessage("");
    setPurchaseSuccess(false);

    if (stock > 0) {
      const startAmount =
        maximumSelectable > 0
          ? 1
          : 0;

      setSelectedAmount(startAmount);
    }

    setIsPurchaseOpen(true);
  };

  const closePurchaseWindow = () => {
    setMessage("");
    setPurchaseSuccess(false);

    setSelectedAmount(
      stock > 0 ? 1 : 0
    );

    setIsPurchaseOpen(false);
  };

  const decreaseAmount = () => {
    setSelectedAmount(
      (currentAmount) =>
        Math.max(1, currentAmount - 1)
    );

    setMessage("");
  };

  const increaseAmount = () => {
    setSelectedAmount(
      (currentAmount) =>
        Math.min(
          maximumSelectable,
          currentAmount + 1
        )
    );

    setMessage("");
  };

  const handleSliderChange = (
    event
  ) => {
    setSelectedAmount(
      Number(event.target.value)
    );

    setMessage("");
  };

  const handleBuy = () => {
    if (selectedAmount <= 0) {
      setMessage(
        "Выбери количество семян."
      );

      return;
    }

    const result = onBuy(
      item,
      selectedAmount
    );

    if (!result?.success) {
      setPurchaseSuccess(false);

      setMessage(
        result?.message ||
          "Не удалось совершить покупку."
      );

      return;
    }

    setPurchaseSuccess(true);

    setMessage(
      result.message ||
        `Вы купили ${selectedAmount} семян Психомора.`
    );
  };

  return (
    <>
      {/* Товар на полке */}
      <button
        type="button"
        className={
          isSoldOut
            ? "shop-shelf-product sold-out"
            : "shop-shelf-product"
        }
        onClick={openPurchaseWindow}
        aria-label="Открыть товар Психомор"
      >
        <img
          className="shop-shelf-product-image"
          src={item.image}
          alt={item.name}
          draggable="false"
        />

        <div className="shop-shelf-product-price">
          {isSoldOut ? (
            <span>Распродано</span>
          ) : (
            <>
              <span>🪙</span>

              <span>
                {pricePerSeed}
              </span>
            </>
          )}
        </div>

        <div className="shop-shelf-product-stock">
          Осталось: {stock}
        </div>
      </button>

      {/* Окно товара */}
      {isPurchaseOpen && (
        <div className="shop-purchase-window">
          <button
            type="button"
            className="shop-purchase-close"
            onClick={closePurchaseWindow}
            aria-label="Закрыть"
          >
            ×
          </button>

          {!purchaseSuccess && (
            <>
              <div className="shop-purchase-label">
                Редкие семена
              </div>

              <div className="shop-purchase-name">
                {item.name}
              </div>

              <img
                className="shop-purchase-image"
                src={item.image}
                alt={item.name}
                draggable="false"
              />

              <div className="shop-purchase-description">
                {item.description}
              </div>

              <div className="shop-stock-information">
                <div>
                  У Зорика
                  <strong>
                    {stock} шт.
                  </strong>
                </div>

                <div>
                  У тебя
                  <strong>
                    {playerSeedCount} шт.
                  </strong>
                </div>
              </div>

              {!isSoldOut && (
                <>
                  <div className="shop-amount-title">
                    Количество
                  </div>

                  <div className="shop-amount-controller">
                    <button
                      type="button"
                      className="shop-amount-button"
                      onClick={decreaseAmount}
                      disabled={
                        selectedAmount <= 1
                      }
                    >
                      −
                    </button>

                    <div className="shop-selected-amount">
                      {selectedAmount}
                    </div>

                    <button
                      type="button"
                      className="shop-amount-button"
                      onClick={increaseAmount}
                      disabled={
                        selectedAmount >=
                        maximumSelectable
                      }
                    >
                      +
                    </button>
                  </div>

                  <input
                    className="shop-amount-slider"
                    type="range"
                    min="1"
                    max={Math.max(
                      1,
                      maximumSelectable
                    )}
                    value={Math.max(
                      1,
                      selectedAmount
                    )}
                    onChange={
                      handleSliderChange
                    }
                    disabled={
                      maximumSelectable <= 0
                    }
                  />

                  <div className="shop-slider-limits">
                    <span>1</span>

                    <span>
                      {Math.max(
                        1,
                        maximumSelectable
                      )}
                    </span>
                  </div>
                </>
              )}

              <div className="shop-purchase-price">
                <span>
                  Цена за семя
                </span>

                <strong>
                  🪙 {pricePerSeed}
                </strong>
              </div>

              <div className="shop-purchase-total">
                <span>
                  Общая стоимость
                </span>

                <strong>
                  🪙 {totalPrice}
                </strong>
              </div>

              <div className="shop-purchase-balance">
                На руках: 🪙 {coins}
              </div>

              {maximumSelectable <= 0 &&
                !isSoldOut && (
                  <div className="shop-purchase-message error">
                    Не хватает монет даже
                    на одно семя.
                  </div>
                )}

              {isSoldOut && (
                <div className="shop-purchase-message error">
                  У Зорика закончились
                  семена Психомора.
                </div>
              )}

              {message && (
                <div className="shop-purchase-message error">
                  {message}
                </div>
              )}

              <div className="shop-purchase-actions">
                <button
                  type="button"
                  className="shop-purchase-buy"
                  onClick={handleBuy}
                  disabled={
                    isSoldOut ||
                    selectedAmount <= 0 ||
                    maximumSelectable <= 0 ||
                    totalPrice > coins
                  }
                >
                  Купить
                </button>

                <button
                  type="button"
                  className="shop-purchase-back"
                  onClick={
                    closePurchaseWindow
                  }
                >
                  Назад
                </button>
              </div>
            </>
          )}

          {purchaseSuccess && (
            <div className="shop-purchase-success">
              <div className="shop-success-icon">
                ✓
              </div>

              <div className="shop-success-title">
                Покупка завершена
              </div>

              <img
                className="shop-success-image"
                src={item.image}
                alt={item.name}
                draggable="false"
              />

              <div className="shop-success-message">
                {message}
              </div>

              <div className="shop-success-hint">
                Семена добавлены в твою
                корзинку на плантации.
              </div>

              <button
                type="button"
                className="shop-success-button"
                onClick={
                  closePurchaseWindow
                }
              >
                Отлично
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default ShopModal;