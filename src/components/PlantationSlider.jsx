import PlantArea from "./PlantArea";
import "./PlantationSlider.css";

function PlantationSlider({
  slots,
  activeSlotIndex,
  pot,
  plant,
  canCollect,
  onCollect,
  onSelectSlot,
  onOpenLockedSlot,
  onTouchStart,
  onTouchEnd,
}) {
  const goPrevious = () => {
    onSelectSlot(Math.max(0, activeSlotIndex - 1));
  };

  const goNext = () => {
    onSelectSlot(
      Math.min(slots.length - 1, activeSlotIndex + 1)
    );
  };

  return (
    <div
      className="plantation-slider"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button
        className="plantation-arrow plantation-arrow-left"
        type="button"
        onClick={goPrevious}
        disabled={activeSlotIndex === 0}
        aria-label="Предыдущее ведро"
      >
        <span>‹</span>
      </button>

      <div className="plantation-slider-window">
        <div
          className="plantation-slider-track"
          style={{
            transform: `translateX(-${activeSlotIndex * 100}%)`,
          }}
        >
          {slots.map((slot, index) => (
            <div
              className="plantation-slide"
              key={slot.id}
            >
              {slot.unlocked ? (
                <div className="plantation-unlocked-slot">
                  {index === activeSlotIndex && (
                    <PlantArea
                      pot={pot}
                      plant={plant}
                      canCollect={canCollect}
                      onCollect={onCollect}
                    />
                  )}
                </div>
              ) : (
                <button
                  className="locked-plant-slot"
                  type="button"
                  onClick={() => onOpenLockedSlot(index)}
                >
                  <span className="locked-plant-slot-plus">
                    +
                  </span>

                  <span className="locked-plant-slot-title">
                    Новое место
                  </span>

                  <span className="locked-plant-slot-text">
                    Нажми, чтобы поставить ещё одно ведро
                  </span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <button
        className="plantation-arrow plantation-arrow-right"
        type="button"
        onClick={goNext}
        disabled={activeSlotIndex === slots.length - 1}
        aria-label="Следующее ведро"
      >
        <span>›</span>
      </button>

      <div className="plantation-dots">
        {slots.map((slot, index) => (
          <button
            key={slot.id}
            type="button"
            className={[
              "plantation-dot",
              index === activeSlotIndex ? "active" : "",
              !slot.unlocked ? "locked" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => onSelectSlot(index)}
            aria-label={`Перейти к месту ${index + 1}`}
          >
            {!slot.unlocked && (
              <span className="plantation-dot-lock">
                +
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default PlantationSlider;