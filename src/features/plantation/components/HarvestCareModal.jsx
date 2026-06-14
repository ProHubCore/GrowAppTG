import "./HarvestCareModal.css";

const CARE_OPTIONS = [
  { id: "water", icon: "💧", title: "Чистая вода", description: "Бесплатно. Сокращает оставшееся время роста на 20%.", requiredTrust: 25, free: true },
  { id: "nutrition", icon: "🌿", title: "Питательный раствор", description: "Расходует 1 флакон. Повышает качество и добавляет +1 плод.", requiredTrust: 60 },
  { id: "joeMix", icon: "🧪", title: "Смесь Джо", description: "Расходует 1 флакон. Сильно повышает шанс отличного и редкого качества.", requiredTrust: 240 },
];

export default function HarvestCareModal({ isOpen, trust = 0, careInventory = {}, appliedCare = [], canApplyCare = true, onChoose, onRemovePlant, onClose }) {
  if (!isOpen) return null;
  const applied = Array.isArray(appliedCare) ? appliedCare : appliedCare ? [appliedCare] : [];

  return (
    <div className="care-modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="care-modal">
        <button type="button" className="care-modal-close" onClick={onClose}>×</button>
        <div className="care-modal-kicker">Набор ухода</div>
        <h2>Флаконы и полив</h2>
        <p className="care-modal-intro">За один цикл можно применить каждый вид ухода по одному разу. Эффекты складываются.</p>

        <div className="care-applied-line">
          <span>Применено:</span>
          <strong>{applied.length}/3</strong>
        </div>

        <div className="care-options">
          {CARE_OPTIONS.map((option) => {
            const locked = trust < option.requiredTrust;
            const amount = option.free ? null : (careInventory[option.id] || 0);
            const empty = !option.free && amount <= 0;
            const alreadyUsed = applied.includes(option.id);
            const disabled = !canApplyCare || locked || empty || alreadyUsed;

            return (
              <button key={option.id} type="button" className={`care-option${disabled ? " locked" : ""}${alreadyUsed ? " used" : ""}`} disabled={disabled} onClick={() => onChoose(option.id)}>
                <span className="care-option-icon">{option.icon}</span>
                <span className="care-option-copy">
                  <strong>{option.title}</strong>
                  <small>{option.description}</small>
                  {!canApplyCare ? <em>Уход доступен только на 1-й и 2-й стадии роста</em> : alreadyUsed ? <em>Уже применено в этом цикле</em> : locked ? <em>Откроется при {option.requiredTrust} доверия Джо</em> : !option.free ? <em>В запасе: {amount}</em> : <em>Всегда доступно</em>}
                </span>
              </button>
            );
          })}
        </div>

        <button type="button" className="care-acid-option" onClick={onRemovePlant}>
          <span>☣️</span>
          <span><strong>Кислотная вода</strong><small>Уничтожить текущее растение и освободить ёмкость.</small></span>
        </button>

        <button type="button" className="care-skip" onClick={onClose}>Закрыть набор ухода</button>
      </section>
    </div>
  );
}
