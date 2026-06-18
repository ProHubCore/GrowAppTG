// Единая экономика первой главы Grow Street.
// Все числа здесь рассчитаны так, чтобы игрок принимал решения,
// а не бесконечно нажимал самую дорогую кнопку.
export const GAME_ECONOMY = {
  version: 3,
  startingCoins: 40,
  shopRefreshMs: 25 * 60_000,
  clubBuyerRefreshMs: 12 * 60_000,
  crops: {
    tabakko: {
      growTime: 150,
      basePrice: 10,
      seedPrice: 0,
      averageYield: 2.6,
    },
    greenTomato: {
      growTime: 420,
      basePrice: 20,
      seedPrice: 34,
      averageYield: 2.7,
    },
    kokaNova: {
      growTime: 900,
      basePrice: 38,
      seedPrice: 68,
      averageYield: 2.8,
    },
  },
  equipment: {
    secondSlot: 180,
    thirdSlot: 700,
  },
  care: {
    nutrition: 52,
    mariaMix: 145,
  },
  qualityMultipliers: {
    normal: 1,
    good: 1.45,
    excellent: 2.1,
    rare: 3.4,
  },
  negotiation: {
    clubFeeRate: 0.04,
    minAskMultiplier: 0.82,
    maxAskMultiplier: 1.45,
    rejectionReputationLoss: 2,
  },
};

export function getEconomyCrop(cropId) {
  return GAME_ECONOMY.crops[cropId] || GAME_ECONOMY.crops.tabakko;
}
