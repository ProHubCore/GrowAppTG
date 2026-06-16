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

function SeedBoxLid({ potTypeName }) {
  return (
    <div className="seed-box-lid" aria-hidden="true">
      <span className="seed-box-hinge left" />
      <span className="seed-box-hinge right" />
      <div className="seed-box-brand">GROW</div>
      <div className="seed-box-lid-title">СЕМЕНА</div>
      <div className="seed-box-lid-caption">Ячейки для: {potTypeName}</div>
    </div>
  );
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
  potTypeName = "ведро",
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
  const needsEmptySlot = availableSeeds.length % 2 !== 0;

  return (
    <div className="modal-overlay">
      <div className="seed-modal">
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          disabled={tutorialActive}
          aria-label="Закрыть коробку с семенами"
        >
          ×
        </button>

        {!selectedSeed && (
          <>
            <SeedBoxLid potTypeName={potTypeName} />

            <div className="seed-box-tray">
              <div className="seed-box-tray-header">
                <div>
                  <div className="modal-title">Выбери семена</div>
                  <div className="modal-subtitle">
                    Нажми на нужный пакетик
                  </div>
                </div>
                <div className="seed-box-counter">
                  {availableSeeds.length}
                  <span>шт.</span>
                </div>
              </div>

              <div className="seed-list">
                {availableSeeds.map((seed, index) => {
                  const amount = getSeedAmount(seed, seedInventory);
                  const disabled =
                    tutorialActive &&
                    (!canChooseSeed || seed.id !== "tabakko");

                  return (
                    <button
                      type="button"
                      key={seed.id}
                      data-seed-id={seed.id}
                      className="seed-card"
                      disabled={disabled}
                      onClick={() => onSelectSeed(seed)}
                    >
                      <div className="seed-card-topline">
                        <span className="seed-card-index">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="seed-card-stock">
                          {seed.infinite ? "∞" : `×${amount}`}
                        </span>
                      </div>

                      <div className="seed-card-visual">
                        <SeedIcon seed={seed} />
                      </div>

                      <div className="seed-info">
                        <div className="seed-name">{seed.name}</div>
                        <div className="seed-description">
                          {seed.description}
                        </div>
                      </div>

                      <div className="seed-card-footer">
                        <span>
                          {seed.infinite ? "Базовые" : "В наличии"}
                        </span>
                        <strong>Выбрать</strong>
                      </div>
                    </button>
                  );
                })}

                {needsEmptySlot && (
                  <div className="seed-empty-slot" aria-hidden="true">
                    <span className="seed-empty-slot-ring" />
                    <span>Свободная ячейка</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {selectedSeed && (
          <>
            <SeedBoxLid potTypeName={potTypeName} />

            <div className="seed-box-tray confirm-tray">
              <div className="modal-title">Посадить растение?</div>
              <div className="modal-subtitle">
                Пакетик «{selectedSeed.name}» выбран
              </div>

              <div className="confirm-seed-card">
                <div className="confirm-seed-stamp">ВЫБРАНО</div>
                <div className="confirm-seed-visual">
                  <SeedIcon seed={selectedSeed} big />
                </div>
                <div className="seed-name">{selectedSeed.name}</div>
                <div className="seed-description">
                  {selectedSeed.description}
                </div>
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
                  className="plant-button seed-modal-plant-button"
                  data-action="plant"
                  onClick={onPlantSeed}
                  disabled={
                    selectedSeedUnavailable ||
                    (tutorialActive && !canPlantSeed)
                  }
                >
                  Посадить
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default SeedModal;
