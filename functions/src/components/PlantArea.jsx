import { useRef, useState } from "react";

import Pot from "./Pot";
import Plant from "./Plant";
import SeedBasket from "./SeedBasket";
import ShovelTool from "./ShovelTool";
import GrowTimer from "./GrowTimer";

import "./PlantArea.css";

const SWIPE_DISTANCE = 45;
const SLIDE_OUT_TIME = 180;
const SLIDE_IN_TIME = 240;

function PlantArea({
  pot,
  plant,
  growStep,
  timeLeft,
  growTime,
  unlockPrice,
  isSlotAvailable,
  lockedStatusText,
  isUnlocked,
  isEmpty,
  canCollect,
  onCollect,
  onSeedClick,
  onRemoveClick,
  onUnlock,
  onPreviousPot,
  onNextPot,
}) {
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const [animationClass, setAnimationClass] =
    useState("");

  const [isChanging, setIsChanging] =
    useState(false);

  const changePot = (direction) => {
    if (isChanging) {
      return;
    }

    const isNext = direction === "next";

    setIsChanging(true);

    setAnimationClass(
      isNext
        ? "plantation-slide-out-left"
        : "plantation-slide-out-right",
    );

    window.setTimeout(() => {
      if (isNext) {
        onNextPot();
      } else {
        onPreviousPot();
      }

      setAnimationClass(
        isNext
          ? "plantation-slide-in-right"
          : "plantation-slide-in-left",
      );

      window.setTimeout(() => {
        setAnimationClass("");
        setIsChanging(false);
      }, SLIDE_IN_TIME);
    }, SLIDE_OUT_TIME);
  };

  const handleTouchStart = (event) => {
    const touch = event.touches[0];

    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
  };

  const handleTouchEnd = (event) => {
    if (
      touchStartX.current === null ||
      touchStartY.current === null ||
      isChanging
    ) {
      return;
    }

    const touch = event.changedTouches[0];

    const differenceX =
      touch.clientX - touchStartX.current;

    const differenceY =
      touch.clientY - touchStartY.current;

    touchStartX.current = null;
    touchStartY.current = null;

    if (
      Math.abs(differenceY) >
      Math.abs(differenceX)
    ) {
      return;
    }

    if (
      Math.abs(differenceX) <
      SWIPE_DISTANCE
    ) {
      return;
    }

    changePot(
      differenceX < 0 ? "next" : "previous",
    );
  };

  const handleTouchCancel = () => {
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const stopSwipeStart = (event) => {
    event.stopPropagation();
  };

  return (
    <div
      className="plantation-slider"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      <button
        className="plantation-arrow plantation-arrow-left"
        type="button"
        aria-label="Предыдущее ведро"
        disabled={isChanging}
        onClick={() => changePot("previous")}
      >
        ‹
      </button>

      <div
        className={`plantation-slot ${animationClass}`}
      >
        {isUnlocked ? (
          <>
            <GrowTimer
              growStep={growStep}
              timeLeft={timeLeft}
              growTime={growTime}
            />

            <div className="plant-area">
              <Pot pot={pot} />

              {plant && (
                <Plant
                  plant={plant}
                  canCollect={canCollect}
                  onCollect={onCollect}
                />
              )}
            </div>

            <div
              className="plantation-seed-basket"
              onTouchStart={stopSwipeStart}
              onTouchEnd={stopSwipeStart}
            >
              <SeedBasket
                disabled={!isEmpty}
                onClick={onSeedClick}
              />
            </div>

            <div
              className="plantation-shovel-tool"
              onTouchStart={stopSwipeStart}
              onTouchEnd={stopSwipeStart}
            >
              <ShovelTool
                disabled={isEmpty}
                onClick={onRemoveClick}
              />
            </div>
          </>
        ) : (
          <button
            className={`add-pot-button${
              isSlotAvailable
                ? ""
                : " unavailable"
            }`}
            type="button"
            onTouchStart={stopSwipeStart}
            onTouchEnd={stopSwipeStart}
            onClick={onUnlock}
          >
            <span className="add-pot-plus">
              +
            </span>

            {isSlotAvailable ? (
              <>
                <span className="add-pot-label">
                  Добавить ведро
                </span>

                <span className="add-pot-price">
                  {unlockPrice} монет
                </span>
              </>
            ) : (
              <>
                <span className="add-pot-label">
                  Новое место
                </span>

                <span className="add-pot-price">
                  {lockedStatusText ||
                    "Пока что недоступно"}
                </span>
              </>
            )}
          </button>
        )}
      </div>

      <button
        className="plantation-arrow plantation-arrow-right"
        type="button"
        aria-label="Следующее ведро"
        disabled={isChanging}
        onClick={() => changePot("next")}
      >
        ›
      </button>
    </div>
  );
}

export default PlantArea;
