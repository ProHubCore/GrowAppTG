// Экономика первой главы Grow Street.
// Цель: у игрока всегда есть безопасный способ восстановиться через Табакко,
// но платные культуры требуют оборота, ухода и разумного выбора покупателя.
export const GAME_ECONOMY = {
  version: 4,
  startingCoins: 24,
  shopRefreshMs: 30 * 60_000,
  clubBuyerRefreshMs: 12 * 60_000,

  crops: {
    tabakko: {
      growTime: 90,
      basePrice: 7,
      seedPrice: 0,
      yieldWeights: [0.15, 0.55, 0.3],
      wateredYieldWeights: {
        1: [0.1, 0.54, 0.36],
        2: [0.05, 0.45, 0.5],
      },
      nutritionYieldWeights: {
        0: [0, 0.25, 0.75],
        1: [0, 0.18, 0.82],
        2: [0, 0.12, 0.88],
      },
    },
    greenTomato: {
      growTime: 240,
      basePrice: 15,
      seedPrice: 20,
      yieldWeights: [0.25, 0.55, 0.2],
      wateredYieldWeights: {
        1: [0.18, 0.55, 0.27],
        2: [0.1, 0.52, 0.38],
      },
      nutritionYieldWeights: {
        0: [0, 0.35, 0.65],
        1: [0, 0.28, 0.72],
        2: [0, 0.22, 0.78],
      },
    },
    kokaNova: {
      growTime: 480,
      basePrice: 28,
      seedPrice: 44,
      yieldWeights: [0.35, 0.5, 0.15],
      wateredYieldWeights: {
        1: [0.28, 0.5, 0.22],
        2: [0.17, 0.5, 0.33],
      },
      nutritionYieldWeights: {
        0: [0, 0.45, 0.55],
        1: [0, 0.38, 0.62],
        2: [0, 0.32, 0.68],
      },
    },
  },

  equipment: {
    secondSlot: 160,
    thirdSlot: 650,
  },

  care: {
    nutrition: 18,
    mariaMix: 34,
    acidWater: 18,
  },

  qualityMultipliers: {
    normal: 1,
    good: 1.28,
    excellent: 1.7,
    rare: 4,
  },

  negotiation: {
    clubFeeRate: 0.04,
    minAskMultiplier: 0.78,
    maxAskMultiplier: 1.28,
    rejectionReputationLoss: 2,
  },
};

export function getEconomyCrop(cropId) {
  return GAME_ECONOMY.crops[cropId] || GAME_ECONOMY.crops.tabakko;
}
