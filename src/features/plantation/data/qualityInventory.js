import { HARVEST_QUALITIES } from "./harvestQuality";

export const QUALITY_PRICE_MULTIPLIERS = {
  normal: 1,
  good: 1.45,
  excellent: 2.1,
  rare: 3.4,
};

export function createEmptyQualityInventory() {
  return {};
}

export function getQualityAmount(qualityInventory, itemId, qualityId) {
  return Math.max(0, Number(qualityInventory?.[itemId]?.[qualityId]) || 0);
}

export function getQualityTotal(qualityInventory, itemId) {
  return HARVEST_QUALITIES.reduce(
    (sum, quality) => sum + getQualityAmount(qualityInventory, itemId, quality.id),
    0,
  );
}

export function addQualityItems(previous, itemId, qualityId, amount) {
  return {
    ...previous,
    [itemId]: {
      ...(previous?.[itemId] || {}),
      [qualityId]: getQualityAmount(previous, itemId, qualityId) + amount,
    },
  };
}

export function removeQualityItems(previous, itemId, qualityId, amount) {
  return {
    ...previous,
    [itemId]: {
      ...(previous?.[itemId] || {}),
      [qualityId]: Math.max(0, getQualityAmount(previous, itemId, qualityId) - amount),
    },
  };
}

export function removeAnyQuality(previous, itemId, amount) {
  let remaining = Math.max(0, amount);
  const next = { ...previous, [itemId]: { ...(previous?.[itemId] || {}) } };
  for (const quality of HARVEST_QUALITIES) {
    if (remaining <= 0) break;
    const available = getQualityAmount(next, itemId, quality.id);
    const removed = Math.min(available, remaining);
    next[itemId][quality.id] = available - removed;
    remaining -= removed;
  }
  return { next, removed: amount - remaining };
}
