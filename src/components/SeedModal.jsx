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

            width: big
              ? "100px"
              : "58px",

            height: big
              ? "115px"
              : "68px",

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

function getSeedAmount(
  seed,
  seedInventory
) {
  if (seed.infinite) {
    return Infinity;
  }

  return (
    seedInventory?.[seed.id] || 0
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
}) {
  if (!isOpen) {
    return null;
  }

  const selectedSeedAmount =
    selectedSeed
      ? getSeedAmount(
          selectedSeed,
          seedInventory
        )
      : 0;

  const selectedSeedUnavailable =
    selectedSeed &&
    !selectedSeed.infinite &&
    selectedSeedAmount <= 0;

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
              {seeds.map((seed) => {
                const amount =
                  getSeedAmount(
                    seed,
                    seedInventory
                  );

                const isUnavailable =
                  !seed.infinite &&
                  amount <= 0;

                return (
                  <button
                    type="button"
                    key={seed.id}
                    className={
                      isUnavailable
                        ? "seed-card disabled"
                        : "seed-card"
                    }
                    onClick={() =>
                      onSelectSeed(seed)
                    }
                  >
                    <SeedIcon
                      seed={seed}
                    />

                    <div className="seed-info">
                      <div className="seed-name">
                        {seed.name}
                      </div>

                      <div className="seed-description">
                        {seed.description}
                      </div>

                      <div
                        style={{
                          marginTop:
                            "6px",

                          color:
                            isUnavailable
                              ? "#ff9e9e"
                              : "#9fffe0",

                          fontSize:
                            "12px",

                          fontWeight:
                            "900",
                        }}
                      >
                        {seed.infinite
                          ? "Семена: ∞"
                          : `Семена: ${amount}`}
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

              <div
                style={{
                  marginTop: "8px",

                  color:
                    selectedSeedUnavailable
                      ? "#ff9e9e"
                      : "#9fffe0",

                  fontSize: "13px",

                  fontWeight: "900",
                }}
              >
                {selectedSeed.infinite
                  ? "Доступно: ∞"
                  : `Доступно: ${selectedSeedAmount}`}
              </div>

              {selectedSeedUnavailable && (
                <div
                  style={{
                    marginTop: "8px",

                    color:
                      "rgba(255,255,255,0.65)",

                    fontSize: "12px",

                    textAlign:
                      "center",
                  }}
                >
                  Семена закончились.
                  Загляни к Зорику.
                </div>
              )}
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
                onClick={
                  onPlantSeed
                }
                disabled={
                  selectedSeedUnavailable
                }
                style={
                  selectedSeedUnavailable
                    ? {
                        opacity: 0.4,
                        cursor:
                          "default",
                      }
                    : undefined
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