import {
  useEffect,
  useState,
} from "react";

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
import { plantsBySeed } from "../data/plants";
import { seeds } from "../data/seeds";
import { shopItems } from "../data/shopItems";

const DEFAULT_GROW_TIME = 5;

const STAGE_WIDTH = 390;
const STAGE_HEIGHT = 844;

function createPotState(index) {
  return {
    unlocked: index === 0,

    growStep: 0,

    selectedSeedId: null,

    growTime:
      DEFAULT_GROW_TIME,

    timeLeft:
      DEFAULT_GROW_TIME,

    nextGrowthAt: null,
  };
}

function GameScreen() {
  const [
    currentPotIndex,
    setCurrentPotIndex,
  ] = useState(0);

  const [
    potStates,
    setPotStates,
  ] = useState(() =>
    pots.map((_, index) =>
      createPotState(index)
    )
  );

  const [
    isSeedModalOpen,
    setIsSeedModalOpen,
  ] = useState(false);

  const [
    selectedSeed,
    setSelectedSeed,
  ] = useState(null);

  const [
    isRemoveModalOpen,
    setIsRemoveModalOpen,
  ] = useState(false);

  const [
    isInventoryOpen,
    setIsInventoryOpen,
  ] = useState(false);

  const [
    isShopProductVisible,
    setIsShopProductVisible,
  ] = useState(false);

  /*
    Собранные плоды.
  */
  const [
    inventory,
    setInventory,
  ] = usePersistentState(
    "growapp-inventory",
    {
      greenTomato: 0,
      psychomor: 0,
    }
  );

  /*
    Купленные семена игрока.
  */
  const [
    seedInventory,
    setSeedInventory,
  ] = usePersistentState(
    "growapp-seed-inventory",
    {
      psychomor: 0,
    }
  );

  /*
    Остаток семян у Зорика.
  */
  const [
    shopStock,
    setShopStock,
  ] = usePersistentState(
    "growapp-shop-stock",
    {
      psychomor: 5,
    }
  );

  const [coins, setCoins] =
    usePersistentState(
      "growapp-coins",
      100
    );

  const [
    activeScreen,
    setActiveScreen,
  ] = useState("plantation");

  const [
    flyingLootItems,
    setFlyingLootItems,
  ] = useState([]);

  const [
    stageScale,
    setStageScale,
  ] = useState(1);

  const currentPot =
    pots[currentPotIndex];

  const currentPotState =
    potStates[currentPotIndex] ??
    createPotState(
      currentPotIndex
    );

  const growStep =
    currentPotState.growStep;

  const timeLeft =
    currentPotState.timeLeft;

  const plantedSeedId =
    currentPotState.selectedSeedId;

  const isCurrentPotUnlocked =
    currentPotState.unlocked;

  const psychomorItem =
    shopItems.find(
      (item) =>
        item.id === "psychomor"
    ) ?? null;

  const currentPlantStages =
    plantsBySeed[
      plantedSeedId
    ] ?? null;

  const currentPlant =
    growStep > 0 &&
    currentPlantStages
      ? currentPlantStages[
          growStep - 1
        ] ?? null
      : null;

  useEffect(() => {
    const updateScale = () => {
      const viewportWidth =
        window.visualViewport
          ?.width ||
        window.innerWidth;

      const viewportHeight =
        window.visualViewport
          ?.height ||
        window.innerHeight;

      const widthScale =
        viewportWidth /
        STAGE_WIDTH;

      const heightScale =
        viewportHeight /
        STAGE_HEIGHT;

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

                const growTime =
                  potState.growTime ||
                  DEFAULT_GROW_TIME;

                if (
                  !potState.nextGrowthAt
                ) {
                  return {
                    ...potState,

                    timeLeft:
                      growTime,

                    nextGrowthAt:
                      now +
                      growTime *
                        1000,
                  };
                }

                const millisecondsLeft =
                  potState.nextGrowthAt -
                  now;

                if (
                  millisecondsLeft >
                  0
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
                      growTime,

                    nextGrowthAt:
                      now +
                      growTime *
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
          (
            potState,
            index
          ) => {
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
        (
          previousIndex -
          1 +
          pots.length
        ) % pots.length
    );
  };

  const unlockCurrentPot = () => {
    updateCurrentPotState({
      unlocked: true,

      growStep: 0,

      selectedSeedId: null,

      growTime:
        DEFAULT_GROW_TIME,

      timeLeft:
        DEFAULT_GROW_TIME,

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

    const seedId =
      selectedSeed.id;

    /*
      Для небесконечного семени
      проверяем количество.
    */
    if (!selectedSeed.infinite) {
      const currentAmount =
        seedInventory[
          seedId
        ] || 0;

      if (currentAmount <= 0) {
        return;
      }

      /*
        Списываем одно семя
        при посадке.
      */
      setSeedInventory(
        (previousInventory) => ({
          ...previousInventory,

          [seedId]: Math.max(
            0,

            (
              previousInventory[
                seedId
              ] || 0
            ) - 1
          ),
        })
      );
    }

    const growTime =
      selectedSeed.growTime ||
      DEFAULT_GROW_TIME;

    updateCurrentPotState({
      growStep: 1,

      selectedSeedId: seedId,

      growTime,

      timeLeft: growTime,

      nextGrowthAt:
        Date.now() +
        growTime * 1000,
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

    if (!plantedSeedId) {
      return;
    }

    const reward =
      Math.floor(
        Math.random() * 3
      ) + 1;

    const harvestItemId =
      plantedSeedId ===
      "psychomor"
        ? "psychomor"
        : "greenTomato";

    const newLootItems =
      Array.from(
        {
          length: reward,
        },

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

          itemId:
            harvestItemId,
        })
      );

    setFlyingLootItems(
      newLootItems
    );

    setInventory(
      (previousInventory) => ({
        ...previousInventory,

        [harvestItemId]:
          (
            previousInventory[
              harvestItemId
            ] || 0
          ) + reward,
      })
    );

    updateCurrentPotState({
      growStep: 0,

      selectedSeedId: null,

      growTime:
        DEFAULT_GROW_TIME,

      timeLeft:
        DEFAULT_GROW_TIME,

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

      selectedSeedId: null,

      growTime:
        DEFAULT_GROW_TIME,

      timeLeft:
        DEFAULT_GROW_TIME,

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
      itemId !==
        "greenTomato" &&
      itemId !==
        "psychomor"
    ) {
      return;
    }

    setInventory(
      (previousInventory) => ({
        ...previousInventory,

        [itemId]: Math.max(
          0,

          (
            previousInventory[
              itemId
            ] || 0
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

  const showPsychomorProduct =
    () => {
      setIsShopProductVisible(true);
    };

  /*
    Покупка выбранного количества.
  */
  const buyShopItem = (
    item,
    amount
  ) => {
    if (!item) {
      return {
        success: false,

        message:
          "Товар не найден.",
      };
    }

    const requestedAmount =
      Math.floor(
        Number(amount)
      );

    if (
      !Number.isFinite(
        requestedAmount
      ) ||
      requestedAmount <= 0
    ) {
      return {
        success: false,

        message:
          "Выбери количество семян.",
      };
    }

    const availableStock =
      shopStock[item.id] || 0;

    if (
      requestedAmount >
      availableStock
    ) {
      return {
        success: false,

        message:
          "У Зорика нет столько семян.",
      };
    }

    const totalPrice =
      requestedAmount *
      item.pricePerSeed;

    if (coins < totalPrice) {
      return {
        success: false,

        message:
          "Недостаточно монет.",
      };
    }

    setCoins(
      (previousCoins) =>
        previousCoins -
        totalPrice
    );

    setShopStock(
      (previousStock) => ({
        ...previousStock,

        [item.id]: Math.max(
          0,

          (
            previousStock[
              item.id
            ] || 0
          ) -
            requestedAmount
        ),
      })
    );

    setSeedInventory(
      (previousInventory) => ({
        ...previousInventory,

        [item.id]:
          (
            previousInventory[
              item.id
            ] || 0
          ) +
          requestedAmount,
      })
    );

    return {
      success: true,

      message:
        `Вы купили семена Психомора: ${requestedAmount} шт.`,
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

              seeds={seeds}

              seedInventory={
                seedInventory
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
            onOpenClub={openClub}

            onOpenShop={openShop}
          />
        )}

        {activeScreen ===
          "shop" && (
          <>
            <ShopScreen
              onGoBack={
                goBackToDistrict
              }

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

              stock={
                shopStock
                  .psychomor || 0
              }

              playerSeedCount={
                seedInventory
                  .psychomor || 0
              }

              onBuy={
                buyShopItem
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