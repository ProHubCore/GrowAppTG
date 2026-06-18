import "./HarvestCareModal.css";

const CARE_OPTIONS = [
  {
    id: "water",
    icon: "💧",
    title: "Старая лейка",
    description: "Один раз на каждой стадии роста мгновенно убирает 20% полной длительности этой стадии.",
    requiredTool: "wateringCan",
  },
  {
    id: "nutrition",
    icon: "🌿",
    title: "Питательный раствор",
    description: "Расходует 1 флакон. Повышает качество и добавляет +1 плод.",
    requiredTrust: 160,
  },
  {
    id: "mariaMix",
    icon: "🧪",
    title: "Смесь Марии Ивановны",
    description: "Расходует 1 флакон. Сильно повышает шанс отличного и редкого качества.",
    requiredTrust: 240,
  },
];

export default function HarvestCareModal({
  isOpen,
  trust = 0,
  careInventory = {},
  appliedCare = [],
  wateredStages = [],
  currentStage = 0,
  canApplyCare = true,
  onChoose,
  onRemovePlant,
  onClose,
}) {
  if (!isOpen) return null;

  const applied = Array.isArray(appliedCare)
    ? appliedCare
    : appliedCare
      ? [appliedCare]
      : [];

  const watered = Array.isArray(wateredStages)
    ? wateredStages.map(Number).filter((stage) => stage === 1 || stage === 2)
    : [];

  return (
    <div
      className="care-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="care-modal">
        <button type="button" className="care-modal-close" onClick={onClose}>×</button>
        <div className="care-modal-kicker">Набор ухода</div>
        <h2>Лейка и составы</h2>
        <p className="care-modal-intro">
          Лейку можно использовать отдельно на первой и второй стадии. Расходные составы применяются по одному разу за весь цикл.
        </p>

        <div className="care-applied-line">
          <span>Полито стадий:</span>
          <strong>{watered.length}/2</strong>
        </div>

        <div className="care-options">
          {CARE_OPTIONS.map((option) => {
            const isWater = option.id === "water";
            const lockedByTrust = trust < (option.requiredTrust || 0);
            const missingTool = Boolean(
              option.requiredTool && !(careInventory[option.requiredTool] > 0),
            );
            const amount = isWater ? null : (careInventory[option.id] || 0);
            const empty = !isWater && amount <= 0;
            const alreadyUsed = isWater
              ? watered.includes(Number(currentStage))
              : applied.includes(option.id);
            const disabled =
              !canApplyCare ||
              lockedByTrust ||
              missingTool ||
              empty ||
              alreadyUsed;

            const status = !canApplyCare
              ? "Уход доступен только на 1-й и 2-й стадии роста"
              : alreadyUsed && isWater
                ? `Стадия ${currentStage} уже полита`
                : alreadyUsed
                  ? "Уже применено в этом цикле"
                  : missingTool
                    ? "Сначала купи лейку у Зорика"
                    : lockedByTrust
                      ? `Откроется при ${option.requiredTrust} доверия Марии Ивановны`
                      : isWater
                        ? `Можно полить стадию ${currentStage}`
                        : `В запасе: ${amount}`;

            return (
              <button
                key={option.id}
                type="button"
                className={`care-option${disabled ? " locked" : ""}${alreadyUsed ? " used" : ""}`}
                disabled={disabled}
                onClick={() => onChoose(option.id)}
              >
                <span className="care-option-icon">{option.icon}</span>
                <span className="care-option-copy">
                  <strong>{option.title}</strong>
                  <small>{option.description}</small>
                  <em>{status}</em>
                </span>
              </button>
            );
          })}
        </div>

        <button type="button" className="care-acid-option" onClick={onRemovePlant}>
          <span>☣️</span>
          <span>
            <strong>Кислотная вода</strong>
            <small>Уничтожить текущее растение и освободить ёмкость.</small>
          </span>
        </button>

        <button type="button" className="care-skip" onClick={onClose}>
          Закрыть набор ухода
        </button>
      </section>
    </div>
  );
}
