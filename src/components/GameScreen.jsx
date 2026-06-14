import { useEffect, useState } from "react";

import PlantArea from "./PlantArea";
import BottomMenu from "./BottomMenu";
import SeedModal from "./SeedModal";
import RemovePlantModal from "./RemovePlantModal";
import BackpackTool from "./BackpackTool";
import InventoryModal from "./InventoryModal";
import FlyingLoot from "./FlyingLoot";
import DistrictScreen from "./DistrictScreen";
import ShopScreen from "./ShopScreen";
import ClubScreen from "./ClubScreen";
import JoeHouseScreen from "./JoeHouseScreen";
import ShopModal from "./ShopModal";
import ActionModal from "./ActionModal";
import TestResetButton from "./TestResetButton";
import HarvestCareModal from "./HarvestCareModal";
import HarvestResultModal from "./HarvestResultModal";
import PlantCatalogModal from "./PlantCatalogModal";
import TutorialOverlay from "./tutorial/TutorialOverlay";
import usePersistentState from "../hooks/usePersistentState";
import usePotGrowth from "../hooks/usePotGrowth";
import useClubReputation from "../hooks/useClubReputation";

import { pots } from "../data/pots";
import {
  getPlantationSlotState,
  plantationSlots,
} from "../data/plantationSlots";
import { getClubLevel } from "../game/clubProgression";
import { plantsBySeed } from "../data/plants";
import { seeds } from "../data/seeds";
import { shopItems } from "../data/shopItems";
import { getHarvestYield, rollHarvestQuality } from "../data/harvestQuality";

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
  "growapp-tutorial-step",
  "growapp-joe-quests",
  "growapp-plant-catalog",
];

function createPotState(index) {
  return {
    unlocked: false,
    growStep: 0,
    selectedSeedId: null,
    growTime: DEFAULT_GROW_TIME,
    timeLeft: DEFAULT_GROW_TIME,
    nextGrowthAt: null,
    careApplied: null,
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
    careApplied: null,
  };
}

function GameScreen() {
  const [currentPotIndex, setCurrentPotIndex] = useState(0);
  const clubReputation = useClubReputation();
  const clubLevel = getClubLevel(clubReputation);

  const [tutorialStep, setTutorialStep] = usePersistentState(
    "growapp-tutorial-step",
    () =>
      localStorage.getItem("growapp-pot-states")
        ? "completed"
        : "intro",
  );

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

  const [joeQuestState, setJoeQuestState] = usePersistentState(
    "growapp-joe-quests",
    {
      completedQuestIds: [],
      trust: 0,
      clubSales: {
        greenTomato: 0,
        psychomor: 0,
      },
      careUses: {
        water: 0,
        nutrition: 0,
        joeMix: 0,
      },
    },
  );

  const [plantCatalog, setPlantCatalog] = usePersistentState(
    "growapp-plant-catalog",
    {},
  );

  const [activeScreen, setActiveScreen] = useState("plantation");
  const [stageScale, setStageScale] = useState(1);

  const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);
  const [selectedSeed, setSelectedSeed] = useState(null);

  const [isRemoveModalOpen, setIsRemoveModalOpen] =
    useState(false);

  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isCareModalOpen, setIsCareModalOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [harvestResult, setHarvestResult] = useState(null);

  const [isShopProductVisible, setIsShopProductVisible] =
    useState(false);

  const [flyingLootItems, setFlyingLootItems] = useState([]);

  const [pendingSlotIndex, setPendingSlotIndex] =
    useState(null);

  const [isUnavailableModalOpen, setIsUnavailableModalOpen] =
    useState(false);

  const [isResetModalOpen, setIsResetModalOpen] =
    useState(false);

  const isTutorialActive =
    tutorialStep !== "completed";

  const tutorialAllows = (action) => {
    if (!isTutorialActive) {
      return true;
    }

    const allowedByStep = {
      intro: ["continue"],
      "unlock-pot": ["unlock-pot"],
      "open-seeds": ["open-seeds"],
      "choose-seed": ["choose-seed"],
      "plant-seed": ["plant-seed"],
      growing: [],
      collect: ["collect"],
      "go-district": ["go-district"],
      "district-finish": ["continue"],
    };

    return (allowedByStep[tutorialStep] || []).includes(action);
  };

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
          unlocked: Boolean(savedState.unlocked),
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


  useEffect(() => {
    document.body.dataset.tutorialLocked =
      isTutorialActive ? "true" : "false";

    return () => {
      delete document.body.dataset.tutorialLocked;
    };
  }, [isTutorialActive]);

  useEffect(() => {
    if (!isTutorialActive) {
      return;
    }

    if (tutorialStep === "district-finish") {
      setActiveScreen("district");
      setIsSeedModalOpen(false);
      setSelectedSeed(null);
      return;
    }

    setActiveScreen("plantation");
    setCurrentPotIndex(0);
    setIsInventoryOpen(false);
    setIsCareModalOpen(false);
    setIsCatalogOpen(false);
    setHarvestResult(null);
    setIsRemoveModalOpen(false);
    setIsResetModalOpen(false);
    setPendingSlotIndex(null);
    setIsUnavailableModalOpen(false);

    if (tutorialStep === "choose-seed") {
      setSelectedSeed(null);
      setIsSeedModalOpen(true);
      return;
    }

    if (tutorialStep === "plant-seed") {
      const tutorialSeed =
        seeds.find((seed) => seed.id === "greenTomato") || null;

      setSelectedSeed(tutorialSeed);
      setIsSeedModalOpen(true);
      return;
    }

    setIsSeedModalOpen(false);
    setSelectedSeed(null);
  }, [isTutorialActive, tutorialStep]);

  const currentPot = pots[currentPotIndex];

  const currentSlot =
    plantationSlots[currentPotIndex] || null;

  const currentPotState =
    potStates[currentPotIndex] ||
    createPotState(currentPotIndex);

  const currentSlotState = getPlantationSlotState(
    currentSlot,
    clubLevel,
    Boolean(currentPotState.unlocked),
  );

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

  useEffect(() => {
    if (
      tutorialStep === "growing" &&
      activeScreen === "plantation" &&
      growStep === 3
    ) {
      setTutorialStep("collect");
    }
  }, [
    activeScreen,
    growStep,
    setTutorialStep,
    tutorialStep,
  ]);

  const psychomorItem =
    shopItems.find((item) => item.id === "psychomor") ||
    null;

  const pendingSlot =
    pendingSlotIndex === null
      ? null
      : plantationSlots[pendingSlotIndex];

  const pendingSlotState = getPlantationSlotState(
    pendingSlot,
    clubLevel,
    pendingSlotIndex === null
      ? false
      : Boolean(potStates[pendingSlotIndex]?.unlocked),
  );

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
    if (isTutorialActive) {
      return;
    }

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
    if (!tutorialAllows("unlock-pot")) {
      return;
    }

    if (isCurrentPotUnlocked) {
      return;
    }

    if (
      tutorialStep === "unlock-pot" &&
      currentPotIndex === 0
    ) {
      setPotStates((previousStates) =>
        previousStates.map((potState, index) =>
          index === 0
            ? createEmptyPotState(true)
            : potState,
        ),
      );

      setTutorialStep("open-seeds");
      return;
    }

    if (!currentSlotState.canBuy) {
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

    const slotState = getPlantationSlotState(
      slot,
      clubLevel,
      Boolean(potStates[pendingSlotIndex]?.unlocked),
    );

    if (!slotState.canBuy || slot.unlockPrice === null) {
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
    if (!tutorialAllows("open-seeds")) {
      return;
    }

    if (!isCurrentPotUnlocked) {
      return;
    }

    if (growStep !== 0) {
      return;
    }

    setSelectedSeed(null);
    setIsSeedModalOpen(true);

    if (tutorialStep === "open-seeds") {
      setTutorialStep("choose-seed");
    }
  };

  const selectSeed = (seed) => {
    if (!tutorialAllows("choose-seed")) {
      return;
    }

    if (tutorialStep === "choose-seed" && seed?.id !== "greenTomato") {
      return;
    }

    setSelectedSeed(seed);

    if (
      tutorialStep === "choose-seed" &&
      seed?.id === "greenTomato"
    ) {
      setTutorialStep("plant-seed");
    }
  };

  const closeSeedModal = () => {
    if (isTutorialActive) {
      return;
    }

    setSelectedSeed(null);
    setIsSeedModalOpen(false);
  };

  const plantSelectedSeed = () => {
    if (!tutorialAllows("plant-seed")) {
      return;
    }

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
      careApplied: null,
    });

    closeSeedModal();

    if (tutorialStep === "plant-seed") {
      setTutorialStep("growing");
    }
  };

  const applyPlantCare = (careType) => {
    if (growStep !== 2 || currentPotState.careApplied) {
      return;
    }

    const updates = { careApplied: careType };

    if (careType === "water" && currentPotState.nextGrowthAt) {
      const now = Date.now();
      const remaining = Math.max(0, currentPotState.nextGrowthAt - now);
      const nextGrowthAt = now + Math.max(1000, Math.round(remaining * 0.8));
      updates.nextGrowthAt = nextGrowthAt;
      updates.timeLeft = Math.max(1, Math.ceil((nextGrowthAt - now) / 1000));
    }

    updateCurrentPotState(updates);
    setJoeQuestState((previousState) => ({
      ...previousState,
      careUses: {
        water: previousState?.careUses?.water || 0,
        nutrition: previousState?.careUses?.nutrition || 0,
        joeMix: previousState?.careUses?.joeMix || 0,
        [careType]: (previousState?.careUses?.[careType] || 0) + 1,
      },
    }));
    setIsCareModalOpen(false);
  };

  const collectPlant = () => {
    if (!tutorialAllows("collect")) {
      return;
    }

    if (!isCurrentPotUnlocked) {
      return;
    }

    if (growStep !== 3 || !plantedSeedId) {
      return;
    }

    const quality = rollHarvestQuality(currentPotState.careApplied || "none");
    const reward = getHarvestYield(currentPotState.careApplied || "none", quality.id);

    const harvestItemId =
      plantedSeedId === "psychomor"
        ? "psychomor"
        : "greenTomato";

    const itemName = harvestItemId === "psychomor" ? "Психомор" : "Зелёный томат";
    const itemIcon = harvestItemId === "psychomor" ? "🪻" : "🍅";
    const previousRecord = plantCatalog[harvestItemId] || {};
    const firstDiscovery = !(previousRecord.qualities?.[quality.id] > 0);

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

    setPlantCatalog((previousCatalog) => {
      const record = previousCatalog[harvestItemId] || {
        totalHarvested: 0,
        qualities: {},
        bestQualityRank: -1,
        bestQualityName: null,
      };

      return {
        ...previousCatalog,
        [harvestItemId]: {
          ...record,
          totalHarvested: (record.totalHarvested || 0) + reward,
          qualities: {
            ...(record.qualities || {}),
            [quality.id]: ((record.qualities || {})[quality.id] || 0) + 1,
          },
          bestQualityRank: Math.max(record.bestQualityRank ?? -1, quality.rank),
          bestQualityName:
            quality.rank >= (record.bestQualityRank ?? -1)
              ? quality.name
              : record.bestQualityName,
        },
      };
    });

    setHarvestResult({
      itemId: harvestItemId,
      itemName,
      itemIcon,
      amount: reward,
      quality,
      firstDiscovery,
    });

    updateCurrentPotState(
      createEmptyPotState(true),
    );

    if (tutorialStep === "collect") {
      setTutorialStep("go-district");
    }

    window.setTimeout(() => {
      setFlyingLootItems([]);
    }, 1100);
  };

  const openRemoveModal = () => {
    if (isTutorialActive) {
      return;
    }

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
    if (isTutorialActive) {
      return;
    }

    setIsShopProductVisible(false);
    setActiveScreen("club");
  };

  const openShop = () => {
    if (isTutorialActive) {
      return;
    }

    setIsShopProductVisible(false);
    setActiveScreen("shop");
  };

  const openJoeHouse = () => {
    if (isTutorialActive) {
      return;
    }

    setIsShopProductVisible(false);
    setActiveScreen("joe-house");
  };

  const goBackToDistrict = () => {
    if (isTutorialActive) {
      return;
    }

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

  const deliverJoeItems = ({ itemId, amount }) => {
    const safeAmount = Math.max(0, Math.floor(Number(amount) || 0));

    if (!itemId || safeAmount <= 0) {
      return false;
    }

    const availableAmount = inventory[itemId] || 0;

    if (availableAmount < safeAmount) {
      return false;
    }

    setInventory((previousInventory) => ({
      ...previousInventory,
      [itemId]: Math.max(
        0,
        (previousInventory[itemId] || 0) - safeAmount,
      ),
    }));

    return true;
  };

  const claimJoeReward = ({ coins: coinReward }) => {
    const safeCoins = Math.max(0, Math.floor(Number(coinReward) || 0));

    if (safeCoins > 0) {
      setCoins((previousCoins) => previousCoins + safeCoins);
    }
  };

  const handleClubSaleForJoe = ({ itemId, amount }) => {
    const safeAmount = Math.max(0, Math.floor(Number(amount) || 0));

    if (!itemId || safeAmount <= 0) {
      return;
    }

    setJoeQuestState((previousState) => ({
      ...previousState,
      clubSales: {
        greenTomato: previousState?.clubSales?.greenTomato || 0,
        psychomor: previousState?.clubSales?.psychomor || 0,
        [itemId]: (previousState?.clubSales?.[itemId] || 0) + safeAmount,
      },
    }));
  };

  const openResetModal = () => {
    if (isTutorialActive) {
      return;
    }

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

    setJoeQuestState({
      completedQuestIds: [],
      trust: 0,
      clubSales: {
        greenTomato: 0,
        psychomor: 0,
      },
      careUses: {
        water: 0,
        nutrition: 0,
        joeMix: 0,
      },
    });

    setPlantCatalog({});
    setPotStates(createInitialPotStates());
    setTutorialStep("intro");

    setCurrentPotIndex(0);
    setActiveScreen("plantation");

    setSelectedSeed(null);
    setIsSeedModalOpen(false);
    setIsRemoveModalOpen(false);
    setIsInventoryOpen(false);
    setIsCareModalOpen(false);
    setIsCatalogOpen(false);
    setHarvestResult(null);

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

            <TestResetButton
              onClick={openResetModal}
              disabled={isTutorialActive}
            />

            <BackpackTool
              disabled={isTutorialActive}
              onClick={() => {
                if (!isTutorialActive) {
                  setIsInventoryOpen(true);
                }
              }}
            />

            <button
              type="button"
              className="plant-catalog-tool"
              onClick={() => setIsCatalogOpen(true)}
              disabled={isTutorialActive}
              aria-label="Открыть каталог растений"
            >
              📖
            </button>

            <FlyingLoot lootItems={flyingLootItems} />

            <div className="game-content">
              <div className="table-scene">
                <PlantArea
                  pot={currentPot}
                  plant={currentPlant}
                  growStep={growStep}
                  timeLeft={timeLeft}
                  growTime={currentPotState.growTime}
                  unlockPrice={
                    tutorialStep === "unlock-pot" &&
                    currentPotIndex === 0
                      ? 0
                      : currentSlot?.unlockPrice
                  }
                  isSlotAvailable={
                    tutorialStep === "unlock-pot" &&
                    currentPotIndex === 0
                      ? true
                      : currentSlotState.canBuy
                  }
        lockedStatusText={currentSlotState.statusText}
                  isUnlocked={isCurrentPotUnlocked}
                  isEmpty={growStep === 0}
                  canCollect={growStep === 3}
                  onCollect={collectPlant}
                  onSeedClick={openSeedModal}
                  onRemoveClick={openRemoveModal}
                  onUnlock={handleLockedSlotClick}
                  onOpenCare={() => setIsCareModalOpen(true)}
                  careApplied={currentPotState.careApplied}
                  canCare={!isTutorialActive && (joeQuestState.trust || 0) >= 25 && growStep === 2 && !currentPotState.careApplied}
                  onPreviousPot={showPreviousPot}
                  onNextPot={showNextPot}
                  navigationDisabled={isTutorialActive}
                  seedDisabled={!tutorialAllows("open-seeds")}
                  removeDisabled={isTutorialActive}
                  collectDisabled={!tutorialAllows("collect")}
                  unlockDisabled={!tutorialAllows("unlock-pot")}
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
                  disabled={isTutorialActive}
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
              onSelectSeed={selectSeed}
              onPlantSeed={plantSelectedSeed}
              onClose={closeSeedModal}
              tutorialStep={tutorialStep}
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

            <HarvestCareModal
              isOpen={isCareModalOpen}
              trust={joeQuestState.trust || 0}
              onChoose={applyPlantCare}
              onClose={() => setIsCareModalOpen(false)}
            />

            <HarvestResultModal
              result={harvestResult}
              onClose={() => setHarvestResult(null)}
              onOpenCatalog={() => {
                setHarvestResult(null);
                setIsCatalogOpen(true);
              }}
            />

            <PlantCatalogModal
              isOpen={isCatalogOpen}
              catalog={plantCatalog}
              onClose={() => setIsCatalogOpen(false)}
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
          !pendingSlotState.canBuy ||
          coins < pendingSlot.unlockPrice
        }
              onConfirm={buyPendingSlot}
              onCancel={() => setPendingSlotIndex(null)}
            />

            <ActionModal
              isOpen={isUnavailableModalOpen}
              title="Пока что недоступно"
              description={
        currentSlotState.isLevelLocked
          ? currentSlotState.statusText
          : "Это место появится в одном из следующих обновлений."
      }
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
            onOpenJoeHouse={openJoeHouse}
          />
        )}

        {activeScreen === "joe-house" && (
          <JoeHouseScreen
            inventory={inventory}
            seedInventory={seedInventory}
            clubReputation={clubReputation}
            questState={joeQuestState}
            plantCatalog={plantCatalog}
            onQuestStateChange={setJoeQuestState}
            onDeliverItems={deliverJoeItems}
            onRewardClaimed={claimJoeReward}
            onBack={goBackToDistrict}
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
            onSaleCompleted={handleClubSaleForJoe}
            onGoBack={goBackToDistrict}
          />
        )}

        {activeScreen !== "shop" &&
          activeScreen !== "club" &&
          activeScreen !== "joe-house" && (
            <BottomMenu
              activeScreen={activeScreen}
              tutorialStep={tutorialStep}
              onGoPlantation={() => {
                if (isTutorialActive) {
                  return;
                }

                setIsShopProductVisible(false);
                setActiveScreen("plantation");
              }}
              onGoDistrict={() => {
                if (!tutorialAllows("go-district")) {
                  return;
                }

                setIsShopProductVisible(false);
                setActiveScreen("district");

                if (tutorialStep === "go-district") {
                  setTutorialStep("district-finish");
                }
              }}
            />
          )}

        <TutorialOverlay
          step={tutorialStep}
          stageScale={stageScale}
          activeScreen={activeScreen}
          onContinue={() => {
            if (!tutorialAllows("continue")) {
              return;
            }

            if (tutorialStep === "intro") {
              setActiveScreen("plantation");
              setCurrentPotIndex(0);
              setTutorialStep("unlock-pot");
              return;
            }

            if (tutorialStep === "growing") {
              return;
            }

            if (tutorialStep === "district-finish") {
              setTutorialStep("completed");
            }
          }}
        />
      </div>
    </div>
  );
}

export default GameScreen;