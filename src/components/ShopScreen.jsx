import { useEffect, useMemo, useRef, useState } from "react";
import "./ShopScreen.css";
import { getClubLevel } from "../game/clubProgression";

function ItemArt({ item }) {
  if (item.image) return <img src={item.image} alt={item.name} draggable="false" />;
  return <span>{item.icon || "🌱"}</span>;
}

const FILTERS = [
  { id: "all", label: "Всё" },
  { id: "plant", label: "Растения" },
  { id: "mushroom", label: "Грибы" },
  { id: "care", label: "Уход" },
];

export default function ShopScreen({
  onGoBack,
  items = [],
  stock = {},
  coins = 0,
  seedInventory = {},
  careInventory = {},
  clubReputation = 0,
  joeTrust = 0,
  refreshAt,
  onBuy,
  onDevRefresh,
}) {
  const stripRef = useRef(null);
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(items[0]?.id || null);
  const [amount, setAmount] = useState(1);
  const [message, setMessage] = useState("Листай витрину или выбери раздел. Новая поставка приходит каждую минуту.");
  const clubLevel = getClubLevel(clubReputation);

  const filteredItems = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "care") return items.filter((item) => item.type === "care");
    return items.filter((item) => item.type === "seed" && item.seedType === filter);
  }, [items, filter]);

  const selected = useMemo(
    () => filteredItems.find((item) => item.id === selectedId) || filteredItems[0],
    [filteredItems, selectedId],
  );


  useEffect(() => {
    if (stripRef.current) stripRef.current.scrollTo({ left: 0, behavior: "smooth" });
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

  const secondsLeft = Math.max(0, Math.ceil((Number(refreshAt || 0) - Date.now()) / 1000));
  const selectedStock = selected ? stock[selected.id] || 0 : 0;
  const lockedByClub = selected ? clubLevel < (selected.requiredClubLevel || 1) : false;
  const lockedByJoe = selected ? joeTrust < (selected.requiredTrust || 0) : false;
  const locked = lockedByClub || lockedByJoe;
  const maxAffordable = selected?.pricePerSeed ? Math.floor(coins / selected.pricePerSeed) : 0;
  const maxAmount = Math.max(0, Math.min(selectedStock, maxAffordable));

  const changeFilter = (nextFilter) => {
    setFilter(nextFilter);
    setSelectedId(null);
    setAmount(1);
    setMessage(nextFilter === "care" ? "Джо открывает новые составы, а Зорик добавляет их в поставку." : "Выбери товар на витрине.");
  };

  const selectItem = (item) => {
    setSelectedId(item.id);
    setAmount(1);
    setMessage(item.description);
  };

  const buy = () => {
    if (!selected || locked || selectedStock <= 0 || maxAmount <= 0) return;
    const safeAmount = Math.min(Math.max(1, amount), maxAmount);
    const result = onBuy?.(selected, safeAmount);
    setMessage(result?.message || "Покупка не прошла.");
    if (result?.success) setAmount(1);
  };

  return (
    <div className="shop-screen">
      <button type="button" className="shop-back-hitbox" onClick={onGoBack} aria-label="Назад в район" />
      <div className="shop-wallet">🪙 {coins}</div>

      <section className="shop-counter">
        <header className="shop-header">
          <div><span>ЛАВКА ЗОРИКА</span><h1>Свежая поставка</h1></div>
          <div className="shop-refresh">Обновление через <strong>{secondsLeft}с</strong></div>
        </header>

        <div className="shop-filters">
          {FILTERS.map((entry) => (
            <button key={entry.id} type="button" className={filter === entry.id ? "active" : ""} onClick={() => changeFilter(entry.id)}>
              {entry.label}
            </button>
          ))}
        </div>

        <div className="shop-strip-shell">
          <button type="button" className="shop-strip-arrow left" onClick={() => scrollItems(-1)} disabled={filteredItems.length <= 3} aria-label="Предыдущие товары">‹</button>
          <div className="shop-strip" ref={stripRef} onWheel={handleItemsWheel} aria-label="Товары магазина">
            {filteredItems.map((item) => {
              const itemStock = stock[item.id] || 0;
              const itemLocked = clubLevel < (item.requiredClubLevel || 1) || joeTrust < (item.requiredTrust || 0);
              return (
                <button type="button" key={item.id} className={`shop-card${selected?.id === item.id ? " selected" : ""}${itemLocked ? " locked" : ""}`} onClick={() => selectItem(item)}>
                  <div className="shop-card-art"><ItemArt item={item} /></div>
                  <strong>{item.name}</strong>
                  <small>{item.type === "care" ? "Флакон ухода" : item.seedType === "mushroom" ? "Грибная культура" : "Растительная культура"}</small>
                  <div className="shop-card-bottom"><span>🪙 {item.pricePerSeed}</span><b>{itemLocked ? "🔒" : `${itemStock} шт.`}</b></div>
                </button>
              );
            })}
          </div>
          <button type="button" className="shop-strip-arrow right" onClick={() => scrollItems(1)} disabled={filteredItems.length <= 3} aria-label="Следующие товары">›</button>
        </div>

        {selected && (
          <article className="shop-selected">
            <div className="shop-selected-art"><ItemArt item={selected} /></div>
            <div className="shop-selected-info">
              <span className="shop-selected-type">{selected.type === "care" ? "РАСХОДНИК ДЛЯ УХОДА" : selected.seedType === "mushroom" ? "ДЛЯ ГРИБНОЙ ЁМКОСТИ" : "ДЛЯ ОБЫЧНОЙ ПОЧВЫ"}</span>
              <h2>{selected.name}</h2>
              <p>{message}</p>
              <div className="shop-owned">У тебя: <strong>{selected.type === "care" ? (careInventory[selected.id] || 0) : (seedInventory[selected.id] || 0)}</strong></div>
            </div>

            {locked ? (
              <div className="shop-lock-note">{lockedByJoe ? `Джо откроет товар при ${selected.requiredTrust} доверия` : `Нужен ${selected.requiredClubLevel} уровень клуба`}</div>
            ) : selectedStock <= 0 ? (
              <div className="shop-lock-note sold">Распродано до следующей поставки</div>
            ) : (
              <div className="shop-buy-row">
                <div className="shop-stepper">
                  <button type="button" onClick={() => setAmount((value) => Math.max(1, value - 1))}>−</button>
                  <strong>{Math.min(amount, Math.max(1, maxAmount))}</strong>
                  <button type="button" onClick={() => setAmount((value) => Math.min(Math.max(1, maxAmount), value + 1))}>+</button>
                </div>
                <button type="button" className="shop-buy" disabled={maxAmount <= 0} onClick={buy}>Купить · 🪙 {Math.min(amount, Math.max(1, maxAmount)) * selected.pricePerSeed}</button>
              </div>
            )}
          </article>
        )}

        {import.meta.env.DEV && <button type="button" className="shop-dev-refresh" onClick={onDevRefresh}>DEV · новая поставка</button>}
      </section>
    </div>
  );
}
