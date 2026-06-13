import "./AddPotModal.css";

function AddPotModal({
  isOpen,
  slotNumber,
  onConfirm,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="add-pot-overlay"
      onClick={onClose}
    >
      <div
        className="add-pot-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="add-pot-close"
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
        >
          ×
        </button>

        <div className="add-pot-icon">
          🪴
        </div>

        <div className="add-pot-title">
          Новое место
        </div>

        <div className="add-pot-text">
          Поставить ведро на место №{slotNumber}?
          Здесь можно будет выращивать отдельное растение.
        </div>

        <button
          className="add-pot-confirm"
          type="button"
          onClick={onConfirm}
        >
          Добавить ведро
        </button>

        <button
          className="add-pot-cancel"
          type="button"
          onClick={onClose}
        >
          Не сейчас
        </button>
      </div>
    </div>
  );
}

export default AddPotModal;