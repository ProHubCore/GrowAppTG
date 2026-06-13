import "./BottomMenu.css";

function BottomMenu({ activeScreen, onGoPlantation, onGoDistrict }) {
  return (
    <div className="bottom-menu">
      <button
        className={`bottom-menu-button ${
          activeScreen === "plantation" ? "active" : ""
        }`}
        onClick={onGoPlantation}
      >
        🪴
        <span>Плантация</span>
      </button>

      <button
        className={`bottom-menu-button ${
          activeScreen === "district" ? "active" : ""
        }`}
        onClick={onGoDistrict}
      >
        🌆
        <span>Район</span>
      </button>
    </div>
  );
}

export default BottomMenu;