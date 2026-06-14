import "./SeedModal.css";

function getSeedAmount(seed, seedInventory) {
  if (seed.infinite) return Infinity;
  return seedInventory?.[seed.id] || 0;
}

function SeedIcon({ seed, big = false }) {
  if (seed.image) {
    return (
      <img
        className={`seed-image${big ? " big" : ""}`}
        src={seed.image}
        alt={seed.name}
        draggable="false"
      />
    );
  }

  return <div className={`seed-icon${big ? " big" : ""}`}>{seed.icon}</div>;
}

function SeedModal({
  isOpen,
  seeds,
  seedInventory,
  selectedSeed,
  onSelectSeed,
  onPlantSeed,
  onClose,
  tutorialStep = "completed",
}) {
  if (!isOpen) return null;

  const tutorialActive = tutorialStep !== "completed";
  const canChooseSeed = tutorialStep === "choose-seed";
  const canPlantSeed = tutorialStep === "plant-seed";
  const availableSeeds = seeds.filter(
    (seed) => seed.infinite || getSeedAmount(seed, seedInventory) > 0,
  );
  const selectedSeedAmount = selectedSeed
    ? getSeedAmount(selectedSeed, seedInventory)
    : 0;
  const selectedSeedUnavailable =
    selectedSeed && !selectedSeed.infinite && selectedSeedAmount <= 0;

  return (
    <div className="modal-overlay">
      <div className="seed-modal">
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          disabled={tutorialActive}
          aria-label="Закрыть корзинку"
        >
          ×
        </button>

        {!selectedSeed && (
          <>
            <div className="modal-title">Корзинка с семенами</div>
            <div className="modal-subtitle">Выбери, что посадить</div>
            <div className="seed-list">
              {availableSeeds.map((seed) => {
                const amount = getSeedAmount(seed, seedInventory);
                const disabled =
                  tutorialActive &&
                  (!canChooseSeed || seed.id !== "greenTomato");

                return (
                  <button
                    type="button"
                    key={seed.id}
                    className="seed-card"
                    disabled={disabled}
                    onClick={() => onSelectSeed(seed)}
                  >
                    <SeedIcon seed={seed} />
                    <div className="seed-info">
                      <div className="seed-name">{seed.name}</div>
                      <div className="seed-description">{seed.description}</div>
                      <div className="seed-amount">
                        {seed.infinite ? "Семена: ∞" : `Семена: ${amount}`}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {selectedSeed && (
          <>
            <div className="modal-title">Посадить растение?</div>
            <div className="modal-subtitle">
              Хочешь посадить «{selectedSeed.name}»?
            </div>
            <div className="confirm-seed-card">
              <SeedIcon seed={selectedSeed} big />
              <div className="seed-name">{selectedSeed.name}</div>
              <div className="seed-description">{selectedSeed.description}</div>
              <div className="seed-amount">
                {selectedSeed.infinite
                  ? "Доступно: ∞"
                  : `Доступно: ${selectedSeedAmount}`}
              </div>
              {selectedSeedUnavailable && (
                <div className="seed-unavailable-message">
                  Семена закончились. Загляни к Зорику.
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={onClose}
                disabled={tutorialActive}
              >
                Отмена
              </button>
              <button
                type="button"
                className="plant-button"
                onClick={onPlantSeed}
                disabled={
                  selectedSeedUnavailable ||
                  (tutorialActive && !canPlantSeed)
                }
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
