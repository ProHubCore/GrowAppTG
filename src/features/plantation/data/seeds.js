import { CROPS } from "./crops";

export const seeds = CROPS.map((crop) => ({
  id: crop.id,
  name: crop.name,
  description: crop.description,
  icon: crop.icon,
  image: crop.seedImage || crop.stages[0]?.image,
  infinite: Boolean(crop.infiniteSeeds),
  growTime: crop.growTime,
  harvestItemId: crop.id,
  seedType: crop.type,
  requiredTrust: crop.shop?.requiredTrust || 0,
}));
