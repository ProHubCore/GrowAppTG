import "./BottomMenu.css";

function BottomMenu({
  activeScreen,
  tutorialStep,
  onGoPlantation,
  onGoDistrict,
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
    </div>
  );
}

export default BottomMenu;
