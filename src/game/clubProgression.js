export const CLUB_REPUTATION_STORAGE_KEY =
  "growapp-club-reputation";

export const CLUB_REPUTATION_EVENT =
  "growapp-club-reputation-change";

export const CLUB_LEVELS = [
  {
    level: 1,
    title: "Новый знакомый",
    required: 0,
    reward: "Доступ к клубному сбыту",
  },
  {
    level: 2,
    title: "Свой человек",
    required: 50,
    reward: "Новые семена в магазине",
  },
  {
    level: 3,
    title: "Надёжный поставщик",
    required: 150,
    reward: "Второе ведро за 100 монет",
  },
  {
    level: 4,
    title: "Звезда клуба",
    required: 300,
    reward: "Скоро",
  },
  {
    level: 5,
    title: "Легенда района",
    required: 600,
    reward: "Скоро",
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
