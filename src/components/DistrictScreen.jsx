import "./DistrictScreen.css";

function DistrictScreen({ onOpenClub, onOpenShop }) {
  return (
    <div className="district-screen">
      <button
        className="district-building-button district-club-button"
        onClick={onOpenClub}
        aria-label="Клуб"
      >
        <img src="/assets/club-building.png" alt="Клуб" />
      </button>

      <button
        className="district-building-button district-shop-button"
        onClick={onOpenShop}
        aria-label="Магазин"
      >
        <img src="/assets/shop-building.png" alt="Магазин" />
      </button>
    </div>
  );
}

export default DistrictScreen;