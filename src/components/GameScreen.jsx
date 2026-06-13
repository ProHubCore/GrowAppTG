import { useState } from "react";

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
import useStageScale from "../hooks/useStageScale";
import usePotGrowth from "../hooks/usePotGrowth";

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
    growTime: DEFAULT_GROW_TIME,
    timeLeft: DEFAULT_GROW_TIME,
    nextGrowthAt: null,
  };
}

function GameScreen() {
  const [currentPotIndex, setCurrentPotIndex] = useState(0);

  const [potStates, setPotStates] = useState(() =>
    pots.map((_, index) => createPotState(index))
  );

  const [activeScreen, setActiveScreen] =
    useState("plantation");

  const [selectedSeed, setSelectedSeed] = useState(null);

  const [isSeedModalOpen, setIsSeedModalOpen] =
    useState(false);

  const [isRemoveModalOpen, setIsRemoveModalOpen] =
    useState(false);

  const [isInventoryOpen, setIsInventoryOpen] =
    useState(false);

  const [
    isShopProductVisible,
    setIsShopProductVisible,
  ] = useState(false);

  const [flyingLootItems, setFlyingLootItems] =
    useState([]);

  const [inventory, setInventory] = usePersistentState(
    "growapp-inventory",
    {
      greenTomato: 0,
      psychomor: 0,
    }
  );

  const [seedInventory, setSeedInventory] =
    usePersistentState("growapp-seed-inventory", {
      psychomor: 0,
    });

  const [shopStock, setShopStock] = usePersistentState(
    "growapp-shop-stock",
    {
      psychomor: 5,
    }
  );

  const [coins, setCoins] = usePersistentState(
    "growapp-coins",
    100
  );

  const stageScale = useStageScale(
    STAGE_WIDTH,
    STAGE_HEIGHT
  );

  usePotGrowth(setPotStates, DEFAULT_GROW_TIME);

  const currentPot = pots[currentPotIndex];

  const currentPotState =
    potStates[currentPotIndex] ??
    createPotState(currentPotIndex);

  const {
    growStep,
    timeLeft,
    selectedSeedId: plantedSeedId,
    unlocked: isCurrentPotUnlocked,
  } = currentPotState;

  const currentPlantStages =
    plantsBySeed[plantedSeedId] ?? null;

  const currentPlant =
    growStep > 0 && currentPlantStages
      ? currentPlantStages[growStep - 1] ?? null
      : null;

  const psychomorItem =
    shopItems.find((item) => item.id === "psychomor") ??
    null;

  const updateCurrentPotState = (updates) => {
    setPotStates((previousStates) =>
      previousStates.map((potState, index) => {
        if (index !== currentPotIndex) {
          return potState;
        }

        return {
          ...potState,
          ...updates,
        };
      })
    );
  };

  const resetCurrentPot = () => {
    updateCurrentPotState({
      growStep: 0,
      selectedSeedId: null,
      growTime: DEFAULT_GROW_TIME,
      timeLeft: DEFAULT_GROW_TIME,
      nextGrowthAt: null,
    });
  };

  const closePlantationModals = () => {
    setIsSeedModalOpen(false);
    setIsRemoveModalOpen(false);
    setSelectedSeed(null);
  };

  const changeScreen = (screenName) => {
    setIsShopProductVisible(false);
    closePlantationModals();
    setActiveScreen(screenName);
  };

  const showNextPot = () => {
    closePlantationModals();

    setCurrentPotIndex(
      (previousIndex) =>
        (previousIndex + 1) % pots.length
    );
  };

  const showPreviousPot = () => {
    closePlantationModals();

    setCurrentPotIndex(
      (previousIndex) =>
        (previousIndex - 1 + pots.length) % pots.length
    );
  };

  const unlockCurrentPot = () => {
    updateCurrentPotState({
      ...createPotState(currentPotIndex),
      unlocked: true,
    });
  };

  const openSeedModal = () => {
    if (!isCurrentPotUnlocked || growStep !== 0) {
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
    if (
      !selectedSeed ||
      !isCurrentPotUnlocked ||
      growStep !== 0
    ) {
      return;
    }

    const seedId = selectedSeed.id;

    if (!selectedSeed.infinite) {
      const currentAmount = seedInventory[seedId] || 0;

      if (currentAmount <= 0) {
        setSelectedSeed(null);
        return;
      }

      setSeedInventory((previousInventory) => ({
        ...previousInventory,
        [seedId]: Math.max(
          0,
          (previousInventory[seedId] || 0) - 1
        ),
      }));
    }

    const growTime =
      selectedSeed.growTime || DEFAULT_GROW_TIME;

    updateCurrentPotState({
      growStep: 1,
      selectedSeedId: seedId,
      growTime,
      timeLeft: growTime,
      nextGrowthAt: Date.now() + growTime * 1000,
    });

    setSelectedSeed(null);
    setIsSeedModalOpen(false);
  };

  const collectPlant = () => {
    if (
      !isCurrentPotUnlocked ||
      growStep !== 3 ||
      !plantedSeedId
    ) {
      return;
    }

    const reward = Math.floor(Math.random() * 3) + 1;

    const harvestItemId =
      plantedSeedId === "psychomor"
        ? "psychomor"
        : "greenTomato";

    const lootItems = Array.from(
      { length: reward },
      (_, index) => ({
        id: `${Date.now()}-${index}`,
        startX: 190 + index * 12,
        startY: 470 - index * 8,
        delay: index * 120,
        itemId: harvestItemId,
      })
    );

    setFlyingLootItems(lootItems);

    setInventory((previousInventory) => ({
      ...previousInventory,
      [harvestItemId]:
        (previousInventory[harvestItemId] || 0) + reward,
    }));

    resetCurrentPot();

    window.setTimeout(() => {
      setFlyingLootItems([]);
    }, 1100);
  };

  const openRemoveModal = () => {
    if (!isCurrentPotUnlocked || growStep === 0) {
      return;
    }

    setIsRemoveModalOpen(true);
  };

  const removePlant = () => {
    if (!isCurrentPotUnlocked || growStep === 0) {
      return;
    }

    resetCurrentPot();
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
        (previousInventory[itemId] || 0) - count
      ),
    }));
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

    const availableStock = shopStock[item.id] || 0;

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

    setCoins((previousCoins) =>
      Math.max(0, previousCoins - totalPrice)
    );

    setShopStock((previousStock) => ({
      ...previousStock,
      [item.id]: Math.max(
        0,
        (previousStock[item.id] || 0) -
          requestedAmount
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
              🪙 {coins}
            </div>

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
                  isUnlocked={isCurrentPotUnlocked}
                  isEmpty={growStep === 0}
                  canCollect={growStep === 3}
                  onCollect={collectPlant}
                  onSeedClick={openSeedModal}
                  onRemoveClick={openRemoveModal}
                  onUnlock={unlockCurrentPot}
                  onPreviousPot={showPreviousPot}
                  onNextPot={showNextPot}
                />
              </div>
            </div>

            <SeedModal
              isOpen={
                isSeedModalOpen && isCurrentPotUnlocked
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
          </>
        )}

        {activeScreen === "district" && (
          <DistrictScreen
            onOpenClub={() => changeScreen("club")}
            onOpenShop={() => changeScreen("shop")}
          />
        )}

        {activeScreen === "shop" && (
          <>
            <ShopScreen
              onGoBack={() => changeScreen("district")}
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
            onGoBack={() => changeScreen("district")}
          />
        )}

        {activeScreen !== "shop" &&
          activeScreen !== "club" && (
            <BottomMenu
              activeScreen={activeScreen}
              onGoPlantation={() =>
                changeScreen("plantation")
              }
              onGoDistrict={() =>
                changeScreen("district")
              }
            />
          )}
      </div>
    </div>
  );
}

export default GameScreen;