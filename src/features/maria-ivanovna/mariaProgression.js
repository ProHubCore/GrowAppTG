export const MARIA_TRUST_LEVELS = [
  {
    level: 0,
    title: "Незнакомец",
    required: 0,
    icon: "👋",
    reward: "Доска дел Марии Ивановны",
    unlockTitle: "Знакомство с Марией Ивановной",
    unlockDescription: "Мария Ивановна разрешила пользоваться своей доской поручений.",
    unlocks: ["Доска дел", "Первая цепочка заданий"],
  },
  {
    level: 1,
    title: "Ученик",
    required: 25,
    icon: "💧",
    reward: "Старая лейка и чистая вода",
    unlockTitle: "Старая лейка",
    unlockDescription: "Теперь во время роста можно использовать чистую воду и ускорять созревание.",
    unlocks: ["Инструмент ухода", "Чистая вода", "Ускорение роста"],
  },
  {
    level: 2,
    title: "Подручный",
    required: 60,
    icon: "🌿",
    reward: "Питательный раствор у Зорика",
    unlockTitle: "Питательный раствор",
    unlockDescription: "Мария Ивановна договорилась с Зориком: в лавке появился состав для качества и урожайности.",
    unlocks: ["Новый товар у Зорика", "Питательный раствор", "+1 плод при уходе"],
  },
  {
    level: 3,
    title: "Свой человек",
    required: 110,
    icon: "📜",
    reward: "Новая ветка испытаний",
    unlockTitle: "Мария Ивановна считает тебя своим",
    unlockDescription: "Открылись задания на качество урожая и правильный уход.",
    unlocks: ["Новые дела", "Испытания качества", "Путь к грибным культурам"],
  },
  {
    level: 4,
    title: "Партнёр",
    required: 180,
    icon: "🍄",
    reward: "Мико-биореактор и Психомор",
    unlockTitle: "Грибное дело",
    unlockDescription: "Мария Ивановна доверила тебе мико-биореактор. Зорик теперь продаёт грибные культуры.",
    unlocks: ["Мико-биореактор", "Психомор", "Грибная ветка"],
  },
  {
    level: 5,
    title: "Правая рука",
    required: 240,
    icon: "🧪",
    reward: "Секретная смесь и Псилокуб Цебенсис",
    unlockTitle: "Смесь Марии Ивановны",
    unlockDescription: "В лавке появился секретный состав, а в закрытой поставке — Псилокуб Цебенсис.",
    unlocks: ["Смесь Марии Ивановны", "Псилокуб Цебенсис", "Подготовка мастерской"],
  },
];

export function getMariaTrustInfo(trustValue) {
  const trust = Math.max(0, Number(trustValue) || 0);
  let current = MARIA_TRUST_LEVELS[0];

  for (const level of MARIA_TRUST_LEVELS) {
    if (trust >= level.required) current = level;
  }

  const index = MARIA_TRUST_LEVELS.findIndex((level) => level.level === current.level);
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
