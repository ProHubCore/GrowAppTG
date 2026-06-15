import { ASSETS } from "../../../core/assets/assetCatalog";

export const POT_TYPES = [
  {
    id: "soil",
    name: "Гидропонное ведро",
    shortName: "Для растений",
    icon: "🪴",
    image: ASSETS.containers.hydroSoilBucket,
    description: "Универсальная ёмкость для Кислоплода, Табакко, Кока Новы и других растений.",
    requiredTrust: 0,
    seedType: "plant",
  },
  {
    id: "mushroom",
    name: "Мико-биореактор",
    shortName: "Для грибов",
    icon: "🍄",
    image: ASSETS.containers.mycoBioreactor,
    description: "Влажная герметичная камера для Психомора и Псилокуба Цебенсиса.",
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
