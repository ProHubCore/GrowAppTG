export const plantationSlots = [
  {
    id: 1,
    unlockPrice: 0,
    requiredClubLevel: 1,
    released: true,
  },
  {
    id: 2,
    unlockPrice: 100,
    requiredClubLevel: 3,
    released: true,
  },
  {
    id: 3,
    unlockPrice: 500,
    requiredClubLevel: 5,
    released: true,
  },
];

export function getPlantationSlotState(
  slot,
  clubLevel,
  isUnlocked = false,
) {
  if (!slot) {
    return {
      canBuy: false,
      isLevelLocked: false,
      isReleased: false,
      statusText: "Пока что недоступно",
    };
  }

  if (isUnlocked) {
    return {
      canBuy: false,
      isLevelLocked: false,
      isReleased: true,
      statusText: "Открыто",
    };
  }

  if (!slot.released) {
    return {
      canBuy: false,
      isLevelLocked: false,
      isReleased: false,
      statusText: "Пока что недоступно",
    };
  }

  const currentLevel = Math.max(
    1,
    Math.floor(Number(clubLevel) || 1),
  );

  const requiredLevel = Math.max(
    1,
    Math.floor(Number(slot.requiredClubLevel) || 1),
  );

  if (currentLevel < requiredLevel) {
    return {
      canBuy: false,
      isLevelLocked: true,
      isReleased: true,
      statusText: `Откроется на ${requiredLevel} уровне клуба`,
    };
  }

  const price = Number(slot.unlockPrice);

  return {
    canBuy: Number.isFinite(price) && price > 0,
    isLevelLocked: false,
    isReleased: true,
    statusText: Number.isFinite(price)
      ? `${price} монет`
      : "Пока что недоступно",
  };
}
