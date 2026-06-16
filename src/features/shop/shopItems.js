import { CROPS } from "../plantation/data/crops";
import { GAME_ECONOMY } from "../economy/gameEconomy";

export const SHOP_REFRESH_MS = GAME_ECONOMY.shopRefreshMs;

const cropItems = CROPS.filter((crop) => crop.shop).map((crop) => ({
  id: crop.id,
  type: "seed",
  name: crop.name,
  icon: crop.icon,
  image: crop.seedImage || crop.stages[0]?.image,
  description: crop.description,
  pricePerSeed: crop.shop.price,
  minStock: crop.shop.minStock,
  maxStock: crop.shop.maxStock,
  requiredClubLevel: crop.shop.requiredClubLevel,
  requiredTrust: crop.shop.requiredTrust,
  seedType: crop.type,
}));

const toolItems = [
  {
    id: "wateringCan",
    type: "tool",
    name: "Старая лейка",
    icon: "💧",
    description: "Постоянный инструмент. Один раз на каждой стадии срезает ровно 20% полной длительности стадии.",
    pricePerSeed: GAME_ECONOMY.equipment.wateringCan,
    minStock: 1,
    maxStock: 1,
    requiredClubLevel: 1,
    requiredTrust: 25,
  },
];

const careItems = [
  {
    id: "nutrition",
    type: "care",
    name: "Питательный раствор",
    icon: "🌿",
    description: "Расходник на один цикл. Повышает качество и гарантирует дополнительный плод.",
    pricePerSeed: GAME_ECONOMY.care.nutrition,
    minStock: 2,
    maxStock: 6,
    requiredClubLevel: 1,
    requiredTrust: 160,
  },
  {
    id: "mariaMix",
    type: "care",
    name: "Смесь Марии Ивановны",
    icon: "🧪",
    description: "Секретный состав. Сильно повышает шанс отличного и редкого качества.",
    pricePerSeed: GAME_ECONOMY.care.mariaMix,
    minStock: 1,
    maxStock: 3,
    requiredClubLevel: 3,
    requiredTrust: 240,
  },
];

export const shopItems = [...cropItems, ...toolItems, ...careItems];

export function createShopStock() {
  return Object.fromEntries(
    shopItems.map((item) => [
      item.id,
      Math.floor(Math.random() * (item.maxStock - item.minStock + 1)) + item.minStock,
    ]),
  );
}
