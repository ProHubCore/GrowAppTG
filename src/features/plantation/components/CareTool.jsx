import { ASSETS } from "../../../core/assets/assetCatalog";

function CareTool({
  disabled,
  onClick,
}) {
  return (
    <button
      className={`care-tool${disabled ? " disabled" : ""}`}
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Открыть уход за растением"
    >
      <img
        className="care-tool-image"
        src={ASSETS.ui.plantCareKit}
        alt="Предметы для ухода за растением"
        draggable="false"
      />
    </button>
  );
}

export default CareTool;
