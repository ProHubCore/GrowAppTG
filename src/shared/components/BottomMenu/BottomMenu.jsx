import "./BottomMenu.css";

function BottomMenu({
  activeScreen,
  tutorialStep,
  onGoPlantation,
  onGoDistrict,
  readyPlants = 0,
}) {
  if (activeScreen !== "plantation" && activeScreen !== "district") {
    return null;
  }

  const tutorialActive = tutorialStep !== "completed";
  const districtAllowed = tutorialStep === "go-district";
  const goesToDistrict = activeScreen === "plantation";
  const disabled = goesToDistrict
    ? tutorialActive && !districtAllowed
    : tutorialActive;

  return (
    <nav className="bottom-menu" aria-label="Переход между локациями">
      <button
        type="button"
        className={`bottom-menu-button bottom-menu-button--${
          goesToDistrict ? "district" : "plantation"
        }`}
        disabled={disabled}
        onClick={goesToDistrict ? onGoDistrict : onGoPlantation}
        aria-label={goesToDistrict ? "Перейти в район" : "Вернуться на плантацию"}
      >
        <span className="bottom-menu-button__icon" aria-hidden="true">
          <span className="bottom-menu-button__mark" />
        </span>

        <span className="bottom-menu-button__copy">
          <small>ПЕРЕЙТИ</small>
          <strong>{goesToDistrict ? "В район" : "На плантацию"}</strong>
        </span>

        {!goesToDistrict && readyPlants > 0 && (
          <b
            className="bottom-menu-badge"
            aria-label={`Готово растений: ${readyPlants}`}
          >
            {readyPlants}
          </b>
        )}
      </button>
    </nav>
  );
}

export default BottomMenu;
