import { useEffect, useMemo, useRef, useState } from "react";

import { CROPS } from "../../plantation/data/crops";
import { HARVEST_QUALITIES } from "../../plantation/data/harvestQuality";
import {
  QUALITY_PRICE_MULTIPLIERS,
  getQualityAmount,
} from "../../plantation/data/qualityInventory";
import "./InventoryModal.css";

const SLOT_COUNT = 20;
const LAYOUT_STORAGE_KEY = "growapp-backpack-layout-v3";
const LEGACY_LAYOUT_STORAGE_KEY = "growapp-backpack-layout-v2";
const LEGACY_QUICK_STORAGE_KEY = "growapp-backpack-quick-v2";

const CATEGORY_TABS = [
  { id: "harvest", label: "Урожай", icon: "✦" },
  { id: "seed", label: "Семена", icon: "🌱" },
  { id: "care", label: "Расходники", icon: "🧪" },
];

const QUALITY_CLASS = {
  normal: "normal",
  good: "good",
  excellent: "excellent",
  rare: "rare",
};

const CROP_SORT_INDEX = Object.fromEntries(
  CROPS.map((crop, index) => [crop.id, index]),
);

const CONSUMABLE_ITEMS = {
  nutrition: {
    name: "Питательный раствор",
    icon: "🌿",
    description:
      "Насыщает растение минералами: повышает шанс хорошего, отличного и редкого качества и добавляет ещё одну единицу к урожаю.",
  },
  mariaMix: {
    name: "Смесь Марьи Ивановны",
    icon: "🧪",
    description:
      "Фирменная смесь Марьи Ивановны. Сильно повышает шанс отличного и редкого качества. Особенно хорошо работает вместе с питательным раствором.",
  },
  acidWater: {
    name: "Кислотная вода",
    icon: "☣",
    description:
      "Опасный одноразовый флакон. Полностью уничтожает текущее растение и освобождает ёмкость.",
  },
};

function createEmptyLayouts() {
  return Object.fromEntries(
    CATEGORY_TABS.map(({ id }) => [
      id,
      Array.from({ length: SLOT_COUNT }, () => null),
    ]),
  );
}

function readStoredLayout() {
  try {
    const current = JSON.parse(
      localStorage.getItem(LAYOUT_STORAGE_KEY) || "null",
    );
    if (current && typeof current === "object" && !Array.isArray(current))
      return current;

    const legacy = JSON.parse(
      localStorage.getItem(LEGACY_LAYOUT_STORAGE_KEY) || "null",
    );
    return Array.isArray(legacy) ? { legacy } : null;
  } catch {
    return null;
  }
}

function writeStoredLayout(value) {
  try {
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Инвентарь продолжит работать и без доступа к localStorage.
  }
}

function reconcileCategoryOrder(previousOrder, availableKeys) {
  const validKeys = new Set(availableKeys);
  const used = new Set();
  const next = Array.from({ length: SLOT_COUNT }, () => null);

  (Array.isArray(previousOrder) ? previousOrder : [])
    .slice(0, SLOT_COUNT)
    .forEach((key, index) => {
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

function reconcileLayouts(previous, stacks) {
  const next = createEmptyLayouts();
  const legacyOrder = Array.isArray(previous?.legacy) ? previous.legacy : [];

  CATEGORY_TABS.forEach(({ id }) => {
    const availableKeys = stacks
      .filter((stack) => stack.category === id)
      .map((stack) => stack.key);
    const previousOrder = Array.isArray(previous?.[id])
      ? previous[id]
      : legacyOrder.filter((key) => availableKeys.includes(key));

    next[id] = reconcileCategoryOrder(previousOrder, availableKeys);
  });

  return next;
}

function ItemArt({ stack }) {
  if (stack.image) {
    return (
      <img
        className="backpack-item-image"
        src={stack.image}
        alt={stack.name}
        draggable="false"
      />
    );
  }

  return <span className="backpack-item-emoji">{stack.icon}</span>;
}

function buildStacks({ qualityInventory, seedInventory, careInventory }) {
  const stacks = [];

  Object.entries(CONSUMABLE_ITEMS).forEach(([itemId, meta]) => {
    const count = Math.max(0, Number(careInventory[itemId]) || 0);
    if (count <= 0) return;

    stacks.push({
      key: `care:${itemId}`,
      type: "care",
      category: "care",
      categoryLabel: "Расходник",
      itemId,
      count,
      countLabel: `x${count}`,
      name: meta.name,
      icon: meta.icon,
      image: null,
      description: meta.description,
      sortRank: itemId === "mariaMix" ? 1 : 0,
    });
  });

  CROPS.forEach((crop) => {
    const count = crop.infiniteSeeds
      ? Infinity
      : Math.max(0, Number(seedInventory[crop.id]) || 0);
    if (!crop.infiniteSeeds && count <= 0) return;

    stacks.push({
      key: `seed:${crop.id}`,
      type: "seed",
      category: "seed",
      categoryLabel: "Семена",
      itemId: crop.id,
      count,
      countLabel: crop.infiniteSeeds ? "∞" : `x${count}`,
      name: crop.name,
      icon: crop.icon,
      image: crop.seedImage || crop.stages[0]?.image,
      description: crop.infiniteSeeds
        ? `${crop.description} Базовый запас этих семян не заканчивается.`
        : `${crop.description} Посади семена в свободное ведро.`,
      cropSortRank: CROP_SORT_INDEX[crop.id] ?? Number.MAX_SAFE_INTEGER,
      sortRank: crop.requiredTrust || 0,
    });
  });

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
        description: crop.description,
        basePrice: crop.basePrice,
        cropSortRank: CROP_SORT_INDEX[crop.id] ?? Number.MAX_SAFE_INTEGER,
        qualitySortRank: quality.rank,
        sortRank: quality.rank,
      });
    });
  });

  return stacks;
}

function getDropTarget(clientX, clientY) {
  const element = document.elementFromPoint(clientX, clientY);
  return (
    element?.closest?.("[data-backpack-drop]")?.dataset.backpackDrop || null
  );
}

export default function InventoryModal({
  isOpen,
  qualityInventory = {},
  seedInventory = {},
  careInventory = {},
  appliedCare = [],
  canPlantSeed = false,
  canUseCare = false,
  canUseAcidWater = false,
  onPlantSeed,
  onUseCare,
  onClose,
  onDeleteQualityItem,
  onDeleteSeedItem,
  onDeleteCareItem,
}) {
  const stacks = useMemo(
    () => buildStacks({ qualityInventory, seedInventory, careInventory }),
    [qualityInventory, seedInventory, careInventory],
  );
  const stackMap = useMemo(
    () => Object.fromEntries(stacks.map((stack) => [stack.key, stack])),
    [stacks],
  );

  const [layouts, setLayouts] = useState(() =>
    reconcileLayouts(readStoredLayout(), stacks),
  );
  const [activeCategory, setActiveCategory] = useState("harvest");
  const [selectedKey, setSelectedKey] = useState(null);
  const [deleteConfirmKey, setDeleteConfirmKey] = useState(null);
  const [dragState, setDragState] = useState(null);

  const dragRef = useRef(null);
  const dragGhostRef = useRef(null);
  const dragFrameRef = useRef(null);
  const dragPositionRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setLayouts((previous) => reconcileLayouts(previous, stacks));
      setSelectedKey((previous) =>
        previous && stackMap[previous] ? previous : null,
      );
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [stacks, stackMap]);

  useEffect(() => {
    writeStoredLayout(layouts);
  }, [layouts]);

  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_QUICK_STORAGE_KEY);
    } catch {
      // Ничего страшного, если хранилище недоступно.
    }
  }, []);

  useEffect(
    () => () => {
      if (dragFrameRef.current) cancelAnimationFrame(dragFrameRef.current);
    },
    [],
  );

  if (!isOpen) return null;

  const activeLayout =
    layouts[activeCategory] || createEmptyLayouts()[activeCategory];
  const selected = selectedKey ? stackMap[selectedKey] : null;
  const draggedStack = dragState?.key ? stackMap[dragState.key] : null;

  const closeInventory = () => {
    dragRef.current = null;
    setDragState(null);
    setSelectedKey(null);
    setDeleteConfirmKey(null);
    onClose();
  };

  const switchCategory = (categoryId) => {
    setActiveCategory(categoryId);
    setSelectedKey(null);
    setDeleteConfirmKey(null);
    dragRef.current = null;
    setDragState(null);
  };

  const moveToSlot = (key, targetIndex) => {
    setLayouts((previous) => {
      const current = [...(previous[activeCategory] || [])];
      const sourceIndex = current.indexOf(key);
      if (sourceIndex === -1 || sourceIndex === targetIndex) return previous;

      const targetKey = current[targetIndex] || null;
      current[targetIndex] = key;
      current[sourceIndex] = targetKey;

      const next = { ...previous, [activeCategory]: current };
      writeStoredLayout(next);
      return next;
    });
  };

  const handleDrop = (drag, dropTarget) => {
    if (!dropTarget?.startsWith("slot:")) return;
    const targetIndex = Number(dropTarget.split(":")[1]);
    if (
      !Number.isInteger(targetIndex) ||
      targetIndex < 0 ||
      targetIndex >= SLOT_COUNT
    )
      return;
    moveToSlot(drag.key, targetIndex);
  };

  const positionDragGhost = (x, y) => {
    dragPositionRef.current = { x, y };
    if (dragFrameRef.current) return;

    dragFrameRef.current = requestAnimationFrame(() => {
      dragFrameRef.current = null;
      const ghost = dragGhostRef.current;
      if (!ghost) return;
      const position = dragPositionRef.current;
      ghost.style.transform = `translate3d(${position.x}px, ${position.y}px, 0) translate(-50%, -55%) rotate(2deg) scale(1.04)`;
    });
  };

  const beginPointerDrag = (event, key, sourceIndex) => {
    if (event.button !== undefined && event.button !== 0) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = {
      key,
      sourceIndex,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      started: false,
      dropTarget: null,
    };
  };

  const updatePointerDrag = (event) => {
    const current = dragRef.current;
    if (!current || current.pointerId !== event.pointerId) return;

    const distance = Math.hypot(
      event.clientX - current.startX,
      event.clientY - current.startY,
    );
    if (!current.started && distance <= 8) return;

    event.preventDefault();
    const dropTarget = getDropTarget(event.clientX, event.clientY);

    if (!current.started) {
      current.started = true;
      current.dropTarget = dropTarget;
      setDragState({
        key: current.key,
        sourceIndex: current.sourceIndex,
        dropTarget,
      });
    } else if (current.dropTarget !== dropTarget) {
      current.dropTarget = dropTarget;
      setDragState((previous) =>
        previous ? { ...previous, dropTarget } : previous,
      );
    }

    positionDragGhost(event.clientX, event.clientY);
  };

  const endPointerDrag = (event) => {
    const current = dragRef.current;
    if (!current || current.pointerId !== event.pointerId) return;

    if (current.started) {
      handleDrop(current, getDropTarget(event.clientX, event.clientY));
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
    const sortedKeys = stacks
      .filter((stack) => stack.category === activeCategory)
      .sort((left, right) => {
        if (activeCategory === "harvest") {
          const cropDifference =
            (left.cropSortRank ?? Number.MAX_SAFE_INTEGER) -
            (right.cropSortRank ?? Number.MAX_SAFE_INTEGER);
          if (cropDifference !== 0) return cropDifference;

          const qualityDifference =
            (left.qualitySortRank ?? Number.MAX_SAFE_INTEGER) -
            (right.qualitySortRank ?? Number.MAX_SAFE_INTEGER);
          if (qualityDifference !== 0) return qualityDifference;
        }

        if (activeCategory === "seed") {
          const cropDifference =
            (left.cropSortRank ?? Number.MAX_SAFE_INTEGER) -
            (right.cropSortRank ?? Number.MAX_SAFE_INTEGER);
          if (cropDifference !== 0) return cropDifference;
        }

        if (left.sortRank !== right.sortRank)
          return left.sortRank - right.sortRank;
        return left.name.localeCompare(right.name, "ru");
      })
      .map((stack) => stack.key);

    setLayouts((previous) => {
      const next = {
        ...previous,
        [activeCategory]: [
          ...sortedKeys,
          ...Array.from(
            { length: Math.max(0, SLOT_COUNT - sortedKeys.length) },
            () => null,
          ),
        ].slice(0, SLOT_COUNT),
      };
      writeStoredLayout(next);
      return next;
    });
  };

  const selectedCareAlreadyApplied =
    selected?.type === "care" && appliedCare.includes(selected.itemId);
  const canUseSelectedCare =
    selected?.itemId === "acidWater"
      ? canUseAcidWater
      : canUseCare && !selectedCareAlreadyApplied;
  const selectedHarvestPrice =
    selected?.type === "harvest"
      ? Math.round(
          selected.basePrice * QUALITY_PRICE_MULTIPLIERS[selected.qualityId],
        )
      : null;

  const canDiscardSelected = Boolean(
    selected && !(selected.type === "seed" && !Number.isFinite(selected.count)),
  );

  const requestDeleteSelected = () => {
    if (!selected || !canDiscardSelected) return;
    setDeleteConfirmKey(selected.key);
  };

  const confirmDeleteSelected = () => {
    const item = deleteConfirmKey ? stackMap[deleteConfirmKey] : null;
    if (!item || (item.type === "seed" && !Number.isFinite(item.count))) {
      setDeleteConfirmKey(null);
      return;
    }

    if (item.type === "harvest") {
      onDeleteQualityItem?.(item.itemId, item.qualityId, item.count);
    } else if (item.type === "seed") {
      onDeleteSeedItem?.(item.itemId, item.count);
    } else if (item.type === "care") {
      onDeleteCareItem?.(item.itemId, item.count);
    }

    setDeleteConfirmKey(null);
    setSelectedKey(null);
  };

  return (
    <div
      className="modal-overlay backpack-inventory-overlay"
      onPointerUp={endPointerDrag}
      onPointerCancel={cancelPointerDrag}
    >
      <section className="backpack-inventory" aria-label="Рюкзак">
        <div className="backpack-top-flap" aria-hidden="true">
          <span className="backpack-top-flap__stitch" />
          <span className="backpack-top-flap__buckle backpack-top-flap__buckle--left" />
          <span className="backpack-top-flap__buckle backpack-top-flap__buckle--right" />
        </div>

        <header className="backpack-header">
          <h2 className="backpack-title">Рюкзак</h2>
        </header>

        <nav className="backpack-tabs" aria-label="Разделы рюкзака">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              className={`backpack-tab${activeCategory === tab.id ? " active" : ""}`}
              type="button"
              onClick={() => switchCategory(tab.id)}
            >
              <span className="backpack-tab-icon">{tab.icon}</span>
              <span className="backpack-tab-label">{tab.label}</span>
            </button>
          ))}
        </nav>

        <section className="backpack-main-pocket">
          <div className="backpack-grid">
            {activeLayout.map((key, index) => {
              const stack = key ? stackMap[key] : null;
              const isSelected = stack && selectedKey === stack.key;
              const isDragging = stack && dragState?.key === stack.key;
              const isDropTarget = dragState?.dropTarget === `slot:${index}`;

              return (
                <button
                  key={`${activeCategory}-slot-${index}`}
                  className={`backpack-slot${stack ? " filled" : " empty"}${isSelected ? " selected" : ""}${isDragging ? " dragging-source" : ""}${isDropTarget ? " drop-target" : ""}`}
                  type="button"
                  data-backpack-drop={`slot:${index}`}
                  onPointerDown={
                    stack
                      ? (event) => beginPointerDrag(event, stack.key, index)
                      : undefined
                  }
                  onPointerMove={stack ? updatePointerDrag : undefined}
                  onPointerUp={stack ? endPointerDrag : undefined}
                  onPointerCancel={stack ? cancelPointerDrag : undefined}
                  aria-label={
                    stack
                      ? `${stack.name}, ${stack.countLabel}`
                      : `Пустая ячейка ${index + 1}`
                  }
                >
                  <span className="backpack-slot-index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {stack && (
                    <>
                      <span
                        className={`backpack-item-card category-${stack.category} quality-${QUALITY_CLASS[stack.qualityId] || "none"}`}
                      >
                        <ItemArt stack={stack} />
                      </span>
                      {stack.quality && (
                        <span
                          className={`backpack-quality-mark quality-${QUALITY_CLASS[stack.qualityId]}`}
                        >
                          {stack.quality.icon}
                        </span>
                      )}
                      <span className="backpack-item-count">
                        {stack.countLabel}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <footer className="backpack-bottom-actions">
          <button
            className="backpack-sort-button"
            type="button"
            onClick={autoSort}
          >
            <span aria-hidden="true">⇅</span>
            Сортировать
          </button>

          <button
            className="backpack-close-bottom"
            type="button"
            onClick={closeInventory}
          >
            Закрыть рюкзак
          </button>
        </footer>

        {selected && (
          <div
            className="backpack-item-modal-layer"
            role="presentation"
            onPointerDown={(event) => {
              event.stopPropagation();
              if (event.target === event.currentTarget) setSelectedKey(null);
            }}
            onPointerUp={(event) => event.stopPropagation()}
          >
            <section
              className={`backpack-item-modal category-${selected.category} quality-${QUALITY_CLASS[selected.qualityId] || "none"}`}
              role="dialog"
              aria-modal="true"
              aria-labelledby="backpack-item-modal-title"
            >
              <button
                className="backpack-item-modal-close"
                type="button"
                onClick={() => setSelectedKey(null)}
                aria-label="Закрыть информацию о предмете"
              >
                ×
              </button>

              <div className="backpack-item-modal-art">
                <ItemArt stack={selected} />
                <span className="backpack-item-modal-count">
                  {selected.countLabel}
                </span>
              </div>

              <h3
                id="backpack-item-modal-title"
                className="backpack-item-modal-title"
              >
                {selected.name}
              </h3>

              <p className="backpack-item-modal-description">
                {selected.description}
              </p>

              {selected.type === "harvest" && (
                <div className="backpack-item-modal-stats">
                  <div>
                    <span>Качество</span>
                    <strong
                      className={`quality-${QUALITY_CLASS[selected.qualityId]}`}
                    >
                      {selected.quality.icon} {selected.quality.name}
                    </strong>
                  </div>
                  <div>
                    <span>Ориентир цены</span>
                    <strong>{selectedHarvestPrice} монет за штуку</strong>
                  </div>
                </div>
              )}

              <div className="backpack-item-modal-actions">
                {selected.type === "seed" && (
                  <button
                    className="backpack-item-modal-primary"
                    type="button"
                    disabled={!canPlantSeed}
                    onClick={() => onPlantSeed?.(selected.itemId)}
                  >
                    Посадить
                  </button>
                )}

                {selected.type === "care" && (
                  <button
                    className="backpack-item-modal-primary"
                    type="button"
                    disabled={!canUseSelectedCare}
                    onClick={() => onUseCare?.(selected.itemId)}
                  >
                    Использовать
                  </button>
                )}

                {selected.type === "harvest" && (
                  <button
                    className="backpack-item-modal-secondary"
                    type="button"
                    onClick={() => setSelectedKey(null)}
                  >
                    Закрыть
                  </button>
                )}

                {canDiscardSelected && (
                  <button
                    className="backpack-item-modal-delete"
                    type="button"
                    onClick={requestDeleteSelected}
                  >
                    Выбросить
                  </button>
                )}
              </div>

              {deleteConfirmKey === selected.key && (
                <div
                  className="backpack-delete-confirm-layer"
                  role="presentation"
                >
                  <section
                    className="backpack-delete-confirm"
                    role="alertdialog"
                    aria-modal="true"
                    aria-labelledby="backpack-delete-confirm-title"
                  >
                    <div
                      className="backpack-delete-confirm-icon"
                      aria-hidden="true"
                    >
                      !
                    </div>
                    <h4 id="backpack-delete-confirm-title">
                      Выбросить предмет?
                    </h4>
                    <p>
                      «{selected.name}» {selected.countLabel}. Вернуть его после
                      удаления уже не получится.
                    </p>
                    <div className="backpack-delete-confirm-actions">
                      <button
                        className="backpack-item-modal-secondary"
                        type="button"
                        onClick={() => setDeleteConfirmKey(null)}
                      >
                        Отмена
                      </button>
                      <button
                        className="backpack-item-modal-delete"
                        type="button"
                        onClick={confirmDeleteSelected}
                      >
                        Выбросить
                      </button>
                    </div>
                  </section>
                </div>
              )}
            </section>
          </div>
        )}
      </section>

      {dragState && draggedStack && (
        <div
          ref={dragGhostRef}
          className="backpack-drag-ghost"
          aria-hidden="true"
        >
          <span
            className={`backpack-item-card category-${draggedStack.category} quality-${QUALITY_CLASS[draggedStack.qualityId] || "none"}`}
          >
            <ItemArt stack={draggedStack} />
          </span>
          <span>{draggedStack.countLabel}</span>
        </div>
      )}
    </div>
  );
}
