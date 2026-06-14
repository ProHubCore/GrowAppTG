import { ASSETS } from "../../../core/assets/assetCatalog";

const emojiStages = (seedId, names, emojis) => names.map((name, index) => ({
  id: `${seedId}-stage-${index + 1}`,
  seedId,
  stage: index + 1,
  name,
  emoji: emojis[index],
  width: [78, 112, 148][index],
  bottom: [126, 116, 106][index],
  left: 50,
}));

export const plants = [
  { id: "green-tomato-stage-1", seedId: "greenTomato", stage: 1, name: "Росток Кислоплода", image: ASSETS.plants.greenTomato[0], width: 75, bottom: 125, left: 50 },
  { id: "green-tomato-stage-2", seedId: "greenTomato", stage: 2, name: "Молодой Кислоплод", image: ASSETS.plants.greenTomato[1], width: 145, bottom: 135, left: 50 },
  { id: "green-tomato-stage-3", seedId: "greenTomato", stage: 3, name: "Спелый Кислоплод", image: ASSETS.plants.greenTomato[2], width: 200, bottom: 115, left: 49 },
];

export const lumenweedPlants = [
  { id: "lumenweed-stage-1", seedId: "lumenweed", stage: 1, name: "Росток Люмен-травы", image: ASSETS.plants.lumenweed[0], width: 105, bottom: 108, left: 50 },
  { id: "lumenweed-stage-2", seedId: "lumenweed", stage: 2, name: "Цветущая Люмен-трава", image: ASSETS.plants.lumenweed[1], width: 165, bottom: 95, left: 50 },
  { id: "lumenweed-stage-3", seedId: "lumenweed", stage: 3, name: "Спелая Люмен-трава", image: ASSETS.plants.lumenweed[2], width: 175, bottom: 95, left: 50 },
];

export const plantsBySeed = {
  greenTomato: plants,
  lumenweed: lumenweedPlants,
  moonmint: emojiStages("moonmint", ["Росток мяты", "Лунная мята", "Спелая лунная мята"], ["·", "🌱", "🌿"]),
  velvetbud: emojiStages("velvetbud", ["Росток бутона", "Бархатный бутон", "Спелый бутон"], ["·", "🌷", "🌺"]),
  psychoshroom: emojiStages("psychoshroom", ["Грибница", "Молодой Психомор", "Спелый Психомор"], ["·", "🍄", "🍄"]),
  bluecap: emojiStages("bluecap", ["Синяя грибница", "Молодой колпак", "Спелый синий колпак"], ["·", "🔹", "🔵"]),
  starleaf: emojiStages("starleaf", ["Росток листа", "Звёздный лист", "Спелый звёздный лист"], ["·", "🌱", "✨"]),
  emberpod: emojiStages("emberpod", ["Тёплый росток", "Жар-стручок", "Спелый жар-стручок"], ["·", "🌶️", "🔥"]),
  dreamcap: emojiStages("dreamcap", ["Сонная грибница", "Молодой сонный колпак", "Спелый сонный колпак"], ["·", "🌙", "🍄"]),
  ghostmorel: emojiStages("ghostmorel", ["Бледная грибница", "Призрачный сморчок", "Спелый призрачный сморчок"], ["·", "👻", "🍄"]),
};
