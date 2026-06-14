import { useEffect } from "react";

function getUpdatedPotState(potState, now, defaultGrowTime) {
  if (!potState?.unlocked) {
    return potState;
  }

  if (potState.growStep !== 1 && potState.growStep !== 2) {
    return potState;
  }

  const growTime = Math.max(
    1,
    Number(potState.growTime) || defaultGrowTime
  );

  const stageDurationMs = growTime * 1000;

  /*
   * Поддержка старых сохранений:
   * если растение растёт, но точного времени нет,
   * создаём новое время окончания стадии.
   */
  if (!potState.nextGrowthAt) {
    return {
      ...potState,
      growTime,
      timeLeft: growTime,
      nextGrowthAt: now + stageDurationMs,
    };
  }

  let growStep = potState.growStep;
  let nextGrowthAt = Number(potState.nextGrowthAt);

  if (!Number.isFinite(nextGrowthAt)) {
    nextGrowthAt = now + stageDurationMs;
  }

  /*
   * Самое важное:
   * учитываем всё время, которое прошло офлайн.
   *
   * Например:
   * стадия 1 закончилась 20 секунд назад,
   * стадия 2 тоже уже должна была закончиться —
   * растение сразу становится готовым.
   */
  while (growStep < 3 && now >= nextGrowthAt) {
    growStep += 1;

    if (growStep < 3) {
      /*
       * Не считаем от текущего времени.
       * Продолжаем считать от старого дедлайна,
       * чтобы не потерять офлайн-время.
       */
      nextGrowthAt += stageDurationMs;
    }
  }

  if (growStep >= 3) {
    if (
      potState.growStep === 3 &&
      potState.timeLeft === 0 &&
      potState.nextGrowthAt === null
    ) {
      return potState;
    }

    return {
      ...potState,
      growStep: 3,
      growTime,
      timeLeft: 0,
      nextGrowthAt: null,
    };
  }

  const timeLeft = Math.max(
    0,
    Math.ceil((nextGrowthAt - now) / 1000)
  );

  if (
    potState.growStep === growStep &&
    potState.growTime === growTime &&
    potState.timeLeft === timeLeft &&
    potState.nextGrowthAt === nextGrowthAt
  ) {
    return potState;
  }

  return {
    ...potState,
    growStep,
    growTime,
    timeLeft,
    nextGrowthAt,
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
            defaultGrowTime
          );

          if (updatedPotState !== potState) {
            hasChanges = true;
          }

          return updatedPotState;
        });

        return hasChanges ? updatedStates : previousStates;
      });
    };

    /*
     * Сразу пересчитываем растения при открытии игры.
     */
    updateGrowth();

    const interval = window.setInterval(updateGrowth, 1000);

    /*
     * Telegram и браузер могут замораживать таймеры,
     * когда приложение свёрнуто.
     * Поэтому пересчитываем рост при возвращении.
     */
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updateGrowth();
      }
    };

    const handleWindowFocus = () => {
      updateGrowth();
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    window.addEventListener("focus", handleWindowFocus);

    return () => {
      window.clearInterval(interval);

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      window.removeEventListener(
        "focus",
        handleWindowFocus
      );
    };
  }, [setPotStates, defaultGrowTime]);
}

export default usePotGrowth;