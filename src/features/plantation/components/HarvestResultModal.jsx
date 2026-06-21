import { QUALITY_PRICE_MULTIPLIERS } from "../data/qualityInventory";
import "./HarvestResultModal.css";

const QUALITY_COPY = {
  normal: { grade: "ОБЫЧНЫЙ", line: "Чистая базовая партия", hint: "Поливай в обе стадии, чтобы поднять качество." },
  good: { grade: "ХОРОШИЙ", line: "Ровный ухоженный урожай", hint: "Раствор откроет шанс отличного качества." },
  excellent: { grade: "ОТЛИЧНЫЙ", line: "Партия для дорогого покупателя", hint: "Такие партии выгоднее не отдавать первому клиенту." },
  rare: { grade: "РЕДКИЙ", line: "Находка района", hint: "Редкий урожай стоит беречь для особого заказа." },
};

export default function HarvestResultModal({ result, onContinue }) {
  if (!result) return null;
  const qualityId = result.quality?.id || "normal";
  const copy = QUALITY_COPY[qualityId] || QUALITY_COPY.normal;
  const multiplier = QUALITY_PRICE_MULTIPLIERS[qualityId] || 1;
  const wateredCount = Array.isArray(result.wateredStages) ? new Set(result.wateredStages.map(Number)).size : 0;
  const care = Array.isArray(result.careApplied) ? result.careApplied : [];
  const careLabel = care.includes("nutrition") && care.includes("mariaMix")
    ? "Полный уход"
    : care.includes("mariaMix")
      ? "Смесь Марии"
      : care.includes("nutrition")
        ? "Питательный раствор"
        : wateredCount >= 2
          ? "Двойной полив"
          : wateredCount === 1
            ? "Один полив"
            : "Без ухода";

  return (
    <div className="harvest-result-overlay">
      <section className={`harvest-result-card quality-${qualityId}`} role="dialog" aria-modal="true">
        <div className="harvest-result-glow" aria-hidden="true" />
        <div className="harvest-result-head"><span>УРОЖАЙ СОБРАН</span><b>+{result.amount}</b></div>
        <div className="harvest-result-hero">
          <div className="harvest-result-icon" aria-hidden="true">
            {result.itemImage ? <img src={result.itemImage} alt="" draggable="false" /> : <span>{result.itemIcon}</span>}
          </div>
        </div>
        <div className="harvest-result-grade">
          <span aria-hidden="true">{result.quality?.icon || "◆"}</span>
          <div><small>КАЧЕСТВО</small><strong>{copy.grade}</strong></div>
          <b>×{multiplier}</b>
        </div>
        <h2>{result.itemName}</h2>
        <p className="harvest-result-line">{copy.line}</p>
        <div className="harvest-result-value">
          <span><small>В РЮКЗАК</small><strong>{result.amount} шт.</strong></span>
          <i />
          <span><small>КЛАСС</small><strong>{result.quality?.name || "Обычное"}</strong></span>
          <i />
          <span><small>УХОД</small><strong>{careLabel}</strong></span>
        </div>
        <div className="harvest-result-tip"><span>✦</span><p>{copy.hint}</p></div>
        <button type="button" className="harvest-continue-button" onClick={onContinue}>Забрать урожай</button>
      </section>
    </div>
  );
}
