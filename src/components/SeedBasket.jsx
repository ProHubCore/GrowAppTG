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
        src="/assets/items/seed-basket.png"
        alt="Корзинка с семенами"
      />
    </button>
  );
}

export default SeedBasket;