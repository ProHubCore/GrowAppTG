import { useEffect, useMemo, useRef, useState } from "react";

import { CROPS } from "../../plantation/data/crops";
import { HARVEST_QUALITIES } from "../../plantation/data/harvestQuality";
import {
  QUALITY_PRICE_MULTIPLIERS,
  getQualityAmount,
} from "../../plantation/data/qualityInventory";
import "./InventoryModal.css";

const SLOT_COUNT = 20;
const QUICK_SLOT_COUNT = 3;
const LAYOUT_STORAGE_KEY = "growapp-backpack-layout-v2";
const QUICK_STORAGE_KEY = "growapp-backpack-quick-v2";

const QUALITY_CLASS = {
  normal: "normal",
  good: "good",
  excellent: "excellent",
  rare: "rare",
};

const UTILITY_ITEMS = {
  wateringCan: {
    name: "Старая лейка",
    icon: "💧",
    description: "Постоянный инструмент. Срезает 20% времени текущей стадии.",
    category: "tool",
    categoryLabel: "Инструмент",
  },
  nutrition: {
    name: "Питательный раствор",
    icon: "🌿",
    description: "Расходник для повышения качества и дополнительного урожая.",
    category: "care",
    categoryLabel: "Уход",
  },
  mariaMix: {
    name: "Смесь Марьи Ивановны",
    icon: "🧪",
    description: "Редкий состав с высоким шансом отличного качества.",
    category: "care",
    categoryLabel: "Уход",
  },
};

function readStoredArray(key, length) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "null");
    return Array.isArray(parsed) ? parsed.slice(0, length) : [];
  } catch {
    return [];
  }
}

function writeStoredArray(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Игра продолжает работать даже при запрещённом localStorage.
  }
}

function reconcileLayout(previous, availableKeys) {
  const validKeys = new Set(availableKeys);
  const used = new Set();
  const next = Array.from({ length: SLOT_COUNT }, () => null);

  previous.slice(0, SLOT_COUNT).forEach((key, index) => {
    if (key && validKeys.has(key) && !used.has(key)) {
      next[index] = key;
      used.add(key);
    }
  });

  availableKeys.forEach((key) => {
    if (used.has(key)) return;
    const emptyIndex = next.indexOf(null);
    if (emptyIndex !== -1) {
      next[emptyIndex] = key;
      used.add(key);
    }
  });

  return next;
}

function reconcileQuick(previous, availableKeys) {
  const validKeys = new Set(availableKeys);
  const used = new Set();

  return Array.from({ length: QUICK_SLOT_COUNT }, (_, index) => {
    const key = previous[index];
    if (!key || !validKeys.has(key) || used.has(key)) return null;
    used.add(key);
    return key;
  });
}

function ItemArt({ stack, compact = false }) {
  const size = compact ? 34 : 46;

  if (stack.image) {
    return (
      <img
        className="backpack-item-image"
        src={stack.image}
        alt={stack.name}
        style={{ width: size, height: size }}
        draggable="false"
      />
    );
  }

  return (
    <span className="backpack-item-emoji" style={{ fontSize: compact ? 23 : 30 }}>
      {stack.icon}
    </span>
  );
}

function buildStacks({ qualityInventory, seedInventory, careInventory }) {
  const cropById = Object.fromEntries(CROPS.map((crop) => [crop.id, crop]));
  const stacks = [];

  CROPS.forEach((crop) => {
    HARVEST_QUALITIES.forEach((quality) => {
      const count = getQualityAmount(qualityInventory, crop.id, quality.id);
      if (count <= 0) return;

      stacks.push({
        key: `harvest:${crop.id}:${quality.id}`,
        type: "harvest",
        category: "harvest",
        categoryLabel: "Урожай",
        itemId: crop.id,
        qualityId: quality.id,
        quality,
        count,
        countLabel: `x${count}`,
        name: crop.name,
        icon: crop.icon,
        image: crop.stages.at(-1)?.image,
        description: `${quality.name} качество`,
        basePrice: crop.basePrice,
        sortRank: 30 + quality.rank,
      });
    });
  });

  CROPS.forEach((crop) => {
    const count = crop.infiniteSeeds ? Infinity : Math.max(0, seedInventory[crop.id] || 0);
    if (!crop.infiniteSeeds && count <= 0) return;

    stacks.push({
      key: `seed:${crop.id}`,
      type: "seed",
      category: "seed",
      categoryLabel: "Семена",
      itemId: crop.id,
      count,
      countLabel: crop.infiniteSeeds ? "∞" : `x${count}`,
      name: `Семена: ${crop.name}`,
      icon: crop.icon,
      image: crop.seedImage || crop.stages[0]?.image,
      description: crop.infiniteSeeds
        ? "Базовые семена всегда доступны"
        : "Можно посадить в свободное ведро",
      sortRank: 20,
    });
  });

  Object.entries(UTILITY_ITEMS).forEach(([itemId, meta]) => {
    const count = Math.max(0, careInventory[itemId] || 0);
    if (count <= 0) return;

    stacks.push({
      key: `utility:${itemId}`,
      type: meta.category === "tool" ? "tool" : "care",
      category: meta.category,
      categoryLabel: meta.categoryLabel,
      itemId,
      count,
      countLabel: itemId === "wateringCan" ? "1" : `x${count}`,
      name: meta.name,
      icon: meta.icon,
      image: null,
      description: meta.description,
      sortRank: meta.category === "tool" ? 0 : 10,
    });
  });

  return stacks.map((stack) => ({
    ...stack,
    crop: cropById[stack.itemId],
  }));
}

function getDropTarget(clientX, clientY) {
  const element = document.elementFromPoint(clientX, clientY);
  return element?.closest?.("[data-backpack-drop]")?.dataset.backpackDrop || null;
}

export default function InventoryModal({
  isOpen,
  qualityInventory = {},
  seedInventory = {},
  careInventory = {},
  onClose,
  onDeleteQualityItem,
}) {
  const stacks = useMemo(
    () => buildStacks({ qualityInventory, seedInventory, careInventory }),
    [qualityInventory, seedInventory, careInventory],
  );
  const stackMap = useMemo(
    () => Object.fromEntries(stacks.map((stack) => [stack.key, stack])),
    [stacks],
  );
  const stackKeys = useMemo(() => stacks.map((stack) => stack.key), [stacks]);

  const [layout, setLayout] = useState(() =>
    reconcileLayout(readStoredArray(LAYOUT_STORAGE_KEY, SLOT_COUNT), []),
  );
  const [quickSlots, setQuickSlots] = useState(() =>
    reconcileQuick(readStoredArray(QUICK_STORAGE_KEY, QUICK_SLOT_COUNT), []),
  );
  const [selectedKey, setSelectedKey] = useState(null);
  const [dragState, setDragState] = useState(null);
  const dragRef = useRef(null);

  useEffect(() => {
    setLayout((previous) => reconcileLayout(previous, stackKeys));
    setQuickSlots((previous) => reconcileQuick(previous, stackKeys));
    setSelectedKey((previous) => (previous && stackMap[previous] ? previous : null));
  }, [stackKeys, stackMap]);

  useEffect(() => {
    writeStoredArray(LAYOUT_STORAGE_KEY, layout);
  }, [layout]);

  useEffect(() => {
    writeStoredArray(QUICK_STORAGE_KEY, quickSlots);
  }, [quickSlots]);

  if (!isOpen) return null;

  const selected = selectedKey ? stackMap[selectedKey] : null;
  const usedSlots = layout.filter(Boolean).length;
  const categoryCounts = stacks.reduce(
    (counts, stack) => ({ ...counts, [stack.category]: (counts[stack.category] || 0) + 1 }),
    {},
  );

  const closeInventory = () => {
    setDragState(null);
    dragRef.current = null;
    setSelectedKey(null);
    onClose();
  };

  const moveToSlot = (key, sourceType, sourceIndex, targetIndex) => {
    setLayout((previous) => {
      const next = [...previous];
      const existingIndex = next.indexOf(key);

      if (existingIndex !== -1) {
        const targetKey = next[targetIndex];
        next[targetIndex] = key;
        next[existingIndex] = targetKey || null;
      } else if (!next[targetIndex]) {
        next[targetIndex] = key;
      }

      return next;
    });

    if (sourceType === "quick" && sourceIndex !== null) {
      setQuickSlots((previous) => {
        const next = [...previous];
        next[sourceIndex] = null;
        return next;
      });
    }
  };

  const moveToQuickSlot = (key, sourceType, sourceIndex, targetIndex) => {
    setQuickSlots((previous) => {
      if (sourceType === "quick" && sourceIndex === targetIndex) return previous;

      const next = [...previous];
      const duplicateIndex = next.indexOf(key);
      if (duplicateIndex !== -1) next[duplicateIndex] = null;

      if (sourceType === "quick" && sourceIndex !== null) {
        const targetKey = next[targetIndex];
        next[targetIndex] = key;
        next[sourceIndex] = targetKey || null;
      } else {
        next[targetIndex] = key;
      }

      return next;
    });
  };

  const handleDrop = (drag, dropTarget) => {
    if (!dropTarget) return;
    const [targetType, rawIndex] = dropTarget.split(":");
    const targetIndex = Number(rawIndex);

    if (!Number.isInteger(targetIndex)) return;

    if (targetType === "slot" && targetIndex >= 0 && targetIndex < SLOT_COUNT) {
      moveToSlot(drag.key, drag.sourceType, drag.sourceIndex, targetIndex);
    }

    if (targetType === "quick" && targetIndex >= 0 && targetIndex < QUICK_SLOT_COUNT) {
      moveToQuickSlot(drag.key, drag.sourceType, drag.sourceIndex, targetIndex);
    }
  };

  const beginPointerDrag = (event, key, sourceType, sourceIndex) => {
    if (event.button !== undefined && event.button !== 0) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);

    const nextDrag = {
      key,
      sourceType,
      sourceIndex,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      started: false,
      dropTarget: null,
    };

    dragRef.current = nextDrag;
    setDragState(nextDrag);
  };

  const updatePointerDrag = (event) => {
    const current = dragRef.current;
    if (!current || current.pointerId !== event.pointerId) return;

    const distance = Math.hypot(event.clientX - current.startX, event.clientY - current.startY);
    const started = current.started || distance > 7;
    const dropTarget = started ? getDropTarget(event.clientX, event.clientY) : null;
    const nextDrag = {
      ...current,
      x: event.clientX,
      y: event.clientY,
      started,
      dropTarget,
    };

    dragRef.current = nextDrag;
    setDragState(nextDrag);
  };

  const endPointerDrag = (event) => {
    const current = dragRef.current;
    if (!current || current.pointerId !== event.pointerId) return;

    if (current.started) {
      handleDrop(current, getDropTarget(event.clientX, event.clientY));
      setSelectedKey(current.key);
    } else {
      setSelectedKey(current.key);
    }

    dragRef.current = null;
    setDragState(null);
  };

  const cancelPointerDrag = () => {
    dragRef.current = null;
    setDragState(null);
  };

  const autoSort = () => {
    const sortedKeys = [...stacks]
      .sort((left, right) => {
        if (left.sortRank !== right.sortRank) return left.sortRank - right.sortRank;
        if (left.name !== right.name) return left.name.localeCompare(right.name, "ru");
        return (right.quality?.rank || 0) - (left.quality?.rank || 0);
      })
      .map((stack) => stack.key);

    setLayout([...sortedKeys, ...Array.from({ length: SLOT_COUNT - sortedKeys.length }, () => null)]);
  };

  const pinSelected = () => {
    if (!selected) return;

    setQuickSlots((previous) => {
      const next = [...previous];
      const existingIndex = next.indexOf(selected.key);
      if (existingIndex !== -1) {
        next[existingIndex] = null;
        return next;
      }

      const emptyIndex = next.indexOf(null);
      next[emptyIndex === -1 ? 0 : emptyIndex] = selected.key;
      return next;
    });
  };

  const selectedIsPinned = selected ? quickSlots.includes(selected.key) : false;
  const draggedStack = dragState?.key ? stackMap[dragState.key] : null;

  return (
    <div className="modal-overlay backpack-inventory-overlay" onPointerUp={endPointerDrag} onPointerCancel={cancelPointerDrag}>
      <section className="backpack-inventory" aria-label="Рюкзак">
        <div className="backpack-top-flap" aria-hidden="true">
          <span className="backpack-top-flap__stitch" />
          <span className="backpack-top-flap__buckle backpack-top-flap__buckle--left" />
          <span className="backpack-top-flap__buckle backpack-top-flap__buckle--right" />
        </div>

        <header className="backpack-header">
          <div>
            <div className="backpack-kicker">Снаряжение района</div>
            <h2 className="backpack-title">Рюкзак</h2>
          </div>
          <div className="backpack-capacity" aria-label={`Занято ${usedSlots} из ${SLOT_COUNT} ячеек`}>
            <strong>{usedSlots}</strong>
            <span>/ {SLOT_COUNT}</span>
          </div>
          <button className="backpack-close" type="button" onClick={closeInventory} aria-label="Закрыть рюкзак">
            ×
          </button>
        </header>

        <div className="backpack-category-strip" aria-label="Состав рюкзака">
          <span><b>{categoryCounts.tool || 0}</b> инструменты</span>
          <span><b>{categoryCounts.seed || 0}</b> семена</span>
          <span><b>{categoryCounts.harvest || 0}</b> урожай</span>
        </div>

        <section className="backpack-quick-section">
          <div className="backpack-section-heading">
            <div>
              <strong>Быстрые карманы</strong>
              <span>Перетащи сюда нужные предметы</span>
            </div>
            <button className="backpack-sort-button" type="button" onClick={autoSort}>
              Уложить
            </button>
          </div>

          <div className="backpack-quick-row">
            {quickSlots.map((key, index) => {
              const stack = key ? stackMap[key] : null;
              const isDropTarget = dragState?.started && dragState.dropTarget === `quick:${index}`;

              return (
                <button
                  key={`quick-${index}`}
                  className={`backpack-quick-slot${stack ? " filled" : ""}${isDropTarget ? " drop-target" : ""}`}
                  type="button"
                  data-backpack-drop={`quick:${index}`}
                  onPointerDown={stack ? (event) => beginPointerDrag(event, stack.key, "quick", index) : undefined}
                  onPointerMove={stack ? updatePointerDrag : undefined}
                  onPointerUp={stack ? endPointerDrag : undefined}
                  onPointerCancel={stack ? cancelPointerDrag : undefined}
                  onClick={() => stack && setSelectedKey(stack.key)}
                  aria-label={stack ? `${stack.name}, быстрый карман ${index + 1}` : `Пустой быстрый карман ${index + 1}`}
                >
                  <span className="backpack-quick-number">{index + 1}</span>
                  {stack ? (
                    <>
                      <ItemArt stack={stack} compact />
                      <span className="backpack-quick-count">{stack.countLabel}</span>
                    </>
                  ) : (
                    <span className="backpack-quick-empty">+</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section className="backpack-main-pocket">
          <div className="backpack-main-pocket__label">
            <span>Главное отделение</span>
            <small>зажми и перетащи</small>
          </div>

          <div className="backpack-grid">
            {layout.map((key, index) => {
              const stack = key ? stackMap[key] : null;
              const isSelected = stack && selectedKey === stack.key;
              const isDragging = stack && dragState?.started && dragState.key === stack.key && dragState.sourceType === "slot";
              const isDropTarget = dragState?.started && dragState.dropTarget === `slot:${index}`;

              return (
                <button
                  key={`slot-${index}`}
                  className={`backpack-slot${stack ? " filled" : " empty"}${isSelected ? " selected" : ""}${isDragging ? " dragging-source" : ""}${isDropTarget ? " drop-target" : ""}`}
                  type="button"
                  data-backpack-drop={`slot:${index}`}
                  onPointerDown={stack ? (event) => beginPointerDrag(event, stack.key, "slot", index) : undefined}
                  onPointerMove={stack ? updatePointerDrag : undefined}
                  onPointerUp={stack ? endPointerDrag : undefined}
                  onPointerCancel={stack ? cancelPointerDrag : undefined}
                  onClick={() => stack && setSelectedKey(stack.key)}
                  aria-label={stack ? `${stack.name}, ${stack.countLabel}` : `Пустая ячейка ${index + 1}`}
                >
                  <span className="backpack-slot-index">{String(index + 1).padStart(2, "0")}</span>
                  {stack && (
                    <>
                      <span className={`backpack-item-card category-${stack.category} quality-${QUALITY_CLASS[stack.qualityId] || "none"}`}>
                        <ItemArt stack={stack} />
                      </span>
                      {stack.quality && (
                        <span className={`backpack-quality-mark quality-${QUALITY_CLASS[stack.qualityId]}`}>
                          {stack.quality.icon}
                        </span>
                      )}
                      <span className="backpack-item-count">{stack.countLabel}</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section className={`backpack-inspector${selected ? " has-item" : ""}`}>
          {selected ? (
            <>
              <div className={`backpack-inspector-art category-${selected.category} quality-${QUALITY_CLASS[selected.qualityId] || "none"}`}>
                <ItemArt stack={selected} />
              </div>
              <div className="backpack-inspector-copy">
                <div className="backpack-inspector-meta">
                  <span>{selected.categoryLabel}</span>
                  {selected.quality && <b>{selected.quality.icon} {selected.quality.name}</b>}
                </div>
                <strong className="backpack-inspector-name">{selected.name}</strong>
                <p>{selected.description}</p>
                {selected.type === "harvest" && (
                  <small>
                    Цена: около {Math.round(selected.basePrice * QUALITY_PRICE_MULTIPLIERS[selected.qualityId])} монет за штуку
                  </small>
                )}
              </div>
              <div className="backpack-inspector-actions">
                <button className={`backpack-pin-button${selectedIsPinned ? " active" : ""}`} type="button" onClick={pinSelected}>
                  {selectedIsPinned ? "Снять" : "В карман"}
                </button>
                {selected.type === "harvest" && (
                  <button
                    className="backpack-delete-button"
                    type="button"
                    onClick={() => {
                      onDeleteQualityItem(selected.itemId, selected.qualityId, selected.count);
                      setSelectedKey(null);
                    }}
                  >
                    Выбросить
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="backpack-inspector-empty">
              <span>↕</span>
              <div>
                <strong>Разложи всё по-своему</strong>
                <p>Нажми на предмет для информации или перетащи его в другую ячейку.</p>
              </div>
            </div>
          )}
        </section>

        <div className="backpack-bottom-seam" aria-hidden="true" />
      </section>

      {dragState?.started && draggedStack && (
        <div
          className="backpack-drag-ghost"
          style={{ left: dragState.x, top: dragState.y }}
          aria-hidden="true"
        >
          <span className={`backpack-item-card category-${draggedStack.category} quality-${QUALITY_CLASS[draggedStack.qualityId] || "none"}`}>
            <ItemArt stack={draggedStack} />
          </span>
          <span>{draggedStack.countLabel}</span>
        </div>
      )}
    </div>
  );
}
