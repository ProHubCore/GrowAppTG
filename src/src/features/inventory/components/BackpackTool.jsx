import { ASSETS } from "../../../core/assets/assetCatalog";

function BackpackTool({ disabled, onClick }) {
  return (
    <button
      className={`backpack-tool${disabled ? " disabled" : ""}`}
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label="Открыть инвентарь"
    >
      <img
        className="backpack-tool-image"
        src={ASSETS.ui.backpack}
        alt="Инвентарь"
        draggable="false"
      />
    </button>
  );
}

export default BackpackTool;
