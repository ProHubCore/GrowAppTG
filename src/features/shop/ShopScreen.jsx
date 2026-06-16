import { useEffect, useMemo, useState } from "react";
import "./ShopScreen.css";
import { getClubLevel } from "../club/clubProgression";

const DEPARTMENTS = [
  { id: "seed", label: "Семена", icon: "🌱" },
  { id: "care", label: "Уход", icon: "🧪" },
  { id: "equipment", label: "Оснащение", icon: "🛠️" },
];

const SHOP_SEEN_STORAGE_KEY = "grow-shop-seen-stock-v1";

function getSupplyKey(refreshAt) {
  return String(Number(refreshAt || 0));
}

function readSeenItems(refreshAt) {
  try {
    const saved = JSON.parse(window.localStorage.getItem(SHOP_SEEN_STORAGE_KEY) || "null");
    if (!saved || saved.supplyKey !== getSupplyKey(refreshAt)) return [];
    return Array.isArray(saved.seenItemIds) ? saved.seenItemIds : [];
  } catch {
    return [];
  }
}

function saveSeenItems(refreshAt, seenItemIds) {
  try {
    window.localStorage.setItem(
      SHOP_SEEN_STORAGE_KEY,
      JSON.stringify({
        supplyKey: getSupplyKey(refreshAt),
        seenItemIds: [...seenItemIds],
      }),
    );
  } catch {
    // Игра продолжит работать даже при недоступном localStorage.
  }
}

function ItemArt({ item }) {
  if (item.image) {
    return <img src={item.image} alt={item.name} draggable="false" />;
  }

  return <span aria-hidden="true">{item.icon || "🌱"}</span>;
}

function formatTimer(totalSeconds) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getOwnedAmount(item, seedInventory, careInventory) {
  if (!item) return 0;
  if (item.type === "seed") return seedInventory[item.id] || 0;
  return careInventory[item.id] || 0;
}

function getDepartmentId(item) {
  if (item.type === "seed") return "seed";
  if (item.type === "care") return "care";
  return "equipment";
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
}) {
  const [department, setDepartment] = useState("seed");
  const [selectedId, setSelectedId] = useState(null);
  const [amount, setAmount] = useState(1);
  const [toast, setToast] = useState("");
  const [seenItemIds, setSeenItemIds] = useState(() => new Set(readSeenItems(refreshAt)));
  const clubLevel = getClubLevel(clubReputation);

  const visibleItems = useMemo(
    () => items.filter((item) => {
      if (item.type !== "tool") return true;
      return (careInventory[item.id] || 0) <= 0;
    }),
    [items, careInventory],
  );

  const availableDepartments = DEPARTMENTS;

  const filteredItems = useMemo(
    () => visibleItems.filter((item) => getDepartmentId(item) === department),
    [visibleItems, department],
  );

  const selected = useMemo(
    () => visibleItems.find((item) => item.id === selectedId) || null,
    [visibleItems, selectedId],
  );

  useEffect(() => {
    if (!availableDepartments.some((entry) => entry.id === department)) {
      setDepartment(availableDepartments[0]?.id || "seed");
    }
  }, [availableDepartments, department]);

  useEffect(() => {
    if (selectedId && !selected) {
      setSelectedId(null);
      setAmount(1);
    }
  }, [selected, selectedId]);

  useEffect(() => {
    setSeenItemIds(new Set(readSeenItems(refreshAt)));
  }, [refreshAt]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

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
  const maxAffordable = selected?.pricePerSeed
    ? Math.floor(coins / selected.pricePerSeed)
    : 0;
  const maxAmount = selected?.type === "tool"
    ? Math.min(1, selectedStock, maxAffordable)
    : Math.max(0, Math.min(selectedStock, maxAffordable));
  const safeAmount = selected?.type === "tool"
    ? 1
    : Math.min(Math.max(1, amount), Math.max(1, maxAmount));
  const totalPrice = selected ? safeAmount * selected.pricePerSeed : 0;
  const ownedAmount = getOwnedAmount(selected, seedInventory, careInventory);
  const unseenItemIds = useMemo(
    () => new Set(
      visibleItems
        .filter((item) => {
          const itemStock = stock[item.id] || 0;
          const itemLocked =
            clubLevel < (item.requiredClubLevel || 1) ||
            mariaTrust < (item.requiredTrust || 0);
          return itemStock > 0 && !itemLocked && !seenItemIds.has(item.id);
        })
        .map((item) => item.id),
    ),
    [visibleItems, stock, clubLevel, mariaTrust, seenItemIds],
  );
  const hasUnseenItems = unseenItemIds.size > 0;

  const markItemSeen = (itemId) => {
    setSeenItemIds((current) => {
      if (current.has(itemId)) return current;
      const next = new Set(current);
      next.add(itemId);
      saveSeenItems(refreshAt, next);
      return next;
    });
  };

  const openItem = (item) => {
    const itemLocked =
      clubLevel < (item.requiredClubLevel || 1) ||
      mariaTrust < (item.requiredTrust || 0);

    if (itemLocked) return;

    markItemSeen(item.id);
    setSelectedId(item.id);
    setAmount(1);
  };

  const closeItem = () => {
    setSelectedId(null);
    setAmount(1);
  };

  const buy = () => {
    if (!selected || locked || selectedStock <= 0 || maxAmount <= 0) return;

    const result = onBuy?.(selected, safeAmount);
    if (!result?.success) {
      setToast(result?.message || "Покупка не прошла");
      return;
    }

    setToast(selected.type === "tool" ? `${selected.name} теперь у тебя` : result.message);
    closeItem();
  };

  const changeDepartment = (nextDepartment) => {
    setDepartment(nextDepartment);
    closeItem();
  };

  return (
    <div className="shop-screen">
      <div className="shop-top-safe" aria-hidden="true" />

      <div className="shop-wallet" aria-label={`Монеты: ${coins}`}>
        <span className="shop-wallet-coin">●</span>
        <strong>{coins}</strong>
      </div>

      <section className="shop-stall" aria-label="Лавка Зорика">
        <header className="shop-signboard">
          <div className="shop-signboard-copy">
            <h1>Лавка Зорика</h1>
          </div>

          <div className={`shop-delivery${hasUnseenItems ? " has-new" : ""}`} aria-label={`Обновление через ${formatTimer(secondsLeft)}`}>
            <span className="shop-delivery-icon" aria-hidden="true">↻</span>
            <div className="shop-delivery-copy">
              <small>ОБНОВЛЕНИЕ</small>
              <strong>{formatTimer(secondsLeft)}</strong>
            </div>
            {hasUnseenItems && <span className="shop-delivery-new">ЕСТЬ НОВОЕ</span>}
          </div>
        </header>

        <nav className="shop-departments" aria-label="Разделы магазина">
          {availableDepartments.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={department === entry.id ? "active" : ""}
              onClick={() => changeDepartment(entry.id)}
            >
              <span className="shop-department-icon" aria-hidden="true">{entry.icon}</span>
              <span className="shop-department-copy">
                <strong>{entry.label}</strong>
              </span>
            </button>
          ))}
        </nav>

        <div className="shop-shelf-frame">
          <div className="shop-shelf-title">
            <span>{department === "seed"
              ? "Семена"
              : department === "care"
                ? "Уход за растениями"
                : "Оснащение"}</span>
            <i aria-hidden="true" />
          </div>

          <div className="shop-product-grid">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => {
                const itemStock = stock[item.id] || 0;
                const itemLocked =
                  clubLevel < (item.requiredClubLevel || 1) ||
                  mariaTrust < (item.requiredTrust || 0);
                const soldOut = itemStock <= 0;
                const isNew = unseenItemIds.has(item.id);

                return (
                  <button
                    type="button"
                    key={item.id}
                    className={`shop-product${itemLocked ? " locked" : ""}${soldOut ? " sold-out" : ""}${isNew ? " new-arrival" : ""}`}
                    onClick={() => openItem(item)}
                    aria-disabled={itemLocked ? "true" : undefined}
                  >
                    {isNew && !itemLocked && <span className="shop-product-new">НОВОЕ</span>}
                    <span className="shop-product-art"><ItemArt item={item} /></span>
                    {itemLocked && (
                      <span className="shop-product-lock" aria-label="Товар пока закрыт">
                        <span className="shop-product-lock-shackle" aria-hidden="true" />
                        <span className="shop-product-lock-body" aria-hidden="true">◆</span>
                      </span>
                    )}
                    <span className="shop-product-name">{item.name}</span>
                    {!itemLocked && (
                      <span className="shop-product-footer">
                        <span className="shop-product-price">
                          <i aria-hidden="true">●</i>{item.pricePerSeed}
                        </span>
                        <span className="shop-product-stock">
                          {soldOut ? "РАЗОБРАЛИ" : `×${itemStock}`}
                        </span>
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="shop-empty-shelf">
                <span aria-hidden="true">✓</span>
                <strong>Здесь всё разобрано</strong>
                <small>Новые товары появятся с поставкой</small>
              </div>
            )}
          </div>
        </div>

        <button type="button" className="shop-exit" onClick={onGoBack}>
          НА ГРОУ-СТРИТ
        </button>

      </section>

      {selected && (
        <div className="shop-product-modal-layer" role="presentation" onPointerDown={closeItem}>
          <article
            className="shop-product-modal"
            role="dialog"
            aria-modal="true"
            aria-label={selected.name}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <button type="button" className="shop-modal-close" onClick={closeItem} aria-label="Закрыть">×</button>

            <div className="shop-modal-art"><ItemArt item={selected} /></div>
            <h2>{selected.name}</h2>
            <p>{selected.description}</p>

            <div className="shop-modal-facts">
              <div>
                <span>У тебя</span>
                <strong>{selected.type === "tool" ? (ownedAmount > 0 ? "Есть" : "Нет") : `${ownedAmount} шт.`}</strong>
              </div>
              <div>
                <span>На прилавке</span>
                <strong>{selectedStock} шт.</strong>
              </div>
              <div>
                <span>Цена</span>
                <strong><i aria-hidden="true">●</i>{selected.pricePerSeed}</strong>
              </div>
            </div>

            {locked ? (
              <div className="shop-modal-status locked">
                <span aria-hidden="true">🔒</span>
                <strong>{lockedByMaria
                  ? `Откроется при ${selected.requiredTrust} доверия Марии Ивановны`
                  : `Нужен ${selected.requiredClubLevel} уровень клуба`}</strong>
              </div>
            ) : selectedStock <= 0 ? (
              <div className="shop-modal-status sold-out">
                <span aria-hidden="true">⌛</span>
                <strong>Товар закончился до следующей поставки</strong>
              </div>
            ) : (
              <>
                {selected.type !== "tool" && (
                  <div className="shop-modal-quantity">
                    <span>Количество</span>
                    <div>
                      <button type="button" onClick={() => setAmount((value) => Math.max(1, value - 1))}>−</button>
                      <strong>{safeAmount}</strong>
                      <button type="button" onClick={() => setAmount((value) => Math.min(Math.max(1, maxAmount), value + 1))}>+</button>
                    </div>
                  </div>
                )}

                <button type="button" className="shop-modal-buy" disabled={maxAmount <= 0} onClick={buy}>
                  <span>{maxAmount <= 0 ? "Не хватает монет" : "Купить"}</span>
                  {maxAmount > 0 && <strong><i aria-hidden="true">●</i>{totalPrice}</strong>}
                </button>
              </>
            )}
          </article>
        </div>
      )}

      {toast && <div className="shop-toast" role="status">{toast}</div>}
    </div>
  );
}
