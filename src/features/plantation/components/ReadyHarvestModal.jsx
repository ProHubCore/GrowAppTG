import "./ReadyHarvestModal.css";

export default function ReadyHarvestModal({
  isOpen,
  readyCount = 0,
  onContinue,
}) {
  if (!isOpen) return null;

  const safeCount = Math.max(1, Math.floor(Number(readyCount) || 1));

  return (
    <div className="ready-harvest-overlay">
      <section
        className="ready-harvest-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ready-harvest-title"
      >
        <header className="ready-harvest-header">
          <span className="ready-harvest-handle" aria-hidden="true" />
          <span>Плантация</span>
          <h2 id="ready-harvest-title">Урожай созрел</h2>
        </header>

        <div className="ready-harvest-tray">
          <div className="ready-harvest-emblem" aria-hidden="true">
            <span className="ready-harvest-glow" />
            <span className="ready-harvest-crate">☘</span>
          </div>

          <div className="ready-harvest-copy">
            <strong>
              {safeCount === 1
                ? "Одно растение готово"
                : `Готово растений: ${safeCount}`}
            </strong>
            <p>Урожай дождался тебя и не пропал.</p>
          </div>
        </div>

        <button
          type="button"
          className="ready-harvest-continue"
          onClick={onContinue}
        >
          Продолжить
        </button>
      </section>
    </div>
  );
}
