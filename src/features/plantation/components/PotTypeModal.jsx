import { POT_TYPES } from "../data/potTypes";
import "./PotTypeModal.css";

export default function PotTypeModal({
  isOpen,
  trust = 0,
  title = "Выбери ёмкость",
  description = "Мария разрешила новое место. Выбери ёмкость для следующего цикла.",
  price = null,
  coins = 0,
  onChoose,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay pot-type-overlay">
      <section className="pot-type-modal">
        <button className="modal-close" type="button" onClick={onClose}>×</button>
        <div className="modal-title">{title}</div>
        <div className="modal-subtitle">{description}</div>

        <div className="pot-type-list">
          {POT_TYPES.map((type) => {
            const unlocked = trust >= type.requiredTrust;
            const cannotAfford = price !== null && coins < price;
            return (
              <button
                key={type.id}
                className={`pot-type-card${unlocked ? " unlocked" : " locked"}`}
                type="button"
                disabled={!unlocked || cannotAfford}
                onClick={() => onChoose(type.id)}
              >
                <div className="pot-type-visual">
                  {type.image ? <img src={type.image} alt="" /> : <span>{type.icon}</span>}
                </div>
                <div className="pot-type-copy">
                  <strong>{type.name}</strong>
                  <p>{type.description}</p>
                  <small>
                    {unlocked
                      ? price === null || price === 0 ? "Установить бесплатно" : `Установить · ${price} монет`
                      : `Откроется при ${type.requiredTrust} доверия Марии Ивановны`}
                  </small>
                </div>
                <span className="pot-type-arrow">›</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
