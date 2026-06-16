import { ASSETS } from "../../core/assets/assetCatalog";
import "./DistrictScreen.css";

function DistrictScreen({ onOpenClub, onOpenShop, onOpenMariaHouse, showMariaNotice = true }) {
  return (
    <div className="district-screen">
      <button className="district-building-button district-club-button" onClick={onOpenClub} aria-label="Клуб">
        <img src={ASSETS.buildings.club} alt="Клуб Орбита" draggable="false" />
      </button>

      <button className="district-building-button district-shop-button" onClick={onOpenShop} aria-label="Магазин">
        <img src={ASSETS.buildings.shop} alt="Лавка Зорика" draggable="false" />
      </button>

      <button className="district-building-button district-maria-house-button" onClick={onOpenMariaHouse} aria-label="Дом Марии Ивановны">
        {showMariaNotice && <span className="district-maria-house-glow" />}
        <img src={ASSETS.buildings.mariaIvanovnaHouse} alt="Дом Марии Ивановны" draggable="false" />
        {showMariaNotice && <span className="district-maria-house-notice">!</span>}
      </button>
    </div>
  );
}

export default DistrictScreen;
