import { useState } from "react";

const INVENTORY_SIZE = 12;
const STACK_SIZE = 20;

const inventoryItems = {
  greenTomato: {
    itemId: "greenTomato",
    name: "Зелёный помидор",
    icon: "🍅",
  },

  psychomor: {
    itemId: "psychomor",
    name: "Плод Психомора",
    image:
      "/assets/plants/psychomor/psychomor-stage-3.png",
  },
};

function createItemStacks(
  itemId,
  amount
) {
  const item = inventoryItems[itemId];

  if (!item || amount <= 0) {
    return [];
  }

  const slots = [];

  const fullStacks = Math.floor(
    amount / STACK_SIZE
  );

  const remainder =
    amount % STACK_SIZE;

  for (
    let index = 0;
    index < fullStacks;
    index += 1
  ) {
    slots.push({
      ...item,
      id: `${itemId}-stack-${index}`,
      count: STACK_SIZE,
    });
  }

  if (remainder > 0) {
    slots.push({
      ...item,
      id: `${itemId}-stack-last`,
      count: remainder,
    });
  }

  return slots;
}

function InventoryItemIcon({
  slot,
  large = false,
}) {
  if (slot.image) {
    return (
      <img
        src={slot.image}
        alt={slot.name}
        draggable="false"
        style={{
          display: "block",
          width: large ? "70px" : "48px",
          height: large ? "70px" : "48px",
          objectFit: "contain",
          pointerEvents: "none",
        }}
      />
    );
  }

  return (
    <span
      style={{
        fontSize: large ? "46px" : "30px",
      }}
    >
      {slot.icon}
    </span>
  );
}

function InventoryModal({
  isOpen,
  inventory,
  onClose,
  onDeleteItem,
}) {
  const [
    selectedSlot,
    setSelectedSlot,
  ] = useState(null);

  if (!isOpen) {
    return null;
  }

  const slots = [
    ...createItemStacks(
      "greenTomato",
      inventory.greenTomato || 0
    ),

    ...createItemStacks(
      "psychomor",
      inventory.psychomor || 0
    ),
  ];

  while (
    slots.length < INVENTORY_SIZE
  ) {
    slots.push({
      id: `empty-${slots.length}`,
      empty: true,
    });
  }

  const visibleSlots = slots.slice(
    0,
    INVENTORY_SIZE
  );

  const closeInventory = () => {
    setSelectedSlot(null);
    onClose();
  };

  const closeSlotMenu = () => {
    setSelectedSlot(null);
  };

  const deleteSelectedSlot = () => {
    if (!selectedSlot) {
      return;
    }

    onDeleteItem(
      selectedSlot.itemId,
      selectedSlot.count
    );

    setSelectedSlot(null);
  };

  return (
    <div className="modal-overlay">
      <div className="inventory-modal">
        <button
          type="button"
          className="modal-close"
          onClick={closeInventory}
          aria-label="Закрыть инвентарь"
        >
          ×
        </button>

        <div className="modal-title">
          Инвентарь
        </div>

        <div className="modal-subtitle">
          Твои ресурсы и урожай
        </div>

        <div className="inventory-grid">
          {visibleSlots.map((slot) => (
            <button
              type="button"
              key={slot.id}
              className={
                slot.empty
                  ? "inventory-slot empty"
                  : "inventory-slot"
              }
              onClick={() => {
                if (!slot.empty) {
                  setSelectedSlot(slot);
                }
              }}
            >
              {!slot.empty && (
                <>
                  <InventoryItemIcon
                    slot={slot}
                  />

                  <div className="inventory-count">
                    x{slot.count}
                  </div>
                </>
              )}
            </button>
          ))}
        </div>

        <div className="inventory-hint">
          Нажми на предмет, чтобы открыть
          действия.
        </div>

        {selectedSlot && (
          <div className="inventory-action-panel">
            <div className="inventory-selected-item">
              <InventoryItemIcon
                slot={selectedSlot}
                large
              />

              <div>
                <div className="seed-name">
                  {selectedSlot.name}
                </div>

                <div className="seed-description">
                  Количество:{" "}
                  {selectedSlot.count}
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={closeSlotMenu}
              >
                Отмена
              </button>

              <button
                type="button"
                className="delete-button"
                onClick={
                  deleteSelectedSlot
                }
              >
                Удалить
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default InventoryModal;