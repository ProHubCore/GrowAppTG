export const JOE_TRUST_LEVELS = [
  {
    level: 0,
    title: "Незнакомец",
    required: 0,
    icon: "👋",
    reward: "Доска дел Джо",
    unlockTitle: "Знакомство с Джо",
    unlockDescription: "Дядя Джо разрешил пользоваться своей доской поручений.",
    unlocks: ["Доска дел Джо", "Первая цепочка заданий"],
  },
  {
    level: 1,
    title: "Ученик",
    required: 25,
    icon: "💧",
    reward: "Быстрый полив",
    unlockTitle: "Сигнал о поливе",
    unlockDescription: "Когда растению нужна вода, оно показывает облачко с каплей. Нажатие сразу ускоряет текущую стадию роста.",
    unlocks: ["Облачко полива", "Полив одним нажатием", "Ускорение роста"],
  },
  {
    level: 2,
    title: "Подручный",
    required: 60,
    icon: "🌿",
    reward: "Питательный раствор у Зорика",
    unlockTitle: "Питательный раствор",
    unlockDescription: "Джо договорился с Зориком. В лавке появился питательный раствор для повышения качества и урожайности.",
    unlocks: ["Новый товар у Зорика", "Питательный раствор", "+1 плод при уходе"],
  },
  {
    level: 3,
    title: "Свой человек",
    required: 110,
    icon: "📜",
    reward: "Новая ветка испытаний Джо",
    unlockTitle: "Джо считает тебя своим",
    unlockDescription: "Открылась следующая часть обучения: задания на качество урожая и правильный уход.",
    unlocks: ["Новые дела Джо", "Испытания качества", "Продвижение к грибным культурам"],
  },
  {
    level: 4,
    title: "Партнёр",
    required: 180,
    icon: "🍄",
    reward: "Грибная ёмкость и грибные культуры",
    unlockTitle: "Грибное дело",
    unlockDescription: "Джо доверил тебе грибную ёмкость. Зорик теперь продаёт Психомор и другие грибные культуры.",
    unlocks: ["Грибная ёмкость", "Психомор", "Синий и Сонный колпаки"],
  },
  {
    level: 5,
    title: "Правая рука",
    required: 240,
    icon: "🧪",
    reward: "Смесь Джо и редкие грибницы",
    unlockTitle: "Секретная смесь Джо",
    unlockDescription: "В лавке Зорика появилась смесь Джо, а в закрытой поставке — самые редкие грибницы.",
    unlocks: ["Смесь Джо", "Призрачный сморчок", "Подготовка мастерской"],
  },
];

export function getJoeTrustInfo(trustValue) {
  const trust = Math.max(0, Number(trustValue) || 0);
  let current = JOE_TRUST_LEVELS[0];

  for (const level of JOE_TRUST_LEVELS) {
    if (trust >= level.required) current = level;
  }

  const index = JOE_TRUST_LEVELS.findIndex(
    (level) => level.level === current.level,
  );
  const next = JOE_TRUST_LEVELS[index + 1] || null;

  if (!next) {
    return { current, next: null, progress: 100, text: "MAX" };
  }

  const range = next.required - current.required;
  const value = trust - current.required;

  return {
    current,
    next,
    progress: Math.max(0, Math.min(100, (value / range) * 100)),
    text: `${value}/${range}`,
  };
}
