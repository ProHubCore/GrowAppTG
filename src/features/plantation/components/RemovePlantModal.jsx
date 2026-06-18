import "./RemovePlantModal.css";

function RemovePlantModal({ isOpen, amount = 0, onConfirm, onCancel }) {
  if (!isOpen) return null;

  const safeAmount = Math.max(0, Math.floor(Number(amount) || 0));
  const isEmpty = safeAmount <= 0;

  return (
    <div
      className="remove-plant-overlay"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        className="remove-plant-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="remove-plant-title"
      >
        <header className="remove-plant-modal__header">
          <span className="remove-plant-modal__handle" aria-hidden="true" />
          <div>
            <span className="remove-plant-modal__eyebrow">
              Опасное средство ухода
            </span>
            <h2 id="remove-plant-title">Кислотная вода</h2>
          </div>

          <button
            type="button"
            className="remove-plant-modal__close"
            onClick={onCancel}
            aria-label="Закрыть окно"
          >
            ×
          </button>
        </header>

        <div className="remove-plant-modal__tray">
          <div className="remove-plant-modal__visual" aria-hidden="true">
            <span className="remove-plant-modal__glow" />
            <span className="remove-plant-modal__bottle">
              <span className="remove-plant-modal__cap" />
              <span className="remove-plant-modal__neck" />
              <span className="remove-plant-modal__body">
                <span className="remove-plant-modal__acid" />
                <span className="remove-plant-modal__bubble remove-plant-modal__bubble--one" />
                <span className="remove-plant-modal__bubble remove-plant-modal__bubble--two" />
                <span className="remove-plant-modal__hazard">☣</span>
              </span>
            </span>

            <span className="remove-plant-modal__amount">
              В запасе <strong>×{safeAmount}</strong>
            </span>
          </div>

          <div className="remove-plant-modal__copy">
            <strong>Ёмкость будет очищена</strong>
            <p>
              Растение, текущая стадия и применённые средства ухода исчезнут, а
              ведро снова станет свободным для новой культуры.
            </p>
          </div>
        </div>

        <div
          className={`remove-plant-modal__warning${isEmpty ? " is-empty" : ""}`}
        >
          <span aria-hidden="true">!</span>
          <p>
            {isEmpty
              ? "Кислотная вода закончилась. Получи новый флакон перед очисткой."
              : "Действие нельзя отменить. Урожай за растение не начисляется."}
          </p>
        </div>

        <div className="remove-plant-modal__actions">
          <button
            type="button"
            className="remove-plant-modal__cancel"
            onClick={onCancel}
          >
            Оставить растение
          </button>

          <button
            type="button"
            className="remove-plant-modal__confirm"
            onClick={onConfirm}
            disabled={isEmpty}
          >
            <span aria-hidden="true">☣</span>
            Уничтожить
          </button>
        </div>
      </section>
    </div>
  );
}

export default RemovePlantModal;
