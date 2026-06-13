function SeedIcon({
  seed,
  big = false,
}) {
  if (seed.image) {
    return (
      <div
        className={
          big
            ? "seed-icon big"
            : "seed-icon"
        }
      >
        <img
          src={seed.image}
          alt={seed.name}
          draggable="false"
          style={{
            display: "block",
            width: big ? "100px" : "58px",
            height: big ? "115px" : "68px",
            objectFit: "contain",
            pointerEvents: "none",
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={
        big
          ? "seed-icon big"
          : "seed-icon"
      }
    >
      {seed.icon}
    </div>
  );
}

function SeedModal({
  isOpen,
  seeds,
  selectedSeed,
  onSelectSeed,
  onPlantSeed,
  onClose,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="seed-modal">
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Закрыть корзинку"
        >
          ×
        </button>

        {!selectedSeed && (
          <>
            <div className="modal-title">
              Корзинка с семенами
            </div>

            <div className="modal-subtitle">
              Выбери, что посадить
            </div>

            <div className="seed-list">
              {seeds.map((seed) => (
                <button
                  type="button"
                  key={seed.id}
                  className="seed-card"
                  onClick={() =>
                    onSelectSeed(seed)
                  }
                >
                  <SeedIcon seed={seed} />

                  <div className="seed-info">
                    <div className="seed-name">
                      {seed.name}
                    </div>

                    <div className="seed-description">
                      {seed.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {selectedSeed && (
          <>
            <div className="modal-title">
              Посадить растение?
            </div>

            <div className="modal-subtitle">
              Хочешь посадить «
              {selectedSeed.name}»?
            </div>

            <div className="confirm-seed-card">
              <SeedIcon
                seed={selectedSeed}
                big
              />

              <div className="seed-name">
                {selectedSeed.name}
              </div>

              <div className="seed-description">
                {selectedSeed.description}
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={onClose}
              >
                Отмена
              </button>

              <button
                type="button"
                className="plant-button"
                onClick={onPlantSeed}
              >
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