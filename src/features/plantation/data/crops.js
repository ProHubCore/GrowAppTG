import { ASSETS } from "../../../core/assets/assetCatalog.js";

const stage = (image, name, width, bottom, left = 50) => ({
  image,
  name,
  width,
  bottom,
  left,
});

// Верхняя плантация намеренно ограничена тремя культурами.
// Грибные культуры вернутся позже отдельной веткой в подвальном помещении.
export const CROPS = [
  {
    id: "tabakko",
    slug: "tabakko",
    name: "Табакко",
    icon: "🌿",
    type: "plant",
    infiniteSeeds: true,
    growTime: 90,
    basePrice: 7,
    description: "Первое растение ученика: выносливый ароматный табачный лист.",
    lore: "Простой дымный лист, с которого начинается торговля в старом районе.",
    catalogNote: "Базовая культура района с густым ароматом и стабильным спросом.",
    stages: [
      stage(ASSETS.plants.tabakko[0], "Росток Табакко", 70, 100),
      stage(ASSETS.plants.tabakko[1], "Молодой Табакко", 140, 110),
      stage(ASSETS.plants.tabakko[2], "Зрелый Табакко", 180, 110),
    ],
  },
  {
    id: "greenTomato",
    slug: "green-tomato",
    name: "Кислоплод",
    icon: "🟢",
    type: "plant",
    growTime: 240,
    basePrice: 15,
    description: "Кислый бодрящий плод с цепкими инопланетными побегами.",
    lore: "Яркий кислый плод для коктейлей, ночных смен и шумных заказов клуба.",
    catalogNote: "Кислый бодрящий плод района с живучими зелёными побегами.",
    shop: {
      price: 20,
      minStock: 2,
      maxStock: 5,
      requiredClubLevel: 1,
      requiredTrust: 60,
    },
    stages: [
      stage(ASSETS.plants.greenTomato[0], "Росток Кислоплода", 75, 85),
      stage(ASSETS.plants.greenTomato[1], "Молодой Кислоплод", 150, 100),
      stage(ASSETS.plants.greenTomato[2], "Спелый Кислоплод", 150, 85, 49),
    ],
  },
  {
    id: "kokaNova",
    slug: "koka-nova",
    name: "Кока Нова",
    icon: "🍃",
    type: "plant",
    growTime: 480,
    basePrice: 28,
    description: "Редкий бодрящий куст с плотными красноватыми листьями.",
    lore: "Ценится за чистый импульс и устойчивый эффект во время длинных вечеринок.",
    catalogNote: "Инопланетный родственник коки с яркими верхними листьями.",
    shop: {
      price: 44,
      minStock: 1,
      maxStock: 3,
      requiredClubLevel: 1,
      requiredTrust: 110,
    },
    stages: [
      stage(ASSETS.plants.kokaNova[0], "Росток Кока Новы", 82, 122),
      stage(ASSETS.plants.kokaNova[1], "Молодая Кока Нова", 132, 110),
      stage(ASSETS.plants.kokaNova[2], "Зрелая Кока Нова", 182, 98),
    ],
  },
];

export const CROP_BY_ID = Object.fromEntries(
  CROPS.map((crop) => [crop.id, crop]),
);

export const CROP_IDS = CROPS.map((crop) => crop.id);

export const createEmptyCropInventory = () =>
  Object.fromEntries(CROPS.map((crop) => [crop.id, 0]));

export const createEmptySeedInventory = () =>
  Object.fromEntries(
    CROPS.filter((crop) => !crop.infiniteSeeds).map((crop) => [crop.id, 0]),
  );
