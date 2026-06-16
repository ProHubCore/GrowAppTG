export const CLUB_REPUTATION_STORAGE_KEY =
  "growapp-club-reputation";

export const CLUB_REPUTATION_EVENT =
  "growapp-club-reputation-change";

export const CLUB_LEVELS = [
  {
    level: 1,
    title: "Новый поставщик",
    required: 0,
    reward: "Доступ к клубному сбыту",
  },
  {
    level: 2,
    title: "Свой человек",
    required: 60,
    reward: "+5% к клубным ценам",
  },
  {
    level: 3,
    title: "Надёжный поставщик",
    required: 180,
    reward: "Второе место и +10% к клубным ценам",
  },
  {
    level: 4,
    title: "Звезда клуба",
    required: 420,
    reward: "+15% к клубным ценам",
  },
  {
    level: 5,
    title: "Легенда района",
    required: 850,
    reward: "Третье место и +20% к клубным ценам",
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
