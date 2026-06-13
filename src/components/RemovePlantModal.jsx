function RemovePlantModal({ isOpen, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="remove-plant-modal">
        <div className="modal-title">Удалить растение?</div>

        <div className="modal-subtitle">
          Растение будет выкорчевано, а ведро снова станет пустым.
        </div>

        <div className="modal-actions">
          <button className="cancel-button" onClick={onCancel}>
            Отмена
          </button>

          <button className="remove-button" onClick={onConfirm}>
            Да, удалить
          </button>
        </div>
      </div>
    </div>
  );
}

export default RemovePlantModal;