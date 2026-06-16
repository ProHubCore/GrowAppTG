import { ASSETS } from "../../../core/assets/assetCatalog";

// На верхней плантации используется только растительная ёмкость.
// Грибная ёмкость будет добавлена позже вместе с отдельным подвалом.
export const POT_TYPES = [
  {
    id: "soil",
    name: "Гидропонное ведро",
    shortName: "Для растений",
    icon: "🪴",
    image: ASSETS.containers.hydroSoilBucket,
    description: "Универсальная ёмкость для Табакко, Кислоплода и Кока Новы.",
    requiredTrust: 0,
    seedType: "plant",
  },
];

export const POT_TYPES_BY_ID = Object.fromEntries(
  POT_TYPES.map((potType) => [potType.id, potType]),
);

export function getUnlockedPotTypes() {
  return POT_TYPES;
}
