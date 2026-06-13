import { useState } from "react";

function InventoryModal({ isOpen, inventory, onClose, onDeleteItem }) {
  const [selectedSlot, setSelectedSlot] = useState(null);

  if (!isOpen) return null;

  const tomatoes = inventory.greenTomato || 0;
  const stackSize = 20;
  const fullStacks = Math.floor(tomatoes / stackSize);
  const remainder = tomatoes % stackSize;

  const slots = [];

  for (let i = 0; i < fullStacks; i += 1) {
    slots.push({
      id: `tomato-stack-${i}`,
      itemId: "greenTomato",
      name: "Зелёный помидор",
      icon: "🍅",
      count: stackSize,
    });
  }

  if (remainder > 0) {
    slots.push({
      id: "tomato-stack-last",
      itemId: "greenTomato",
      name: "Зелёный помидор",
      icon: "🍅",
      count: remainder,
    });
  }

  while (slots.length < 12) {
    slots.push({
      id: `empty-${slots.length}`,
      empty: true,
    });
  }

  const closeSlotMenu = () => {
    setSelectedSlot(null);
  };

  const deleteSelectedSlot = () => {
    if (!selectedSlot) return;

    onDeleteItem(selectedSlot.itemId, selectedSlot.count);
    setSelectedSlot(null);
  };

  return (
    <div className="modal-overlay">
      <div className="inventory-modal">
        <button
          className="modal-close"
          onClick={() => {
            setSelectedSlot(null);
            onClose();
          }}
        >
          ×
        </button>

        <div className="modal-title">Инвентарь</div>
        <div className="modal-subtitle">Твои ресурсы и урожай</div>

        <div className="inventory-grid">
          {slots.map((slot) => (
            <button
              key={slot.id}
              className={`inventory-slot ${slot.empty ? "empty" : ""}`}
              disabled={slot.empty}
              onClick={() => {
                if (!slot.empty) {
                  setSelectedSlot(slot);
                }
              }}
            >
              {!slot.empty && (
                <>
                  <div className="inventory-icon">{slot.icon}</div>
                  <div className="inventory-count">x{slot.count}</div>
                </>
              )}
            </button>
          ))}
        </div>

        <div className="inventory-hint">
          Нажми на предмет, чтобы открыть действия.
        </div>

        {selectedSlot && (
          <div className="slot-action-panel">
            <div className="slot-action-title">
              {selectedSlot.icon} {selectedSlot.name} x{selectedSlot.count}
            </div>

            <div className="slot-action-buttons">
              <button className="cancel-button" onClick={closeSlotMenu}>
                Отмена
              </button>

              <button className="remove-button" onClick={deleteSelectedSlot}>
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