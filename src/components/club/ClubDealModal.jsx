import "./ClubDealModal.css";

function ClubDealModal({
  order,
  inventory,
  onSell,
  onClose,
  onCreateNextOrder,
}) {
  if (!order) return null;

  const playerAmount = inventory[order.plantId] || 0;

  const canSell =
    !order.completed && playerAmount >= order.amount;

  const totalPrice =
    order.amount * order.pricePerItem + order.bonus;

  return (
    <div className="club-deal-overlay" onClick={onClose}>
      <div
        className="club-deal-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="club-deal-modal__close"
          type="button"
          onClick={onClose}
        >
          ×
        </button>

        {!order.completed ? (
          <>
            <div className="club-deal-modal__name">
              Марк
            </div>

            <div className="club-deal-modal__phrase">
              «{order.phrase}»
            </div>

            <div className="club-deal-modal__order">
              <div className="club-deal-modal__plant">
                {order.plantName}
              </div>

              <div className="club-deal-modal__row">
                <span>Нужно</span>
                <strong>{order.amount} шт.</strong>
              </div>

              <div className="club-deal-modal__row">
                <span>У тебя</span>
                <strong>{playerAmount} шт.</strong>
              </div>

              <div className="club-deal-modal__row">
                <span>Цена за штуку</span>
                <strong>{order.pricePerItem}</strong>
              </div>

              <div className="club-deal-modal__row">
                <span>Бонус за заказ</span>
                <strong>+{order.bonus}</strong>
              </div>

              <div className="club-deal-modal__total">
                Получишь: {totalPrice} монет
              </div>
            </div>

            {!canSell && (
              <div className="club-deal-modal__warning">
                Не хватает ещё{" "}
                {Math.max(order.amount - playerAmount, 0)} шт.
              </div>
            )}

            <button
              className="club-deal-modal__sell"
              type="button"
              disabled={!canSell}
              onClick={onSell}
            >
              Продать {order.amount} шт.
            </button>

            <button
              className="club-deal-modal__leave"
              type="button"
              onClick={onClose}
            >
              Уйти
            </button>
          </>
        ) : (
          <>
            <div className="club-deal-modal__name">
              Марк
            </div>

            <div className="club-deal-modal__success">
              «Нормальная работа. Приходи ещё.»
            </div>

            <button
              className="club-deal-modal__sell"
              type="button"
              onClick={onCreateNextOrder}
            >
              Узнать новый заказ
            </button>

            <button
              className="club-deal-modal__leave"
              type="button"
              onClick={onClose}
            >
              Закрыть
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default ClubDealModal;