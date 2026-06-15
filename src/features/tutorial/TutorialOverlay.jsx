import { ASSETS } from "../../core/assets/assetCatalog";
import { useEffect, useState } from "react";

import "./TutorialOverlay.css";

const CHARACTER_IMAGE = ASSETS.characters.mariaIvanovna;

const STEPS = {
  intro: {
    name: "Мария Ивановна",
    text:
      "Ну здравствуй, ученик. Давай сначала организуем тебе своё место и посадим первый Кислоплод.",
    buttonText: "Показывай",
    target: null,
    characterMode: "hero",
    layoutMode: "intro",
  },
  "unlock-pot": {
    name: "Мария Ивановна",
    text:
      "Пока тут пусто. Нажми на новое место — первое ведро сегодня за мой счёт.",
    hint: "Нажми «Добавить ведро»",
    target: ".add-pot-button",
    characterMode: "compact",
  },
  "open-seeds": {
    name: "Мария Ивановна",
    text:
      "Вот, уже похоже на хозяйство. Теперь открой корзинку с семенами.",
    hint: "Нажми на корзинку",
    target: ".plantation-seed-basket",
    characterMode: "compact",
  },
  "choose-seed": {
    name: "Мария Ивановна",
    text:
      "Для начала бери зелёный томат. Он простой и ошибок прощает больше остальных.",
    hint: "Выбери зелёный томат",
    target: ".seed-card",
    characterMode: "compact",
  },
  "plant-seed": {
    name: "Мария Ивановна",
    text:
      "Правильный выбор. Теперь подтверждай посадку.",
    hint: "Нажми «Посадить»",
    target: ".plant-button",
    characterMode: "compact",
  },
  growing: {
    name: "Мария Ивановна",
    text:
      "Теперь оно растёт. Здесь видно этап роста и сколько осталось. Как созреет — растение само даст понять.",
    hint: "Следи за таймером",
    target: ".grow-hint.growing",
    characterMode: "compact",
  },
  collect: {
    name: "Мария Ивановна",
    text:
      "Готово. Жми прямо на растение и забирай первый урожай.",
    hint: "Собери урожай",
    target: ".plant-button-image.collectable",
    characterMode: "compact",
  },
  "go-district": {
    name: "Мария Ивановна",
    text:
      "Урожай в кармане. Теперь глянем район — там клуб, магазин и люди, с которыми ещё познакомишься.",
    hint: "Перейди в «Район»",
    target: ".bottom-menu-button:last-child",
    characterMode: "compact",
  },
  "district-finish": {
    name: "Мария Ивановна",
    text:
      "Вот твой район. В клубе продают урожай, а у Зорика берут редкие семена. На сегодня хватит — дальше освоишься.",
    buttonText: "Понял, Мария Ивановна",
    target: null,
    characterMode: "hero",
    layoutMode: "finish",
  },
};

function TutorialOverlay({
  step,
  stageScale,
  activeScreen,
  onContinue,
}) {
  const config = STEPS[step] || null;
  const [spotlight, setSpotlight] = useState(null);

  const shouldShow =
    step &&
    step !== "completed" &&
    Boolean(config);

  const targetSelector = config?.target || null;

  useEffect(() => {
    if (!shouldShow || !targetSelector) {
      setSpotlight(null);
      return undefined;
    }

    const updateSpotlight = () => {
      const stage = document.querySelector(".game-stage");
      const target = document.querySelector(targetSelector);

      if (!stage || !target) {
        setSpotlight(null);
        return;
      }

      const stageRect = stage.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const scale = stageScale || 1;
      const padding = 9;

      setSpotlight({
        left:
          (targetRect.left - stageRect.left) / scale -
          padding,
        top:
          (targetRect.top - stageRect.top) / scale -
          padding,
        width: targetRect.width / scale + padding * 2,
        height:
          targetRect.height / scale + padding * 2,
      });
    };

    updateSpotlight();

    const timer = window.setInterval(
      updateSpotlight,
      180,
    );

    window.addEventListener("resize", updateSpotlight);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener(
        "resize",
        updateSpotlight,
      );
    };
  }, [
    activeScreen,
    shouldShow,
    stageScale,
    targetSelector,
  ]);

  const getCoachTop = () => {
    if (!spotlight) {
      return null;
    }

    const blockHeight =
      step === "choose-seed" ||
      step === "plant-seed"
        ? 176
        : 154;

    const gap = 18;
    const safeTop = 118;
    const safeBottom = 790;

    const roomAbove =
      spotlight.top - gap - blockHeight;

    if (roomAbove >= safeTop) {
      return roomAbove;
    }

    const roomBelow =
      spotlight.top +
      spotlight.height +
      gap;

    return Math.min(
      roomBelow,
      safeBottom - blockHeight,
    );
  };

  const coachTop = getCoachTop();

  if (!shouldShow) {
    return null;
  }

  const characterMode =
    config.characterMode || "compact";

  const layoutMode =
    config.layoutMode || "standard";

  return (
    <div
      className={[
        "tutorial-layer",
        `tutorial-character-${characterMode}`,
        `tutorial-layout-${layoutMode}`,
        `tutorial-step-${step}`,
        spotlight ? "tutorial-has-target" : "",
      ].join(" ")}
      style={{
        "--tutorial-coach-top":
          coachTop === null
            ? undefined
            : `${coachTop}px`,
      }}
      aria-live="polite"
    >
      {!spotlight && <div className="tutorial-dim-full" />}

      {spotlight && (
        <>
          <div
            className="tutorial-dim-panel tutorial-dim-top"
            style={{
              height: Math.max(0, spotlight.top),
            }}
          />

          <div
            className="tutorial-dim-panel tutorial-dim-left"
            style={{
              top: spotlight.top,
              width: Math.max(0, spotlight.left),
              height: spotlight.height,
            }}
          />

          <div
            className="tutorial-dim-panel tutorial-dim-right"
            style={{
              top: spotlight.top,
              left: spotlight.left + spotlight.width,
              right: 0,
              height: spotlight.height,
            }}
          />

          <div
            className="tutorial-dim-panel tutorial-dim-bottom"
            style={{
              top: spotlight.top + spotlight.height,
              bottom: 0,
            }}
          />

          <div
            className="tutorial-spotlight"
            style={{
              left: spotlight.left,
              top: spotlight.top,
              width: spotlight.width,
              height: spotlight.height,
            }}
          />
        </>
      )}

      <div className="tutorial-character-wrap">
        <img
          className="tutorial-character"
          src={CHARACTER_IMAGE}
          alt={config.name}
          draggable="false"
        />
      </div>

      <div className="tutorial-dialog">
        <div className="tutorial-name">
          {config.name}
        </div>

        <div className="tutorial-text">
          {config.text}
        </div>

        {config.hint && (
          <div className="tutorial-hint">
            {config.hint}
          </div>
        )}

        {config.buttonText && (
          <button
            className="tutorial-continue"
            type="button"
            onClick={onContinue}
          >
            {config.buttonText}
          </button>
        )}
      </div>
    </div>
  );
}

export default TutorialOverlay;
