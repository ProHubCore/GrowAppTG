import "./ClubScreen.css";

function ClubScreen({ onGoBack }) {
  return (
    <div className="club-screen">
      <img
        className="club-npc club-npc-smoker"
        src="/assets/club-characters/club-alien-smoker-01.png"
        alt="Клубный тип"
      />

      <button
        className="club-back-hitbox"
        onClick={onGoBack}
        aria-label="Назад в район"
      />

      <div className="club-dialog">
        <div className="club-speaker">Типусиан</div>

        <div className="club-text">
          Йо, земной фермер. Вайб ровный, музыка мягкая, народ ждёт свежачок.
          Принёс что-то интересное?
        </div>

        <div className="club-answers">
          <button className="club-answer-button">
            Есть свежий урожай
          </button>

          <button className="club-answer-button secondary">
            Я просто осмотреться
          </button>
        </div>
      </div>
    </div>
  );
}

export default ClubScreen;