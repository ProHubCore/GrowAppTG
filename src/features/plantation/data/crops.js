import { ASSETS } from "../../../core/assets/assetCatalog.js";

const stage = (image, name, width, bottom, left = 50) => ({
  image,
  name,
  width,
  bottom,
  left,
});

// Главный каталог культур. Чтобы добавить новую культуру, достаточно:
// 1) положить три PNG в public/assets/plants/<slug>/;
// 2) добавить пути в assetCatalog.js;
// 3) добавить одну запись сюда.
// Магазин, инвентарь, клуб, каталог и посадка подхватят её автоматически.
export const CROPS = [
  {
    id: "greenTomato",
    slug: "green-tomato",
    name: "Кислоплод",
    icon: "🟢",
    type: "plant",
    infiniteSeeds: true,
    growTime: 5,
    basePrice: 4,
    description: "Базовый бодрящий плод района. Прощает ошибки и быстро созревает.",
    lore: "Бодрящий плод для коктейлей, ночных смен и первого заработка.",
    catalogNote: "Базовый бодрящий плод района.",
    stages: [
      stage(ASSETS.plants.greenTomato[0], "Росток Кислоплода", 75, 125),
      stage(ASSETS.plants.greenTomato[1], "Молодой Кислоплод", 145, 135),
      stage(ASSETS.plants.greenTomato[2], "Спелый Кислоплод", 200, 115, 49),
    ],
  },
  {
    id: "tabakko",
    slug: "tabakko",
    name: "Табакко",
    icon: "🌿",
    type: "plant",
    growTime: 5,
    basePrice: 10,
    description: "Крепкая ароматная культура для первых серьёзных заказов клуба.",
    lore: "Тёплый дымный лист, который особенно любят посетители старого зала.",
    catalogNote: "Крепкая культура с густым ароматом и стабильным спросом.",
    shop: { price: 20, minStock: 2, maxStock: 6, requiredClubLevel: 1, requiredTrust: 0 },
    stages: [
      stage(ASSETS.plants.tabakko[0], "Росток Табакко", 78, 123),
      stage(ASSETS.plants.tabakko[1], "Молодой Табакко", 126, 112),
      stage(ASSETS.plants.tabakko[2], "Зрелый Табакко", 180, 98),
    ],
  },
  {
    id: "kokaNova",
    slug: "koka-nova",
    name: "Кока Нова",
    icon: "🍃",
    type: "plant",
    growTime: 6,
    basePrice: 16,
    description: "Редкий бодрящий куст с плотными красноватыми листьями.",
    lore: "Ценится за чистый импульс и устойчивый эффект во время длинных вечеринок.",
    catalogNote: "Инопланетный родственник коки с яркими верхними листьями.",
    shop: { price: 34, minStock: 2, maxStock: 5, requiredClubLevel: 2, requiredTrust: 25 },
    stages: [
      stage(ASSETS.plants.kokaNova[0], "Росток Кока Новы", 82, 122),
      stage(ASSETS.plants.kokaNova[1], "Молодая Кока Нова", 132, 110),
      stage(ASSETS.plants.kokaNova[2], "Зрелая Кока Нова", 182, 98),
    ],
  },
  {
    id: "donJuana",
    slug: "don-juana",
    name: "Дон Хуана",
    icon: "🌱",
    type: "plant",
    growTime: 7,
    basePrice: 22,
    description: "Высокая фиолетово-зелёная культура для проверенных поставщиков.",
    lore: "Её узнают по пальчатым листьям и плотной верхушке ещё до открытия упаковки.",
    catalogNote: "Высокая культура с узнаваемыми листьями и плотным зрелым соцветием.",
    shop: { price: 48, minStock: 1, maxStock: 4, requiredClubLevel: 2, requiredTrust: 60 },
    stages: [
      stage(ASSETS.plants.donJuana[0], "Росток Дон Хуаны", 84, 124),
      stage(ASSETS.plants.donJuana[1], "Молодая Дон Хуана", 138, 108),
      stage(ASSETS.plants.donJuana[2], "Зрелая Дон Хуана", 190, 96),
    ],
  },
  {
    id: "xenobloom",
    slug: "xenobloom",
    name: "Ксеноблум",
    icon: "🌺",
    type: "plant",
    growTime: 8,
    basePrice: 28,
    description: "Яркий инопланетный цветок с фиолетовыми лепестками и светящейся сердцевиной.",
    lore: "Редкий цветок для шумных залов, фотосессий и закрытых праздничных заказов.",
    catalogNote: "Чистая инопланетная экзотика с ярким цветением.",
    shop: { price: 66, minStock: 1, maxStock: 3, requiredClubLevel: 3, requiredTrust: 110 },
    stages: [
      stage(ASSETS.plants.xenobloom[0], "Росток Ксеноблума", 90, 124),
      stage(ASSETS.plants.xenobloom[1], "Цветущий Ксеноблум", 145, 109),
      stage(ASSETS.plants.xenobloom[2], "Зрелый Ксеноблум", 196, 95),
    ],
  },
  {
    id: "psychomor",
    slug: "psychomor",
    name: "Психомор",
    icon: "🍄",
    type: "mushroom",
    growTime: 5,
    basePrice: 34,
    description: "Светящаяся грибная культура Марии Ивановны. Нужен мико-биореактор.",
    lore: "Гриб для тех, кто хочет увидеть музыку и услышать свет.",
    catalogNote: "Светящийся инопланетный гриб с живой фиолетовой шляпкой.",
    seedImage: ASSETS.seedPackets.psychomor,
    shop: { price: 78, minStock: 1, maxStock: 4, requiredClubLevel: 3, requiredTrust: 180 },
    stages: [
      stage(ASSETS.plants.psychomor[0], "Молодой Психомор", 104, 108),
      stage(ASSETS.plants.psychomor[1], "Цветущий Психомор", 154, 97),
      stage(ASSETS.plants.psychomor[2], "Зрелый Психомор", 184, 92),
    ],
  },
  {
    id: "psilocubeCebensis",
    slug: "psilocube-cebensis",
    name: "Псилокуб Цебенсис",
    icon: "🍄",
    type: "mushroom",
    growTime: 7,
    basePrice: 48,
    description: "Редкая золотистая грибная культура для закрытых заказов клуба.",
    lore: "Выглядит почти земной, но споры реагируют на инопланетное освещение.",
    catalogNote: "Золотистая грибная группа с лёгкой внеземной мутацией.",
    shop: { price: 112, minStock: 1, maxStock: 2, requiredClubLevel: 4, requiredTrust: 240 },
    stages: [
      stage(ASSETS.plants.psilocubeCebensis[0], "Молодой Псилокуб", 98, 112),
      stage(ASSETS.plants.psilocubeCebensis[1], "Группа Псилокуба", 148, 100),
      stage(ASSETS.plants.psilocubeCebensis[2], "Зрелый Псилокуб Цебенсис", 182, 94),
    ],
  },
];

export const CROP_BY_ID = Object.fromEntries(CROPS.map((crop) => [crop.id, crop]));
export const CROP_IDS = CROPS.map((crop) => crop.id);

export const createEmptyCropInventory = () =>
  Object.fromEntries(CROPS.map((crop) => [crop.id, 0]));

export const createEmptySeedInventory = () =>
  Object.fromEntries(
    CROPS.filter((crop) => !crop.infiniteSeeds).map((crop) => [crop.id, 0]),
  );
