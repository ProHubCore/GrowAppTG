import { CROPS } from "./crops";

export const plantsBySeed = Object.fromEntries(
  CROPS.map((crop) => [
    crop.id,
    crop.stages.map((stage, index) => ({
      id: `${crop.slug}-stage-${index + 1}`,
      seedId: crop.id,
      stage: index + 1,
      name: stage.name,
      image: stage.image,
      width: stage.width,
      bottom: stage.bottom,
      left: stage.left ?? 50,
    })),
  ]),
);

export const plants = plantsBySeed.greenTomato;
