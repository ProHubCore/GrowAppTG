import { CROPS } from "../../plantation/data/crops";
import { HARVEST_QUALITIES } from "../../plantation/data/harvestQuality";
import "./PlantCatalogModal.css";

export default function PlantCatalogModal({ isOpen, catalog = {}, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="catalog-overlay">
      <section className="catalog-book">
        <button type="button" className="catalog-close" onClick={onClose}>×</button>
        <div className="catalog-kicker">Записи Марии Ивановны</div>
        <h2>Каталог культур</h2>
        <p className="catalog-subtitle">Открывай качества и собирай лучшие экземпляры.</p>

        <div className="catalog-list">
          {CROPS.map((crop) => {
            const record = catalog[crop.id] || {};
            const discovered = (record.totalHarvested || 0) > 0;
            return (
              <article key={crop.id} className={`catalog-entry${discovered ? "" : " undiscovered"}`}>
                <div className="catalog-plant-icon">
                  {discovered ? (
                    <img src={crop.stages.at(-1)?.image} alt={crop.name} draggable="false" />
                  ) : (
                    "?"
                  )}
                </div>
                <div className="catalog-entry-copy">
                  <h3>{discovered ? crop.name : "Неизвестная культура"}</h3>
                  <p>{discovered ? crop.catalogNote : "Сначала вырасти и собери эту культуру."}</p>
                  <div className="catalog-stats">
                    <span>Собрано: {record.totalHarvested || 0}</span>
                    <span>Лучшее: {record.bestQualityName || "—"}</span>
                  </div>
                  <div className="catalog-quality-row">
                    {HARVEST_QUALITIES.map((quality) => (
                      <span
                        key={quality.id}
                        className={(record.qualities?.[quality.id] || 0) > 0 ? "found" : ""}
                        title={quality.name}
                      >
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
