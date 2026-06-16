import {
  CROP_IDS,
  createEmptyCropInventory,
  createEmptySeedInventory,
} from "../../features/plantation/data/crops";

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
    wateringCan: safeNumber(source.wateringCan) > 0 ? 1 : 0,
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

  return value.map((pot) => {
    const mappedSeedId = pot?.selectedSeedId
      ? mapCropId(pot.selectedSeedId)
      : null;
    const validSeedId = mappedSeedId && CROP_IDS.includes(mappedSeedId)
      ? mappedSeedId
      : null;

    const legacyCareApplied = [
      ...new Set(
        (Array.isArray(pot?.careApplied)
          ? pot.careApplied
          : pot?.careApplied
            ? [pot.careApplied]
            : []
        ).map((careId) => (careId === "joeMix" ? "mariaMix" : careId)),
      ),
    ];
    const careApplied = legacyCareApplied.filter((careId) => careId !== "water");

    const wateredStages = [
      ...new Set(
        (Array.isArray(pot?.wateredStages) ? pot.wateredStages : [])
          .map(Number)
          .filter((stage) => stage === 1 || stage === 2),
      ),
    ];

    const growStep = Math.max(0, Math.floor(Number(pot?.growStep) || 0));

    // В старой версии вода применялась один раз за весь цикл.
    // Считаем текущую стадию уже политой, чтобы старое сохранение не дало двойной бонус.
    if (
      legacyCareApplied.includes("water") &&
      wateredStages.length === 0 &&
      (growStep === 1 || growStep === 2)
    ) {
      wateredStages.push(growStep);
    }

    if (growStep > 0 && !validSeedId) {
      return {
        ...pot,
        growStep: 0,
        selectedSeedId: null,
        timeLeft: Math.max(1, Number(pot?.growTime) || 5),
        nextGrowthAt: null,
        careApplied: [],
        wateredStages: [],
        potTypeId: "soil",
      };
    }

    return {
      ...pot,
      selectedSeedId: validSeedId,
      careApplied,
      wateredStages,
      potTypeId: "soil",
    };
  });
}

export function migrateQualityInventory(value) {
  const source = value && typeof value === "object" ? value : {};
  const next = {};

  for (const [oldId, qualities] of Object.entries(source)) {
    const newId = mapCropId(oldId);
    if (!CROP_IDS.includes(newId) || !qualities || typeof qualities !== "object") continue;
    next[newId] ||= {};
    for (const [qualityId, amount] of Object.entries(qualities)) {
      next[newId][qualityId] =
        safeNumber(next[newId][qualityId]) + safeNumber(amount);
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

    const previous = next[newId] || {
      totalHarvested: 0,
      qualities: {},
      bestQualityRank: -1,
    };
    const candidateRank = Number(record.bestQualityRank ?? -1);
    const previousRank = Number(previous.bestQualityRank ?? -1);
    const qualities = { ...(previous.qualities || {}) };

    for (const [qualityId, amount] of Object.entries(record.qualities || {})) {
      qualities[qualityId] =
        safeNumber(qualities[qualityId]) + safeNumber(amount);
    }

    next[newId] = {
      ...previous,
      totalHarvested:
        safeNumber(previous.totalHarvested) + safeNumber(record.totalHarvested),
      qualities,
      bestQualityRank: Math.max(previousRank, candidateRank),
      bestQualityName:
        candidateRank > previousRank
          ? record.bestQualityName
          : previous.bestQualityName,
    };
  }

  return next;
}

const MARIA_QUEST_TRUST = {
  "maria-tabakko-delivery": 25,
  "maria-buy-watering-can": 10,
  "maria-first-watering": 25,
  "maria-kisloplod-seed": 15,
  "maria-kisloplod-harvest": 35,
  "maria-koka-seed": 15,
  "maria-koka-harvest": 35,
  "maria-quality-tabakko": 20,
  "maria-nutrition-care": 60,
};

export function migrateMariaQuestState(value) {
  const source = value && typeof value === "object" ? value : {};
  const completedQuestIds = Array.isArray(source.completedQuestIds)
    ? [
        ...new Set(
          source.completedQuestIds.filter((id) => Object.hasOwn(MARIA_QUEST_TRUST, id)),
        ),
      ]
    : [];

  const trust = completedQuestIds.reduce(
    (total, questId) => total + MARIA_QUEST_TRUST[questId],
    0,
  );

  const hasCurrentProgress = completedQuestIds.length > 0;

  return {
    ...source,
    completedQuestIds,
    trust,
    clubSales: hasCurrentProgress
      ? migrateCropInventory(source.clubSales)
      : createEmptyCropInventory(),
    careUses: {
      water: hasCurrentProgress ? safeNumber(source.careUses?.water) : 0,
      nutrition: hasCurrentProgress ? safeNumber(source.careUses?.nutrition) : 0,
      mariaMix: hasCurrentProgress
        ? safeNumber(source.careUses?.mariaMix) + safeNumber(source.careUses?.joeMix)
        : 0,
    },
  };
}
