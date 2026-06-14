export const HARVEST_QUALITIES = [
  { id: "normal", name: "Обычное", rank: 0, icon: "●" },
  { id: "good", name: "Хорошее", rank: 1, icon: "◆" },
  { id: "excellent", name: "Отличное", rank: 2, icon: "✦" },
  { id: "rare", name: "Редкое", rank: 3, icon: "★" },
];

const QUALITY_WEIGHTS = {
  none: [0.58, 0.28, 0.11, 0.03],
  water: [0.55, 0.3, 0.12, 0.03],
  nutrition: [0.34, 0.39, 0.21, 0.06],
  joeMix: [0.38, 0.28, 0.18, 0.16],
};

export function rollHarvestQuality(careType = "none") {
  const weights = QUALITY_WEIGHTS[careType] || QUALITY_WEIGHTS.none;
  const roll = Math.random();
  let cursor = 0;

  for (let index = 0; index < weights.length; index += 1) {
    cursor += weights[index];
    if (roll <= cursor) return HARVEST_QUALITIES[index];
  }

  return HARVEST_QUALITIES[0];
}

export function getQualityById(qualityId) {
  return (
    HARVEST_QUALITIES.find((quality) => quality.id === qualityId) ||
    HARVEST_QUALITIES[0]
  );
}

export function getHarvestYield(careType, qualityId) {
  let amount = Math.floor(Math.random() * 3) + 1;

  if (careType === "nutrition") amount += 1;
  if (qualityId === "excellent" || qualityId === "rare") amount += 1;

  return amount;
}
