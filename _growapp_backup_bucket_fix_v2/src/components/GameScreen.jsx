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
import ActionModal from "./ActionModal";
import TestResetButton from "./TestResetButton";
import usePersistentState from "../hooks/usePersistentState";
import usePotGrowth from "../hooks/usePotGrowth";

import { pots } from "../data/pots";
import { plantationSlots } from "../data/plantationSlots";
import { plantsBySeed } from "../data/plants";
import { seeds } from "../data/seeds";
import { shopItems } from "../data/shopItems";

import "./GameScreen.css";

const DEFAULT_GROW_TIME = 5;
const INITIAL_COINS = 100000;

const STAGE_WIDTH = 390;
const STAGE_HEIGHT = 844;

const STORAGE_KEYS = [
  "growapp-pot-states",
  "growapp-inventory",
  "growapp-seed-inventory",
  "growapp-shop-stock",
  "growapp-coins",
  "growapp-club-reputation",
];

function createPotState(index) {
  return {
    unlocked: index === 0,
    growStep: 0,
    selectedSeedId: null,
    growTime: DEFAULT_GROW_TIME,
    timeLeft: DEFAULT_GROW_TIME,
    nextGrowthAt: null,
  };
}

function createInitialPotStates() {
  return pots.map((_, index) => createPotState(index));
}

function createEmptyPotState(unlocked) {
  return {
    unlocked,
    growStep: 0,
    selectedSeedId: null,
    growTime: DEFAULT_GROW_TIME,
    timeLeft: DEFAULT_GROW_TIME,
    nextGrowthAt: null,
  };
}

function GameScreen() {
  const [currentPotIndex, setCurrentPotIndex] = useState(0);

  const [potStates, setPotStates] = usePersistentState(
    "growapp-pot-states",
    createInitialPotStates,
  );

  const [inventory, setInventory] = usePersistentState(
    "growapp-inventory",
    {
      greenTomato: 0,
      psychomor: 0,
    },
  );

  const [seedInventory, setSeedInventory] = usePersistentState(
    "growapp-seed-inventory",
    {
      psychomor: 0,
    },
  );

  const [shopStock, setShopStock] = usePersistentState(
    "growapp-shop-stock",
    {
      psychomor: 5,
    },
  );

  const [coins, setCoins] = usePersistentState(
    "growapp-coins",
    INITIAL_COINS,
  );

  const [activeScreen, setActiveScreen] = useState("plantation");
  const [stageScale, setStageScale] = useState(1);

  const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);
  const [selectedSeed, setSelectedSeed] = useState(null);

  const [isRemoveModalOpen, setIsRemoveModalOpen] =
    useState(false);

  const [isInventoryOpen, setIsInventoryOpen] = useState(false);

  const [isShopProductVisible, setIsShopProductVisible] =
    useState(false);

  const [flyingLootItems, setFlyingLootItems] = useState([]);

  const [pendingSlotIndex, setPendingSlotIndex] =
    useState(null);

  const [isUnavailableModalOpen, setIsUnavailableModalOpen] =
    useState(false);

  const [isResetModalOpen, setIsResetModalOpen] =
    useState(false);

  usePotGrowth(setPotStates, DEFAULT_GROW_TIME);

  useEffect(() => {
    setPotStates((previousStates) =>
      pots.map((_, index) => {
        const savedState = previousStates[index];

        if (!savedState) {
          return createPotState(index);
        }

        return {
          ...createPotState(index),
          ...savedState,
          unlocked:
            index === 0
              ? true
              : Boolean(savedState.unlocked),
        };
      }),
    );
  }, [setPotStates]);

  useEffect(() => {
    const updateScale = () => {
      const viewportWidth =
        window.visualViewport?.width || window.innerWidth;

      const viewportHeight =
        window.visualViewport?.height || window.innerHeight;

      const widthScale = viewportWidth / STAGE_WIDTH;
      const heightScale = viewportHeight / STAGE_HEIGHT;

      setStageScale(Math.min(widthScale, heightScale));
    };

    updateScale();

    window.addEventListener("resize", updateScale);

    window.visualViewport?.addEventListener(
      "resize",
      updateScale,
    );

    return () => {
      window.removeEventListener("resize", updateScale);

      window.visualViewport?.removeEventListener(
        "resize",
        updateScale,
      );
    };
  }, []);


  const currentPot = pots[currentPotIndex];

  const currentSlot =
    plantationSlots[currentPotIndex] || null;

  const currentPotState =
    potStates[currentPotIndex] ||
    createPotState(currentPotIndex);

  const growStep = currentPotState.growStep;
  const timeLeft = currentPotState.timeLeft;
  const plantedSeedId = currentPotState.selectedSeedId;

  const isCurrentPotUnlocked =
    currentPotState.unlocked;

  const currentPlantStages =
    plantsBySeed[plantedSeedId] || null;

  const currentPlant =
    growStep > 0 && currentPlantStages
      ? currentPlantStages[growStep - 1] || null
      : null;

  const psychomorItem =
    shopItems.find((item) => item.id === "psychomor") ||
    null;

  const pendingSlot =
    pendingSlotIndex === null
      ? null
      : plantationSlots[pendingSlotIndex];

  const updateCurrentPotState = (updates) => {
    setPotStates((previousStates) =>
      previousStates.map((potState, index) =>
        index === currentPotIndex
          ? {
              ...potState,
              ...updates,
            }
          : potState,
      ),
    );
  };

  const closePlantationModals = () => {
    setIsSeedModalOpen(false);
    setIsRemoveModalOpen(false);
    setSelectedSeed(null);
    setPendingSlotIndex(null);
    setIsUnavailableModalOpen(false);
  };

  const changePot = (nextIndex) => {
    closePlantationModals();

    const safeIndex =
      (nextIndex + pots.length) % pots.length;

    setCurrentPotIndex(safeIndex);
  };

  const showNextPot = () => {
    changePot(currentPotIndex + 1);
  };

  const showPreviousPot = () => {
    changePot(currentPotIndex - 1);
  };

  const handleLockedSlotClick = () => {
    if (isCurrentPotUnlocked) {
      return;
    }

    if (!currentSlot?.available) {
      setIsUnavailableModalOpen(true);
      return;
    }

    setPendingSlotIndex(currentPotIndex);
  };

  const buyPendingSlot = () => {
    if (pendingSlotIndex === null) {
      return;
    }

    const slot = plantationSlots[pendingSlotIndex];

    if (!slot?.available || slot.unlockPrice === null) {
      setPendingSlotIndex(null);
      setIsUnavailableModalOpen(true);
      return;
    }

    if (coins < slot.unlockPrice) {
      return;
    }

    setCoins(
      (previousCoins) =>
        previousCoins - slot.unlockPrice,
    );

    setPotStates((previousStates) =>
      previousStates.map((potState, index) =>
        index === pendingSlotIndex
          ? createEmptyPotState(true)
          : potState,
      ),
    );

    setPendingSlotIndex(null);
  };

  const openSeedModal = () => {
    if (!isCurrentPotUnlocked) {
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

    if (!isCurrentPotUnlocked || growStep !== 0) {
      return;
    }

    const seedId = selectedSeed.id;

    if (!selectedSeed.infinite) {
      const currentAmount =
        seedInventory[seedId] || 0;

      if (currentAmount <= 0) {
        return;
      }

      setSeedInventory((previousInventory) => ({
        ...previousInventory,
        [seedId]: Math.max(
          0,
          (previousInventory[seedId] || 0) - 1,
        ),
      }));
    }

    const growTime =
      selectedSeed.growTime || DEFAULT_GROW_TIME;

    updateCurrentPotState({
      unlocked: true,
      growStep: 1,
      selectedSeedId: seedId,
      growTime,
      timeLeft: growTime,
      nextGrowthAt: Date.now() + growTime * 1000,
    });

    closeSeedModal();
  };

  const collectPlant = () => {
    if (!isCurrentPotUnlocked) {
      return;
    }

    if (growStep !== 3 || !plantedSeedId) {
      return;
    }

    const reward = Math.floor(Math.random() * 3) + 1;

    const harvestItemId =
      plantedSeedId === "psychomor"
        ? "psychomor"
        : "greenTomato";

    const newLootItems = Array.from(
      {
        length: reward,
      },
      (_, index) => ({
        id: `${Date.now()}-${index}`,
        startX: 190 + index * 12,
        startY: 470 - index * 8,
        delay: index * 120,
        itemId: harvestItemId,
      }),
    );

    setFlyingLootItems(newLootItems);

    setInventory((previousInventory) => ({
      ...previousInventory,
      [harvestItemId]:
        (previousInventory[harvestItemId] || 0) + reward,
    }));

    updateCurrentPotState(
      createEmptyPotState(true),
    );

    window.setTimeout(() => {
      setFlyingLootItems([]);
    }, 1100);
  };

  const openRemoveModal = () => {
    if (!isCurrentPotUnlocked) {
      return;
    }

    if (growStep === 0) {
      return;
    }

    setIsRemoveModalOpen(true);
  };

  const removePlant = () => {
    if (!isCurrentPotUnlocked) {
      return;
    }

    if (growStep === 0) {
      return;
    }

    updateCurrentPotState(
      createEmptyPotState(true),
    );

    setIsRemoveModalOpen(false);
  };

  const deleteInventoryItem = (itemId, count) => {
    if (
      itemId !== "greenTomato" &&
      itemId !== "psychomor"
    ) {
      return;
    }

    setInventory((previousInventory) => ({
      ...previousInventory,
      [itemId]: Math.max(
        0,
        (previousInventory[itemId] || 0) - count,
      ),
    }));
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

  const buyShopItem = (item, amount) => {
    if (!item) {
      return {
        success: false,
        message: "Товар не найден.",
      };
    }

    const requestedAmount = Math.floor(Number(amount));

    if (
      !Number.isFinite(requestedAmount) ||
      requestedAmount <= 0
    ) {
      return {
        success: false,
        message: "Выбери количество семян.",
      };
    }

    const availableStock =
      shopStock[item.id] || 0;

    if (requestedAmount > availableStock) {
      return {
        success: false,
        message: "У Зорика нет столько семян.",
      };
    }

    const totalPrice =
      requestedAmount * item.pricePerSeed;

    if (coins < totalPrice) {
      return {
        success: false,
        message: "Недостаточно монет.",
      };
    }

    setCoins(
      (previousCoins) =>
        previousCoins - totalPrice,
    );

    setShopStock((previousStock) => ({
      ...previousStock,
      [item.id]: Math.max(
        0,
        (previousStock[item.id] || 0) -
          requestedAmount,
      ),
    }));

    setSeedInventory((previousInventory) => ({
      ...previousInventory,
      [item.id]:
        (previousInventory[item.id] || 0) +
        requestedAmount,
    }));

    return {
      success: true,
      message: `Вы купили семена Психомора: ${requestedAmount} шт.`,
    };
  };

  const openResetModal = () => {
    closePlantationModals();
    setIsInventoryOpen(false);
    setIsResetModalOpen(true);
  };

  const resetAllProgress = () => {
    for (const key of STORAGE_KEYS) {
      localStorage.removeItem(key);
    }

    setCoins(INITIAL_COINS);

    setInventory({
      greenTomato: 0,
      psychomor: 0,
    });

    setSeedInventory({
      psychomor: 0,
    });

    setShopStock({
      psychomor: 5,
    });

    setPotStates(createInitialPotStates());

    setCurrentPotIndex(0);
    setActiveScreen("plantation");

    setSelectedSeed(null);
    setIsSeedModalOpen(false);
    setIsRemoveModalOpen(false);
    setIsInventoryOpen(false);

    setIsShopProductVisible(false);
    setFlyingLootItems([]);

    setPendingSlotIndex(null);
    setIsUnavailableModalOpen(false);
    setIsResetModalOpen(false);
  };

  return (
    <div className="game-screen">
      <div
        className="game-stage"
        style={{
          transform: `scale(${stageScale})`,
        }}
      >
        {activeScreen === "plantation" && (
          <>
            <div className="background" />

            <div className="top-wallet">
              {coins}
            </div>

            <TestResetButton onClick={openResetModal} />

            {isCurrentPotUnlocked && (
              <GrowTimer
                growStep={growStep}
                timeLeft={timeLeft}
              />
            )}

            <BackpackTool
              onClick={() => setIsInventoryOpen(true)}
            />

            <FlyingLoot lootItems={flyingLootItems} />

            <div className="game-content">
              <div className="table-scene">
                <PlantArea
                  pot={currentPot}
                  plant={currentPlant}
                  unlockPrice={currentSlot?.unlockPrice}
                  isSlotAvailable={Boolean(
                    currentSlot?.available,
                  )}
                  isUnlocked={isCurrentPotUnlocked}
                  isEmpty={growStep === 0}
                  canCollect={growStep === 3}
                  onCollect={collectPlant}
                  onSeedClick={openSeedModal}
                  onRemoveClick={openRemoveModal}
                  onUnlock={handleLockedSlotClick}
                  onPreviousPot={showPreviousPot}
                  onNextPot={showNextPot}
                />
              </div>
            </div>

            <div className="plantation-pagination">
              {pots.map((pot, index) => (
                <button
                  key={pot.id}
                  className={`plantation-pagination-dot${
                    index === currentPotIndex
                      ? " active"
                      : ""
                  }${
                    potStates[index]?.unlocked
                      ? " unlocked"
                      : ""
                  }`}
                  type="button"
                  aria-label={`Перейти к ведру ${index + 1}`}
                  onClick={() => changePot(index)}
                />
              ))}
            </div>

            <SeedModal
              isOpen={
                isSeedModalOpen &&
                isCurrentPotUnlocked
              }
              seeds={seeds}
              seedInventory={seedInventory}
              selectedSeed={selectedSeed}
              onSelectSeed={setSelectedSeed}
              onPlantSeed={plantSelectedSeed}
              onClose={closeSeedModal}
            />

            <RemovePlantModal
              isOpen={
                isRemoveModalOpen &&
                isCurrentPotUnlocked
              }
              onConfirm={removePlant}
              onCancel={() =>
                setIsRemoveModalOpen(false)
              }
            />

            <InventoryModal
              isOpen={isInventoryOpen}
              inventory={inventory}
              onClose={() => setIsInventoryOpen(false)}
              onDeleteItem={deleteInventoryItem}
            />

            <ActionModal
              isOpen={pendingSlot !== null}
              title="Купить место для ведра?"
              description="После покупки здесь появится новое ведро. Открытое место сохранится после перезапуска игры."
              price={pendingSlot?.unlockPrice ?? null}
              coins={coins}
              confirmText="Купить"
              confirmDisabled={
                !pendingSlot ||
                coins < pendingSlot.unlockPrice
              }
              onConfirm={buyPendingSlot}
              onCancel={() => setPendingSlotIndex(null)}
            />

            <ActionModal
              isOpen={isUnavailableModalOpen}
              title="Пока что недоступно"
              description="Это место появится в одном из следующих обновлений."
              confirmText="Понятно"
              cancelText="Закрыть"
              onConfirm={() =>
                setIsUnavailableModalOpen(false)
              }
              onCancel={() =>
                setIsUnavailableModalOpen(false)
              }
            />

            <ActionModal
              isOpen={isResetModalOpen}
              title="Сбросить весь прогресс?"
              description="Удалятся растения, урожай, семена и открытые места. После сброса на балансе будет 100 000 монет."
              confirmText="Сбросить всё"
              cancelText="Отмена"
              danger
              onConfirm={resetAllProgress}
              onCancel={() =>
                setIsResetModalOpen(false)
              }
            />
          </>
        )}

        {activeScreen === "district" && (
          <DistrictScreen
            onOpenClub={openClub}
            onOpenShop={openShop}
          />
        )}

        {activeScreen === "shop" && (
          <>
            <ShopScreen
              onGoBack={goBackToDistrict}
              onShowPsychomor={() =>
                setIsShopProductVisible(true)
              }
            />

            <ShopModal
              isOpen={isShopProductVisible}
              item={psychomorItem}
              coins={coins}
              stock={shopStock.psychomor || 0}
              playerSeedCount={
                seedInventory.psychomor || 0
              }
              onBuy={buyShopItem}
            />
          </>
        )}

        {activeScreen === "club" && (
          <ClubScreen
            inventory={inventory}
            setInventory={setInventory}
            coins={coins}
            setCoins={setCoins}
            onGoBack={goBackToDistrict}
          />
        )}

        {activeScreen !== "shop" &&
          activeScreen !== "club" && (
            <BottomMenu
              activeScreen={activeScreen}
              onGoPlantation={() => {
                setIsShopProductVisible(false);
                setActiveScreen("plantation");
              }}
              onGoDistrict={() => {
                setIsShopProductVisible(false);
                setActiveScreen("district");
              }}
            />
          )}
      </div>
    </div>
  );
}

export default GameScreen;