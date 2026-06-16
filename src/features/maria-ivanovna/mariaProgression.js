export const MARIA_TRUST_LEVELS = [
  {
    level: 0,
    title: "Незнакомец",
    required: 0,
    icon: "👋",
    reward: "Доска дел Марии Ивановны",
    unlockTitle: "Знакомство с Марией Ивановной",
    unlockDescription: "Мария Ивановна разрешила пользоваться своей доской поручений.",
    unlocks: ["Доска дел", "Первая цепочка заданий", "Табакко доступен сразу"],
  },
  {
    level: 1,
    title: "Ученик",
    required: 25,
    icon: "💧",
    reward: "Старая лейка у Зорика",
    unlockTitle: "Лейка появилась в магазине",
    unlockDescription: "Зорик теперь продаёт постоянную лейку. Она срезает 20% полной длительности каждой стадии роста.",
    unlocks: ["Старая лейка у Зорика", "Полив стадий", "−20% времени за полив"],
  },
  {
    level: 2,
    title: "Подручный",
    required: 60,
    icon: "🟢",
    reward: "Семена Кислоплода",
    unlockTitle: "Открыт Кислоплод",
    unlockDescription: "После урока полива Зорик добавил на витрину семена Кислоплода.",
    unlocks: ["Кислоплод", "Новая культура у Зорика", "Новые задания"],
  },
  {
    level: 3,
    title: "Свой человек",
    required: 110,
    icon: "🍃",
    reward: "Семена Кока Новы",
    unlockTitle: "Открыта Кока Нова",
    unlockDescription: "Мария Ивановна разрешила Зорику открыть закрытую поставку Кока Новы.",
    unlocks: ["Кока Нова", "Третья культура плантации", "Новые клубные поставки"],
  },
  {
    level: 4,
    title: "Партнёр",
    required: 160,
    icon: "🌿",
    reward: "Питательный раствор у Зорика",
    unlockTitle: "Питательный раствор",
    unlockDescription: "В магазине появился состав, повышающий качество и урожайность растений.",
    unlocks: ["Питательный раствор", "+1 плод", "Повышение качества"],
  },
  {
    level: 5,
    title: "Правая рука",
    required: 240,
    icon: "🧪",
    reward: "Смесь Марии Ивановны",
    unlockTitle: "Секретная смесь",
    unlockDescription: "Мария Ивановна доверила Зорику свой редкий состав для лучших урожаев.",
    unlocks: ["Смесь Марии Ивановны", "Шанс редкого качества", "Подготовка следующей главы"],
  },
];

export function getMariaTrustInfo(trustValue) {
  const trust = Math.max(0, Number(trustValue) || 0);
  let current = MARIA_TRUST_LEVELS[0];

  for (const level of MARIA_TRUST_LEVELS) {
    if (trust >= level.required) current = level;
  }

  const index = MARIA_TRUST_LEVELS.findIndex(
    (level) => level.level === current.level,
  );
  const next = MARIA_TRUST_LEVELS[index + 1] || null;

  if (!next) return { current, next: null, progress: 100, text: "MAX" };

  const range = next.required - current.required;
  const value = trust - current.required;

  return {
    current,
    next,
    progress: Math.max(0, Math.min(100, (value / range) * 100)),
    text: `${value}/${range}`,
  };
}
