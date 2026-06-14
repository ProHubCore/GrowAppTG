import "./GrowTimer.css";

const DEFAULT_GROW_TIME = 5;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function GrowTimer({
  growStep,
  timeLeft,
  growTime = DEFAULT_GROW_TIME,
}) {
  const safeGrowTime = Math.max(
    1,
    Number(growTime) || DEFAULT_GROW_TIME,
  );

  const safeTimeLeft = Math.max(
    0,
    Math.ceil(Number(timeLeft) || 0),
  );

  const progress = clamp(
    ((safeGrowTime - safeTimeLeft) /
      safeGrowTime) *
      100,
    0,
    100,
  );

  if (growStep === 0) {
    return null;
  }

  if (growStep === 3) {
    return (
      <div className="grow-hint ready">
        <span
          className="grow-ready-check"
          aria-hidden="true"
        >
          ✓
        </span>

        <span className="grow-ready-text">
          Урожай готов
        </span>
      </div>
    );
  }

  return (
    <div className="grow-hint growing">
      <div className="grow-hint-row">
        <span className="grow-hint-title">
          Рост {growStep}/3
        </span>

        <span className="grow-hint-time">
          {safeTimeLeft} сек.
        </span>
      </div>

      <div
        className="grow-timer-track"
        aria-hidden="true"
      >
        <div
          className="grow-timer-fill"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>
    </div>
  );
}

export default GrowTimer;
