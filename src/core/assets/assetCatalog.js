// Единый реестр игровых изображений.
// Чтобы заменить арт, меняй путь здесь или положи новый файл по текущему пути.

export const ASSETS = {
  backgrounds: {
    plantation: "/assets/backgrounds/main-bg.png",
    district: "/assets/district-bg.png",
    shop: "/assets/shop-bg.png",
    club: "/assets/club-bg.png",
  },
  buildings: {
    club: "/assets/club-building.png",
    shop: "/assets/shop-building.png",
  },
  characters: {
    joe: "/assets/characters/tutorial-dealer.png",
    clubDealer: "/assets/club/club-dealer.png",
  },
  pots: {
    plantBucket: "/assets/pots/bucket-1.png",
    mushroomBucket: null,
  },
  plants: {
    greenTomato: [
      "/assets/plants/plant-1.png",
      "/assets/plants/plant-2.png",
      "/assets/plants/plant-3.png",
    ],
    lumenweed: [
      "/assets/plants/psychomor/psychomor-stage-1.png",
      "/assets/plants/psychomor/psychomor-stage-2.png",
      "/assets/plants/psychomor/psychomor-stage-3.png",
    ],
  },
  seeds: {
    lumenweed: "/assets/seeds/psychomor-seeds.png",
  },
  items: {
    seedBasket: "/assets/items/seed-basket.png",
    backpack: "/assets/items/backpack-1.png",
  },
  tools: {
    shovel: "/assets/tools/shovel-1.png",
  },
};

export const preloadAssets = [...new Set([
  ...Object.values(ASSETS.backgrounds),
  ...Object.values(ASSETS.buildings),
  ...Object.values(ASSETS.characters),
  ...Object.values(ASSETS.pots).filter(Boolean),
  ...Object.values(ASSETS.plants).flat(),
  ...Object.values(ASSETS.seeds),
  ...Object.values(ASSETS.items),
  ...Object.values(ASSETS.tools),
])];
