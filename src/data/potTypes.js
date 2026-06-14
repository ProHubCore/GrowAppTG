export const POT_TYPES = [
  {
    id: "soil",
    name: "Растительное ведро",
    shortName: "Для растений",
    icon: "🪴",
    image: "/assets/pots/bucket-1.png",
    description: "Обычная земля для томатов, Психомора и других растений.",
    requiredTrust: 0,
    seedType: "plant",
  },
  {
    id: "mushroom",
    name: "Грибная ёмкость",
    shortName: "Для грибов",
    icon: "🍄",
    image: null,
    description: "Тёмная влажная ёмкость для Психогриба и будущих грибных культур.",
    requiredTrust: 180,
    seedType: "mushroom",
  },
];

export const POT_TYPES_BY_ID = Object.fromEntries(
  POT_TYPES.map((potType) => [potType.id, potType]),
);

export function getUnlockedPotTypes(trust = 0) {
  return POT_TYPES.filter((potType) => trust >= potType.requiredTrust);
}
