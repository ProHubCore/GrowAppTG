import { useRef, useState } from "react";

import Pot from "./Pot";
import Plant from "./Plant";
import SeedBasket from "./SeedBasket";
import CareTool from "./CareTool";
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
  unlockPrice,
  isSlotAvailable,
  lockedStatusText,
  isUnlocked,
  isEmpty,
  canCollect,
  onCollect,
  onSeedClick,
  onUnlock,
  onOpenCare,
  careApplied,
  wateredStages = [],
  hasWateringCan = false,
  canCare = false,
  onPreviousPot,
  onNextPot,
  navigationDisabled = false,
  seedDisabled = false,
  collectDisabled = false,
  unlockDisabled = false,
  onOpenGrowthInfo,
  growthInfoDisabled = false,
}) {
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const [animationClass, setAnimationClass] =
    useState("");

  const [isChanging, setIsChanging] =
    useState(false);

  const changePot = (direction) => {
    if (navigationDisabled || isChanging) {
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
    if (navigationDisabled) {
      return;
    }

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
        disabled={navigationDisabled || isChanging}
        onClick={() => changePot("previous")}
      >
        <span className="plantation-arrow__chevron" aria-hidden="true" />
      </button>

      <div
        className={`plantation-slot ${animationClass}`}
      >
        {isUnlocked ? (
          <>
            <div className="plant-area">
              <Pot pot={pot} />

              {growStep > 0 && growStep < 3 && (
                <button
                  type="button"
                  className="pot-growth-info-button"
                  aria-label="Открыть информацию о растении"
                  disabled={growthInfoDisabled || typeof onOpenGrowthInfo !== "function"}
                  onClick={onOpenGrowthInfo}
                />
              )}

              <GrowTimer
                growStep={growStep}
                timeLeft={timeLeft}
                onOpenInfo={onOpenGrowthInfo}
                infoDisabled={growthInfoDisabled}
              />

              {plant && (
                <Plant
                  plant={plant}
                  canCollect={canCollect && !collectDisabled}
                  onCollect={onCollect}
                />
              )}
            </div>


            {growStep > 0 && growStep < 3 && (
              (Array.isArray(careApplied) && careApplied.length > 0) ||
              (Array.isArray(wateredStages) && wateredStages.length > 0)
            ) && (
              <div className="plant-care-status">
                {Array.isArray(wateredStages) && wateredStages.length > 0 && (
                  <span>💧 {wateredStages.length}/2</span>
                )}
                {Array.isArray(careApplied) && careApplied.includes("nutrition") && <span>🌿</span>}
                {Array.isArray(careApplied) && careApplied.includes("mariaMix") && <span>🧪</span>}
              </div>
            )}

            <div
              className="plantation-seed-basket"
              onTouchStart={stopSwipeStart}
              onTouchEnd={stopSwipeStart}
            >
              <SeedBasket
                disabled={!isEmpty || seedDisabled}
                onClick={onSeedClick}
              />
            </div>

            <div
              className="plantation-care-tool"
              onTouchStart={stopSwipeStart}
              onTouchEnd={stopSwipeStart}
            >
              <CareTool
                disabled={!canCare}
                appliedCount={Array.isArray(careApplied) ? careApplied.length : careApplied ? 1 : 0}
                wateredCount={Array.isArray(wateredStages) ? wateredStages.length : 0}
                hasWateringCan={hasWateringCan}
                onClick={onOpenCare}
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
            disabled={unlockDisabled}
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
        disabled={navigationDisabled || isChanging}
        onClick={() => changePot("next")}
      >
        <span className="plantation-arrow__chevron" aria-hidden="true" />
      </button>
    </div>
  );
}

export default PlantArea;
