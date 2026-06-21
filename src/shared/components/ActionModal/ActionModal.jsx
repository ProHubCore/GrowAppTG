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
  isProcessing = false,
  danger = false,
  modalIcon = null,
  currencyLabel = "монет",
  currencyIcon = null,
  onConfirm,
  onInsufficientFunds = null,
  insufficientText = "Приобрести",
  onCancel,
}) {
  if (!isOpen) {
    return null;
  }

  const insufficientFunds = price !== null && coins < price;
  const canOpenStore = insufficientFunds && typeof onInsufficientFunds === "function";

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
          disabled={isProcessing}
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

        {insufficientFunds && !canOpenStore && (
          <div className="action-modal-warning">
            Недостаточно валюты для действия.
          </div>
        )}

        <div className="action-modal-actions">
          <button
            className={`action-modal-confirm${danger ? " danger" : ""}${canOpenStore ? " purchase" : ""}`}
            type="button"
            disabled={isProcessing || (confirmDisabled && !canOpenStore)}
            aria-busy={isProcessing ? "true" : undefined}
            onClick={canOpenStore ? onInsufficientFunds : onConfirm}
          >
            <span>{isProcessing ? "Подтверждаем…" : canOpenStore ? insufficientText : confirmText}</span>
            {canOpenStore && <i className="action-modal-premium-coin" aria-hidden="true" />}
          </button>

          <button
            className="action-modal-cancel"
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ActionModal;
