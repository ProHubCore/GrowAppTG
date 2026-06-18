export const PREMIUM_CURRENCY = Object.freeze({
  id: "growCoin",
  name: "G-монеты",
  shortName: "G",
  icon: "◆",
  storageKey: "growapp-premium-coins",
  demoStartingBalance: 1000,
  coinsPerStar: 10,
});

export const PREMIUM_PRICES = Object.freeze({
  shopRefresh: 5,
});

export function normalizePremiumBalance(value) {
  return Math.max(0, Math.floor(Number(value) || 0));
}

export function getInstantGrowCost({ growStep, timeLeft, growTime }) {
  const stage = Math.min(2, Math.max(1, Math.floor(Number(growStep) || 1)));
  const stageTime = Math.max(1, Math.ceil(Number(growTime) || 1));
  const currentStageLeft = Math.max(0, Math.ceil(Number(timeLeft) || 0));
  const futureStages = Math.max(0, 2 - stage);
  const totalSecondsLeft = currentStageLeft + futureStages * stageTime;

  // Примерно одна G-монета за каждые две минуты ожидания.
  // Стартовые значения: Табакко ≈ 2, Кислоплод ≈ 4, Кока Нова ≈ 8.
  return Math.max(1, Math.ceil(totalSecondsLeft / 120));
}

export function starsToPremiumCoins(stars) {
  return Math.max(
    0,
    Math.floor(Number(stars) || 0) * PREMIUM_CURRENCY.coinsPerStar,
  );
}
