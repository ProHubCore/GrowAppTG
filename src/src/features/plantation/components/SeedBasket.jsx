import { ASSETS } from "../../../core/assets/assetCatalog";

function SeedBasket({ disabled, onClick }) {
  return (
    <button
      className={`seed-basket${disabled ? " disabled" : ""}`}
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label="Открыть семена"
    >
      <img
        className="seed-basket-image"
        src={ASSETS.ui.seedBasket}
        alt="Семена"
        draggable="false"
      />
    </button>
  );
}

export default SeedBasket;
