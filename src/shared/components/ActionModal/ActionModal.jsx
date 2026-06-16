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
  modalIcon = null,
  currencyLabel = "монет",
  currencyIcon = null,
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
          {modalIcon || (danger ? "!" : price === null ? "…" : "🪣")}
        </div>

        <h2 id="action-modal-title">{title}</h2>
        <p>{description}</p>

        {price !== null && (
          <div className="action-modal-price-block">
            <div>
              <span>Стоимость</span>
              <strong>{currencyIcon ? `${currencyIcon} ` : ""}{price} {currencyLabel}</strong>
            </div>

            <div>
              <span>На руках</span>
              <strong>{currencyIcon ? `${currencyIcon} ` : ""}{coins} {currencyLabel}</strong>
            </div>
          </div>
        )}

        {price !== null && coins < price && (
          <div className="action-modal-warning">
            Недостаточно валюты для действия.
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
