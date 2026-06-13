function SeedModal({
  isOpen,
  seeds,
  selectedSeed,
  onSelectSeed,
  onPlantSeed,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="seed-modal">
        <button className="modal-close" onClick={onClose}>
          ×
        </button>

        {!selectedSeed && (
          <>
            <div className="modal-title">Корзинка с семенами</div>
            <div className="modal-subtitle">Выбери, что посадить</div>

            <div className="seed-list">
              {seeds.map((seed) => (
                <button
                  key={seed.id}
                  className="seed-card"
                  onClick={() => onSelectSeed(seed)}
                >
                  <div className="seed-icon">{seed.icon}</div>

                  <div className="seed-info">
                    <div className="seed-name">{seed.name}</div>
                    <div className="seed-description">{seed.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {selectedSeed && (
          <>
            <div className="modal-title">Посадить растение?</div>
            <div className="modal-subtitle">
              Хочешь посадить “{selectedSeed.name}”?
            </div>

            <div className="confirm-seed-card">
              <div className="seed-icon big">{selectedSeed.icon}</div>
              <div className="seed-name">{selectedSeed.name}</div>
              <div className="seed-description">{selectedSeed.description}</div>
            </div>

            <div className="modal-actions">
              <button className="cancel-button" onClick={onClose}>
                Отмена
              </button>

              <button className="plant-button" onClick={onPlantSeed}>
                Посадить
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default SeedModal;