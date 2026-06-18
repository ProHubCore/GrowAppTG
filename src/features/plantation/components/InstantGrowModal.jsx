import "./InstantGrowModal.css";

function InstantGrowModal({ request, coins, onConfirm, onBuyCoins, onCancel }) {
  if (!request) return null;

  const cost = Math.max(1, Math.floor(Number(request.cost) || 1));
  const balance = Math.max(0, Math.floor(Number(coins) || 0));
  const missing = Math.max(0, cost - balance);

  return (
    <div
      className="instant-grow-overlay"
      role="presentation"
      onMouseDown={onCancel}
    >
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
        >
          ×
        </button>

        <div className="instant-grow-kicker">Ускорение роста</div>
        <h2 id="instant-grow-title">{request.cropName}</h2>
        <p className="instant-grow-lead">
          Растение можно довести до готового урожая прямо сейчас.
        </p>

        <div className="instant-grow-chamber" aria-hidden="true">
          <span className="instant-grow-ring instant-grow-ring--outer" />
          <span className="instant-grow-ring instant-grow-ring--inner" />
          <span className="instant-grow-energy" />
          {request.cropImage ? (
            <img
              className="instant-grow-plant"
              src={request.cropImage}
              alt=""
              draggable="false"
            />
          ) : (
            <span className="instant-grow-fallback">🌿</span>
          )}
        </div>

        <div className="instant-grow-actions">
          <button
            className={`instant-grow-confirm${missing > 0 ? " instant-grow-confirm--purchase" : ""}`}
            type="button"
            onClick={missing > 0 ? onBuyCoins : onConfirm}
            aria-label={missing > 0 ? "Приобрести G-монеты" : `Вырастить сейчас за ${cost} монет роста`}
          >
            <span>{missing > 0 ? "Приобрести" : "Вырастить сейчас"}</span>
            <b
              className={`instant-grow-price${missing > 0 ? " instant-grow-price--purchase" : ""}`}
              aria-hidden="true"
            >
              {missing <= 0 && <strong>{cost}</strong>}
              <i className="instant-grow-price-coin" />
            </b>
          </button>

          <button
            className="instant-grow-cancel"
            type="button"
            onClick={onCancel}
          >
            Пусть растёт
          </button>
        </div>
      </section>
    </div>
  );
}

export default InstantGrowModal;
