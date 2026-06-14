import { useEffect, useMemo, useState } from "react";
import "./ShopModal.css";

const REPUTATION_STORAGE_KEY = "growapp-club-reputation";

const CLUB_LEVELS = [
  { level: 1, required: 0 },
  { level: 2, required: 50 },
  { level: 3, required: 150 },
  { level: 4, required: 300 },
  { level: 5, required: 600 },
];

function readClubReputation() {
  try {
    const savedValue = Number(
      localStorage.getItem(REPUTATION_STORAGE_KEY),
    );

    if (!Number.isFinite(savedValue) || savedValue < 0) {
      return 0;
    }

    return Math.floor(savedValue);
  } catch {
    return 0;
  }
}

function getClubLevel(reputation) {
  let currentLevel = 1;

  for (const levelInfo of CLUB_LEVELS) {
    if (reputation >= levelInfo.required) {
      currentLevel = levelInfo.level;
    }
  }

  return currentLevel;
}

function getRequiredReputation(level) {
  return (
    CLUB_LEVELS.find(
      (levelInfo) => levelInfo.level === level,
    )?.required || 0
  );
}

function ShopModal({
  isOpen,
  item,
  coins,
  stock,
  playerSeedCount,
  onBuy,
}) {
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(1);
  const [message, setMessage] = useState("");
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [clubReputation, setClubReputation] =
    useState(readClubReputation);

  useEffect(() => {
    const handleReputationChange = (event) => {
      const newReputation = Number(event?.detail?.reputation);

      if (
        Number.isFinite(newReputation) &&
        newReputation >= 0
      ) {
        setClubReputation(Math.floor(newReputation));
        return;
      }

      setClubReputation(readClubReputation());
    };

    const handleStorageChange = (event) => {
      if (event.key === REPUTATION_STORAGE_KEY) {
        setClubReputation(readClubReputation());
      }
    };

    window.addEventListener(
      "growapp-club-reputation-change",
      handleReputationChange,
    );

    window.addEventListener(
      "storage",
      handleStorageChange,
    );

    return () => {
      window.removeEventListener(
        "growapp-club-reputation-change",
        handleReputationChange,
      );

      window.removeEventListener(
        "storage",
        handleStorageChange,
      );
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setClubReputation(readClubReputation());
    }

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
      Math.min(Math.max(currentAmount, 1), stock),
    );
  }, [stock]);

  const clubLevel = useMemo(
    () => getClubLevel(clubReputation),
    [clubReputation],
  );

  if (!isOpen || !item) {
    return null;
  }

  const requiredClubLevel = Math.max(
    1,
    Number(item.requiredClubLevel) || 1,
  );

  const requiredReputation =
    getRequiredReputation(requiredClubLevel);

  const isLocked = clubLevel < requiredClubLevel;
  const pricePerSeed = Number(item.pricePerSeed) || 0;
  const isSoldOut = stock <= 0;

  const maximumAffordable =
    pricePerSeed > 0
      ? Math.floor(coins / pricePerSeed)
      : stock;

  const maximumSelectable = Math.min(
    stock,
    Math.max(0, maximumAffordable),
  );

  const totalPrice = selectedAmount * pricePerSeed;

  const openPurchaseWindow = () => {
    setMessage("");
    setPurchaseSuccess(false);

    if (
      !isLocked &&
      stock > 0 &&
      maximumSelectable > 0
    ) {
      setSelectedAmount(1);
    }

    setIsPurchaseOpen(true);
  };

  const closePurchaseWindow = () => {
    setMessage("");
    setPurchaseSuccess(false);
    setSelectedAmount(stock > 0 ? 1 : 0);
    setIsPurchaseOpen(false);
  };

  const decreaseAmount = () => {
    setMessage("");

    setSelectedAmount((currentAmount) =>
      Math.max(1, currentAmount - 1),
    );
  };

  const increaseAmount = () => {
    setMessage("");

    setSelectedAmount((currentAmount) =>
      Math.min(maximumSelectable, currentAmount + 1),
    );
  };

  const handleSliderChange = (event) => {
    setMessage("");
    setSelectedAmount(Number(event.target.value));
  };

  const handleBuy = () => {
    if (isLocked) {
      setMessage(
        `Откроется на ${requiredClubLevel} уровне клуба.`,
      );
      return;
    }

    if (selectedAmount <= 0) {
      setMessage("Выбери количество семян.");
      return;
    }

    if (typeof onBuy !== "function") {
      setMessage("Покупка временно недоступна.");
      return;
    }

    const result = onBuy(item, selectedAmount);

    if (!result?.success) {
      setPurchaseSuccess(false);

      setMessage(
        result?.message ||
          "Не удалось совершить покупку.",
      );

      return;
    }

    setPurchaseSuccess(true);

    setMessage(
      result.message ||
        `Вы купили ${selectedAmount} семян ${item.name}.`,
    );
  };

  const shelfClassName = [
    "shop-shelf-product",
    isSoldOut ? "sold-out" : "",
    isLocked ? "club-locked" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <button
        type="button"
        className={shelfClassName}
        onClick={openPurchaseWindow}
        aria-label={
          isLocked
            ? `${item.name}. Откроется на ${requiredClubLevel} уровне клуба`
            : `Открыть товар ${item.name}`
        }
        style={
          isLocked
            ? {
                position: "relative",
                opacity: 0.88,
                filter:
                  "grayscale(0.2) saturate(0.88) brightness(1.06)",
              }
            : undefined
        }
      >
        <img
          className="shop-shelf-product-image"
          src={item.image}
          alt={item.name}
          draggable="false"
        />

        {isLocked && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 8,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "12px",
              borderRadius: "inherit",
              color: "#ffffff",
              textAlign: "center",
              textShadow:
                "0 2px 8px rgba(13, 7, 28, 0.82), 0 0 12px rgba(201, 171, 255, 0.9)",
              background:
                "radial-gradient(circle at 50% 48%, rgba(190, 140, 255, 0.4) 0%, rgba(134, 87, 223, 0.2) 34%, rgba(76, 43, 132, 0.06) 62%, rgba(15, 9, 32, 0) 82%)",
              boxShadow:
                "inset 0 0 24px rgba(205, 166, 255, 0.14), 0 0 18px rgba(152, 99, 232, 0.2)",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                fontSize: "29px",
                lineHeight: 1,
                filter:
                  "drop-shadow(0 0 8px rgba(214, 190, 255, 0.96))",
              }}
            >
              🔒
            </div>

            <strong
              style={{
                maxWidth: "140px",
                padding: "5px 10px",
                borderRadius: "999px",
                fontSize: "10px",
                lineHeight: 1.25,
                letterSpacing: "0.06em",
                background:
                  "rgba(111, 70, 188, 0.3)",
                border:
                  "1px solid rgba(224, 207, 255, 0.22)",
                boxShadow:
                  "0 0 14px rgba(183, 134, 255, 0.3)",
                backdropFilter: "blur(5px)",
                WebkitBackdropFilter: "blur(5px)",
              }}
            >
              {requiredClubLevel} УРОВЕНЬ КЛУБА
            </strong>
          </div>
        )}

        <div className="shop-shelf-product-price">
          {isLocked ? (
            <span>Закрыто</span>
          ) : isSoldOut ? (
            <span>Распродано</span>
          ) : (
            <>
              <span>🪙</span>
              <span>{pricePerSeed}</span>
            </>
          )}
        </div>

        <div className="shop-shelf-product-stock">
          {isLocked
            ? `${clubReputation} / ${requiredReputation} REP`
            : `Осталось: ${stock}`}
        </div>
      </button>

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

          {isLocked ? (
            <div
              style={{
                minHeight: "420px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "30px 24px 24px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  marginBottom: "10px",
                  fontSize: "52px",
                  lineHeight: 1,
                  filter:
                    "drop-shadow(0 0 12px rgba(202, 169, 255, 0.8))",
                }}
              >
                🔒
              </div>

              <div className="shop-purchase-label">
                Клубная награда
              </div>

              <div className="shop-purchase-name">
                {item.name}
              </div>

              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    width: "190px",
                    height: "190px",
                    borderRadius: "50%",
                    background:
                      "radial-gradient(circle, rgba(186, 135, 255, 0.36) 0%, rgba(123, 79, 210, 0.17) 45%, rgba(20, 12, 40, 0) 75%)",
                    filter: "blur(2px)",
                    pointerEvents: "none",
                  }}
                />

                <img
                  className="shop-purchase-image"
                  src={item.image}
                  alt={item.name}
                  draggable="false"
                  style={{
                    position: "relative",
                    zIndex: 1,
                    opacity: 0.8,
                    filter:
                      "grayscale(0.25) saturate(0.86)",
                  }}
                />
              </div>

              <div className="shop-purchase-description">
                Зорик пока не продаёт тебе эти семена.
                Продавай урожай Типусиану и повышай
                репутацию клуба.
              </div>

              <div
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  margin: "16px 0 18px",
                  padding: "14px",
                  borderRadius: "16px",
                  border:
                    "1px solid rgba(190, 169, 255, 0.3)",
                  background:
                    "radial-gradient(circle at center, rgba(148, 102, 233, 0.2), rgba(92, 58, 165, 0.08))",
                  boxShadow:
                    "inset 0 0 18px rgba(194, 155, 255, 0.08), 0 0 14px rgba(139, 91, 218, 0.12)",
                }}
              >
                <strong style={{ color: "#ffffff" }}>
                  Нужно: {requiredClubLevel} уровень клуба
                </strong>

                <span
                  style={{
                    color: "rgba(255, 255, 255, 0.72)",
                    fontSize: "13px",
                  }}
                >
                  Сейчас: {clubLevel} уровень ·{" "}
                  {clubReputation} REP
                </span>
              </div>

              <button
                type="button"
                className="shop-purchase-back"
                onClick={closePurchaseWindow}
              >
                Понятно
              </button>
            </div>
          ) : !purchaseSuccess ? (
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
                  <strong>{stock} шт.</strong>
                </div>

                <div>
                  У тебя
                  <strong>{playerSeedCount} шт.</strong>
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
                      disabled={selectedAmount <= 1}
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
                        selectedAmount >= maximumSelectable
                      }
                    >
                      +
                    </button>
                  </div>

                  <input
                    className="shop-amount-slider"
                    type="range"
                    min="1"
                    max={Math.max(1, maximumSelectable)}
                    value={Math.max(1, selectedAmount)}
                    onChange={handleSliderChange}
                    disabled={maximumSelectable <= 0}
                  />

                  <div className="shop-slider-limits">
                    <span>1</span>
                    <span>
                      {Math.max(1, maximumSelectable)}
                    </span>
                  </div>
                </>
              )}

              <div className="shop-purchase-price">
                <span>Цена за семя</span>
                <strong>{pricePerSeed}</strong>
              </div>

              <div className="shop-purchase-total">
                <span>Общая стоимость</span>
                <strong>{totalPrice}</strong>
              </div>

              <div className="shop-purchase-balance">
                На руках: {coins}
              </div>

              {maximumSelectable <= 0 && !isSoldOut && (
                <div className="shop-purchase-message error">
                  Не хватает монет даже на одно семя.
                </div>
              )}

              {isSoldOut && (
                <div className="shop-purchase-message error">
                  У Зорика закончились семена{" "}
                  {item.name}.
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
                  onClick={closePurchaseWindow}
                >
                  Назад
                </button>
              </div>
            </>
          ) : (
            <div className="shop-purchase-success">
              <div className="shop-success-icon">✓</div>

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
                Семена добавлены в твою корзинку на
                плантации.
              </div>

              <button
                type="button"
                className="shop-success-button"
                onClick={closePurchaseWindow}
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
