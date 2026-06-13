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

    /*
      Какое растение сейчас посажено.
    */
    selectedSeedId: null,

    /*
      Индивидуальное время стадии.
    */
    growTime: DEFAULT_GROW_TIME,

    timeLeft: DEFAULT_GROW_TIME,

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
    createPotState(currentPotIndex);

  const growStep =
    currentPotState.growStep;

  const timeLeft =
    currentPotState.timeLeft;

  const selectedSeedId =
    currentPotState.selectedSeedId;

  const isCurrentPotUnlocked =
    currentPotState.unlocked;

  const psychomorItem =
    shopItems.find(
      (item) =>
        item.id === "psychomor"
    ) ?? null;

  /*
    Семена уже находятся в seeds.js,
    поэтому обе культуры видны
    в корзинке плантации.
  */
  const availableSeeds = seeds;

  /*
    Выбираем правильный комплект стадий
    по посаженному семени.
  */
  const currentPlantStages =
    plantsBySeed[selectedSeedId] ??
    null;

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
        window.visualViewport?.width ||
        window.innerWidth;

      const viewportHeight =
        window.visualViewport?.height ||
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

  /*
    Общий таймер для всех ведер.

    Зелёный помидор:
    5 секунд на стадию.

    Психомор:
    3 секунды на стадию.
  */
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
                      growTime * 1000,
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
                      growTime,

                    nextGrowthAt:
                      now +
                      growTime * 1000,
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

    if (!selectedSeedId) {
      return;
    }

    const reward =
      Math.floor(
        Math.random() * 3
      ) + 1;

    const harvestItemId =
      selectedSeedId ===
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
    Пока покупку можно повторять
    сколько угодно раз.

    Она просто списывает 60 монет.
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