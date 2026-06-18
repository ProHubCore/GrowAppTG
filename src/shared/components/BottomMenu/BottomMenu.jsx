import "./BottomMenu.css";

function BottomMenu({
  activeScreen,
  onGoPlantation,
  readyPlants = 0,
}) {
  if (activeScreen !== "district") {
    return null;
  }

  return (
    <nav className="bottom-menu" aria-label="Возврат на плантацию">
      <button
        type="button"
        className="bottom-menu-button bottom-menu-button--plantation"
        onClick={onGoPlantation}
        aria-label="Вернуться на плантацию"
      >
        <span className="bottom-menu-button__icon" aria-hidden="true">
          <span className="bottom-menu-button__mark" />
        </span>

        <span className="bottom-menu-button__copy">
          <small>ВЕРНУТЬСЯ</small>
          <strong>На плантацию</strong>
        </span>

        {readyPlants > 0 && (
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
