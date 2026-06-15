import { CROP_IDS, createEmptyCropInventory, createEmptySeedInventory } from "../../features/plantation/data/crops";

export const LEGACY_CROP_ID_MAP = {
  lumenweed: "tabakko",
  moonmint: "kokaNova",
  velvetbud: "donJuana",
  starleaf: "xenobloom",
  emberpod: "xenobloom",
  psychoshroom: "psychomor",
  bluecap: "psilocubeCebensis",
  dreamcap: "psilocubeCebensis",
  ghostmorel: "psilocubeCebensis",
};

export function mapCropId(id) {
  return LEGACY_CROP_ID_MAP[id] || id;
}

function safeNumber(value) {
  return Math.max(0, Number(value) || 0);
}

function migrateFlatCounters(value, initialFactory) {
  const source = value && typeof value === "object" ? value : {};
  const next = initialFactory();

  for (const [oldId, amount] of Object.entries(source)) {
    const newId = mapCropId(oldId);
    if (!Object.hasOwn(next, newId)) continue;
    next[newId] = safeNumber(next[newId]) + safeNumber(amount);
  }

  return next;
}

export const migrateCropInventory = (value) =>
  migrateFlatCounters(value, createEmptyCropInventory);

export const migrateSeedInventory = (value) =>
  migrateFlatCounters(value, createEmptySeedInventory);

export function migrateCareInventory(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    nutrition: safeNumber(source.nutrition),
    mariaMix: safeNumber(source.mariaMix) + safeNumber(source.joeMix),
  };
}

export function migrateShopStock(value) {
  const source = value && typeof value === "object" ? value : {};
  const next = {};

  for (const [oldId, amount] of Object.entries(source)) {
    const newId = oldId === "joeMix" ? "mariaMix" : mapCropId(oldId);
    next[newId] = safeNumber(next[newId]) + safeNumber(amount);
  }

  return next;
}

export function migratePotStates(value) {
  if (!Array.isArray(value)) return value;
  return value.map((pot) => ({
    ...pot,
    selectedSeedId: pot?.selectedSeedId ? mapCropId(pot.selectedSeedId) : null,
    careApplied: (Array.isArray(pot?.careApplied) ? pot.careApplied : pot?.careApplied ? [pot.careApplied] : [])
      .map((careId) => (careId === "joeMix" ? "mariaMix" : careId)),
  }));
}

export function migrateQualityInventory(value) {
  const source = value && typeof value === "object" ? value : {};
  const next = {};

  for (const [oldId, qualities] of Object.entries(source)) {
    const newId = mapCropId(oldId);
    if (!CROP_IDS.includes(newId) || !qualities || typeof qualities !== "object") continue;
    next[newId] ||= {};
    for (const [qualityId, amount] of Object.entries(qualities)) {
      next[newId][qualityId] = safeNumber(next[newId][qualityId]) + safeNumber(amount);
    }
  }

  return next;
}

export function migratePlantCatalog(value) {
  const source = value && typeof value === "object" ? value : {};
  const next = {};

  for (const [oldId, record] of Object.entries(source)) {
    const newId = mapCropId(oldId);
    if (!CROP_IDS.includes(newId) || !record || typeof record !== "object") continue;

    const previous = next[newId] || { totalHarvested: 0, qualities: {}, bestQualityRank: -1 };
    const candidateRank = Number(record.bestQualityRank ?? -1);
    const previousRank = Number(previous.bestQualityRank ?? -1);
    const qualities = { ...(previous.qualities || {}) };

    for (const [qualityId, amount] of Object.entries(record.qualities || {})) {
      qualities[qualityId] = safeNumber(qualities[qualityId]) + safeNumber(amount);
    }

    next[newId] = {
      ...previous,
      totalHarvested: safeNumber(previous.totalHarvested) + safeNumber(record.totalHarvested),
      qualities,
      bestQualityRank: Math.max(previousRank, candidateRank),
      bestQualityName: candidateRank > previousRank ? record.bestQualityName : previous.bestQualityName,
    };
  }

  return next;
}

const QUEST_ID_MAP = {
  "joe-first-delivery": "maria-first-delivery",
  "joe-club-request": "maria-club-request",
  "joe-dark-seed": "maria-dark-seed",
  "joe-strange-harvest": "maria-strange-harvest",
  "joe-club-status": "maria-club-status",
  "joe-quality-harvest": "maria-quality-harvest",
  "joe-nutrition-care": "maria-nutrition-care",
  "joe-rare-discovery": "maria-rare-discovery",
};

export function migrateMariaQuestState(value) {
  const source = value && typeof value === "object" ? value : {};
  const completedQuestIds = Array.isArray(source.completedQuestIds)
    ? [...new Set(source.completedQuestIds.map((id) => QUEST_ID_MAP[id] || id))]
    : [];

  return {
    ...source,
    completedQuestIds,
    trust: safeNumber(source.trust),
    clubSales: migrateCropInventory(source.clubSales),
    careUses: {
      water: safeNumber(source.careUses?.water),
      nutrition: safeNumber(source.careUses?.nutrition),
      mariaMix: safeNumber(source.careUses?.mariaMix) + safeNumber(source.careUses?.joeMix),
    },
  };
}
