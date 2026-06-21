import { useEffect, useRef, useState } from "react";

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
  onWater,
  careApplied,
  wateredStages = [],
  canWater = false,
  canCare = false,
  onPreviousPot,
  onNextPot,
  navigationDisabled = false,
  seedDisabled = false,
  collectDisabled = false,
  unlockDisabled = false,
  onOpenGrowthInfo,
  growthInfoDisabled = false,
  isHarvesting = false,
}) {
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const suppressClickUntil = useRef(0);

  const [animationClass, setAnimationClass] =
    useState("");

  const [isChanging, setIsChanging] =
    useState(false);

  const [isJustWatered, setIsJustWatered] =
    useState(false);

  const previousWaterState = useRef({
    potId: pot?.id || null,
    plantId: plant?.id || null,
    wateredCount: Array.isArray(wateredStages) ? wateredStages.length : 0,
  });

  const normalizedWateredStages = Array.isArray(wateredStages)
    ? wateredStages.map(Number)
    : [];

  const needsWater = Boolean(
    plant &&
    canWater &&
    growStep > 0 &&
    growStep < 3 &&
    !normalizedWateredStages.includes(Number(growStep)),
  );

  useEffect(() => {
    const nextState = {
      potId: pot?.id || null,
      plantId: plant?.id || null,
      wateredCount: normalizedWateredStages.length,
    };

    const previousState = previousWaterState.current;
    const isSamePlant =
      previousState.potId === nextState.potId &&
      previousState.plantId === nextState.plantId;

    previousWaterState.current = nextState;

    if (!isSamePlant) {
      setIsJustWatered(false);
      return undefined;
    }

    if (nextState.wateredCount <= previousState.wateredCount) {
      return undefined;
    }

    setIsJustWatered(true);

    const timer = window.setTimeout(() => {
      setIsJustWatered(false);
    }, 760);

    return () => window.clearTimeout(timer);
  }, [pot?.id, plant?.id, normalizedWateredStages.length]);

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

  const resetTouch = () => {
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleTouchStartCapture = (event) => {
    if (navigationDisabled || isChanging) {
      resetTouch();
      return;
    }

    const touch = event.touches?.[0];

    if (!touch) {
      resetTouch();
      return;
    }

    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
  };

  const handleTouchEndCapture = (event) => {
    if (
      touchStartX.current === null ||
      touchStartY.current === null ||
      isChanging
    ) {
      resetTouch();
      return;
    }

    const touch = event.changedTouches?.[0];

    if (!touch) {
      resetTouch();
      return;
    }

    const differenceX = touch.clientX - touchStartX.current;
    const differenceY = touch.clientY - touchStartY.current;

    resetTouch();

    if (Math.abs(differenceY) > Math.abs(differenceX)) {
      return;
    }

    if (Math.abs(differenceX) < SWIPE_DISTANCE) {
      return;
    }

    // Не даём кнопке под пальцем открыть модалку после горизонтального жеста.
    if (event.cancelable) {
      event.preventDefault();
    }
    event.stopPropagation();
    suppressClickUntil.current = Date.now() + 180;

    changePot(differenceX < 0 ? "next" : "previous");
  };

  const handleTouchCancelCapture = () => {
    resetTouch();
  };

  const handleClickCapture = (event) => {
    if (Date.now() >= suppressClickUntil.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    suppressClickUntil.current = 0;
  };

  return (
    <div
      className="plantation-slider"
      onTouchStartCapture={handleTouchStartCapture}
      onTouchEndCapture={handleTouchEndCapture}
      onTouchCancelCapture={handleTouchCancelCapture}
      onClickCapture={handleClickCapture}
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

              <GrowTimer
                growStep={growStep}
                timeLeft={timeLeft}
                fastForwardKey={normalizedWateredStages.length}
                fastForwardIdentity={pot?.id || "pot"}
              />

              {plant && (
                <Plant
                  plant={plant}
                  canCollect={canCollect && !collectDisabled}
                  onCollect={onCollect}
                  onOpenInfo={onOpenGrowthInfo}
                  infoDisabled={growthInfoDisabled}
                  needsWater={needsWater}
                  onWater={onWater}
                  isJustWatered={isJustWatered}
                  isHarvesting={isHarvesting}
                />
              )}
            </div>


            {growStep > 0 && growStep < 3 &&
              Array.isArray(careApplied) &&
              (careApplied.includes("nutrition") || careApplied.includes("mariaMix")) && (
                <div className="plant-care-status" aria-label="Применённые средства ухода">
                  {careApplied.includes("nutrition") && <span>🌿</span>}
                  {careApplied.includes("mariaMix") && <span>🧪</span>}
                </div>
              )}

            <div className="plantation-seed-basket">
              <SeedBasket
                disabled={!isEmpty || seedDisabled}
                onClick={onSeedClick}
              />
            </div>

            <div className="plantation-care-tool">
              <CareTool
                disabled={!canCare}
                appliedCount={Array.isArray(careApplied) ? careApplied.length : careApplied ? 1 : 0}
                wateredCount={Array.isArray(wateredStages) ? wateredStages.length : 0}
                onClick={onOpenCare}
              />
            </div>

          </>
        ) : (
          <button
            className={`add-pot-button ${isSlotAvailable ? "add-pot-button--available" : "add-pot-button--locked"}`}
            type="button"
            disabled={unlockDisabled}
            onClick={onUnlock}
            aria-label={isSlotAvailable ? (Number(unlockPrice) > 0 ? `Установить новое ведро за ${unlockPrice} монет` : "Установить подарок Марии") : lockedStatusText || "Место откроется по поручениям Марии"}
          >
            <span className="add-pot-button__shine" aria-hidden="true" />
            <span className="add-pot-symbol" aria-hidden="true">
              {isSlotAvailable ? (
                <span className="add-pot-symbol__plus">+</span>
              ) : (
                <span className="add-pot-symbol__lock">
                  <span className="add-pot-symbol__lock-loop" />
                  <span className="add-pot-symbol__lock-body"><span className="add-pot-symbol__keyhole" /></span>
                </span>
              )}
            </span>
            <span className="add-pot-copy">
              <strong>{isSlotAvailable ? "Установить ведро" : "Место закрыто"}</strong>
              <small>{isSlotAvailable ? (Number(unlockPrice) > 0 ? "Разрешение Марии получено" : "Подарок Марии Ивановны") : "Продолжи поручения Марии"}</small>
            </span>
            {isSlotAvailable ? (
              Number(unlockPrice) > 0 ? (
                <span className="add-pot-status add-pot-status--price">
                  <span className="add-pot-status__coin" aria-hidden="true" />
                  <strong>{unlockPrice}</strong><small>монет</small>
                </span>
              ) : (
                <span className="add-pot-status add-pot-status--gift"><span>ПОДАРОК</span><strong>Бесплатно</strong></span>
              )
            ) : (
              <span className="add-pot-status add-pot-status--maria"><span>МАРИЯ</span><strong>{lockedStatusText || "Поручение"}</strong></span>
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
