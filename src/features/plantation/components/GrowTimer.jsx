import "./GrowTimer.css";

const DEFAULT_GROW_TIME = 90;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatTime(seconds) {
  const safe = Math.max(0, Math.ceil(Number(seconds) || 0));
  if (safe < 60) return `${safe} сек.`;
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function GrowTimer({
  growStep,
  timeLeft,
  growTime = DEFAULT_GROW_TIME,
  instantGrowCost = null,
  premiumBalance = 0,
  onInstantGrow,
  instantGrowDisabled = false,
}) {
  const safeGrowTime = Math.max(1, Number(growTime) || DEFAULT_GROW_TIME);
  const safeTimeLeft = Math.max(0, Math.ceil(Number(timeLeft) || 0));

  const progress = clamp(
    ((safeGrowTime - safeTimeLeft) / safeGrowTime) * 100,
    0,
    100,
  );

  if (growStep === 0) return null;

  if (growStep === 3) {
    return (
      <div className="grow-hint ready">
        <span className="grow-ready-check" aria-hidden="true">✓</span>
        <span className="grow-ready-text">Урожай готов</span>
      </div>
    );
  }

  const canShowInstantGrow =
    Number.isFinite(Number(instantGrowCost)) &&
    Number(instantGrowCost) > 0 &&
    typeof onInstantGrow === "function";

  const insufficientPremium = premiumBalance < Number(instantGrowCost || 0);

  return (
    <div className={`grow-hint growing${canShowInstantGrow ? " has-instant" : ""}`}>
      <div className="grow-hint-row">
        <span className="grow-hint-title">Рост {growStep}/3</span>
        <span className="grow-hint-time">{formatTime(safeTimeLeft)}</span>
      </div>

      <div className="grow-timer-track" aria-hidden="true">
        <div className="grow-timer-fill" style={{ width: `${progress}%` }} />
      </div>

      {canShowInstantGrow && (
        <button
          type="button"
          className="grow-instant-button"
          disabled={instantGrowDisabled || insufficientPremium}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onInstantGrow();
          }}
        >
          <span>Вырастить сейчас</span>
          <strong>◆ {instantGrowCost}</strong>
        </button>
      )}
    </div>
  );
}

export default GrowTimer;
