import { useEffect, useRef, useState } from "react";

import PlantArea from "../plantation/components/PlantArea";
import BottomMenu from "../../shared/components/BottomMenu/BottomMenu";
import SeedModal from "../plantation/components/SeedModal";
import RemovePlantModal from "../plantation/components/RemovePlantModal";
import BackpackTool from "../inventory/components/BackpackTool";
import InventoryModal from "../inventory/components/InventoryModal";
import FlyingLoot from "../plantation/components/FlyingLoot";
import DistrictScreen from "../district/DistrictScreen";
import ShopScreen from "../shop/ShopScreen";
import ClubScreen from "../club/ClubScreen";
import MariaHouseScreen, { MARIA_QUESTS } from "../maria-ivanovna/MariaHouseScreen";
import ActionModal from "../../shared/components/ActionModal/ActionModal";
import UnlockCelebration from "../progression/components/UnlockCelebration";
import SupportScreen from "../support/SupportScreen";
import HarvestCareModal from "../plantation/components/HarvestCareModal";
import HarvestResultModal from "../plantation/components/HarvestResultModal";
import PlantCatalogModal from "../catalog/components/PlantCatalogModal";
import PotTypeModal from "../plantation/components/PotTypeModal";
import TutorialOverlay from "../tutorial/TutorialOverlay";
import usePersistentState from "../../core/hooks/usePersistentState";
import useResponsiveStage from "../../core/hooks/useResponsiveStage";
import usePotGrowth from "../plantation/hooks/usePotGrowth";
import useClubReputation from "../club/useClubReputation";
import { triggerTelegramHaptic, triggerTelegramNotification } from "../../core/telegram";
import { requestGameProgressReset } from "../../core/bootstrap/prepareReleaseState";

import { pots } from "../plantation/data/pots";
import {
  getPlantationSlotState,
  plantationSlots,
} from "../plantation/data/plantationSlots";
import { CLUB_LEVELS, getClubLevel } from "../club/clubProgression";
import { MARIA_TRUST_LEVELS } from "../maria-ivanovna/mariaProgression";
import { plantsBySeed } from "../plantation/data/plants";
import { CROP_IDS, createEmptyCropInventory, createEmptySeedInventory } from "../plantation/data/crops";
import { seeds } from "../plantation/data/seeds";
import { SHOP_REFRESH_MS, createShopStock, shopItems } from "../shop/shopItems";
import { getHarvestYield, getQualityById, rollHarvestQuality } from "../plantation/data/harvestQuality";
import { POT_TYPES_BY_ID } from "../plantation/data/potTypes";
import { addQualityItems, createEmptyQualityInventory, getQualityAmount, getQualityTotal, removeAnyQuality, removeQualityItems } from "../plantation/data/qualityInventory";
import {
  migrateCareInventory,
  migrateCropInventory,
  migrateMariaQuestState,
  migratePlantCatalog,
  migratePotStates,
  migrateQualityInventory,
  migrateSeedInventory,
  migrateShopStock,
} from "../../core/migrations/gameStateMigrations";

import "./GameScreen.css";

const DEFAULT_GROW_TIME = 90;
const TUTORIAL_GROW_TIME = 8;
const INITIAL_COINS = 40;

const STAGE_WIDTH = 390;
const STAGE_HEIGHT = 844;
const INVENTORY_SLOT_LIMIT = 20;
const LAST_SEEN_STORAGE_KEY = "growapp-last-seen-at";
const OFFLINE_NOTICE_THRESHOLD_MS = 60_000;


function createPotState(index) {
  return {
    unlocked: false,
    growStep: 0,
    selectedSeedId: null,
    growTime: DEFAULT_GROW_TIME,
    timeLeft: DEFAULT_GROW_TIME,
    nextGrowthAt: null,
    careApplied: [],
    wateredStages: [],
    potTypeId: "soil",
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
    careApplied: [],
    wateredStages: [],
    potTypeId: "soil",
  };
}

function migrateReleaseCoins(value) {
  const coins = Math.max(0, Math.floor(Number(value) || 0));
  return coins >= 5_000 ? INITIAL_COINS : coins;
}

function GameScreen() {
  const [currentPotIndex, setCurrentPotIndex] = useState(0);
  const clubReputation = useClubReputation();
  const clubLevel = getClubLevel(clubReputation);

  const [tutorialStep, setTutorialStep] = usePersistentState(
    "growapp-tutorial-step",
    "intro",
  );

  const [potStates, setPotStates] = usePersistentState(
    "growapp-pot-states",
    createInitialPotStates,
    { migrate: migratePotStates },
  );

  const [inventory, setInventory] = usePersistentState(
    "growapp-inventory",
    createEmptyCropInventory,
    { migrate: migrateCropInventory },
  );

  const [seedInventory, setSeedInventory] = usePersistentState(
    "growapp-seed-inventory",
    createEmptySeedInventory,
    { migrate: migrateSeedInventory },
  );

  const [careInventory, setCareInventory] = usePersistentState(
    "growapp-care-inventory",
    { wateringCan: 0, nutrition: 0, mariaMix: 0 },
    { migrate: migrateCareInventory },
  );

  const [shopStock, setShopStock] = usePersistentState(
    "growapp-shop-stock",
    createShopStock,
    { migrate: (value) => ({ ...createShopStock(), ...migrateShopStock(value) }) },
  );

  const [shopRefreshAt, setShopRefreshAt] = usePersistentState(
    "growapp-shop-refresh-at",
    () => Date.now() + SHOP_REFRESH_MS,
  );

  const [, setShopClock] = useState(Date.now());

  const [coins, setCoins] = usePersistentState(
    "growapp-coins",
    INITIAL_COINS,
    { migrate: migrateReleaseCoins },
  );

  const [mariaQuestState, setMariaQuestState] = usePersistentState(
    "growapp-maria-ivanovna-quests",
    {
      completedQuestIds: [],
      trust: 0,
      clubSales: createEmptyCropInventory(),
      careUses: { water: 0, nutrition: 0, mariaMix: 0 },
    },
    {
      legacyKeys: ["growapp-joe-quests"],
      migrate: migrateMariaQuestState,
    },
  );

  const [plantCatalog, setPlantCatalog] = usePersistentState(
    "growapp-plant-catalog",
    {},
    { migrate: migratePlantCatalog },
  );

  const [qualityInventory, setQualityInventory] = usePersistentState(
    "growapp-quality-inventory",
    createEmptyQualityInventory,
    { migrate: migrateQualityInventory },
  );

  const potStatesRef = useRef(potStates);
  potStatesRef.current = potStates;
  const initialLastSeenRef = useRef(0);
  if (initialLastSeenRef.current === 0) {
    try {
      initialLastSeenRef.current = Math.max(0, Number(localStorage.getItem(LAST_SEEN_STORAGE_KEY)) || 0);
    } catch {
      initialLastSeenRef.current = 0;
    }
  }
  const [offlineReadyCount, setOfflineReadyCount] = useState(0);

  const [unlockQueue, setUnlockQueue] = useState([]);
  const previousMariaTrustRef = useRef(null);
  const previousClubReputationRef = useRef(null);

  const [activeScreen, setActiveScreen] = useState("plantation");
  const {
    viewportRef,
    scale: stageScale,
    stageCenterY,
    cropX,
    cropY,
    visibleWidth,
    visibleHeight,
  } = useResponsiveStage(
    STAGE_WIDTH,
    STAGE_HEIGHT,
  );

  const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);
  const [selectedSeed, setSelectedSeed] = useState(null);

  const [isRemoveModalOpen, setIsRemoveModalOpen] =
    useState(false);

  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isCareModalOpen, setIsCareModalOpen] = useState(false);
  const [isInventoryFullModalOpen, setIsInventoryFullModalOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isPotTypeModalOpen, setIsPotTypeModalOpen] = useState(false);
  const [potTypeMode, setPotTypeMode] = useState("change");
  const [harvestResult, setHarvestResult] = useState(null);

  const [flyingLootItems, setFlyingLootItems] = useState([]);

  const [pendingSlotIndex, setPendingSlotIndex] =
    useState(null);

  const [isUnavailableModalOpen, setIsUnavailableModalOpen] =
    useState(false);
  const [isResetProgressModalOpen, setIsResetProgressModalOpen] =
    useState(false);


  useEffect(() => {
    const currentTrust = Math.max(0, Number(mariaQuestState?.trust) || 0);
    const previousTrust = previousMariaTrustRef.current;

    if (previousTrust === null) {
      previousMariaTrustRef.current = currentTrust;
      return;
    }

    if (currentTrust > previousTrust) {
      const unlockedLevels = MARIA_TRUST_LEVELS.filter(
        (level) =>
          level.level > 0 &&
          level.required > previousTrust &&
          level.required <= currentTrust,
      );

      if (unlockedLevels.length > 0) {
        setUnlockQueue((queue) => [
          ...queue,
          ...unlockedLevels.map((level) => ({
            id: `maria-${level.level}-${Date.now()}`,
            source: "maria",
            sourceLabel: "Путь ученика · Мария Ивановна",
            level: `${level.level} · ${level.title}`,
            icon: level.icon,
            title: level.unlockTitle || level.reward,
            description:
              level.unlockDescription ||
              `Мария Ивановна открыла для тебя: ${level.reward}.`,
            unlocks: level.unlocks || [level.reward],
          })),
        ]);
      }
    }

    previousMariaTrustRef.current = currentTrust;
  }, [mariaQuestState?.trust]);

  useEffect(() => {
    const currentReputation = Math.max(0, Number(clubReputation) || 0);
    const previousReputation = previousClubReputationRef.current;

    if (previousReputation === null) {
      previousClubReputationRef.current = currentReputation;
      return;
    }

    if (currentReputation > previousReputation) {
      const unlockedLevels = CLUB_LEVELS.filter(
        (level) =>
          level.level > 1 &&
          level.required > previousReputation &&
          level.required <= currentReputation,
      );

      if (unlockedLevels.length > 0) {
        const clubUnlocks = {
          2: [
            "+5% к клубным ценам",
            "Новый статус поставщика",
          ],
          3: [
            "Второе место под ведро",
            "+10% к клубным ценам",
          ],
          4: [
            "+15% к клубным ценам",
            "Статус звезды клуба",
          ],
          5: [
            "Третье место под ведро",
            "+20% к клубным ценам",
          ],
        };

        setUnlockQueue((queue) => [
          ...queue,
          ...unlockedLevels.map((level) => ({
            id: `club-${level.level}-${Date.now()}`,
            source: "club",
            sourceLabel: "Репутация клуба",
            level: `${level.level} · ${level.title}`,
            icon: level.level >= 4 ? "★" : "♣",
            title: level.reward,
            description:
              "Клуб повысил твой статус. Район начинает относиться к твоим поставкам серьёзнее.",
            unlocks: clubUnlocks[level.level] || [level.reward],
          })),
        ]);
      }
    }

    previousClubReputationRef.current = currentReputation;
  }, [clubReputation]);

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
      "open-maria-house": ["open-maria-house"],
      "open-maria-board": ["open-maria-board"],
      "claim-first-quest": ["claim-first-quest"],
      "onboarding-finish": ["continue"],
    };

    return (allowedByStep[tutorialStep] || []).includes(action);
  };

  usePotGrowth(setPotStates, DEFAULT_GROW_TIME);

  useEffect(() => {
    const saveLastSeen = () => {
      try {
        localStorage.setItem(LAST_SEEN_STORAGE_KEY, String(Date.now()));
      } catch {
        // Игра продолжает работать без localStorage.
      }
    };

    const checkTimer = window.setTimeout(() => {
      const awayFor = Date.now() - initialLastSeenRef.current;
      if (initialLastSeenRef.current <= 0 || awayFor < OFFLINE_NOTICE_THRESHOLD_MS) return;

      const readyCount = (potStatesRef.current || []).filter(
        (potState) => potState?.unlocked && potState.growStep === 3,
      ).length;

      if (readyCount > 0) {
        setOfflineReadyCount(readyCount);
        triggerTelegramNotification("success");
      }
    }, 1200);

    const heartbeat = window.setInterval(saveLastSeen, 30_000);
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") saveLastSeen();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", saveLastSeen);

    return () => {
      window.clearTimeout(checkTimer);
      window.clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", saveLastSeen);
      saveLastSeen();
    };
  }, []);

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

    if (
      tutorialStep === "district-finish" ||
      tutorialStep === "open-maria-house"
    ) {
      setActiveScreen("district");
      setIsSeedModalOpen(false);
      setSelectedSeed(null);
      return;
    }

    if (
      tutorialStep === "open-maria-board" ||
      tutorialStep === "claim-first-quest" ||
      tutorialStep === "onboarding-finish"
    ) {
      setActiveScreen("maria-house");
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
    setPendingSlotIndex(null);
    setIsUnavailableModalOpen(false);

    if (tutorialStep === "choose-seed") {
      setSelectedSeed(null);
      setIsSeedModalOpen(true);
      return;
    }

    if (tutorialStep === "plant-seed") {
      const tutorialSeed =
        seeds.find((seed) => seed.id === "tabakko") || null;

      setSelectedSeed(tutorialSeed);
      setIsSeedModalOpen(true);
      return;
    }

    setIsSeedModalOpen(false);
    setSelectedSeed(null);
  }, [isTutorialActive, tutorialStep]);

  useEffect(() => {
    setQualityInventory((previous) => {
      let next = previous || {};
      let changed = false;
      for (const itemId of CROP_IDS) {
        const total = Math.max(0, Number(inventory[itemId]) || 0);
        const qualityTotal = getQualityTotal(next, itemId);
        if (total > qualityTotal) {
          next = addQualityItems(next, itemId, "normal", total - qualityTotal);
          changed = true;
        }
      }
      return changed ? next : previous;
    });
  }, [inventory, setQualityInventory]);

  useEffect(() => {
    setShopStock((previous) => {
      const generated = createShopStock();
      let changed = false;
      const next = { ...previous };
      for (const item of shopItems) {
        if (!Number.isFinite(Number(next[item.id]))) {
          next[item.id] = generated[item.id];
          changed = true;
        }
      }
      return changed ? next : previous;
    });
  }, [setShopStock]);

  useEffect(() => {
    const refreshShop = () => {
      const now = Date.now();
      setShopClock(now);
      if (now >= Number(shopRefreshAt || 0)) {
        setShopStock(createShopStock());
        setShopRefreshAt(now + SHOP_REFRESH_MS);
      }
    };

    refreshShop();
    const timer = window.setInterval(refreshShop, 1000);
    return () => window.clearInterval(timer);
  }, [shopRefreshAt, setShopRefreshAt, setShopStock]);

  const readyPlantCount = potStates.filter(
    (potState) => potState?.unlocked && potState.growStep === 3,
  ).length;

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

  const currentPotType = POT_TYPES_BY_ID[currentPotState.potTypeId] || POT_TYPES_BY_ID.soil;
  const displayPot = { ...currentPot, name: currentPotType.name, image: currentPotType.image, icon: currentPotType.icon };

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

  const availableSeedsForCurrentPot = seeds.filter((seed) =>
    (seed.seedType || "plant") === currentPotType.seedType &&
    (mariaQuestState.trust || 0) >= (seed.requiredTrust || 0)
  );

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
    setPotTypeMode("purchase");
    setIsPotTypeModalOpen(true);
  };

  const choosePendingSlotType = (potTypeId) => {
    if (pendingSlotIndex === null) return;
    const slot = plantationSlots[pendingSlotIndex];
    const slotState = getPlantationSlotState(slot, clubLevel, Boolean(potStates[pendingSlotIndex]?.unlocked));
    const type = POT_TYPES_BY_ID[potTypeId];
    if (!type || (mariaQuestState.trust || 0) < type.requiredTrust || !slotState.canBuy || slot.unlockPrice === null || coins < slot.unlockPrice) return;
    setCoins((value) => value - slot.unlockPrice);
    setPotStates((states) => states.map((state,index)=> index===pendingSlotIndex ? { ...createEmptyPotState(true), potTypeId } : state));
    setPendingSlotIndex(null);
    setIsPotTypeModalOpen(false);
  };

  const openPotTypeChange = () => {
    if (!isCurrentPotUnlocked || growStep !== 0 || isTutorialActive) return;
    setPotTypeMode("change");
    setIsPotTypeModalOpen(true);
  };

  const chooseCurrentPotType = (potTypeId) => {
    const type = POT_TYPES_BY_ID[potTypeId];
    if (!type || (mariaQuestState.trust || 0) < type.requiredTrust || growStep !== 0) return;
    updateCurrentPotState({ potTypeId });
    setIsPotTypeModalOpen(false);
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

    if (tutorialStep === "choose-seed" && seed?.id !== "tabakko") {
      return;
    }

    setSelectedSeed(seed);

    if (
      tutorialStep === "choose-seed" &&
      seed?.id === "tabakko"
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

    if ((selectedSeed.seedType || "plant") !== currentPotType.seedType) return;

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
      tutorialStep === "plant-seed"
        ? TUTORIAL_GROW_TIME
        : selectedSeed.growTime || DEFAULT_GROW_TIME;

    triggerTelegramHaptic("light");

    updateCurrentPotState({
      unlocked: true,
      growStep: 1,
      selectedSeedId: seedId,
      growTime,
      timeLeft: growTime,
      nextGrowthAt: Date.now() + growTime * 1000,
      careApplied: [],
      wateredStages: [],
    });

    closeSeedModal();

    if (tutorialStep === "plant-seed") {
      setTutorialStep("growing");
    }
  };

  const applyPlantCare = (careType) => {
    if (growStep <= 0 || growStep >= 3) {
      return;
    }

    const appliedCare = Array.isArray(currentPotState.careApplied)
      ? currentPotState.careApplied
      : currentPotState.careApplied
        ? [currentPotState.careApplied]
        : [];

    const wateredStages = Array.isArray(currentPotState.wateredStages)
      ? currentPotState.wateredStages
          .map(Number)
          .filter((stage) => stage === 1 || stage === 2)
      : [];

    if (careType === "water") {
      if ((careInventory.wateringCan || 0) <= 0) {
        return;
      }

      if (wateredStages.includes(growStep)) {
        return;
      }

      if (!currentPotState.nextGrowthAt) {
        return;
      }

      const now = Date.now();
      const stageDurationMs = Math.max(
        1000,
        (Number(currentPotState.growTime) || DEFAULT_GROW_TIME) * 1000,
      );
      const reductionMs = Math.round(stageDurationMs * 0.2);
      const nextGrowthAt = Math.max(
        now,
        Number(currentPotState.nextGrowthAt) - reductionMs,
      );

      updateCurrentPotState({
        wateredStages: [...wateredStages, growStep],
        nextGrowthAt,
        timeLeft: Math.max(0, Math.ceil((nextGrowthAt - now) / 1000)),
      });
    } else {
      if (appliedCare.includes(careType)) {
        return;
      }

      if ((careInventory[careType] || 0) <= 0) {
        return;
      }

      updateCurrentPotState({
        careApplied: [...appliedCare, careType],
      });

      setCareInventory((previous) => ({
        ...previous,
        [careType]: Math.max(0, (previous[careType] || 0) - 1),
      }));
    }

    triggerTelegramHaptic("medium");

    setMariaQuestState((previousState) => ({
      ...previousState,
      careUses: {
        water: previousState?.careUses?.water || 0,
        nutrition: previousState?.careUses?.nutrition || 0,
        mariaMix: previousState?.careUses?.mariaMix || 0,
        [careType]: (previousState?.careUses?.[careType] || 0) + 1,
      },
    }));
  };

  const getOccupiedInventorySlots = () => {
    let occupied = 0;
    Object.values(qualityInventory || {}).forEach((qualities) => {
      Object.values(qualities || {}).forEach((amount) => {
        if ((Number(amount) || 0) > 0) occupied += 1;
      });
    });
    return occupied;
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

    const isTutorialHarvest =
      tutorialStep === "collect" && plantedSeedId === "tabakko";
    const quality = isTutorialHarvest
      ? getQualityById("normal")
      : rollHarvestQuality(currentPotState.careApplied || []);
    const reward = isTutorialHarvest
      ? 3
      : getHarvestYield(currentPotState.careApplied || [], quality.id);

    const seedData = seeds.find((seed) => seed.id === plantedSeedId);
    const harvestItemId = seedData?.harvestItemId || plantedSeedId || "tabakko";
    const itemName = seedData?.name || "Урожай";
    const itemIcon = seedData?.icon || "🌱";
    const previousRecord = plantCatalog[harvestItemId] || {};
    const firstDiscovery = !(previousRecord.qualities?.[quality.id] > 0);
    const existingQualityStack = getQualityAmount(qualityInventory, harvestItemId, quality.id) > 0;
    const occupiedInventorySlots = getOccupiedInventorySlots();

    if (!existingQualityStack && occupiedInventorySlots >= INVENTORY_SLOT_LIMIT) {
      setIsInventoryFullModalOpen(true);
      return;
    }

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
      [harvestItemId]: (previousInventory[harvestItemId] || 0) + reward,
    }));
    setQualityInventory((previous) => addQualityItems(previous, harvestItemId, quality.id, reward));

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

    triggerTelegramNotification("success");

    setHarvestResult({
      itemId: harvestItemId,
      itemName,
      itemIcon,
      amount: reward,
      quality,
      firstDiscovery,
    });

    updateCurrentPotState({ ...createEmptyPotState(true), potTypeId: currentPotState.potTypeId || "soil" });

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

    updateCurrentPotState({ ...createEmptyPotState(true), potTypeId: currentPotState.potTypeId || "soil" });

    setIsRemoveModalOpen(false);
  };

  const deleteQualityItem = (itemId, qualityId, count) => {
    const safe = Math.max(0, Math.floor(Number(count) || 0));
    setQualityInventory((previous) => removeQualityItems(previous, itemId, qualityId, safe));
    setInventory((previous) => ({ ...previous, [itemId]: Math.max(0, (previous[itemId] || 0) - safe) }));
  };

  const deleteSeedItem = (itemId, count) => {
    const seed = seeds.find((item) => item.id === itemId);
    if (!seed || seed.infinite) return;

    const safe = Math.max(0, Math.floor(Number(count) || 0));
    if (safe <= 0) return;

    setSeedInventory((previous) => ({
      ...previous,
      [itemId]: Math.max(0, (previous[itemId] || 0) - safe),
    }));
  };

  const deleteCareItem = (itemId, count) => {
    const safe = Math.max(0, Math.floor(Number(count) || 0));
    if (safe <= 0 || itemId === "wateringCan") return;

    setCareInventory((previous) => ({
      ...previous,
      [itemId]: Math.max(0, (previous[itemId] || 0) - safe),
    }));
  };

  const openClub = () => {
    if (isTutorialActive) {
      return;
    }

    setActiveScreen("club");
  };

  const openShop = () => {
    if (isTutorialActive) {
      return;
    }

    setActiveScreen("shop");
  };

  const openMariaHouse = () => {
    if (!tutorialAllows("open-maria-house")) {
      return;
    }

    setActiveScreen("maria-house");

    if (tutorialStep === "open-maria-house") {
      setTutorialStep("open-maria-board");
    }
  };

  const goBackToDistrict = () => {
    if (isTutorialActive) {
      return;
    }

    setActiveScreen("district");
  };

  const buyShopItem = (item, amount) => {
    if (!item) {
      return {
        success: false,
        message: "Товар не найден.",
      };
    }

    const requestedAmount = item.type === "tool"
      ? 1
      : Math.floor(Number(amount));

    if (
      !Number.isFinite(requestedAmount) ||
      requestedAmount <= 0
    ) {
      return {
        success: false,
        message: "Выбери количество товара.",
      };
    }

    if (item.type === "tool" && (careInventory[item.id] || 0) > 0) {
      return {
        success: false,
        message: "Этот инструмент уже куплен.",
      };
    }

    const availableStock =
      shopStock[item.id] || 0;

    if (requestedAmount > availableStock) {
      return {
        success: false,
        message: "У Зорика нет столько товара.",
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
    triggerTelegramHaptic("medium");

    setShopStock((previousStock) => ({
      ...previousStock,
      [item.id]: Math.max(
        0,
        (previousStock[item.id] || 0) -
          requestedAmount,
      ),
    }));

    if (item.type === "tool") {
      setCareInventory((previousInventory) => ({
        ...previousInventory,
        [item.id]: 1,
      }));
    } else if (item.type === "care") {
      setCareInventory((previousInventory) => ({
        ...previousInventory,
        [item.id]: (previousInventory[item.id] || 0) + requestedAmount,
      }));
    } else {
      setSeedInventory((previousInventory) => ({
        ...previousInventory,
        [item.id]: (previousInventory[item.id] || 0) + requestedAmount,
      }));
    }

    return {
      success: true,
      message: item.type === "tool"
        ? `Куплено: ${item.name}. Инструмент останется у тебя навсегда.`
        : `Куплено: ${item.name} — ${requestedAmount} шт.`,
    };
  };

  const deliverMariaItems = ({ itemId, amount }) => {
    const safeAmount = Math.max(0, Math.floor(Number(amount) || 0));

    if (!itemId || safeAmount <= 0) {
      return false;
    }

    const availableAmount = inventory[itemId] || 0;

    if (availableAmount < safeAmount) {
      return false;
    }

    setInventory((previousInventory) => ({ ...previousInventory, [itemId]: Math.max(0, (previousInventory[itemId] || 0) - safeAmount) }));
    setQualityInventory((previous) => removeAnyQuality(previous, itemId, safeAmount).next);

    return true;
  };

  const claimMariaReward = ({ coins: coinReward }) => {
    const safeCoins = Math.max(0, Math.floor(Number(coinReward) || 0));

    if (safeCoins > 0) {
      setCoins((previousCoins) => previousCoins + safeCoins);
    }
  };

  const handleClubSaleForMaria = ({ itemId, amount }) => {
    const safeAmount = Math.max(0, Math.floor(Number(amount) || 0));

    if (!itemId || safeAmount <= 0) {
      return;
    }

    setMariaQuestState((previousState) => ({
      ...previousState,
      clubSales: {
        ...(previousState?.clubSales || {}),
        [itemId]: (previousState?.clubSales?.[itemId] || 0) + safeAmount,
      },
    }));
  };


  return (
    <div className={`game-screen game-screen--${activeScreen}`}>
      <div className="game-viewport" ref={viewportRef}>
        <div
          className="game-stage"
          style={{
            "--stage-scale": stageScale,
            "--stage-center-y": `${stageCenterY}px`,
            "--visible-left": `${cropX}px`,
            "--visible-right": `${cropX}px`,
            "--visible-top": `${cropY}px`,
            "--visible-bottom": `${cropY}px`,
            "--visible-width": `${visibleWidth}px`,
            "--visible-height": `${visibleHeight}px`,
          }}
        >
        {activeScreen === "plantation" && (
          <>
            <div className="background" />

            <div className="top-wallet">
              {coins}
            </div>

            <button
              type="button"
              className="progress-reset-button"
              onClick={() => {
                triggerTelegramHaptic("medium");
                setIsResetProgressModalOpen(true);
              }}
              aria-label="Сбросить прогресс и начать игру заново"
            >
              <span className="progress-reset-button__icon" aria-hidden="true">↻</span>
              <span>Сброс</span>
            </button>

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
                  pot={displayPot}
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
                  wateredStages={currentPotState.wateredStages}
                  hasWateringCan={(careInventory.wateringCan || 0) > 0}
                  canCare={!isTutorialActive && growStep > 0 && growStep < 3}
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
              seeds={availableSeedsForCurrentPot}
              seedInventory={seedInventory}
              selectedSeed={selectedSeed}
              onSelectSeed={selectSeed}
              onPlantSeed={plantSelectedSeed}
              onClose={closeSeedModal}
              tutorialStep={tutorialStep}
              potTypeName={currentPotType.name}
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
              qualityInventory={qualityInventory}
              seedInventory={seedInventory}
              careInventory={careInventory}
              appliedCare={Array.isArray(currentPotState.careApplied) ? currentPotState.careApplied : []}
              canPlantSeed={isCurrentPotUnlocked && growStep === 0}
              canUseCare={growStep > 0 && growStep < 3}
              onPlantSeed={(cropId) => {
                const seed = seeds.find((item) => item.id === cropId);
                if (!seed || !isCurrentPotUnlocked || growStep !== 0) return;
                setSelectedSeed(seed);
                setIsInventoryOpen(false);
                setIsSeedModalOpen(true);
              }}
              onUseCare={(careType) => {
                if (growStep <= 0 || growStep >= 3) return;
                applyPlantCare(careType);
                setIsInventoryOpen(false);
              }}
              onClose={() => setIsInventoryOpen(false)}
              onDeleteQualityItem={deleteQualityItem}
              onDeleteSeedItem={deleteSeedItem}
              onDeleteCareItem={deleteCareItem}
            />

            <HarvestCareModal
              isOpen={isCareModalOpen}
              trust={mariaQuestState.trust || 0}
              careInventory={careInventory}
              appliedCare={currentPotState.careApplied}
              wateredStages={currentPotState.wateredStages}
              currentStage={growStep}
              canApplyCare={growStep > 0 && growStep < 3}
              onChoose={applyPlantCare}
              onRemovePlant={() => {
                setIsCareModalOpen(false);
                setIsRemoveModalOpen(true);
              }}
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

            <PotTypeModal
              isOpen={isPotTypeModalOpen}
              trust={mariaQuestState.trust || 0}
              title={potTypeMode === "purchase" ? "Купить место и установить ведро" : "Гидропонное ведро"}
              description={potTypeMode === "purchase" ? "На верхней плантации используются только растительные гидропонные вёдра." : "Грибные ёмкости появятся позже вместе с отдельным подвалом."}
              price={potTypeMode === "purchase" ? pendingSlot?.unlockPrice ?? null : null}
              coins={coins}
              onChoose={potTypeMode === "purchase" ? choosePendingSlotType : chooseCurrentPotType}
              onClose={() => { setIsPotTypeModalOpen(false); if (potTypeMode === "purchase") setPendingSlotIndex(null); }}
            />

            <ActionModal
              isOpen={isInventoryFullModalOpen}
              title="Рюкзак переполнен"
              description="Для урожая нового качества нет свободной ячейки. Удали или продай одну стопку, затем вернись и собери растение."
              confirmText="Открыть инвентарь"
              cancelText="Оставить урожай"
              onConfirm={() => {
                setIsInventoryFullModalOpen(false);
                setIsInventoryOpen(true);
              }}
              onCancel={() => setIsInventoryFullModalOpen(false)}
            />

            <ActionModal
              isOpen={offlineReadyCount > 0}
              title="Пока тебя не было"
              description={`Созрело растений: ${offlineReadyCount}. Они ждали тебя и не пропали.`}
              confirmText="Проверить растения"
              cancelText="Позже"
              onConfirm={() => {
                setOfflineReadyCount(0);
                setActiveScreen("plantation");
              }}
              onCancel={() => setOfflineReadyCount(0)}
            />

            <ActionModal
              isOpen={isResetProgressModalOpen}
              title="Начать игру заново?"
              description="Будут удалены монеты, растения, предметы, задания, репутация и обучение. Покупки поддержки сохранятся. Отменить действие после подтверждения нельзя."
              confirmText="Сбросить прогресс"
              cancelText="Оставить как есть"
              danger
              onConfirm={() => {
                triggerTelegramNotification("warning");
                requestGameProgressReset();
              }}
              onCancel={() => setIsResetProgressModalOpen(false)}
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

          </>
        )}

        {activeScreen === "district" && (
          <DistrictScreen
            onOpenClub={openClub}
            onOpenShop={openShop}
            onOpenMariaHouse={openMariaHouse}
            showMariaNotice={(mariaQuestState.completedQuestIds || []).length < MARIA_QUESTS.length}
          />
        )}

        {activeScreen === "maria-house" && (
          <MariaHouseScreen
            inventory={inventory}
            seedInventory={seedInventory}
            careInventory={careInventory}
            clubReputation={clubReputation}
            questState={mariaQuestState}
            plantCatalog={plantCatalog}
            onQuestStateChange={setMariaQuestState}
            onDeliverItems={deliverMariaItems}
            onRewardClaimed={claimMariaReward}
            onBack={goBackToDistrict}
            tutorialStep={tutorialStep}
            onTutorialAction={(action) => {
              if (
                action === "open-maria-board" &&
                tutorialStep === "open-maria-board"
              ) {
                setTutorialStep("claim-first-quest");
              }

              if (
                action === "claim-first-quest" &&
                tutorialStep === "claim-first-quest"
              ) {
                setTutorialStep("onboarding-finish");
              }
            }}
          />
        )}

        {activeScreen === "shop" && (
          <ShopScreen
            onGoBack={goBackToDistrict}
            items={shopItems}
            stock={shopStock}
            coins={coins}
            seedInventory={seedInventory}
            careInventory={careInventory}
            clubReputation={clubReputation}
            mariaTrust={mariaQuestState.trust || 0}
            refreshAt={shopRefreshAt}
            onBuy={buyShopItem}
          />
        )}

        {activeScreen === "club" && (
          <ClubScreen
            inventory={inventory}
            setInventory={setInventory}
            qualityInventory={qualityInventory}
            setQualityInventory={setQualityInventory}
            coins={coins}
            setCoins={setCoins}
            onSaleCompleted={handleClubSaleForMaria}
            onGoBack={goBackToDistrict}
          />
        )}


        {activeScreen === "support" && (
          <SupportScreen onGoBack={() => setActiveScreen("district")} />
        )}

        {activeScreen !== "shop" &&
          activeScreen !== "club" &&
          activeScreen !== "maria-house" && (
            <BottomMenu
              activeScreen={activeScreen}
              tutorialStep={tutorialStep}
              onGoPlantation={() => {
                if (isTutorialActive) {
                  return;
                }

                setActiveScreen("plantation");
              }}
              onGoDistrict={() => {
                if (!tutorialAllows("go-district")) {
                  return;
                }

                setActiveScreen("district");

                if (tutorialStep === "go-district") {
                  setTutorialStep("district-finish");
                }
              }}
              readyPlants={readyPlantCount}
              onGoSupport={() => {
                if (isTutorialActive) {
                  return;
                }

                setActiveScreen("support");
              }}
            />
          )}

        <UnlockCelebration
          notification={unlockQueue[0] || null}
          queuedCount={Math.max(0, unlockQueue.length - 1)}
          onClose={() => setUnlockQueue((queue) => queue.slice(1))}
        />

        {!isResetProgressModalOpen && (
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
              setTutorialStep("open-maria-house");
              return;
            }

            if (tutorialStep === "onboarding-finish") {
              setTutorialStep("completed");
            }
          }}
        />
        )}
        </div>
      </div>
    </div>
  );
}

export default GameScreen;