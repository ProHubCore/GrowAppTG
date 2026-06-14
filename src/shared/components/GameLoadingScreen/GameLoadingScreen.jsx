import "./GameLoadingScreen.css";

function GameLoadingScreen({ progress }) {
  return (
    <div className="game-loading-screen">
      <div className="game-loading-glow" />

      <div className="game-loading-content">
        <div className="game-loading-logo">GROW</div>

        <div className="game-loading-title">
          Подготавливаем район
        </div>

        <div className="game-loading-progress">
          <div
            className="game-loading-progress-fill"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        <div className="game-loading-percent">
          {progress}%
        </div>
      </div>
    </div>
  );
}

export default GameLoadingScreen;