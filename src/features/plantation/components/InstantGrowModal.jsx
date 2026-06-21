import { getHarvestForecast } from "../data/harvestQuality";
import "./InstantGrowModal.css";

const QUALITY_ROWS = [
  { id: "normal", label: "Обычное", icon: "●" },
  { id: "good", label: "Хорошее", icon: "◆" },
  { id: "excellent", label: "Отличное", icon: "✦" },
  { id: "rare", label: "Редкое", icon: "★" },
];

function toPercent(value) {
  return `${Math.round(Math.max(0, Number(value) || 0) * 100)}%`;
}

function InstantGrowModal({
  request,
  coins,
  isProcessing = false,
  error = "",
  onConfirm,
  onBuyCoins,
  onCancel,
}) {
  if (!request) return null;

  const cost = Math.max(1, Math.floor(Number(request.cost) || 1));
  const balance = Math.max(0, Math.floor(Number(coins) || 0));
  const missing = Math.max(0, cost - balance);
  const forecast = getHarvestForecast({
    cropId: request.cropId || "tabakko",
    care: request.appliedCare || [],
    wateredStages: request.wateredStages || [],
  });

  return (
    <div className="instant-grow-overlay" role="presentation" onMouseDown={onCancel}>
      <section
        className="instant-grow-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="instant-grow-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className="instant-grow-close"
          type="button"
          aria-label="Закрыть"
          onClick={onCancel}
          disabled={isProcessing}
        >
          ×
        </button>

        <div className="instant-grow-kicker">ПРОГНОЗ УРОЖАЯ</div>
        <h2 id="instant-grow-title">{request.cropName}</h2>

        <div className="instant-grow-chamber" aria-hidden="true">
          <span className="instant-grow-ring instant-grow-ring--outer" />
          <span className="instant-grow-ring instant-grow-ring--inner" />
          <span className="instant-grow-energy" />
          {request.cropImage ? (
            <img className="instant-grow-plant" src={request.cropImage} alt="" draggable="false" />
          ) : (
            <span className="instant-grow-fallback">🌿</span>
          )}
        </div>

        <div className="instant-grow-summary">
          <span><small>КОЛИЧЕСТВО</small><strong>{forecast.minYield}–{forecast.maxYield} шт.</strong></span>
          <span><small>МАКСИМУМ</small><strong>{forecast.highestQuality.name}</strong></span>
        </div>

        <div className="instant-grow-quality" aria-label="Шансы качества урожая">
          {QUALITY_ROWS.map((quality) => {
            const chance = forecast.qualityChances?.[quality.id] || 0;
            return (
              <span key={quality.id} className={`quality-${quality.id}`}>
                <i aria-hidden="true">{quality.icon}</i>
                <b>{quality.label}</b>
                <strong>{toPercent(chance)}</strong>
                <em><u style={{ width: toPercent(chance) }} /></em>
              </span>
            );
          })}
        </div>

        <div className="instant-grow-care-note">
          <span>{forecast.waterCount}/2 полива</span>
          <span>{forecast.appliedCare.length > 0 ? `${forecast.appliedCare.length} усилителя` : "без усилителей"}</span>
        </div>

        <div className="instant-grow-actions">
          <button
            className={`instant-grow-confirm${missing > 0 ? " instant-grow-confirm--purchase" : ""}`}
            type="button"
            onClick={missing > 0 ? onBuyCoins : onConfirm}
            disabled={isProcessing}
            aria-busy={isProcessing ? "true" : undefined}
          >
            <span>{isProcessing ? "Списываем…" : missing > 0 ? "Купить ускорители" : "Вырастить сейчас"}</span>
            <b className="instant-grow-price" aria-hidden="true">
              {missing <= 0 && <strong>{cost}</strong>}
              <i className="instant-grow-price-coin">✦</i>
            </b>
          </button>

          {error && <div className="instant-grow-error" role="alert">{error}</div>}

          <button className="instant-grow-cancel" type="button" onClick={onCancel} disabled={isProcessing}>
            Продолжить рост
          </button>
        </div>
      </section>
    </div>
  );
}

export default InstantGrowModal;
