const GROW_TIME = 5;

function GrowTimer({ growStep, timeLeft }) {
  const progress = ((GROW_TIME - timeLeft) / GROW_TIME) * 100;

  if (growStep === 0) {
    return (
      <div className="grow-hint empty">
        <div className="hint-icon">🌱</div>
        <div>
          <div className="hint-title">Горшок пустой</div>
          <div className="hint-text">Нажми “Посадить” снизу</div>
        </div>
      </div>
    );
  }

  if (growStep === 3) {
    return (
      <div className="grow-hint ready">
        <div className="hint-icon">✨</div>
        <div>
          <div className="hint-title">Готово!</div>
          <div className="hint-text">Можно собирать урожай</div>
        </div>
      </div>
    );
  }

  return (
    <div className="grow-hint growing">
      <div className="hint-top">
        <div className="hint-icon">⏳</div>

        <div>
          <div className="hint-title">Рост {growStep}/3</div>
          <div className="hint-text">Осталось {timeLeft} сек.</div>
        </div>
      </div>

      <div className="timer-bar">
        <div
          className="timer-bar-fill"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>
    </div>
  );
}

export default GrowTimer;