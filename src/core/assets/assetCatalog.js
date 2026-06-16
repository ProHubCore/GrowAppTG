// Единый реестр игровых изображений.
// Компоненты получают пути отсюда, а не хранят случайные строки /assets/...

export const ASSETS = {
  backgrounds: {
    plantation: "/assets/backgrounds/plantation.png",
    district: "/assets/backgrounds/district.png",
    shop: "/assets/backgrounds/shop.png",
    club: "/assets/backgrounds/club.png",
  },
  buildings: {
    club: "/assets/buildings/club.png",
    shop: "/assets/buildings/shop.png",
    mariaIvanovnaHouse: "/assets/buildings/maria-ivanovna-house.png",
  },
  characters: {
    mariaIvanovna: "/assets/characters/maria-ivanovna.png",
    clubDealer: "/assets/characters/club-dealer.png",
  },
  locations: {
    mariaIvanovnaHouse: {
      background: "/assets/locations/maria-ivanovna-house/background.png",
      questBoard: "/assets/locations/maria-ivanovna-house/quest-board.png",
      radio: "/assets/locations/maria-ivanovna-house/radio.png",
    },
  },
  containers: {
    basicSoilBucket: "/assets/containers/basic-soil-bucket.png",
    hydroSoilBucket: "/assets/containers/hydro-soil-bucket.png",
  },
  plants: {
    tabakko: [
      "/assets/plants/tabakko/stage-1.png",
      "/assets/plants/tabakko/stage-2.png",
      "/assets/plants/tabakko/stage-3.png",
    ],
    greenTomato: [
      "/assets/plants/green-tomato/stage-1.png",
      "/assets/plants/green-tomato/stage-2.png",
      "/assets/plants/green-tomato/stage-3.png",
    ],
    kokaNova: [
      "/assets/plants/koka-nova/stage-1.png",
      "/assets/plants/koka-nova/stage-2.png",
      "/assets/plants/koka-nova/stage-3.png",
    ],
  },
  ui: {
    backpack: "/assets/ui/inventory/backpack.png",
    seedBasket: "/assets/ui/seed-basket/seed-basket.png",
    phytoStation: "/assets/ui/care/phyto-station.png",
  },
  tools: {
    shovel: "/assets/tools/shovel.png",
  },
};

function collectAssetPaths(value) {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectAssetPaths);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(collectAssetPaths);
  }
  return [];
}

export const allAssets = [...new Set(collectAssetPaths(ASSETS))];

// Только эти файлы блокируют старт приложения. Остальной тяжёлый арт
// догружается в фоне после показа первой сцены.
export const criticalAssets = [
  ASSETS.backgrounds.plantation,
  ASSETS.characters.mariaIvanovna,
  ASSETS.containers.hydroSoilBucket,
  ...ASSETS.plants.tabakko,
  ASSETS.ui.backpack,
  ASSETS.ui.seedBasket,
];

// Ближайшие локации прогреваются после первого кадра. Тяжёлые стадии
// редких культур остаются ленивыми и загружаются только при реальном показе.
export const deferredAssets = [
  ASSETS.backgrounds.district,
  ASSETS.backgrounds.shop,
  ASSETS.backgrounds.club,
  ASSETS.buildings.club,
  ASSETS.buildings.shop,
  ASSETS.buildings.mariaIvanovnaHouse,
  ASSETS.characters.clubDealer,
  ASSETS.locations.mariaIvanovnaHouse.background,
  ASSETS.locations.mariaIvanovnaHouse.questBoard,
  ASSETS.locations.mariaIvanovnaHouse.radio,
  ...ASSETS.plants.greenTomato,
  ...ASSETS.plants.kokaNova,
];

// Совместимое имя для существующего загрузчика.
export const preloadAssets = criticalAssets;
