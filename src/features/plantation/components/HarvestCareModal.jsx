import { useEffect, useMemo, useState } from "react";
import "./HarvestCareModal.css";

const CARE_ITEMS = [
  {
    id: "nutrition",
    inventoryKey: "nutrition",
    icon: "🌿",
    title: "Питательный раствор",
    shortTitle: "Питательный раствор",
    description:
      "Минеральный раствор для растения. Повышает качество урожая и добавляет один плод при сборе.",
    actionLabel: "Использовать флакон",
    tone: "nutrition",
  },
  {
    id: "mariaMix",
    inventoryKey: "mariaMix",
    icon: "🧪",
    title: "Смесь Марии Ивановны",
    shortTitle: "Смесь Марии",
    description:
      "Редкая смесь Марии Ивановны. Сильно повышает шанс отличного и редкого качества урожая.",
    actionLabel: "Использовать смесь",
    tone: "maria",
  },
  {
    id: "acidWater",
    inventoryKey: "acidWater",
    icon: "☣",
    title: "Кислотная вода",
    shortTitle: "Кислотная вода",
    description:
      "Опасная жидкость для аварийной очистки. Полностью уничтожает растение и освобождает ёмкость.",
    actionLabel: "Уничтожить растение",
    tone: "acid",
    destructive: true,
  },
];

function getPluralAmount(amount) {
  const safeAmount = Math.max(0, Number(amount) || 0);
  const mod10 = safeAmount % 10;
  const mod100 = safeAmount % 100;

  if (mod10 === 1 && mod100 !== 11) return `${safeAmount} предмет`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${safeAmount} предмета`;
  }

  return `${safeAmount} предметов`;
}

export default function HarvestCareModal({
  isOpen,
  careInventory = {},
  appliedCare = [],
  canApplyCare = true,
  onChoose,
  onRemovePlant,
  onClose,
}) {
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (!isOpen) setSelectedId(null);
  }, [isOpen]);

  const applied = Array.isArray(appliedCare)
    ? appliedCare
    : appliedCare
      ? [appliedCare]
      : [];

  const availableItems = useMemo(
    () =>
      CARE_ITEMS.map((item) => ({
        ...item,
        amount: Math.max(0, Number(careInventory[item.inventoryKey]) || 0),
      })).filter((item) => item.amount > 0),
    [careInventory],
  );

  const selectedItem =
    availableItems.find((item) => item.id === selectedId) || null;

  const getItemState = (item) => {
    if (!item) {
      return {
        disabled: true,
        status: "Предмет недоступен.",
      };
    }

    if (item.destructive) {
      return {
        disabled: false,
        status: "Растение будет уничтожено без возможности восстановления.",
      };
    }

    const alreadyUsed = applied.includes(item.id);

    if (!canApplyCare) {
      return {
        disabled: true,
        status: "Уход можно применять только на первой и второй стадии роста.",
      };
    }

    if (alreadyUsed) {
      return {
        disabled: true,
        status: "Этот предмет уже применён в текущем цикле.",
      };
    }

    return {
      disabled: false,
      status: `В наличии: ${item.amount}. После применения спишется один предмет.`,
    };
  };

  if (!isOpen) return null;

  const selectedState = getItemState(selectedItem);

  const handleConfirm = () => {
    if (!selectedItem || selectedState.disabled) return;

    if (selectedItem.destructive) {
      setSelectedId(null);
      onRemovePlant();
      return;
    }

    onChoose(selectedItem.id);
    setSelectedId(null);
    onClose();
  };

  return (
    <div
      className="care-modal-overlay"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="care-modal" aria-label="Набор для ухода">
        <header className="care-modal-header">
          <div className="care-modal-header__handle" aria-hidden="true" />
          <h2>Набор для ухода</h2>

          <button
            type="button"
            className="care-modal-close"
            onClick={onClose}
            aria-label="Закрыть набор для ухода"
          >
            ×
          </button>
        </header>

        <div className="care-case-tray">
          {availableItems.length > 0 ? (
            <div className="care-item-grid">
              {availableItems.map((item) => {
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`care-item-card care-item-card--${item.tone}`}
                    onClick={() => {
                      if (item.destructive) {
                        onRemovePlant();
                        return;
                      }

                      setSelectedId(item.id);
                    }}
                    aria-label={`${item.title}. В наличии ${item.amount}`}
                  >
                    <span className="care-item-card__amount">
                      ×{item.amount}
                    </span>

                    <span className="care-item-card__visual" aria-hidden="true">
                      <span className="care-item-card__glow" />
                      <span className="care-item-card__icon">{item.icon}</span>
                    </span>

                    <strong>{item.shortTitle}</strong>
                    <small>Нажми, чтобы открыть</small>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="care-empty-state">
              <span aria-hidden="true">◇</span>
              <strong>Предметов ухода нет</strong>
              <small>
                Специальные растворы появятся здесь после покупки или получения.
              </small>
            </div>
          )}
        </div>
      </section>

      {selectedItem && (
        <div
          className="care-item-dialog-overlay"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) setSelectedId(null);
          }}
        >
          <section
            className={`care-item-dialog care-item-dialog--${selectedItem.tone}`}
            aria-label={selectedItem.title}
          >
            <div className="care-item-dialog__visual" aria-hidden="true">
              <span>{selectedItem.icon}</span>
            </div>

            <div className="care-item-dialog__amount">
              {getPluralAmount(selectedItem.amount)}
            </div>

            <h3>{selectedItem.title}</h3>
            <p>{selectedItem.description}</p>

            <div
              className={`care-item-dialog__status${
                selectedState.disabled ? " is-disabled" : ""
              }${selectedItem.destructive ? " is-danger" : ""}`}
            >
              {selectedState.status}
            </div>

            <div className="care-item-dialog__actions">
              <button
                type="button"
                className="care-item-dialog__cancel"
                onClick={() => setSelectedId(null)}
              >
                Отмена
              </button>

              <button
                type="button"
                className={`care-item-dialog__confirm${
                  selectedItem.destructive ? " is-danger" : ""
                }`}
                disabled={selectedState.disabled}
                onClick={handleConfirm}
              >
                {selectedItem.actionLabel}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
