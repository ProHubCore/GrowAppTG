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
    unlockPrice: null,
    requiredClubLevel: null,
    released: false,
  },

  {
    id: 4,
    unlockPrice: null,
    requiredClubLevel: null,
    released: false,
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

  const requiredClubLevel =
    Number(slot.requiredClubLevel) || 1;

  const currentClubLevel =
    Number(clubLevel) || 1;

  const isLevelLocked =
    currentClubLevel < requiredClubLevel;

  if (isLevelLocked) {
    return {
      canBuy: false,
      isLevelLocked: true,
      isReleased: true,
      statusText: `Откроется на ${requiredClubLevel} уровне клуба`,
    };
  }

  const unlockPrice = Number(slot.unlockPrice);

  return {
    canBuy:
      Number.isFinite(unlockPrice) &&
      unlockPrice > 0,
    isLevelLocked: false,
    isReleased: true,
    statusText: `${unlockPrice} монет`,
  };
}