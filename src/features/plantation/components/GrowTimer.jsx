import "./GrowTimer.css";

function formatClock(seconds) {
  const safeSeconds = Math.max(0, Math.ceil(Number(seconds) || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function GrowTimer({
  growStep,
  timeLeft,
  onOpenInfo,
  infoDisabled = false,
}) {
  if (growStep === 0) {
    return null;
  }

  if (growStep === 3) {
    return (
      <div
        className="grow-hint ready"
        aria-label="Урожай готов"
      >
        <span className="grow-ready-check" aria-hidden="true">
          ✓
        </span>
      </div>
    );
  }

  const canOpenInfo =
    typeof onOpenInfo === "function" && !infoDisabled;

  if (canOpenInfo) {
    return (
      <button
        type="button"
        className="grow-hint growing"
        aria-label={`До урожая ${formatClock(timeLeft)}`}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onOpenInfo();
        }}
      >
        <span className="grow-clock-time">
          {formatClock(timeLeft)}
        </span>
      </button>
    );
  }

  return (
    <div
      className="grow-hint growing"
      aria-label={`До урожая ${formatClock(timeLeft)}`}
    >
      <span className="grow-clock-time">
        {formatClock(timeLeft)}
      </span>
    </div>
  );
}

export default GrowTimer;
