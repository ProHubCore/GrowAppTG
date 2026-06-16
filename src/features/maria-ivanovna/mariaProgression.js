export const MARIA_TRUST_LEVELS = [
  {
    level: 0,
    title: "Чужак",
    required: 0,
    icon: "◌",
    reward: "Доска дел",
    unlockTitle: "Мария тебя заметила",
    unlockDescription: "Теперь у тебя есть первое дело на Grow Street.",
    unlocks: ["Доска дел", "Первая глава", "Табакко"],
  },
  {
    level: 1,
    title: "Ученик",
    required: 25,
    icon: "💧",
    reward: "Лейка у Зорика",
    unlockTitle: "Инструмент ученика",
    unlockDescription: "В лавке появилась постоянная лейка: один полив на стадию снимает 20% времени.",
    unlocks: ["Старая лейка", "Полив стадий", "Ускорение роста"],
  },
  {
    level: 2,
    title: "Подручный",
    required: 60,
    icon: "🟢",
    reward: "Кислоплод",
    unlockTitle: "Кислая линия",
    unlockDescription: "Зорик открыл семена Кислоплода, а клуб начал спрашивать новый товар.",
    unlocks: ["Кислоплод", "Новые покупатели", "Вторая глава"],
  },
  {
    level: 3,
    title: "Свой",
    required: 110,
    icon: "🍃",
    reward: "Кока Нова",
    unlockTitle: "Закрытая поставка",
    unlockDescription: "Мария поручилась за тебя. Кока Нова появилась в лавке.",
    unlocks: ["Кока Нова", "Дорогие сделки", "Третья культура"],
  },
  {
    level: 4,
    title: "Садовник района",
    required: 160,
    icon: "🌿",
    reward: "Питательный раствор",
    unlockTitle: "Работа на качество",
    unlockDescription: "В лавке появился раствор, увеличивающий урожай и шанс высокого качества.",
    unlocks: ["Питательный раствор", "+1 плод", "Качественный товар"],
  },
  {
    level: 5,
    title: "Доверенное лицо",
    required: 240,
    icon: "🧪",
    reward: "Смесь Марии",
    unlockTitle: "Секретный состав",
    unlockDescription: "Мария доверила тебе смесь для отличных и редких урожаев.",
    unlocks: ["Смесь Марии", "Редкое качество", "Финальная глава"],
  },
  {
    level: 6,
    title: "Хозяин грядки",
    required: 350,
    icon: "✦",
    reward: "Ключ от старого лифта",
    unlockTitle: "Следующая глава",
    unlockDescription: "Мария показала старый лифт. Под ним — закрытый грибной подвал.",
    unlocks: ["Ключ от лифта", "Подготовка подвала", "Новая сюжетная ветка"],
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
