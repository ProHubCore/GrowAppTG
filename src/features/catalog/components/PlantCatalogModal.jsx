import { CROPS } from "../../plantation/data/crops";
import "./PlantCatalogModal.css";

export default function PlantCatalogModal({ isOpen, catalog = {}, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="catalog-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="catalog-book">
        <header>
          <div><span>ГЕРБАРИЙ МАРИИ</span><h2>Три культуры</h2></div>
          <button type="button" className="catalog-close" onClick={onClose}>×</button>
        </header>
        <p className="catalog-subtitle">Здесь остаются только факты: что открыто, сколько собрано и какое качество было лучшим.</p>

        <div className="catalog-list">
          {CROPS.map((crop, index) => {
            const record = catalog[crop.id] || {};
            const discovered = (record.totalHarvested || 0) > 0;
            return (
              <article key={crop.id} className={`catalog-entry${discovered ? "" : " undiscovered"}`}>
                <span className="catalog-index">0{index + 1}</span>
                <div className="catalog-plant-icon">
                  {discovered ? <img src={crop.stages.at(-1)?.image} alt={crop.name} draggable="false" /> : <b>?</b>}
                </div>
                <div className="catalog-entry-copy">
                  <small>{discovered ? "ОТКРЫТО" : "НЕИЗВЕСТНО"}</small>
                  <h3>{discovered ? crop.name : "Закрытая культура"}</h3>
                  {discovered ? (
                    <div className="catalog-stats"><span>Собрано <b>{record.totalHarvested || 0}</b></span><span>Лучшее <b>{record.bestQualityName || "Обычное"}</b></span></div>
                  ) : <p>Мария добавит запись после первого урожая.</p>}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
