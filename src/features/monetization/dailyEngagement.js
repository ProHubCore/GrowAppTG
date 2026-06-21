import { getQualityById } from "../plantation/data/harvestQuality";
import { CROP_BY_ID } from "../plantation/data/crops";

export const DAILY_REWARDS = Object.freeze([
  { day: 1, icon: "●", title: "Разогрев", coins: 15 },
  { day: 2, icon: "◉", title: "Уход", care: { nutrition: 1 } },
  { day: 3, icon: "◆", title: "Оборот", coins: 25 },
  { day: 4, icon: "✦", title: "Запас", coins: 30 },
  { day: 5, icon: "◇", title: "Смесь", care: { mariaMix: 1 } },
  { day: 6, icon: "⬡", title: "Касса", coins: 40 },
  { day: 7, icon: "★", title: "Недельный бонус", coins: 70, care: { nutrition: 1 } },
]);

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysBetween(aKey, bKey) {
  const a = new Date(`${aKey}T12:00:00`);
  const b = new Date(`${bKey}T12:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export function prepareDailyLogin(previousState, date = new Date()) {
  const today = getLocalDateKey(date);
  const previous = previousState && typeof previousState === "object"
    ? previousState
    : {};
  const lastClaimed = String(previous.lastClaimed || "");

  if (lastClaimed === today) {
    return {
      state: {
        streak: Math.max(1, Math.min(7, Number(previous.streak) || 1)),
        lastClaimed,
      },
      canClaim: false,
      reward: null,
    };
  }

  const gap = lastClaimed ? daysBetween(lastClaimed, today) : null;
  const streak = gap === 1
    ? ((Math.max(1, Number(previous.streak) || 1) % 7) + 1)
    : 1;

  return {
    state: { streak, lastClaimed },
    canClaim: true,
    reward: DAILY_REWARDS[streak - 1],
    today,
  };
}

export function claimDailyLogin(prepared) {
  if (!prepared?.canClaim || !prepared.today) return prepared?.state || {};
  return {
    streak: prepared.state.streak,
    lastClaimed: prepared.today,
  };
}

const ORDER_TEMPLATES = Object.freeze([
  { minQualityId: "normal", amount: 3, coins: 32, growth: 0 },
  { minQualityId: "good", amount: 2, coins: 52, growth: 0 },
  { minQualityId: "excellent", amount: 1, coins: 78, growth: 0 },
]);

function hashDateKey(dateKey) {
  return String(dateKey || "").split("").reduce((hash, char) => ((hash * 31) + char.charCodeAt(0)) >>> 0, 17);
}

export function createDailyOrder({ unlockedCropIds = [], date = new Date() } = {}) {
  const dateKey = getLocalDateKey(date);
  const candidates = unlockedCropIds.length > 0 ? unlockedCropIds : ["tabakko"];
  const hash = hashDateKey(dateKey);
  const cropId = candidates[hash % candidates.length] || "tabakko";
  const template = ORDER_TEMPLATES[hash % ORDER_TEMPLATES.length];
  const crop = CROP_BY_ID[cropId] || CROP_BY_ID.tabakko;
  const quality = getQualityById(template.minQualityId);

  return {
    id: `daily-${dateKey}-${cropId}-${template.minQualityId}`,
    dateKey,
    cropId,
    cropName: crop?.name || "Урожай",
    cropIcon: crop?.icon || "✦",
    minQualityId: template.minQualityId,
    minQualityRank: quality?.rank || 0,
    qualityName: quality?.name || "Обычное",
    amount: template.amount,
    progress: 0,
    completed: false,
    claimed: false,
    reward: { coins: template.coins, growth: template.growth },
  };
}

export function normalizeDailyOrder(value, options = {}) {
  const generated = createDailyOrder(options);
  if (!value || value.dateKey !== generated.dateKey) return generated;

  return {
    ...generated,
    ...value,
    progress: Math.max(0, Math.min(generated.amount, Number(value.progress) || 0)),
    completed: Boolean(value.completed),
    claimed: Boolean(value.claimed),
  };
}

export function applySaleToDailyOrder(order, sale) {
  if (!order || order.completed || order.claimed) {
    return { order, matchedAmount: 0, completedNow: false };
  }

  const quality = getQualityById(sale?.qualityId || "normal");
  const matches =
    sale?.itemId === order.cropId &&
    (quality?.rank || 0) >= (order.minQualityRank || 0);

  if (!matches) return { order, matchedAmount: 0, completedNow: false };

  const matchedAmount = Math.max(0, Math.floor(Number(sale?.amount) || 0));
  const progress = Math.min(order.amount, (order.progress || 0) + matchedAmount);
  const completedNow = progress >= order.amount;

  return {
    matchedAmount,
    completedNow,
    order: {
      ...order,
      progress,
      completed: completedNow,
    },
  };
}
