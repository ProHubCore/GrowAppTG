import "./ShopScreen.css";

function ShopScreen({
  onGoBack,
  onShowPsychomor,
}) {
  return (
    <div className="shop-screen">
      <button
        type="button"
        className="shop-back-hitbox"
        onClick={onGoBack}
        aria-label="Назад в район"
      />

      <div className="shop-dialog">
        <div className="shop-speaker">
          Зорик
        </div>

        <div className="shop-text">
          Здорово, брат. Заходи без суеты.
          Семки свежие, ростки бодрые,
          вайб ровный. Чё глянем?
        </div>

        <div className="shop-answers">
          <button
            type="button"
            className="shop-answer-button"
            onClick={onShowPsychomor}
          >
            Давай взглянем, братуха
          </button>

          <button
            type="button"
            className="shop-answer-button secondary"
            onClick={onGoBack}
          >
            Мне пока ничего не надо
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShopScreen;