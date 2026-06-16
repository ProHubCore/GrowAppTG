import { ASSETS } from "../../core/assets/assetCatalog";
import "./DistrictScreen.css";

function DistrictScreen({ onOpenClub, onOpenShop, onOpenMariaHouse, showMariaNotice = true, missionTitle = "Осмотрись на районе" }) {
  return (
    <main className="district-screen">
      <header className="district-heading">
        <span>СТАРЫЙ РАЙОН</span>
        <h1>Grow Street</h1>
        <p>{missionTitle}</p>
      </header>

      <button className="district-building-button district-club-button" onClick={onOpenClub} aria-label="Открыть клуб">
        <img src={ASSETS.buildings.club} alt="Клуб Орбита" draggable="false" />
        <span className="district-place-label"><b>КЛУБ</b><small>Продажа и торг</small></span>
      </button>

      <button className="district-building-button district-shop-button" onClick={onOpenShop} aria-label="Открыть лавку">
        <img src={ASSETS.buildings.shop} alt="Лавка Зорика" draggable="false" />
        <span className="district-place-label"><b>ЗОРИК</b><small>Семена и уход</small></span>
      </button>

      <button className="district-building-button district-maria-house-button" onClick={onOpenMariaHouse} aria-label="Открыть дом Марии Ивановны">
        {showMariaNotice && <span className="district-maria-house-glow" />}
        <img src={ASSETS.buildings.mariaIvanovnaHouse} alt="Дом Марии Ивановны" draggable="false" />
        <span className="district-place-label"><b>МАРИЯ</b><small>Дела района</small></span>
        {showMariaNotice && <span className="district-maria-house-notice">!</span>}
      </button>
    </main>
  );
}

export default DistrictScreen;
