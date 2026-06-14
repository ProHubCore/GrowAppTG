import { HARVEST_QUALITIES } from "../../plantation/data/harvestQuality";
import "./PlantCatalogModal.css";

const PLANTS = [
  { id: "greenTomato", name: "Кислоплод", icon: "🟢", note: "Базовый бодрящий плод района." },
  { id: "lumenweed", name: "Люмен-трава", icon: "🪻", note: "Светится в темноте и идёт в клубные смеси." },
  { id: "moonmint", name: "Лунная мята", icon: "🌿", note: "Охлаждает голову и усиливает музыку." },
  { id: "velvetbud", name: "Бархатный бутон", icon: "🌺", note: "Редкий ароматный товар для спокойных заведений." },
  { id: "psychoshroom", name: "Психомор", icon: "🍄", note: "Гриб, после которого некоторые начинают видеть звук." },
  { id: "bluecap", name: "Синий колпак", icon: "🔵", note: "Закрытая грибная культура для опытных поставщиков." },
  { id: "starleaf", name: "Звёздный лист", icon: "✨", note: "Искристая зелень, которую ценят танцполы." },
  { id: "emberpod", name: "Жар-стручок", icon: "🔥", note: "Горячий плод для крепких напитков." },
  { id: "dreamcap", name: "Сонный колпак", icon: "🌙", note: "Мягкий гриб для тихих комнат клуба." },
  { id: "ghostmorel", name: "Призрачный сморчок", icon: "👻", note: "Редкая культура для тайных покупателей." },
];

export default function PlantCatalogModal({ isOpen, catalog = {}, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="catalog-overlay">
      <section className="catalog-book">
        <button type="button" className="catalog-close" onClick={onClose}>×</button>
        <div className="catalog-kicker">Записи Дяди Джо</div>
        <h2>Каталог растений</h2>
        <p className="catalog-subtitle">Открывай качества и собирай лучшие экземпляры.</p>

        <div className="catalog-list">
          {PLANTS.map((plant) => {
            const record = catalog[plant.id] || {};
            const discovered = (record.totalHarvested || 0) > 0;
            return (
              <article key={plant.id} className={`catalog-entry${discovered ? "" : " undiscovered"}`}>
                <div className="catalog-plant-icon">{discovered ? plant.icon : "?"}</div>
                <div className="catalog-entry-copy">
                  <h3>{discovered ? plant.name : "Неизвестное растение"}</h3>
                  <p>{discovered ? plant.note : "Сначала вырасти и собери это растение."}</p>
                  <div className="catalog-stats">
                    <span>Собрано: {record.totalHarvested || 0}</span>
                    <span>Лучшее: {record.bestQualityName || "—"}</span>
                  </div>
                  <div className="catalog-quality-row">
                    {HARVEST_QUALITIES.map((quality) => (
                      <span key={quality.id} className={(record.qualities?.[quality.id] || 0) > 0 ? "found" : ""} title={quality.name}>
                        {quality.icon}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
