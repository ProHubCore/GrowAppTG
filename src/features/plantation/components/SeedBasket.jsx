import { ASSETS } from "../../../core/assets/assetCatalog";
function SeedBasket({ onClick, disabled }) {
  return (
    <button
      className={`seed-basket ${disabled ? "disabled" : ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-label="Открыть семена"
    >
      <img
        className="seed-basket-image"
        src={ASSETS.items.seedBasket}
        alt="Корзинка с семенами"
      />
    </button>
  );
}

export default SeedBasket;