import "./ShopScreen.css";

function ShopScreen({ onGoBack }) {
  return (
    <div className="shop-screen">
      <button
        className="shop-back-hitbox"
        onClick={onGoBack}
        aria-label="Назад в район"
      />

      <div className="shop-dialog">
        <div className="shop-speaker">Зорик</div>

        <div className="shop-text">
          Здорово, брат. Заходи без суеты. Семки свежие, ростки бодрые, вайб
          ровный. Чё глянем?
        </div>

        <div className="shop-answers">
          <button className="shop-answer-button">
            Давай взглянем, братуха
          </button>

          <button className="shop-answer-button secondary">
            Мне пока ничего не надо
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShopScreen;