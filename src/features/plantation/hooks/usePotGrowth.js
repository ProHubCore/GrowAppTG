import { useEffect } from "react";

const LAST_GROWING_STAGE = 2;
const CURRENT_GROWTH_TIMING_VERSION = 2;

function getFiniteTimestamp(value) {
  const timestamp = Number(value);
  return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : null;
}

function getUpdatedPotState(potState, now, defaultGrowTime) {
  if (!potState?.unlocked) {
    return potState;
  }

  if (potState.growStep !== 1 && potState.growStep !== 2) {
    return potState;
  }

  // growTime — это полное время от посадки до готового урожая.
  // Визуальная смена фазы происходит внутри этого единого интервала.
  const growTime = Math.max(
    1,
    Number(potState.growTime) || defaultGrowTime,
  );
  const totalDurationMs = growTime * 1000;
  const phaseDurationMs = Math.max(1000, totalDurationMs / LAST_GROWING_STAGE);

  let growStep = potState.growStep;
  let nextGrowthAt = getFiniteTimestamp(potState.nextGrowthAt);
  let harvestAt = getFiniteTimestamp(potState.harvestAt);

  if (!harvestAt && nextGrowthAt) {
    harvestAt =
      growStep === 1
        ? nextGrowthAt + phaseDurationMs
        : nextGrowthAt;
  }

  if (!harvestAt) {
    const remainingFraction =
      growStep === 1 ? 1 : 1 / LAST_GROWING_STAGE;
    harvestAt = now + totalDurationMs * remainingFraction;
  }

  if (!nextGrowthAt) {
    nextGrowthAt =
      growStep === 1
        ? Math.min(harvestAt, now + phaseDurationMs)
        : harvestAt;
  }

  if (now >= harvestAt) {
    return {
      ...potState,
      growStep: 3,
      growTime,
      timeLeft: 0,
      nextGrowthAt: null,
      harvestAt: null,
      growthTimingVersion: CURRENT_GROWTH_TIMING_VERSION,
    };
  }

  // Картинка растения меняется, но общий таймер до harvestAt не сбрасывается.
  if (growStep === 1 && now >= nextGrowthAt) {
    growStep = 2;
    nextGrowthAt = harvestAt;
  } else if (growStep === 2 && nextGrowthAt !== harvestAt) {
    nextGrowthAt = harvestAt;
  }

  const timeLeft = Math.max(0, Math.ceil((harvestAt - now) / 1000));

  if (
    potState.growStep === growStep &&
    potState.growTime === growTime &&
    potState.timeLeft === timeLeft &&
    potState.nextGrowthAt === nextGrowthAt &&
    potState.harvestAt === harvestAt &&
    potState.growthTimingVersion === CURRENT_GROWTH_TIMING_VERSION
  ) {
    return potState;
  }

  return {
    ...potState,
    growStep,
    growTime,
    timeLeft,
    nextGrowthAt,
    harvestAt,
    growthTimingVersion: CURRENT_GROWTH_TIMING_VERSION,
  };
}

function usePotGrowth(setPotStates, defaultGrowTime) {
  useEffect(() => {
    const updateGrowth = () => {
      const now = Date.now();

      setPotStates((previousStates) => {
        if (!Array.isArray(previousStates)) {
          return previousStates;
        }

        let hasChanges = false;

        const updatedStates = previousStates.map((potState) => {
          const updatedPotState = getUpdatedPotState(
            potState,
            now,
            defaultGrowTime,
          );

          if (updatedPotState !== potState) {
            hasChanges = true;
          }

          return updatedPotState;
        });

        return hasChanges ? updatedStates : previousStates;
      });
    };

    updateGrowth();

    const interval = window.setInterval(updateGrowth, 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updateGrowth();
      }
    };

    const handleWindowFocus = () => {
      updateGrowth();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [setPotStates, defaultGrowTime]);
}

export default usePotGrowth;
