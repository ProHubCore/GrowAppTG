import { useState } from "react";
import "./ShopModal.css";

function ShopModal({
  isOpen,
  item,
  coins,
  onBuy,
}) {
  const [isPurchaseOpen, setIsPurchaseOpen] =
    useState(false);

  const [message, setMessage] = useState("");

  if (!isOpen || !item) {
    return null;
  }

  const openPurchaseWindow = () => {
    setMessage("");
    setIsPurchaseOpen(true);
  };

  const closePurchaseWindow = () => {
    setMessage("");
    setIsPurchaseOpen(false);
  };

  const handleBuy = () => {
    const result = onBuy(item);

    if (!result?.success) {
      setMessage(
        result?.message ||
          "Не удалось совершить покупку."
      );

      return;
    }

    setMessage(
      result?.message ||
        "Психомор куплен!"
    );
  };

  return (
    <>
      {/* Пачка семян и цена на полке */}
      <button
        type="button"
        className="shop-shelf-product"
        onClick={openPurchaseWindow}
        aria-label={`Купить ${item.name}`}
      >
        <img
          className="shop-shelf-product-image"
          src={item.image}
          alt={item.name}
          draggable="false"
        />

        <div className="shop-shelf-product-price">
          <span>🪙</span>
          <span>{item.price}</span>
        </div>
      </button>

      {/* Окно подтверждения покупки */}
      {isPurchaseOpen && (
        <div className="shop-purchase-window">
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

          <div className="shop-purchase-price">
            <span>Стоимость</span>

            <strong>
              🪙 {item.price}
            </strong>
          </div>

          <div className="shop-purchase-balance">
            На руках: 🪙 {coins}
          </div>

          {message && (
            <div className="shop-purchase-message">
              {message}
            </div>
          )}

          <div className="shop-purchase-actions">
            <button
              type="button"
              className="shop-purchase-buy"
              onClick={handleBuy}
            >
              Купить
            </button>

            <button
              type="button"
              className="shop-purchase-back"
              onClick={closePurchaseWindow}
            >
              Назад
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default ShopModal;