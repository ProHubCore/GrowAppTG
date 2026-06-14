export const HARVEST_QUALITIES = [
  { id: "normal", name: "Обычное", rank: 0, icon: "●" },
  { id: "good", name: "Хорошее", rank: 1, icon: "◆" },
  { id: "excellent", name: "Отличное", rank: 2, icon: "✦" },
  { id: "rare", name: "Редкое", rank: 3, icon: "★" },
];

function normalizeCare(care) {
  if (!care || care === "none") return [];
  return Array.isArray(care) ? care : [care];
}

function getWeights(care) {
  const applied = normalizeCare(care);
  let weights = [0.58, 0.28, 0.11, 0.03];

  if (applied.includes("water")) weights = [0.52, 0.31, 0.13, 0.04];
  if (applied.includes("nutrition")) weights = [0.08, 0.42, 0.38, 0.12];
  if (applied.includes("joeMix")) weights = [0, 0.15, 0.45, 0.40];
  if (applied.includes("nutrition") && applied.includes("joeMix")) weights = [0, 0.08, 0.42, 0.50];
  if (applied.length === 3) weights = [0, 0.05, 0.35, 0.60];

  return weights;
}

export function rollHarvestQuality(care = "none") {
  const weights = getWeights(care);
  const roll = Math.random();
  let cursor = 0;

  for (let index = 0; index < weights.length; index += 1) {
    cursor += weights[index];
    if (roll <= cursor) return HARVEST_QUALITIES[index];
  }

  return HARVEST_QUALITIES[0];
}

export function getQualityById(qualityId) {
  return HARVEST_QUALITIES.find((quality) => quality.id === qualityId) || HARVEST_QUALITIES[0];
}

export function getHarvestYield(care, qualityId) {
  const applied = normalizeCare(care);
  let amount = Math.floor(Math.random() * 3) + 1;
  if (applied.includes("nutrition")) amount += 1;
  if (qualityId === "excellent" || qualityId === "rare") amount += 1;
  if (applied.length === 3) amount += 1;
  return amount;
}
