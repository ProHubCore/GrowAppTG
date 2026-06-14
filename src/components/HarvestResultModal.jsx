import "./HarvestResultModal.css";

export default function HarvestResultModal({ result, onClose, onOpenCatalog }) {
  if (!result) return null;

  return (
    <div className="harvest-result-overlay">
      <section className={`harvest-result-card quality-${result.quality.id}`}>
        <div className="harvest-result-rays" />
        <div className="harvest-result-kicker">Урожай собран</div>
        <div className="harvest-result-icon">{result.itemIcon}</div>
        <h2>{result.itemName}</h2>
        <div className="harvest-quality-name">
          {result.quality.icon} {result.quality.name} качество
        </div>
        <div className="harvest-result-amount">+{result.amount} шт.</div>
        {result.firstDiscovery && (
          <div className="harvest-discovery">Новая запись в каталоге!</div>
        )}
        <div className="harvest-result-actions">
          <button type="button" className="harvest-catalog-button" onClick={onOpenCatalog}>Открыть каталог</button>
          <button type="button" className="harvest-continue-button" onClick={onClose}>Продолжить</button>
        </div>
      </section>
    </div>
  );
}
