import { ASSETS } from "../../../core/assets/assetCatalog";

export const pots = Array.from({ length: 4 }, (_, index) => ({
  id: index + 1,
  name: `Ёмкость ${index + 1}`,
  image: ASSETS.containers.hydroSoilBucket,
}));
