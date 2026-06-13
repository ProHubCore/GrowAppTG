import "./ActionModal.css";

function ActionModal({
  isOpen,
  title,
  description,
  price = null,
  coins = 0,
  confirmText = "Подтвердить",
  cancelText = "Отмена",
  confirmDisabled = false,
  danger = false,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="action-modal-overlay"
      role="presentation"
      onMouseDown={onCancel}
    >
      <div
        className="action-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className="action-modal-close"
          type="button"
          aria-label="Закрыть"
          onClick={onCancel}
        >
          ×
        </button>

        <div className="action-modal-icon">
          {danger ? "!" : price === null ? "…" : "🪣"}
        </div>

        <h2 id="action-modal-title">{title}</h2>
        <p>{description}</p>

        {price !== null && (
          <div className="action-modal-price-block">
            <div>
              <span>Стоимость</span>
              <strong>{price} монет</strong>
            </div>

            <div>
              <span>На руках</span>
              <strong>{coins} монет</strong>
            </div>
          </div>
        )}

        {price !== null && coins < price && (
          <div className="action-modal-warning">
            Недостаточно монет для покупки.
          </div>
        )}

        <div className="action-modal-actions">
          <button
            className={`action-modal-confirm${danger ? " danger" : ""}`}
            type="button"
            disabled={confirmDisabled}
            onClick={onConfirm}
          >
            {confirmText}
          </button>

          <button
            className="action-modal-cancel"
            type="button"
            onClick={onCancel}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ActionModal;
