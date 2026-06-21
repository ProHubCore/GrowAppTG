function WaterRequestBubble({ onWater }) {
  return (
    <button
      type="button"
      className="plant-water-request"
      onClick={(event) => {
        event.stopPropagation();
        onWater?.();
      }}
      aria-label="Полить растение"
    >
      <span className="plant-water-request__cloud" aria-hidden="true">
        <svg
          className="plant-water-request__cloud-shape"
          viewBox="0 0 92 62"
          role="presentation"
        >
          <defs>
            <linearGradient id="water-thought-cloud-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fffef7" />
              <stop offset="0.58" stopColor="#f4eddc" />
              <stop offset="1" stopColor="#dfd3b9" />
            </linearGradient>
          </defs>
          <path
            className="plant-water-request__cloud-body"
            d="M19 54C8 54 2 48 2 39c0-8 5-14 13-16C17 13 25 7 35 8 41 2 53 2 60 9c10-1 18 6 19 15 7 2 11 8 11 14 0 10-8 16-19 16H19Z"
          />
          <path
            className="plant-water-request__cloud-highlight"
            d="M15 31c3-8 10-11 17-10 4-7 13-10 21-6"
          />
        </svg>

        <svg
          className="plant-water-request__drop"
          viewBox="0 0 42 54"
          role="presentation"
        >
          <defs>
            <linearGradient id="water-thought-drop-gradient" x1="0" y1="0" x2="0.8" y2="1">
              <stop offset="0" stopColor="#bdefff" />
              <stop offset="0.48" stopColor="#56c6ef" />
              <stop offset="1" stopColor="#2586bc" />
            </linearGradient>
          </defs>
          <path
            className="plant-water-request__drop-shape"
            d="M21 3C17 11 8 20 8 31c0 8 5.8 15 13 15s13-7 13-15C34 20 25 11 21 3Z"
          />
          <path
            className="plant-water-request__drop-highlight"
            d="M16 17c-3 4-5 8-5 12"
          />
        </svg>
      </span>

      <span className="plant-water-request__thought-bubbles" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </button>
  );
}

function Plant({
  plant,
  canCollect,
  onCollect,
  onOpenInfo,
  infoDisabled = false,
  needsWater = false,
  onWater,
  isJustWatered = false,
  isHarvesting = false,
}) {
  const visualStage = Math.max(1, Math.min(3, Number(plant.stage) || 1));
  const stageClassName = `plant-stage-${visualStage}`;

  return (
    <div
      className={`plant-button-image ${stageClassName} ${canCollect && !isHarvesting ? "collectable" : ""}${needsWater ? " needs-water" : ""}${isJustWatered ? " just-watered" : ""}${isHarvesting ? " harvesting" : ""}`}
      style={{
        width: `${plant.width}px`,
        bottom: `${plant.bottom}px`,
        left: `${plant.left}%`,
        transform: "translateX(-50%)",
      }}
    >
      {needsWater && <WaterRequestBubble onWater={onWater} />}

      <button
        type="button"
        className="plant-collect-button"
        onClick={
          isHarvesting
            ? undefined
            : canCollect
              ? onCollect
              : onOpenInfo
        }
        disabled={isHarvesting || (!canCollect && (infoDisabled || typeof onOpenInfo !== "function"))}
        aria-label={canCollect && !isHarvesting ? "Собрать урожай" : `Открыть прогноз: ${plant.name}`}
      >
        {plant.image ? (
          <img className="plant" src={plant.image} alt={plant.name} />
        ) : (
          <span className="plant plant-emoji" aria-hidden="true">
            {plant.emoji}
          </span>
        )}
      </button>
    </div>
  );
}

export default Plant;
