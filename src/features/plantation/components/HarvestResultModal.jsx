import "./HarvestResultModal.css";

export default function HarvestResultModal({ result, onContinue }) {
  if (!result) return null;

  return (
    <div className="harvest-result-overlay">
      <section className="harvest-result-card" role="dialog" aria-modal="true">
        <div className="harvest-result-rays" aria-hidden="true" />

        <div className="harvest-result-kicker">Урожай собран</div>
        <div className="harvest-result-icon" aria-hidden="true">
          {result.itemImage ? (
            <img src={result.itemImage} alt="" draggable="false" />
          ) : (
            <span>{result.itemIcon}</span>
          )}
        </div>
        <h2>{result.itemName}</h2>
        <div className="harvest-result-amount">+{result.amount} шт.</div>

        <div className="harvest-result-actions">
          <button
            type="button"
            className="harvest-continue-button"
            onClick={onContinue}
          >
            Продолжить
          </button>
        </div>
      </section>
    </div>
  );
}
