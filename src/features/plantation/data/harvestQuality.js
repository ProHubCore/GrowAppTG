import { getEconomyCrop } from "../../economy/gameEconomy";

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

function normalizeWateredStages(wateredStages) {
  if (Array.isArray(wateredStages)) {
    return [...new Set(wateredStages.map(Number).filter((value) => value === 1 || value === 2))];
  }

  const numeric = Math.max(0, Math.min(2, Math.floor(Number(wateredStages) || 0)));
  return Array.from({ length: numeric }, (_, index) => index + 1);
}

function getQualityWeights(care, wateredStages) {
  const applied = normalizeCare(care);
  const waterCount = normalizeWateredStages(wateredStages).length;
  const hasNutrition = applied.includes("nutrition");
  const hasMariaMix = applied.includes("mariaMix");

  // Без ухода урожай всегда обычный. Обычный полив может поднять его
  // только до хорошего качества — отличный и редкий требуют растворов.
  if (!hasNutrition && !hasMariaMix) {
    if (waterCount >= 2) return [0.15, 0.85, 0, 0];
    if (waterCount === 1) return [0.65, 0.35, 0, 0];
    return [1, 0, 0, 0];
  }

  if (hasNutrition && hasMariaMix) {
    if (waterCount >= 2) return [0, 0.05, 0.77, 0.18];
    if (waterCount === 1) return [0, 0.12, 0.76, 0.12];
    return [0, 0.25, 0.67, 0.08];
  }

  if (hasMariaMix) {
    if (waterCount >= 2) return [0, 0.18, 0.72, 0.1];
    if (waterCount === 1) return [0, 0.3, 0.64, 0.06];
    return [0.05, 0.45, 0.46, 0.04];
  }

  if (waterCount >= 2) return [0, 0.2, 0.76, 0.04];
  if (waterCount === 1) return [0.05, 0.38, 0.55, 0.02];
  return [0.15, 0.5, 0.34, 0.01];
}

function normalizeWeights(weights, fallback = [1, 0, 0]) {
  const source = Array.isArray(weights) ? weights : fallback;
  const safe = source.map((value) => Math.max(0, Number(value) || 0));
  const total = safe.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return fallback;
  return safe.map((value) => value / total);
}

function rollWeightedIndex(weights) {
  const normalized = normalizeWeights(weights);
  const roll = Math.random();
  let cursor = 0;

  for (let index = 0; index < normalized.length; index += 1) {
    cursor += normalized[index];
    if (roll <= cursor) return index;
  }

  return normalized.length - 1;
}

function getYieldWeights(cropId, care, wateredStages) {
  const crop = getEconomyCrop(cropId);
  const applied = normalizeCare(care);
  const waterCount = normalizeWateredStages(wateredStages).length;

  if (applied.includes("nutrition")) {
    return crop.nutritionYieldWeights?.[waterCount]
      || crop.nutritionYieldWeights?.[2]
      || [0, 0.35, 0.65];
  }

  if (waterCount > 0) {
    return crop.wateredYieldWeights?.[waterCount]
      || crop.wateredYieldWeights?.[2]
      || crop.yieldWeights;
  }

  return crop.yieldWeights || [0.25, 0.55, 0.2];
}

export function getHarvestQualityChances(care = "none", wateredStages = []) {
  const weights = getQualityWeights(care, wateredStages);
  return Object.fromEntries(
    HARVEST_QUALITIES.map((quality, index) => [quality.id, weights[index] || 0]),
  );
}

export function getHarvestForecast({
  cropId = "tabakko",
  care = "none",
  wateredStages = [],
} = {}) {
  const qualityChances = getHarvestQualityChances(care, wateredStages);
  const yieldWeights = normalizeWeights(getYieldWeights(cropId, care, wateredStages));
  const possibleYields = yieldWeights
    .map((chance, index) => ({ amount: index + 1, chance }))
    .filter((entry) => entry.chance > 0);
  const waterCount = normalizeWateredStages(wateredStages).length;
  const applied = normalizeCare(care);
  const highestQuality = [...HARVEST_QUALITIES]
    .reverse()
    .find((quality) => qualityChances[quality.id] > 0) || HARVEST_QUALITIES[0];
  const expectedYield = possibleYields.reduce(
    (sum, entry) => sum + entry.amount * entry.chance,
    0,
  );

  return {
    qualityChances,
    possibleYields,
    minYield: possibleYields[0]?.amount || 1,
    maxYield: possibleYields[possibleYields.length - 1]?.amount || 1,
    expectedYield,
    waterCount,
    appliedCare: applied,
    highestQuality,
  };
}

export function rollHarvestQuality(care = "none", wateredStages = []) {
  const weights = getQualityWeights(care, wateredStages);
  return HARVEST_QUALITIES[rollWeightedIndex(weights)] || HARVEST_QUALITIES[0];
}

export function getQualityById(qualityId) {
  return HARVEST_QUALITIES.find((quality) => quality.id === qualityId)
    || HARVEST_QUALITIES[0];
}

export function getHarvestYield(
  care = "none",
  qualityId = "normal",
  cropId = "tabakko",
  wateredStages = [],
) {
  // Качество и количество считаются отдельно: редкий урожай дороже,
  // но не создаёт дополнительные предметы из воздуха.
  const weights = getYieldWeights(cropId, care, wateredStages);
  return rollWeightedIndex(weights) + 1;
}
