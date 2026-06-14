import { ASSETS } from "../../core/assets/assetCatalog";
import "./DistrictScreen.css";

function DistrictScreen({ onOpenClub, onOpenShop, onOpenJoeHouse }) {
  return (
    <div className="district-screen">
      <button className="district-building-button district-club-button" onClick={onOpenClub} aria-label="Клуб">
        <img src={ASSETS.buildings.club} alt="Клуб" />
      </button>
      <button className="district-building-button district-shop-button" onClick={onOpenShop} aria-label="Магазин">
        <img src={ASSETS.buildings.shop} alt="Магазин" />
      </button>
      <button className="district-building-button district-joe-house-button" onClick={onOpenJoeHouse} aria-label="Дом Дяди Джо">
        <span className="district-joe-house-glow" />
        <span className="district-joe-house-roof" />
        <span className="district-joe-house-body"><span className="district-joe-house-window" /><span className="district-joe-house-door" /></span>
        <span className="district-joe-house-sign">Дом Джо</span>
        <span className="district-joe-house-notice">!</span>
      </button>
    </div>
  );
}

export default DistrictScreen;
