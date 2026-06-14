import { ASSETS } from "../../../core/assets/assetCatalog";
function BackpackTool({ onClick, disabled = false }) {
  return (
    <button
      className="backpack-tool"
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label="Инвентарь"
    >
      <img
        className="backpack-tool-image"
        src={ASSETS.items.backpack}
        alt="Рюкзак"
      />
    </button>
  );
}

export default BackpackTool;
