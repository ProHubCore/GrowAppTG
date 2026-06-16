import "./BottomMenu.css";

function BottomMenu({
  activeScreen,
  tutorialStep,
  onGoPlantation,
  onGoDistrict,
  onGoSupport,
  readyPlants = 0,
}) {
  const tutorialActive = tutorialStep !== "completed";
  const districtAllowed = tutorialStep === "go-district";

  return (
    <div className="bottom-menu">
      <button
        className={`bottom-menu-button ${
          activeScreen === "plantation" ? "active" : ""
        }`}
        disabled={tutorialActive}
        onClick={onGoPlantation}
      >
        🪴
        <span>Плантация</span>
        {readyPlants > 0 && (
          <b className="bottom-menu-badge" aria-label={`Готово растений: ${readyPlants}`}>
            {readyPlants}
          </b>
        )}
      </button>

      <button
        className={`bottom-menu-button ${
          activeScreen === "district" ? "active" : ""
        }`}
        disabled={tutorialActive && !districtAllowed}
        onClick={onGoDistrict}
      >
        🌆
        <span>Район</span>
      </button>

      <button
        className={`bottom-menu-button ${
          activeScreen === "support" ? "active" : ""
        }`}
        disabled={tutorialActive}
        onClick={onGoSupport}
      >
        ⭐
        <span>Stars</span>
      </button>
    </div>
  );
}

export default BottomMenu;
