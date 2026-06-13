import { useEffect, useState } from "react";

import PlantArea from "./PlantArea";
import BottomMenu from "./BottomMenu";
import GrowTimer from "./GrowTimer";
import SeedModal from "./SeedModal";
import RemovePlantModal from "./RemovePlantModal";
import BackpackTool from "./BackpackTool";
import InventoryModal from "./InventoryModal";
import FlyingLoot from "./FlyingLoot";
import DistrictScreen from "./DistrictScreen";
import ShopScreen from "./ShopScreen";
import ClubScreen from "./ClubScreen";
import ShopModal from "./ShopModal";

import usePersistentState from "../hooks/usePersistentState";

import { pots } from "../data/pots";
import { plants } from "../data/plants";
import { seeds } from "../data/seeds";
import { shopItems } from "../data/shopItems";

const GROW_TIME = 5;

const STAGE_WIDTH = 390;
const STAGE_HEIGHT = 844;

function createPotState(index) {
  return {
    unlocked: index === 0,
    growStep: 0,
    timeLeft: GROW_TIME,
    selectedSeedId: null,
    nextGrowthAt: null,
  };
}

function GameScreen() {
  const [currentPotIndex, setCurrentPotIndex] =
    useState(0);

  const [potStates, setPotStates] = useState(() =>
    pots.map((_, index) =>
      createPotState(index)
    )
  );

  const [isSeedModalOpen, setIsSeedModalOpen] =
    useState(false);

  const [selectedSeed, setSelectedSeed] =
    useState(null);

  const [
    isRemoveModalOpen,
    setIsRemoveModalOpen,
  ] = useState(false);

  const [
    isInventoryOpen,
    setIsInventoryOpen,
  ] = useState(false);

  /*
    Показывается ли товар на полке магазина.
    Это НЕ сохраняется после перезагрузки.
  */
  const [
    isShopProductVisible,
    setIsShopProductVisible,
  ] = useState(false);

  const [inventory, setInventory] =
    usePersistentState(
      "growapp-inventory",
      {
        greenTomato: 0,
      }
    );

  const [coins, setCoins] =
    usePersistentState(
      "growapp-coins",
      100
    );

  const [activeScreen, setActiveScreen] =
    useState("plantation");

  const [
    flyingLootItems,
    setFlyingLootItems,
  ] = useState([]);

  const [stageScale, setStageScale] =
    useState(1);

  const currentPot = pots[currentPotIndex];

  const currentPotState =
    potStates[currentPotIndex] ??
    createPotState(currentPotIndex);

  const growStep =
    currentPotState.growStep;

  const timeLeft =
    currentPotState.timeLeft;

  const isCurrentPotUnlocked =
    currentPotState.unlocked;

  const psychomorItem =
    shopItems.find(
      (item) =>
        item.id === "psychomor"
    ) ?? null;

  /*
    Психомор постоянно показывается
    в корзинке плантации.

    Его покупка пока ничего
    не разблокирует и не запоминается.
  */
  const availableSeeds =
    psychomorItem?.seedData
      ? [
          ...seeds,
          psychomorItem.seedData,
        ]
      : seeds;

  let currentPlant = null;

  if (growStep === 1) {
    currentPlant = plants[0];
  }

  if (growStep === 2) {
    currentPlant = plants[1];
  }

  if (growStep === 3) {
    currentPlant = plants[2];
  }

  useEffect(() => {
    const updateScale = () => {
      const viewportWidth =
        window.visualViewport?.width ||
        window.innerWidth;

      const viewportHeight =
        window.visualViewport?.height ||
        window.innerHeight;

      const widthScale =
        viewportWidth / STAGE_WIDTH;

      const heightScale =
        viewportHeight / STAGE_HEIGHT;

      setStageScale(
        Math.min(
          widthScale,
          heightScale
        )
      );
    };

    updateScale();

    window.addEventListener(
      "resize",
      updateScale
    );

    window.visualViewport?.addEventListener(
      "resize",
      updateScale
    );

    return () => {
      window.removeEventListener(
        "resize",
        updateScale
      );

      window.visualViewport?.removeEventListener(
        "resize",
        updateScale
      );
    };
  }, []);

  useEffect(() => {
    const interval =
      window.setInterval(() => {
        const now = Date.now();

        setPotStates(
          (previousStates) =>
            previousStates.map(
              (potState) => {
                if (
                  !potState.unlocked
                ) {
                  return potState;
                }

                if (
                  potState.growStep !==
                    1 &&
                  potState.growStep !==
                    2
                ) {
                  return potState;
                }

                if (
                  !potState.nextGrowthAt
                ) {
                  return {
                    ...potState,

                    timeLeft:
                      GROW_TIME,

                    nextGrowthAt:
                      now +
                      GROW_TIME *
                        1000,
                  };
                }

                const millisecondsLeft =
                  potState.nextGrowthAt -
                  now;

                if (
                  millisecondsLeft > 0
                ) {
                  const secondsLeft =
                    Math.max(
                      0,
                      Math.ceil(
                        millisecondsLeft /
                          1000
                      )
                    );

                  if (
                    secondsLeft ===
                    potState.timeLeft
                  ) {
                    return potState;
                  }

                  return {
                    ...potState,
                    timeLeft:
                      secondsLeft,
                  };
                }

                if (
                  potState.growStep ===
                  1
                ) {
                  return {
                    ...potState,

                    growStep: 2,

                    timeLeft:
                      GROW_TIME,

                    nextGrowthAt:
                      now +
                      GROW_TIME *
                        1000,
                  };
                }

                return {
                  ...potState,

                  growStep: 3,

                  timeLeft: 0,

                  nextGrowthAt: null,
                };
              }
            )
        );
      }, 250);

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, []);

  const updateCurrentPotState = (
    updates
  ) => {
    setPotStates(
      (previousStates) =>
        previousStates.map(
          (potState, index) => {
            if (
              index !==
              currentPotIndex
            ) {
              return potState;
            }

            return {
              ...potState,
              ...updates,
            };
          }
        )
    );
  };

  const closePlantationModals =
    () => {
      setIsSeedModalOpen(false);
      setIsRemoveModalOpen(false);
      setSelectedSeed(null);
    };

  const showNextPot = () => {
    closePlantationModals();

    setCurrentPotIndex(
      (previousIndex) =>
        (previousIndex + 1) %
        pots.length
    );
  };

  const showPreviousPot = () => {
    closePlantationModals();

    setCurrentPotIndex(
      (previousIndex) =>
        (previousIndex -
          1 +
          pots.length) %
        pots.length
    );
  };

  const unlockCurrentPot = () => {
    updateCurrentPotState({
      unlocked: true,

      growStep: 0,

      timeLeft: GROW_TIME,

      selectedSeedId: null,

      nextGrowthAt: null,
    });
  };

  const openSeedModal = () => {
    if (
      !isCurrentPotUnlocked
    ) {
      return;
    }

    if (growStep !== 0) {
      return;
    }

    setSelectedSeed(null);
    setIsSeedModalOpen(true);
  };

  const closeSeedModal = () => {
    setSelectedSeed(null);
    setIsSeedModalOpen(false);
  };

  const plantSelectedSeed = () => {
    if (!selectedSeed) {
      return;
    }

    if (
      !isCurrentPotUnlocked
    ) {
      return;
    }

    if (growStep !== 0) {
      return;
    }

    const selectedSeedId =
      selectedSeed.id ??
      selectedSeed.key ??
      selectedSeed.name ??
      null;

    /*
      Пока Психомор работает
      только как тестовая кнопка.
    */
    if (
      selectedSeedId ===
      "psychomor"
    ) {
      window.alert(
        "Психомор посажен"
      );

      setSelectedSeed(null);
      setIsSeedModalOpen(false);

      return;
    }

    updateCurrentPotState({
      growStep: 1,

      timeLeft: GROW_TIME,

      selectedSeedId,

      nextGrowthAt:
        Date.now() +
        GROW_TIME * 1000,
    });

    setSelectedSeed(null);
    setIsSeedModalOpen(false);
  };

  const collectPlant = () => {
    if (
      !isCurrentPotUnlocked
    ) {
      return;
    }

    if (growStep !== 3) {
      return;
    }

    const reward =
      Math.floor(
        Math.random() * 3
      ) + 1;

    const newLootItems =
      Array.from(
        { length: reward },

        (_, index) => ({
          id:
            `${Date.now()}-${index}`,

          startX:
            190 +
            index * 12,

          startY:
            470 -
            index * 8,

          delay:
            index * 120,
        })
      );

    setFlyingLootItems(
      newLootItems
    );

    setInventory(
      (previousInventory) => ({
        ...previousInventory,

        greenTomato:
          (
            previousInventory.greenTomato ||
            0
          ) + reward,
      })
    );

    updateCurrentPotState({
      growStep: 0,

      timeLeft: GROW_TIME,

      selectedSeedId: null,

      nextGrowthAt: null,
    });

    window.setTimeout(() => {
      setFlyingLootItems([]);
    }, 1100);
  };

  const openRemoveModal = () => {
    if (
      !isCurrentPotUnlocked
    ) {
      return;
    }

    if (growStep === 0) {
      return;
    }

    setIsRemoveModalOpen(true);
  };

  const closeRemoveModal = () => {
    setIsRemoveModalOpen(false);
  };

  const removePlant = () => {
    if (
      !isCurrentPotUnlocked
    ) {
      return;
    }

    if (growStep === 0) {
      return;
    }

    updateCurrentPotState({
      growStep: 0,

      timeLeft: GROW_TIME,

      selectedSeedId: null,

      nextGrowthAt: null,
    });

    setIsRemoveModalOpen(false);
  };

  const openInventory = () => {
    setIsInventoryOpen(true);
  };

  const closeInventory = () => {
    setIsInventoryOpen(false);
  };

  const deleteInventoryItem = (
    itemId,
    count
  ) => {
    if (
      itemId !== "greenTomato"
    ) {
      return;
    }

    setInventory(
      (previousInventory) => ({
        ...previousInventory,

        greenTomato: Math.max(
          0,

          (
            previousInventory.greenTomato ||
            0
          ) - count
        ),
      })
    );
  };

  const openClub = () => {
    setIsShopProductVisible(false);
    setActiveScreen("club");
  };

  const openShop = () => {
    setIsShopProductVisible(false);
    setActiveScreen("shop");
  };

  const goBackToDistrict = () => {
    setIsShopProductVisible(false);
    setActiveScreen("district");
  };

  /*
    Эту функцию должна вызвать
    твоя существующая кнопка:

    "Давай взглянем, братуха"
  */
  const showPsychomorProduct = () => {
    setIsShopProductVisible(true);
  };

  /*
    Покупку можно повторять
    сколько угодно раз.

    Ничего не запоминается,
    только списываются монеты.
  */
  const buyShopItem = (item) => {
    if (!item) {
      return {
        success: false,
        message:
          "Товар не найден.",
      };
    }

    if (coins < item.price) {
      return {
        success: false,
        message:
          "Недостаточно монет.",
      };
    }

    setCoins(
      (previousCoins) =>
        previousCoins -
        item.price
    );

    return {
      success: true,
      message:
        "Психомор куплен!",
    };
  };

  return (
    <div className="game-screen">
      <div
        className="game-stage"
        style={{
          transform:
            `scale(${stageScale})`,
        }}
      >
        {activeScreen ===
          "plantation" && (
          <>
            <div className="background" />

            <div className="top-wallet">
              🪙 {coins}
            </div>

            {isCurrentPotUnlocked && (
              <GrowTimer
                growStep={growStep}
                timeLeft={timeLeft}
              />
            )}

            <BackpackTool
              onClick={
                openInventory
              }
            />

            <FlyingLoot
              lootItems={
                flyingLootItems
              }
            />

            <div className="game-content">
              <div className="table-scene">
                <PlantArea
                  pot={currentPot}

                  plant={
                    currentPlant
                  }

                  isUnlocked={
                    isCurrentPotUnlocked
                  }

                  isEmpty={
                    growStep === 0
                  }

                  canCollect={
                    growStep === 3
                  }

                  onCollect={
                    collectPlant
                  }

                  onSeedClick={
                    openSeedModal
                  }

                  onRemoveClick={
                    openRemoveModal
                  }

                  onUnlock={
                    unlockCurrentPot
                  }

                  onPreviousPot={
                    showPreviousPot
                  }

                  onNextPot={
                    showNextPot
                  }
                />
              </div>
            </div>

            <SeedModal
              isOpen={
                isSeedModalOpen &&
                isCurrentPotUnlocked
              }

              seeds={
                availableSeeds
              }

              selectedSeed={
                selectedSeed
              }

              onSelectSeed={
                setSelectedSeed
              }

              onPlantSeed={
                plantSelectedSeed
              }

              onClose={
                closeSeedModal
              }
            />

            <RemovePlantModal
              isOpen={
                isRemoveModalOpen &&
                isCurrentPotUnlocked
              }

              onConfirm={
                removePlant
              }

              onCancel={
                closeRemoveModal
              }
            />

            <InventoryModal
              isOpen={
                isInventoryOpen
              }

              inventory={
                inventory
              }

              onClose={
                closeInventory
              }

              onDeleteItem={
                deleteInventoryItem
              }
            />
          </>
        )}

        {activeScreen ===
          "district" && (
          <DistrictScreen
            onOpenClub={
              openClub
            }

            onOpenShop={
              openShop
            }
          />
        )}

        {activeScreen ===
          "shop" && (
          <>
            <ShopScreen
              onGoBack={
                goBackToDistrict
              }

              /*
                Эту функцию нужно вызвать
                существующей кнопкой
                "Давай взглянем, братуха".
              */
              onShowPsychomor={
                showPsychomorProduct
              }
            />

            <ShopModal
              isOpen={
                isShopProductVisible
              }

              item={
                psychomorItem
              }

              coins={coins}

              onBuy={
                buyShopItem
              }

              onClose={() =>
                setIsShopProductVisible(
                  false
                )
              }
            />
          </>
        )}

        {activeScreen ===
          "club" && (
          <ClubScreen
            inventory={
              inventory
            }

            setInventory={
              setInventory
            }

            coins={coins}

            setCoins={
              setCoins
            }

            onGoBack={
              goBackToDistrict
            }
          />
        )}

        {activeScreen !==
          "shop" &&
          activeScreen !==
            "club" && (
            <BottomMenu
              activeScreen={
                activeScreen
              }

              onGoPlantation={() => {
                setIsShopProductVisible(
                  false
                );

                setActiveScreen(
                  "plantation"
                );
              }}

              onGoDistrict={() => {
                setIsShopProductVisible(
                  false
                );

                setActiveScreen(
                  "district"
                );
              }}
            />
          )}
      </div>
    </div>
  );
}

export default GameScreen;