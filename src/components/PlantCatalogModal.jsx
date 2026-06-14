import { HARVEST_QUALITIES } from "../data/harvestQuality";
import "./PlantCatalogModal.css";

const PLANTS = [
  { id: "greenTomato", name: "Зелёный томат", icon: "🍅", note: "Зелёный не значит неспелый. Иногда это просто характер." },
  { id: "psychomor", name: "Психомор", icon: "🪻", note: "Светится так, будто знает больше, чем говорит." },
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
