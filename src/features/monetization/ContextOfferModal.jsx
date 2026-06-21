import { trackGameEvent } from "../../core/analytics/monetizationAnalytics";
import { triggerTelegramHaptic } from "../../core/telegram";
import { getStoreProduct } from "./storeCatalog";
import "./MonetizationModals.css";

function OfferReward({ item }) {
  const icon = item.kind === "growth" ? "◆" : item.kind === "care" ? "●" : "✦";
  return (
    <span>
      <i>{icon}</i>
      <span><strong>{item.label}</strong><small>{item.detail || "сразу после оплаты"}</small></span>
    </span>
  );
}

export default function ContextOfferModal({ offer, onOpenStore, onClose }) {
  const product = getStoreProduct(offer?.productId);
  if (!offer || !product) return null;

  return (
    <div className="monetization-modal-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}>
      <section className="context-offer" role="dialog" aria-modal="true" aria-labelledby="context-offer-title">
        <button type="button" className="context-offer__close" onClick={onClose}>×</button>
        <div className="context-offer__badge">{product.badge}</div>
        <div className="context-offer__visual" aria-hidden="true"><i>{product.icon}</i><b>3×</b></div>
        <small>{offer.eyebrow || "ОТКРЫТО ПОСЛЕ ПЕРВОЙ СДЕЛКИ"}</small>
        <h2 id="context-offer-title">{offer.title || product.title}</h2>
        <p>{offer.description || product.subtitle}</p>
        <div className="context-offer__contents">
          {(product.contents || []).map((item) => <OfferReward key={`${item.kind}-${item.id || item.amount}`} item={item} />)}
        </div>
        <div className="context-offer__price-row"><span>Всё сразу</span><strong>{product.stars} ★</strong></div>
        <div className="context-offer__actions">
          <button type="button" onClick={onClose}>Позже</button>
          <button
            type="button"
            className="primary"
            onClick={() => {
              triggerTelegramHaptic("medium");
              trackGameEvent("context_offer_click", { productId: product.id, source: offer.source || "milestone" });
              onOpenStore?.(product.id);
            }}
          >
            Посмотреть набор
          </button>
        </div>
      </section>
    </div>
  );
}
