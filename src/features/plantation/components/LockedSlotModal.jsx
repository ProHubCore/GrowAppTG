import "./LockedSlotModal.css";

export default function LockedSlotModal({
  isOpen,
  currentLevel = 1,
  requiredLevel = null,
  onClose,
}) {
  if (!isOpen) return null;

  const safeCurrentLevel = Math.max(1, Math.floor(Number(currentLevel) || 1));
  const safeRequiredLevel = Number.isFinite(Number(requiredLevel))
    ? Math.max(1, Math.floor(Number(requiredLevel)))
    : null;
  const isLevelLocked =
    safeRequiredLevel !== null && safeCurrentLevel < safeRequiredLevel;
  const progress = isLevelLocked
    ? Math.max(8, Math.min(100, (safeCurrentLevel / safeRequiredLevel) * 100))
    : 100;

  return (
    <div
      className="locked-slot-overlay"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="locked-slot-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="locked-slot-title"
      >
        <header className="locked-slot-header">
          <span className="locked-slot-handle" aria-hidden="true" />
          <div>
            <span>Расширение плантации</span>
            <h2 id="locked-slot-title">Место закрыто</h2>
          </div>

          <button
            type="button"
            className="locked-slot-close"
            onClick={onClose}
            aria-label="Закрыть окно"
          >
            ×
          </button>
        </header>

        <div className="locked-slot-tray">
          <div className="locked-slot-emblem" aria-hidden="true">
            <span className="locked-slot-shackle" />
            <span className="locked-slot-lock">◆</span>
          </div>

          <div className="locked-slot-copy">
            <strong>
              {isLevelLocked
                ? `Откроется на ${safeRequiredLevel} уровне клуба`
                : "Место пока недоступно"}
            </strong>
            <p>
              {isLevelLocked
                ? "Повышай репутацию клуба продажами урожая — новое место откроется автоматически."
                : "Это расширение появится позже. Текущие места продолжат работать без ограничений."}
            </p>
          </div>
        </div>

        {isLevelLocked && (
          <div className="locked-slot-progress">
            <div className="locked-slot-levels">
              <span>Сейчас: {safeCurrentLevel}</span>
              <strong>Нужно: {safeRequiredLevel}</strong>
            </div>
            <div className="locked-slot-track" aria-hidden="true">
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <button type="button" className="locked-slot-confirm" onClick={onClose}>
          Понятно
        </button>
      </section>
    </div>
  );
}
