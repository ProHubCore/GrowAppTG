import { useState } from "react";

import { CROPS } from "../../plantation/data/crops";
import { HARVEST_QUALITIES } from "../../plantation/data/harvestQuality";
import {
  QUALITY_PRICE_MULTIPLIERS,
  getQualityAmount,
} from "../../plantation/data/qualityInventory";

const ITEMS = Object.fromEntries(
  CROPS.map((crop) => [
    crop.id,
    {
      name: crop.name,
      icon: crop.icon,
      image: crop.stages.at(-1)?.image,
      basePrice: crop.basePrice,
    },
  ]),
);

function ItemArt({ item, size = 48 }) {
  if (item.image) {
    return <img src={item.image} alt={item.name} style={{ width: size, height: size, objectFit: "contain" }} />;
  }
  return <span style={{ fontSize: size * 0.64 }}>{item.icon}</span>;
}

export default function InventoryModal({
  isOpen,
  qualityInventory = {},
  onClose,
  onDeleteQualityItem,
}) {
  const [selected, setSelected] = useState(null);
  if (!isOpen) return null;

  const stacks = [];
  Object.entries(ITEMS).forEach(([itemId, item]) => {
    HARVEST_QUALITIES.forEach((quality) => {
      const count = getQualityAmount(qualityInventory, itemId, quality.id);
      if (count > 0) stacks.push({ itemId, qualityId: quality.id, count, item, quality });
    });
  });

  return (
    <div className="modal-overlay">
      <div className="inventory-modal">
        <button
          className="modal-close"
          type="button"
          onClick={() => {
            setSelected(null);
            onClose();
          }}
        >
          ×
        </button>
        <div className="modal-title">Инвентарь качества</div>
        <div className="modal-subtitle">Каждое качество хранится и продаётся отдельно</div>

        <div className="inventory-grid">
          {Array.from({ length: 12 }, (_, index) => stacks[index] || null).map((stack, index) => (
            <button
              key={stack ? `${stack.itemId}-${stack.qualityId}` : `empty-${index}`}
              className={stack ? "inventory-slot" : "inventory-slot empty"}
              type="button"
              onClick={() => stack && setSelected(stack)}
            >
              {stack && (
                <>
                  <ItemArt item={stack.item} />
                  <span style={{ position: "absolute", left: 4, top: 4, fontSize: 11 }}>
                    {stack.quality.icon}
                  </span>
                  <div className="inventory-count">x{stack.count}</div>
                </>
              )}
            </button>
          ))}
        </div>

        <div className="inventory-hint">Качество повышает цену и репутацию при продаже клубу.</div>

        {selected && (
          <div className="inventory-action-panel">
            <div className="inventory-selected-item">
              <ItemArt item={selected.item} size={62} />
              <div>
                <div className="seed-name">{selected.item.name}</div>
                <div className="seed-description">
                  {selected.quality.icon} {selected.quality.name} · x{selected.count}
                </div>
                <div className="seed-description">
                  Ориентир цены: {Math.round(selected.item.basePrice * QUALITY_PRICE_MULTIPLIERS[selected.qualityId])} монет/шт.
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="cancel-button" type="button" onClick={() => setSelected(null)}>Отмена</button>
              <button
                className="delete-button"
                type="button"
                onClick={() => {
                  onDeleteQualityItem(selected.itemId, selected.qualityId, selected.count);
                  setSelected(null);
                }}
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
