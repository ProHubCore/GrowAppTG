import { useEffect } from "react";

function updatePotGrowth(potState, now, defaultGrowTime) {
  if (!potState.unlocked) {
    return potState;
  }

  if (potState.growStep !== 1 && potState.growStep !== 2) {
    return potState;
  }

  const growTime = potState.growTime || defaultGrowTime;

  if (!potState.nextGrowthAt) {
    return {
      ...potState,
      timeLeft: growTime,
      nextGrowthAt: now + growTime * 1000,
    };
  }

  const millisecondsLeft = potState.nextGrowthAt - now;

  if (millisecondsLeft > 0) {
    const secondsLeft = Math.max(
      0,
      Math.ceil(millisecondsLeft / 1000)
    );

    if (secondsLeft === potState.timeLeft) {
      return potState;
    }

    return {
      ...potState,
      timeLeft: secondsLeft,
    };
  }

  if (potState.growStep === 1) {
    return {
      ...potState,
      growStep: 2,
      timeLeft: growTime,
      nextGrowthAt: now + growTime * 1000,
    };
  }

  return {
    ...potState,
    growStep: 3,
    timeLeft: 0,
    nextGrowthAt: null,
  };
}

function usePotGrowth(setPotStates, defaultGrowTime) {
  useEffect(() => {
    const interval = window.setInterval(() => {
      const now = Date.now();

      setPotStates((previousStates) =>
        previousStates.map((potState) =>
          updatePotGrowth(
            potState,
            now,
            defaultGrowTime
          )
        )
      );
    }, 250);

    return () => {
      window.clearInterval(interval);
    };
  }, [setPotStates, defaultGrowTime]);
}

export default usePotGrowth;