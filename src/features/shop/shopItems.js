import { ASSETS } from "../../core/assets/assetCatalog";

export const SHOP_REFRESH_MS = 60_000;

export const shopItems = [
  { id: "lumenweed", type: "seed", name: "Люмен-трава", icon: "🪻", image: ASSETS.seeds.lumenweed, description: "Светящаяся клубная трава для обычной почвы.", pricePerSeed: 20, minStock: 2, maxStock: 6, requiredClubLevel: 1, seedType: "plant" },
  { id: "moonmint", type: "seed", name: "Лунная мята", icon: "🌿", description: "Холодная мята для кальянов ночного района.", pricePerSeed: 14, minStock: 3, maxStock: 8, requiredClubLevel: 1, seedType: "plant" },
  { id: "velvetbud", type: "seed", name: "Бархатный бутон", icon: "🌺", description: "Мягкий ароматный бутон для спокойных заведений.", pricePerSeed: 32, minStock: 1, maxStock: 4, requiredClubLevel: 2, seedType: "plant" },
  { id: "starleaf", type: "seed", name: "Звёздный лист", icon: "✨", description: "Искристая зелень для клубных смесей.", pricePerSeed: 38, minStock: 1, maxStock: 5, requiredClubLevel: 2, seedType: "plant" },
  { id: "emberpod", type: "seed", name: "Жар-стручок", icon: "🔥", description: "Горячий плод для крепких напитков.", pricePerSeed: 54, minStock: 1, maxStock: 3, requiredClubLevel: 3, seedType: "plant" },
  { id: "psychoshroom", type: "seed", name: "Психомор", icon: "🍄", description: "Настоящий гриб Джо. Только грибная ёмкость.", pricePerSeed: 45, minStock: 1, maxStock: 4, requiredClubLevel: 2, requiredTrust: 180, seedType: "mushroom" },
  { id: "bluecap", type: "seed", name: "Синий колпак", icon: "🔵", description: "Редкая грибная культура для закрытых клубных заказов.", pricePerSeed: 70, minStock: 1, maxStock: 3, requiredClubLevel: 3, requiredTrust: 180, seedType: "mushroom" },
  { id: "dreamcap", type: "seed", name: "Сонный колпак", icon: "🌙", description: "Спокойная грибная культура для тихих залов.", pricePerSeed: 62, minStock: 1, maxStock: 3, requiredClubLevel: 3, requiredTrust: 180, seedType: "mushroom" },
  { id: "ghostmorel", type: "seed", name: "Призрачный сморчок", icon: "👻", description: "Очень редкий гриб для тайных заказов.", pricePerSeed: 110, minStock: 1, maxStock: 2, requiredClubLevel: 4, requiredTrust: 240, seedType: "mushroom" },
  { id: "nutrition", type: "care", name: "Питательный раствор", icon: "🌿", description: "Расходник на один цикл. Почти исключает обычное качество и гарантирует +1 плод.", pricePerSeed: 28, minStock: 2, maxStock: 6, requiredClubLevel: 1, requiredTrust: 60 },
  { id: "joeMix", type: "care", name: "Смесь Джо", icon: "🧪", description: "Редкий расходник. Обычное качество невозможно, шанс редкого сильно повышен.", pricePerSeed: 85, minStock: 1, maxStock: 3, requiredClubLevel: 3, requiredTrust: 240 },
];

export function createShopStock() {
  return Object.fromEntries(shopItems.map((item) => [item.id, Math.floor(Math.random() * (item.maxStock - item.minStock + 1)) + item.minStock]));
}
