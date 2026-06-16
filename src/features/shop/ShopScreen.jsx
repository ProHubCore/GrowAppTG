import { useEffect, useMemo, useRef, useState } from "react";
import "./ShopScreen.css";
import { getClubLevel } from "../club/clubProgression";

function ItemArt({ item }) {
  if (item.image) return <img src={item.image} alt={item.name} draggable="false" />;
  return <span>{item.icon || "🌱"}</span>;
}

const FILTERS = [
  { id: "all", label: "Всё" },
  { id: "plant", label: "Растения" },
  { id: "care", label: "Уход" },
];

function getItemKind(item) {
  if (item.type === "tool") return "Постоянный инструмент";
  if (item.type === "care") return "Расходник для ухода";
  return "Растительная культура";
}

export default function ShopScreen({
  onGoBack,
  items = [],
  stock = {},
  coins = 0,
  seedInventory = {},
  careInventory = {},
  clubReputation = 0,
  mariaTrust = 0,
  refreshAt,
  onBuy,
  onDevRefresh,
}) {
  const stripRef = useRef(null);
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(items[0]?.id || null);
  const [amount, setAmount] = useState(1);
  const [message, setMessage] = useState(
    "Листай витрину или выбери раздел. Новая поставка приходит каждую минуту.",
  );
  const clubLevel = getClubLevel(clubReputation);

  const filteredItems = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "care") {
      return items.filter((item) => item.type === "care" || item.type === "tool");
    }
    return items.filter((item) => item.type === "seed" && item.seedType === filter);
  }, [items, filter]);

  const selected = useMemo(
    () => filteredItems.find((item) => item.id === selectedId) || filteredItems[0],
    [filteredItems, selectedId],
  );

  useEffect(() => {
    if (stripRef.current) {
      stripRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  }, [filter]);

  const scrollItems = (direction) => {
    stripRef.current?.scrollBy({
      left: direction * Math.max(220, stripRef.current.clientWidth * 0.72),
      behavior: "smooth",
    });
  };

  const handleItemsWheel = (event) => {
    if (!stripRef.current || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    event.preventDefault();
    stripRef.current.scrollLeft += event.deltaY;
  };

  const secondsLeft = Math.max(
    0,
    Math.ceil((Number(refreshAt || 0) - Date.now()) / 1000),
  );
  const selectedStock = selected ? stock[selected.id] || 0 : 0;
  const lockedByClub = selected
    ? clubLevel < (selected.requiredClubLevel || 1)
    : false;
  const lockedByMaria = selected
    ? mariaTrust < (selected.requiredTrust || 0)
    : false;
  const locked = lockedByClub || lockedByMaria;
  const toolOwned = Boolean(
    selected?.type === "tool" && (careInventory[selected.id] || 0) > 0,
  );
  const maxAffordable = selected?.pricePerSeed
    ? Math.floor(coins / selected.pricePerSeed)
    : 0;
  const maxAmount = selected?.type === "tool"
    ? toolOwned
      ? 0
      : Math.min(1, selectedStock, maxAffordable)
    : Math.max(0, Math.min(selectedStock, maxAffordable));

  const changeFilter = (nextFilter) => {
    setFilter(nextFilter);
    setSelectedId(null);
    setAmount(1);
    setMessage(
      nextFilter === "care"
        ? "Мария Ивановна открывает инструменты и составы, а Зорик добавляет их на витрину."
        : "Выбери товар на витрине.",
    );
  };

  const selectItem = (item) => {
    setSelectedId(item.id);
    setAmount(1);
    setMessage(item.description);
  };

  const buy = () => {
    if (!selected || locked || toolOwned || selectedStock <= 0 || maxAmount <= 0) return;
    const safeAmount = selected.type === "tool"
      ? 1
      : Math.min(Math.max(1, amount), maxAmount);
    const result = onBuy?.(selected, safeAmount);
    setMessage(result?.message || "Покупка не прошла.");
    if (result?.success) setAmount(1);
  };

  return (
    <div className="shop-screen">
      <button
        type="button"
        className="shop-back-hitbox"
        onClick={onGoBack}
        aria-label="Назад в район"
      />
      <div className="shop-wallet">🪙 {coins}</div>

      <section className="shop-counter">
        <header className="shop-header">
          <div>
            <span>ЛАВКА ЗОРИКА</span>
            <h1>Свежая поставка</h1>
          </div>
          <div className="shop-refresh">
            Обновление через <strong>{secondsLeft}с</strong>
          </div>
        </header>

        <div className="shop-filters">
          {FILTERS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={filter === entry.id ? "active" : ""}
              onClick={() => changeFilter(entry.id)}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <div className="shop-strip-shell">
          <button
            type="button"
            className="shop-strip-arrow left"
            onClick={() => scrollItems(-1)}
            disabled={filteredItems.length <= 3}
            aria-label="Предыдущие товары"
          >
            ‹
          </button>
          <div
            className="shop-strip"
            ref={stripRef}
            onWheel={handleItemsWheel}
            aria-label="Товары магазина"
          >
            {filteredItems.map((item) => {
              const itemStock = stock[item.id] || 0;
              const itemLocked =
                clubLevel < (item.requiredClubLevel || 1) ||
                mariaTrust < (item.requiredTrust || 0);
              const itemOwned =
                item.type === "tool" && (careInventory[item.id] || 0) > 0;

              return (
                <button
                  type="button"
                  key={item.id}
                  className={`shop-card${selected?.id === item.id ? " selected" : ""}${itemLocked ? " locked" : ""}`}
                  onClick={() => selectItem(item)}
                >
                  <div className="shop-card-art"><ItemArt item={item} /></div>
                  <strong>{item.name}</strong>
                  <small>{getItemKind(item)}</small>
                  <div className="shop-card-bottom">
                    <span>🪙 {item.pricePerSeed}</span>
                    <b>{itemLocked ? "🔒" : itemOwned ? "Куплено" : `${itemStock} шт.`}</b>
                  </div>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="shop-strip-arrow right"
            onClick={() => scrollItems(1)}
            disabled={filteredItems.length <= 3}
            aria-label="Следующие товары"
          >
            ›
          </button>
        </div>

        {selected && (
          <article className="shop-selected">
            <div className="shop-selected-art"><ItemArt item={selected} /></div>
            <div className="shop-selected-info">
              <span className="shop-selected-type">{getItemKind(selected).toUpperCase()}</span>
              <h2>{selected.name}</h2>
              <p>{message}</p>
              <div className="shop-owned">
                У тебя:{" "}
                <strong>
                  {selected.type === "tool"
                    ? toolOwned
                      ? "есть"
                      : "нет"
                    : selected.type === "care"
                      ? careInventory[selected.id] || 0
                      : seedInventory[selected.id] || 0}
                </strong>
              </div>
            </div>

            {locked ? (
              <div className="shop-lock-note">
                {lockedByMaria
                  ? `Мария Ивановна откроет товар при ${selected.requiredTrust} доверия`
                  : `Нужен ${selected.requiredClubLevel} уровень клуба`}
              </div>
            ) : toolOwned ? (
              <div className="shop-lock-note sold">Инструмент уже куплен и остаётся у тебя навсегда</div>
            ) : selectedStock <= 0 ? (
              <div className="shop-lock-note sold">Распродано до следующей поставки</div>
            ) : (
              <div className={`shop-buy-row${selected.type === "tool" ? " tool-only" : ""}`}>
                {selected.type !== "tool" && (
                  <div className="shop-stepper">
                    <button
                      type="button"
                      onClick={() => setAmount((value) => Math.max(1, value - 1))}
                    >
                      −
                    </button>
                    <strong>{Math.min(amount, Math.max(1, maxAmount))}</strong>
                    <button
                      type="button"
                      onClick={() => setAmount((value) => Math.min(Math.max(1, maxAmount), value + 1))}
                    >
                      +
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  className="shop-buy"
                  disabled={maxAmount <= 0}
                  onClick={buy}
                >
                  Купить · 🪙 {selected.type === "tool"
                    ? selected.pricePerSeed
                    : Math.min(amount, Math.max(1, maxAmount)) * selected.pricePerSeed}
                </button>
              </div>
            )}
          </article>
        )}

        {import.meta.env.DEV && (
          <button type="button" className="shop-dev-refresh" onClick={onDevRefresh}>
            DEV · новая поставка
          </button>
        )}
      </section>
    </div>
  );
}
