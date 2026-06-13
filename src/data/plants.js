export const plants = [
  {
    id: "green-tomato-stage-1",
    seedId: "greenTomato",
    stage: 1,
    name: "Маленький росток",
    image: "/assets/plants/plant-1.png",
    width: 75,
    bottom: 125,
    left: 50,
  },

  {
    id: "green-tomato-stage-2",
    seedId: "greenTomato",
    stage: 2,
    name: "Молодое растение",
    image: "/assets/plants/plant-2.png",
    width: 145,
    bottom: 135,
    left: 50,
  },

  {
    id: "green-tomato-stage-3",
    seedId: "greenTomato",
    stage: 3,
    name: "Растение с плодами",
    image: "/assets/plants/plant-3.png",
    width: 200,
    bottom: 115,
    left: 49,
  },
];

export const psychomorPlants = [
  {
    id: "psychomor-stage-1",
    seedId: "psychomor",
    stage: 1,
    name: "Зародыш Психомора",
    image:
      "/assets/plants/psychomor/psychomor-stage-1.png",

    /*
      Размер и положение первой стадии.
      Потом можешь спокойно менять.
    */
    width: 105,
    bottom: 108,
    left: 50,
  },

  {
    id: "psychomor-stage-2",
    seedId: "psychomor",
    stage: 2,
    name: "Цветущий Психомор",
    image:
      "/assets/plants/psychomor/psychomor-stage-2.png",

    width: 165,
    bottom: 95,
    left: 50,
  },

  {
    id: "psychomor-stage-3",
    seedId: "psychomor",
    stage: 3,
    name: "Спелый Психомор",
    image:
      "/assets/plants/psychomor/psychomor-stage-3.png",

    width: 175,
    bottom: 95,
    left: 50,
  },
];

export const plantsBySeed = {
  greenTomato: plants,
  psychomor: psychomorPlants,
};