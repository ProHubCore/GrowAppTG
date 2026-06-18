function Plant({ plant, canCollect, onCollect }) {
  const visualStage = Math.max(1, Math.min(3, Number(plant.stage) || 1));
  const stageClassName = `plant-stage-${visualStage}`;

  return (
    <button
      className={`plant-button-image ${stageClassName} ${canCollect ? "collectable" : ""}`}
      onClick={canCollect ? onCollect : undefined}
      disabled={!canCollect}
      aria-label={canCollect ? "Собрать урожай" : plant.name}
      style={{
        width: `${plant.width}px`,
        bottom: `${plant.bottom}px`,
        left: `${plant.left}%`,
        transform: "translateX(-50%)",
      }}
    >
      {plant.image ? (
        <img className="plant" src={plant.image} alt={plant.name} />
      ) : (
        <span className="plant plant-emoji" aria-hidden="true">
          {plant.emoji}
        </span>
      )}
    </button>
  );
}

export default Plant;
