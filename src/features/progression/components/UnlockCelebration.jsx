import "./UnlockCelebration.css";

export default function UnlockCelebration({ notification, queuedCount = 0, onClose }) {
  if (!notification) return null;

  return (
    <div className="unlock-celebration" role="dialog" aria-modal="true" aria-label="Открыта новая награда">
      <div className={`unlock-celebration__glow unlock-celebration__glow--${notification.source || "joe"}`} />

      <section className="unlock-celebration__card">
        <div className="unlock-celebration__spark unlock-celebration__spark--one">✦</div>
        <div className="unlock-celebration__spark unlock-celebration__spark--two">✦</div>
        <div className="unlock-celebration__spark unlock-celebration__spark--three">·</div>

        <div className="unlock-celebration__source">
          {notification.sourceLabel}
        </div>

        <div className="unlock-celebration__icon-wrap">
          <span className="unlock-celebration__icon">{notification.icon}</span>
        </div>

        <div className="unlock-celebration__level">
          Новый уровень · {notification.level}
        </div>

        <h2 className="unlock-celebration__title">{notification.title}</h2>
        <p className="unlock-celebration__description">{notification.description}</p>

        {notification.unlocks?.length > 0 && (
          <div className="unlock-celebration__unlocks">
            <div className="unlock-celebration__unlocks-title">Теперь доступно</div>
            {notification.unlocks.map((unlock) => (
              <div className="unlock-celebration__unlock" key={unlock}>
                <span>✓</span>
                <strong>{unlock}</strong>
              </div>
            ))}
          </div>
        )}

        <button className="unlock-celebration__button" type="button" onClick={onClose}>
          {queuedCount > 0 ? `Дальше · ещё ${queuedCount}` : "Забрать и продолжить"}
        </button>
      </section>
    </div>
  );
}
