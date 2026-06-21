import {
  CROP_BY_ID,
  CROP_IDS,
  createEmptyCropInventory,
  createEmptySeedInventory,
} from "../../features/plantation/data/crops";
import { MARIA_QUESTS } from "../../features/maria-ivanovna/mariaQuests";

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
    acidWater: source.acidWater === undefined ? 1 : safeNumber(source.acidWater),
  };
}

export function migrateShopStock(value) {
  const source = value && typeof value === "object" ? value : {};
  const next = {};

  for (const [oldId, amount] of Object.entries(source)) {
    if (oldId === "wateringCan") continue;
    const newId = oldId === "joeMix" ? "mariaMix" : mapCropId(oldId);
    next[newId] = safeNumber(next[newId]) + safeNumber(amount);
  }

  return next;
}

export function migratePotStates(value) {
  if (!Array.isArray(value)) return value;

  const now = Date.now();

  const padded = [...value];
  while (padded.length < 4) padded.push({ unlocked: false, growStep: 0, selectedSeedId: null });
  return padded.slice(0, 4).map((pot) => {
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
        timeLeft: 0,
        nextGrowthAt: null,
        harvestAt: null,
        careApplied: [],
        wateredStages: [],
        potTypeId: "soil",
        growthTimingVersion: 2,
      };
    }

    const savedGrowTime = Math.max(1, Number(pot?.growTime) || 0);
    const productionGrowTime = CROP_BY_ID[validSeedId]?.growTime || 90;
    const growTime = savedGrowTime || productionGrowTime;
    const totalDurationMs = growTime * 1000;
    const phaseDurationMs = Math.max(1000, totalDurationMs / 2);

    let nextGrowthAt = Number(pot?.nextGrowthAt);
    nextGrowthAt = Number.isFinite(nextGrowthAt) && nextGrowthAt > 0
      ? nextGrowthAt
      : null;

    let harvestAt = Number(pot?.harvestAt);
    harvestAt = Number.isFinite(harvestAt) && harvestAt > 0
      ? harvestAt
      : null;

    const isGrowing = growStep === 1 || growStep === 2;
    const isLegacyTwoPhaseTimer =
      isGrowing && Number(pot?.growthTimingVersion) !== 2;

    if (isLegacyTwoPhaseTimer) {
      const legacyRemainingMs = harvestAt
        ? Math.max(0, harvestAt - now)
        : Math.max(0, Number(pot?.timeLeft) || 0) * 1000 ||
          growTime * (3 - growStep) * 1000;
      const remainingMs = Math.max(1000, legacyRemainingMs / 2);
      const legacyUntilNextPhaseMs = nextGrowthAt
        ? Math.max(0, nextGrowthAt - now)
        : growStep === 1
          ? legacyRemainingMs / 2
          : legacyRemainingMs;

      harvestAt = now + remainingMs;
      nextGrowthAt = growStep === 1
        ? Math.min(harvestAt, now + Math.max(1000, legacyUntilNextPhaseMs / 2))
        : harvestAt;
    } else if (isGrowing) {
      if (!harvestAt && nextGrowthAt) {
        harvestAt = growStep === 1
          ? nextGrowthAt + phaseDurationMs
          : nextGrowthAt;
      }

      if (!harvestAt) {
        harvestAt = now + (growStep === 1 ? totalDurationMs : phaseDurationMs);
      }

      if (!nextGrowthAt) {
        nextGrowthAt = growStep === 1
          ? Math.min(harvestAt, now + phaseDurationMs)
          : harvestAt;
      }
    } else {
      nextGrowthAt = null;
      harvestAt = null;
    }

    const timeLeft = harvestAt
      ? Math.max(0, Math.ceil((harvestAt - now) / 1000))
      : 0;

    return {
      ...pot,
      selectedSeedId: validSeedId,
      growTime,
      timeLeft,
      nextGrowthAt,
      harvestAt,
      careApplied,
      wateredStages,
      potTypeId: "soil",
      growthTimingVersion: 2,
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

const MARIA_QUEST_TRUST = Object.fromEntries(
  MARIA_QUESTS.map((quest) => [
    quest.id,
    Math.max(0, Number(quest.reward?.trust) || 0),
  ]),
);

export function migrateMariaQuestState(value) {
  const source = value && typeof value === "object" ? value : {};
  const completedQuestIds = Array.isArray(source.completedQuestIds)
    ? [
        ...new Set(
          source.completedQuestIds.filter((id) => Object.hasOwn(MARIA_QUEST_TRUST, id)),
        ),
      ]
    : [];

  const completedTrust = completedQuestIds.reduce(
    (total, questId) => total + MARIA_QUEST_TRUST[questId],
    0,
  );
  const savedTrust = safeNumber(source.trust);
  const trust = Math.max(savedTrust, completedTrust);

  const hasCurrentProgress = completedQuestIds.length > 0 || trust > 0;

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
