const gameAssets = [
  // Основная плантация
  "/assets/backgrounds/main-bg.png",

  // Район
  "/assets/district-bg.png",
  "/assets/club-building.png",
  "/assets/shop-building.png",

  // Магазин и клуб
  "/assets/shop-bg.png",
  "/assets/club-bg.png",

  // Обучение — Дядя Джо
  "/assets/characters/tutorial-dealer.png",

  // Ведро
  "/assets/pots/bucket-1.png",

  // Обычное растение — сразу все стадии
  "/assets/plants/plant-1.png",
  "/assets/plants/plant-2.png",
  "/assets/plants/plant-3.png",

  // Психомор — сразу все стадии
  "/assets/plants/psychomor/psychomor-stage-1.png",
  "/assets/plants/psychomor/psychomor-stage-2.png",
  "/assets/plants/psychomor/psychomor-stage-3.png",

  // Семена и игровые предметы
  "/assets/seeds/psychomor-seeds.png",
  "/assets/items/seed-basket.png",
  "/assets/items/backpack-1.png",
  "/assets/tools/shovel-1.png",
];

export default [...new Set(gameAssets)];