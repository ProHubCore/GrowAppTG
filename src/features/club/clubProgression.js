export const CLUB_REPUTATION_STORAGE_KEY =
  "growapp-club-reputation";

export const CLUB_REPUTATION_EVENT =
  "growapp-club-reputation-change";

// Клуб отвечает только за покупателей, цену и сложность заказов.
// Все места плантации открывает Мария Ивановна через поручения.
export const CLUB_LEVELS = [
  {
    level: 1,
    title: "Новый поставщик",
    required: 0,
    reward: "Первый покупатель",
    unlocks: ["1 покупатель", "Базовые заказы", "Обычное качество"],
    priceBonus: 0,
    seatCount: 1,
  },
  {
    level: 2,
    title: "Свой человек",
    required: 35,
    reward: "Второй покупатель и +5% к цене",
    unlocks: ["2 покупателя", "+5% к цене", "Больше выбора"],
    priceBonus: 5,
    seatCount: 2,
  },
  {
    level: 3,
    title: "Надёжный поставщик",
    required: 90,
    reward: "Коллекционеры качества и +10%",
    unlocks: ["Покупатели качества", "+10% к цене", "Более дорогие партии"],
    priceBonus: 10,
    seatCount: 2,
  },
  {
    level: 4,
    title: "Звезда клуба",
    required: 180,
    reward: "Третий покупатель и +15% к цене",
    unlocks: ["3 покупателя", "+15% к цене", "Заказы отличного качества"],
    priceBonus: 15,
    seatCount: 3,
  },
  {
    level: 5,
    title: "Легенда района",
    required: 340,
    reward: "VIP-заказы и +20% к цене",
    unlocks: ["VIP-покупатели", "Редкие заказы", "+20% к цене"],
    priceBonus: 20,
    seatCount: 3,
  },
];

export function normalizeReputation(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return 0;
  }

  return Math.floor(number);
}

export function readClubReputation() {
  try {
    return normalizeReputation(
      localStorage.getItem(CLUB_REPUTATION_STORAGE_KEY),
    );
  } catch {
    return 0;
  }
}

export function writeClubReputation(value) {
  const reputation = normalizeReputation(value);

  try {
    localStorage.setItem(CLUB_REPUTATION_STORAGE_KEY, String(reputation));
  } catch {
    // В приватном режиме localStorage может быть недоступен.
  }

  window.dispatchEvent(
    new CustomEvent(CLUB_REPUTATION_EVENT, {
      detail: { reputation },
    }),
  );

  return reputation;
}

export function addClubReputation(amount) {
  const reward = normalizeReputation(amount);
  return writeClubReputation(readClubReputation() + reward);
}

export function getClubLevelInfo(reputationValue) {
  const reputation = normalizeReputation(reputationValue);
  let currentLevel = CLUB_LEVELS[0];

  for (const level of CLUB_LEVELS) {
    if (reputation >= level.required) {
      currentLevel = level;
    }
  }

  const currentIndex = CLUB_LEVELS.findIndex(
    (level) => level.level === currentLevel.level,
  );

  const nextLevel = CLUB_LEVELS[currentIndex + 1] || null;

  if (!nextLevel) {
    return {
      reputation,
      currentLevel,
      nextLevel: null,
      progressPercent: 100,
      currentProgress: reputation - currentLevel.required,
      requiredProgress: 0,
    };
  }

  const requiredProgress =
    nextLevel.required - currentLevel.required;
  const currentProgress =
    reputation - currentLevel.required;

  return {
    reputation,
    currentLevel,
    nextLevel,
    progressPercent: Math.max(
      0,
      Math.min(
        100,
        (currentProgress / requiredProgress) * 100,
      ),
    ),
    currentProgress,
    requiredProgress,
  };
}

export function getClubLevel(reputationValue) {
  return getClubLevelInfo(reputationValue).currentLevel.level;
}

export function getClubSeatCount(reputationValue) {
  return getClubLevelInfo(reputationValue).currentLevel.seatCount || 1;
}

export function getClubPriceBonusPercent(reputationValue) {
  return getClubLevelInfo(reputationValue).currentLevel.priceBonus || 0;
}
