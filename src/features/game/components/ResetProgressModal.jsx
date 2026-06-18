import "./ResetProgressModal.css";

function ResetProgressModal({ isOpen, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div
      className="reset-progress-modal"
      role="presentation"
      onMouseDown={onCancel}
    >
      <section
        className="reset-progress-modal__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-progress-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className="reset-progress-modal__close"
          type="button"
          aria-label="Закрыть окно сброса прогресса"
          onClick={onCancel}
        >
          ×
        </button>

        <div className="reset-progress-modal__emblem" aria-hidden="true">
          <span className="reset-progress-modal__arrow">↻</span>
          <span className="reset-progress-modal__spark reset-progress-modal__spark--one" />
          <span className="reset-progress-modal__spark reset-progress-modal__spark--two" />
          <span className="reset-progress-modal__spark reset-progress-modal__spark--three" />
        </div>

        <div className="reset-progress-modal__eyebrow">Новая игра</div>
        <h2 id="reset-progress-modal-title">Сбросить прогресс?</h2>
        <p className="reset-progress-modal__lead">
          Плантация вернётся в самое начало. Это действие нельзя отменить.
        </p>

        <div className="reset-progress-modal__losses" aria-label="Что будет удалено">
          <div className="reset-progress-modal__loss">
            <span aria-hidden="true">🌱</span>
            <div>
              <strong>Растения и урожай</strong>
              <small>Вёдра, семена и содержимое рюкзака</small>
            </div>
          </div>

          <div className="reset-progress-modal__loss">
            <span aria-hidden="true">★</span>
            <div>
              <strong>Развитие района</strong>
              <small>Задания, уровни клуба и репутация</small>
            </div>
          </div>

          <div className="reset-progress-modal__loss">
            <span aria-hidden="true">◉</span>
            <div>
              <strong>Игровые накопления</strong>
              <small>Обычные монеты и полученные предметы</small>
            </div>
          </div>
        </div>

        <div className="reset-progress-modal__kept">
          <span aria-hidden="true">✓</span>
          Покупки поддержки сохранятся
        </div>

        <div className="reset-progress-modal__actions">
          <button
            className="reset-progress-modal__cancel"
            type="button"
            onClick={onCancel}
          >
            Оставить прогресс
          </button>
          <button
            className="reset-progress-modal__confirm"
            type="button"
            onClick={onConfirm}
          >
            <span aria-hidden="true">↻</span>
            Сбросить всё
          </button>
        </div>
      </section>
    </div>
  );
}

export default ResetProgressModal;
