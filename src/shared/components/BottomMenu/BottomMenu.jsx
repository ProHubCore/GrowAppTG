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

  if (activeScreen === "district") {
    return (
      <div className="location-dock">
        <button type="button" className="location-dock__main" disabled={tutorialActive} onClick={onGoPlantation}>
          <span aria-hidden="true">⌂</span>
          <strong>ПЛАНТАЦИЯ</strong>
          {readyPlants > 0 && <b>{readyPlants} готово</b>}
        </button>
        <button type="button" className="location-dock__side" disabled={tutorialActive} onClick={onGoSupport} aria-label="Поддержать проект">
          ★
        </button>
      </div>
    );
  }

  if (activeScreen === "support") {
    return (
      <div className="location-dock location-dock--single">
        <button type="button" className="location-dock__main" onClick={onGoDistrict}>
          <strong>GROW STREET</strong>
        </button>
      </div>
    );
  }

  return (
    <div className="location-dock location-dock--single">
      <button
        type="button"
        className="location-dock__main location-dock__main--street"
        disabled={tutorialActive && !districtAllowed}
        onClick={onGoDistrict}
      >
        <span aria-hidden="true">▥</span>
        <strong>GROW STREET</strong>
        {readyPlants > 0 && <b>{readyPlants} готово</b>}
      </button>
    </div>
  );
}

export default BottomMenu;
