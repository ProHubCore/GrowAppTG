import { GAME_ECONOMY, getEconomyCrop } from "../economy/gameEconomy";
import { CROPS, CROP_BY_ID } from "../plantation/data/crops";
import { HARVEST_QUALITIES } from "../plantation/data/harvestQuality";
import {
  QUALITY_PRICE_MULTIPLIERS,
  getQualityAmount,
  getQualityTotal,
} from "../plantation/data/qualityInventory";
import { createClubLineup } from "./clubBuyers";
import { getClubPriceBonusPercent } from "./clubProgression";

export const CLUB_MARKET_STORAGE_KEY = "growapp-club-market-v11-balanced";

export const CLUB_BUYER_DELAYS = {
  completed: [5_000, 12_000],
  skipped: [16_000, 28_000],
  rejected: [30_000, 60_000],
};

const SOFT_NEGOTIATION_STEP = 0.055;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function randomInteger(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

export function getBuyerReplacementDelay(reason = "completed") {
  const [minimum, maximum] =
    CLUB_BUYER_DELAYS[reason] || CLUB_BUYER_DELAYS.completed;
  return randomInteger(minimum, maximum);
}

export function normalizeUnlockedCropIds(unlockedCropIds = []) {
  const allowed = new Set(
    Array.isArray(unlockedCropIds) ? unlockedCropIds : [],
  );

  return CROPS.map((crop) => crop.id).filter((cropId) => allowed.has(cropId));
}

export function getClubUnlockSignature(unlockedCropIds = []) {
  return normalizeUnlockedCropIds(unlockedCropIds).join("|");
}

function getStockedCropIds(qualityInventory, unlockedCropIds) {
  const allowed = new Set(normalizeUnlockedCropIds(unlockedCropIds));

  return CROPS.filter(
    (crop) =>
      allowed.has(crop.id) && getQualityTotal(qualityInventory, crop.id) > 0,
  ).map((crop) => crop.id);
}

function chooseRequestedCropId(buyer, qualityInventory, unlockedCropIds) {
  const availableCropIds = normalizeUnlockedCropIds(unlockedCropIds);
  if (availableCropIds.length === 0) return null;

  const stockedCropIds = getStockedCropIds(
    qualityInventory,
    availableCropIds,
  );
  const preferredIsAvailable =
    buyer.prefers && availableCropIds.includes(buyer.prefers);
  const preferredIsStocked =
    preferredIsAvailable && stockedCropIds.includes(buyer.prefers);

  if (preferredIsStocked && Math.random() < 0.72) return buyer.prefers;

  if (stockedCropIds.length > 0 && Math.random() < 0.74) {
    return stockedCropIds[randomInteger(0, stockedCropIds.length - 1)];
  }

  if (preferredIsAvailable && Math.random() < 0.62) return buyer.prefers;

  return availableCropIds[randomInteger(0, availableCropIds.length - 1)];
}

function getHighestOwnedQualityRank(qualityInventory, cropId) {
  let highestRank = -1;

  HARVEST_QUALITIES.forEach((quality) => {
    if (getQualityAmount(qualityInventory, cropId, quality.id) > 0) {
      highestRank = Math.max(highestRank, quality.rank || 0);
    }
  });

  return highestRank;
}

function createBuyerRequest(buyer, qualityInventory, unlockedCropIds) {
  const cropId = chooseRequestedCropId(
    buyer,
    qualityInventory,
    unlockedCropIds,
  );
  if (!cropId) return null;

  const crop = CROP_BY_ID[cropId];
  if (!crop) return null;

  const [minimumAmount, maximumAmount] = buyer.amount || [1, 3];
  const rolledAmount = randomInteger(minimumAmount, maximumAmount);
  const highestOwnedRank = getHighestOwnedQualityRank(
    qualityInventory,
    cropId,
  );
  const requestedRank = Math.max(0, Number(buyer.minQualityRank) || 0);
  const minQualityRank =
    highestOwnedRank >= 0
      ? Math.min(requestedRank, highestOwnedRank)
      : requestedRank;
  const largestMatchingStack = HARVEST_QUALITIES.filter(
    (quality) => (quality.rank || 0) >= minQualityRank,
  ).reduce(
    (largest, quality) =>
      Math.max(
        largest,
        getQualityAmount(qualityInventory, cropId, quality.id),
      ),
    0,
  );
  const amount =
    largestMatchingStack > 0
      ? clamp(rolledAmount, 1, largestMatchingStack)
      : rolledAmount;

  return {
    cropId,
    cropName: crop.name,
    cropIcon: crop.icon,
    amount,
    minQualityRank,
  };
}

function hydrateBuyer(
  buyer,
  qualityInventory,
  unlockedCropIds,
  { slotIndex = 0, now = Date.now() } = {},
) {
  const request = createBuyerRequest(
    buyer,
    qualityInventory,
    unlockedCropIds,
  );
  if (!request) return null;

  return {
    ...buyer,
    slotIndex,
    request,
    negotiationCount: 0,
    tradeInitialized: false,
    tradeLine: "",
    tradeOfferTotal: 0,
    tradePreviousOfferTotal: 0,
    tradeLastDelta: 0,
    tradeCeilingTotal: 0,
    tradeInterest: clamp(70 + (Number(buyer.tolerance) || 0.55) * 24, 62, 94),
    tradeRound: 0,
    tradeTone: "opening",
    lastPlayerLine: "",
    earnedCoins: 0,
    earnedReputation: 0,
    arrivedAt: now,
    replaceAt: 0,
    exitReason: null,
  };
}

export function createClubBuyer({
  qualityInventory = {},
  unlockedCropIds = [],
  excludedBuyerIds = [],
  slotIndex = 0,
  clubLevel = 1,
  now = Date.now(),
} = {}) {
  const normalizedUnlockedCropIds = normalizeUnlockedCropIds(unlockedCropIds);
  if (normalizedUnlockedCropIds.length === 0) return null;

  const buyer = createClubLineup(1, excludedBuyerIds, clubLevel)[0];
  return buyer
    ? hydrateBuyer(buyer, qualityInventory, normalizedUnlockedCropIds, {
        slotIndex,
        now,
      })
    : null;
}

export function createClubSession({
  seatCount = 1,
  qualityInventory = {},
  unlockedCropIds = [],
  previousBuyerIds = [],
  clubLevel = 1,
  now = Date.now(),
} = {}) {
  const normalizedUnlockedCropIds = normalizeUnlockedCropIds(unlockedCropIds);
  const lineup =
    normalizedUnlockedCropIds.length === 0
      ? []
      : createClubLineup(seatCount, previousBuyerIds, clubLevel);
  const buyers = lineup
    .map((buyer, slotIndex) =>
      hydrateBuyer(buyer, qualityInventory, normalizedUnlockedCropIds, {
        slotIndex,
        now,
      }),
    )
    .filter(Boolean);

  return {
    version: 11,
    createdAt: now,
    seatCount,
    clubLevel: Math.max(1, Math.floor(Number(clubLevel) || 1)),
    unlockSignature: getClubUnlockSignature(normalizedUnlockedCropIds),
    buyers,
  };
}

export function scheduleBuyerReplacement(
  buyer,
  reason = "completed",
  now = Date.now(),
) {
  if (!buyer) return buyer;
  return {
    ...buyer,
    replaceAt: now + getBuyerReplacementDelay(reason),
    exitReason: reason,
  };
}

export function replaceReadyClubBuyers(
  session,
  {
    qualityInventory = {},
    unlockedCropIds = [],
    clubLevel = 1,
    now = Date.now(),
  } = {},
) {
  if (!session?.buyers?.length) return session;

  let changed = false;
  const occupiedIds = new Set(
    session.buyers
      .filter((buyer) => buyer.status === "active")
      .map((buyer) => buyer.id),
  );

  const buyers = session.buyers.map((buyer, index) => {
    if (
      buyer.status === "active" ||
      !buyer.replaceAt ||
      now < buyer.replaceAt
    ) {
      return buyer;
    }

    const replacement = createClubBuyer({
      qualityInventory,
      unlockedCropIds,
      excludedBuyerIds: [...occupiedIds, buyer.id],
      slotIndex: Number.isFinite(buyer.slotIndex) ? buyer.slotIndex : index,
      clubLevel,
      now,
    });

    if (!replacement) return buyer;
    occupiedIds.add(replacement.id);
    changed = true;
    return replacement;
  });

  return changed ? { ...session, buyers } : session;
}

export function normalizeClubSession(value) {
  if (!value || typeof value !== "object" || !Array.isArray(value.buyers)) {
    return null;
  }

  const buyers = value.buyers
    .filter((buyer) => buyer && typeof buyer === "object" && buyer.id)
    .map((buyer, index) => ({
      ...buyer,
      slotIndex: Number.isFinite(Number(buyer.slotIndex))
        ? Math.max(0, Math.floor(Number(buyer.slotIndex)))
        : index,
      status: ["active", "completed", "left"].includes(buyer.status)
        ? buyer.status
        : "active",
      patienceLeft: Math.max(0, Math.floor(Number(buyer.patienceLeft) || 0)),
      negotiationCount: Math.max(
        0,
        Math.floor(Number(buyer.negotiationCount) || 0),
      ),
      offerFactor: clamp(Number(buyer.offerFactor) || 0.82, 0.5, 1.45),
      tradeInitialized: Boolean(buyer.tradeInitialized),
      tradeLine:
        typeof buyer.tradeLine === "string" ? buyer.tradeLine.slice(0, 220) : "",
      tradeOfferTotal: Math.max(
        0,
        Math.round(Number(buyer.tradeOfferTotal) || 0),
      ),
      tradePreviousOfferTotal: Math.max(
        0,
        Math.round(
          Number(buyer.tradePreviousOfferTotal) ||
            Number(buyer.tradeOfferTotal) ||
            0,
        ),
      ),
      tradeLastDelta: Math.max(
        0,
        Math.round(Number(buyer.tradeLastDelta) || 0),
      ),
      tradeCeilingTotal: Math.max(
        0,
        Math.round(Number(buyer.tradeCeilingTotal) || 0),
      ),
      tradeInterest: clamp(
        Number(buyer.tradeInterest) ||
          70 + (Number(buyer.tolerance) || 0.55) * 24,
        0,
        100,
      ),
      tradeRound: Math.max(
        0,
        Math.floor(Number(buyer.tradeRound) || 0),
      ),
      tradeTone: ["opening", "counter", "hold", "ceiling", "leaving", "deal"].includes(
        buyer.tradeTone,
      )
        ? buyer.tradeTone
        : "opening",
      lastPlayerLine:
        typeof buyer.lastPlayerLine === "string"
          ? buyer.lastPlayerLine.slice(0, 180)
          : "",
      arrivedAt: Math.max(0, Number(buyer.arrivedAt) || Date.now()),
      replaceAt: Math.max(0, Number(buyer.replaceAt) || 0),
      exitReason: ["completed", "skipped", "rejected"].includes(
        buyer.exitReason,
      )
        ? buyer.exitReason
        : null,
      request:
        buyer.request && CROP_BY_ID[buyer.request.cropId]
          ? {
              ...buyer.request,
              amount: Math.max(1, Math.floor(Number(buyer.request.amount) || 1)),
              minQualityRank: clamp(
                Math.floor(Number(buyer.request.minQualityRank) || 0),
                0,
                HARVEST_QUALITIES.length - 1,
              ),
            }
          : null,
    }))
    .filter((buyer) => buyer.request);

  return {
    version: 11,
    createdAt: Math.max(0, Number(value.createdAt) || Date.now()),
    clubLevel: Math.max(1, Math.floor(Number(value.clubLevel) || 1)),
    seatCount: clamp(
      Math.floor(Number(value.seatCount) || buyers.length || 1),
      1,
      3,
    ),
    unlockSignature:
      typeof value.unlockSignature === "string" ? value.unlockSignature : "",
    buyers,
  };
}

export function getMatchingStacks(qualityInventory, request) {
  if (!request?.cropId) return [];

  return HARVEST_QUALITIES.filter(
    (quality) => (quality.rank || 0) >= (request.minQualityRank || 0),
  )
    .map((quality) => ({
      key: `${request.cropId}:${quality.id}`,
      crop: CROP_BY_ID[request.cropId],
      quality,
      amount: getQualityAmount(qualityInventory, request.cropId, quality.id),
    }))
    .filter((stack) => stack.crop && stack.amount > 0);
}

export function getAllClubStacks(qualityInventory, unlockedCropIds = []) {
  const allowed = new Set(normalizeUnlockedCropIds(unlockedCropIds));

  return CROPS.filter((crop) => allowed.has(crop.id))
    .flatMap((crop) =>
      HARVEST_QUALITIES.map((quality) => ({
        key: `${crop.id}:${quality.id}`,
        crop,
        quality,
        amount: getQualityAmount(qualityInventory, crop.id, quality.id),
      })),
    )
    .filter((stack) => stack.amount > 0);
}

export function getClubTradeQuote({ buyer, stack, reputation }) {
  if (!buyer?.request || !stack?.crop || !stack?.quality) return null;

  const amount = Math.max(1, buyer.request.amount || 1);
  const qualityMultiplier = QUALITY_PRICE_MULTIPLIERS[stack.quality.id] || 1;
  const priceBonusPercent = getClubPriceBonusPercent(reputation);
  const reputationMultiplier = 1 + priceBonusPercent / 100;
  const preferenceMultiplier = buyer.prefers === stack.crop.id ? 1.08 : 1;
  const fairUnitPrice = Math.max(
    1,
    Math.round(
      getEconomyCrop(stack.crop.id).basePrice *
        qualityMultiplier *
        reputationMultiplier *
        preferenceMultiplier,
    ),
  );
  const offerFactor = clamp(Number(buyer.offerFactor) || 0.82, 0.5, 1.45);
  const unitPrice = Math.max(1, Math.round(fairUnitPrice * offerFactor));
  const total = unitPrice * amount;
  const marketTotal = fairUnitPrice * amount;
  const softAskFactor = clamp(
    offerFactor + SOFT_NEGOTIATION_STEP,
    GAME_ECONOMY.negotiation.minAskMultiplier,
    GAME_ECONOMY.negotiation.maxAskMultiplier,
  );
  const softAskUnitPrice = Math.max(1, Math.round(fairUnitPrice * softAskFactor));

  return {
    amount,
    qualityMultiplier,
    priceBonusPercent,
    fairUnitPrice,
    marketTotal,
    offerFactor,
    unitPrice,
    total,
    askFactor: softAskFactor,
    askUnitPrice: softAskUnitPrice,
    askTotal: softAskUnitPrice * amount,
    softAskFactor,
    softAskUnitPrice,
    softAskTotal: softAskUnitPrice * amount,
  };
}

export function negotiateClubOffer({ buyer, stack, reputation }) {
  const quote = getClubTradeQuote({ buyer, stack, reputation });
  if (!quote) return { type: "invalid" };

  return {
    type: "counter",
    pressure: "soft",
    patienceLeft: Math.max(0, Number(buyer?.patienceLeft) || 0),
    offerFactor: Number(quote.softAskFactor.toFixed(3)),
    message: `${buyer?.rejectLine || "Ладно."} Могу немного добавить.`,
  };
}

export function getSaleReputation({ buyer, stack, negotiationCount }) {
  const qualityRank = stack?.quality?.rank || 0;
  const amount = Math.max(1, buyer?.request?.amount || 1);
  const rounds = Math.max(
    0,
    Math.floor(
      Number.isFinite(Number(negotiationCount))
        ? Number(negotiationCount)
        : Number(buyer?.negotiationCount) || 0,
    ),
  );
  const base = 4 + amount * 2 + qualityRank * 2;
  const multiplier =
    rounds === 0
      ? 1.25
      : rounds === 1
        ? 0.9
        : rounds === 2
          ? 0.62
          : rounds === 3
            ? 0.4
            : rounds === 4
              ? 0.22
              : 0.1;

  return Math.max(0, Math.round(base * multiplier));
}

export function isClubSessionResolved(session) {
  return Boolean(
    session?.buyers?.length &&
      session.buyers.every((buyer) => buyer.status !== "active"),
  );
}
