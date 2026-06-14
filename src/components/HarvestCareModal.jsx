import "./HarvestCareModal.css";

const CARE_OPTIONS = [
  {
    id: "water",
    icon: "💧",
    title: "Чистая вода",
    description: "Сразу сокращает оставшееся время роста на 20%.",
    requiredTrust: 60,
  },
  {
    id: "nutrition",
    icon: "🌿",
    title: "Питательный раствор",
    description: "Повышает качество урожая и гарантирует +1 плод.",
    requiredTrust: 25,
  },
  {
    id: "joeMix",
    icon: "🧪",
    title: "Смесь Джо",
    description: "Рискованный уход с повышенным шансом редкого урожая.",
    requiredTrust: 240,
  },
];

export default function HarvestCareModal({ isOpen, trust = 0, onChoose, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="care-modal-overlay" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="care-modal">
        <button type="button" className="care-modal-close" onClick={onClose}>×</button>
        <div className="care-modal-kicker">Один выбор на цикл</div>
        <h2>Как помочь растению?</h2>
        <p className="care-modal-intro">
          Растение вырастет и без ухода. Здесь ты выбираешь, какой результат тебе важнее.
        </p>

        <div className="care-options">
          {CARE_OPTIONS.map((option) => {
            const locked = trust < option.requiredTrust;
            return (
              <button
                key={option.id}
                type="button"
                className={`care-option${locked ? " locked" : ""}`}
                disabled={locked}
                onClick={() => onChoose(option.id)}
              >
                <span className="care-option-icon">{option.icon}</span>
                <span className="care-option-copy">
                  <strong>{option.title}</strong>
                  <small>{option.description}</small>
                  {locked && <em>Откроется при {option.requiredTrust} доверия Джо</em>}
                </span>
              </button>
            );
          })}
        </div>

        <button type="button" className="care-skip" onClick={onClose}>
          Оставить расти самостоятельно
        </button>
      </section>
    </div>
  );
}
