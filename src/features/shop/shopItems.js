import { CROPS } from "../plantation/data/crops";

export const SHOP_REFRESH_MS = 30 * 60_000;

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

const careItems = [
  {
    id: "nutrition",
    type: "care",
    name: "Питательный раствор",
    icon: "🌿",
    description: "Расходник на один цикл. Сдвигает урожай к 2–3 плодам и открывает отличное качество.",
    pricePerSeed: 18,
    minStock: 1,
    maxStock: 4,
    requiredClubLevel: 1,
    requiredTrust: 160,
  },
  {
    id: "mariaMix",
    type: "care",
    name: "Смесь Марии Ивановны",
    icon: "🧪",
    description: "Редкий состав. Нужен для высокого шанса отличного и возможности получить редкое качество.",
    pricePerSeed: 34,
    minStock: 1,
    maxStock: 2,
    requiredClubLevel: 3,
    requiredTrust: 240,
  },
  {
    id: "acidWater",
    type: "care",
    name: "Кислотная вода",
    icon: "☣",
    description: "Аварийный одноразовый флакон. Уничтожает растение и полностью освобождает ёмкость.",
    pricePerSeed: 18,
    minStock: 1,
    maxStock: 3,
    requiredClubLevel: 1,
    requiredTrust: 0,
  },
];

export const shopItems = [...cropItems, ...careItems];

export function createShopStock() {
  return Object.fromEntries(
    shopItems.map((item) => [
      item.id,
      Math.floor(Math.random() * (item.maxStock - item.minStock + 1)) + item.minStock,
    ]),
  );
}
