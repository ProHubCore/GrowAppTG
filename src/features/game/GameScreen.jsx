import { useEffect, useMemo, useRef, useState } from "react";

import PlantArea from "../plantation/components/PlantArea";
import BottomMenu from "../../shared/components/BottomMenu/BottomMenu";
import PremiumWallet from "../../shared/components/PremiumWallet/PremiumWallet";
import SeedModal from "../plantation/components/SeedModal";
import RemovePlantModal from "../plantation/components/RemovePlantModal";
import BackpackTool from "../inventory/components/BackpackTool";
import InventoryModal from "../inventory/components/InventoryModal";
import FlyingLoot from "../plantation/components/FlyingLoot";
import DistrictScreen from "../district/DistrictScreen";
import ShopScreen from "../shop/ShopScreen";
import ClubScreen from "../club/ClubScreen";
import MariaHouseScreen from "../maria-ivanovna/MariaHouseScreen";
import { MARIA_QUESTS } from "../maria-ivanovna/mariaQuests";
import ActionModal from "../../shared/components/ActionModal/ActionModal";
import UnlockCelebration from "../progression/components/UnlockCelebration";
import SupportScreen from "../support/SupportScreen";
import CoinBankScreen from "../support/CoinBankScreen";
import { formatCompactNumber } from "../support/storePackages";
import {
  fetchSecurePlayerProfile,
  spendPremiumCurrency,
} from "../support/starsPayments";
import HarvestCareModal from "../plantation/components/HarvestCareModal";
import HarvestResultModal from "../plantation/components/HarvestResultModal";
import LockedSlotModal from "../plantation/components/LockedSlotModal";
import ReadyHarvestModal from "../plantation/components/ReadyHarvestModal";
import InstantGrowModal from "../plantation/components/InstantGrowModal";
import ResetProgressModal from "./components/ResetProgressModal";
import PlantCatalogModal from "../catalog/components/PlantCatalogModal";
import PotTypeModal from "../plantation/components/PotTypeModal";
import TutorialOverlay from "../tutorial/TutorialOverlay";
import ContextOfferModal from "../monetization/ContextOfferModal";
import DailyRewardModal from "../monetization/DailyRewardModal";
import {
  applySaleToDailyOrder,
  claimDailyLogin,
  createDailyOrder,
  normalizeDailyOrder,
  prepareDailyLogin,
} from "../monetization/dailyEngagement";
import { trackGameEvent, flushGameAnalytics } from "../../core/analytics/monetizationAnalytics";
import { pullProgressSnapshot, pushProgressSnapshot } from "../../core/cloud/gameCloud";
import usePersistentState from "../../core/hooks/usePersistentState";
import useResponsiveStage from "../../core/hooks/useResponsiveStage";
import usePotGrowth from "../plantation/hooks/usePotGrowth";
import useClubReputation from "../club/useClubReputation";
import {
  hasTelegramSession,
  triggerTelegramHaptic,
  triggerTelegramNotification,
} from "../../core/telegram";
import {
  requestGameProgressReset,
  SKIP_CLOUD_RESTORE_ONCE_KEY,
} from "../../core/bootstrap/prepareReleaseState";
import {
  PREMIUM_CURRENCY,
  PREMIUM_PRICES,
  getInstantGrowCost,
  normalizePremiumBalance,
} from "../../core/economy/premiumCurrency";

import { pots } from "../plantation/data/pots";
import {
  getPlantationSlotState,
  plantationSlots,
} from "../plantation/data/plantationSlots";
import {
  CLUB_LEVELS,
  getClubLevel,
  writeClubReputation,
} from "../club/clubProgression";
import { MARIA_TRUST_LEVELS } from "../maria-ivanovna/mariaProgression";
import { plantsBySeed } from "../plantation/data/plants";
import {
  CROP_IDS,
  createEmptyCropInventory,
  createEmptySeedInventory,
} from "../plantation/data/crops";
import { seeds } from "../plantation/data/seeds";
import { SHOP_REFRESH_MS, createShopStock, shopItems } from "../shop/shopItems";
import {
  getHarvestYield,
  getQualityById,
  rollHarvestQuality,
} from "../plantation/data/harvestQuality";
import { POT_TYPES_BY_ID } from "../plantation/data/potTypes";
import {
  addQualityItems,
  createEmptyQualityInventory,
  getQualityAmount,
  getQualityTotal,
  removeAnyQuality,
  removeQualityItems,
} from "../plantation/data/qualityInventory";
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
const TUTORIAL_GROW_TIME = 5;
const INITIAL_COINS = 24;

const STAGE_WIDTH = 390;
const STAGE_HEIGHT = 844;
const INVENTORY_SLOT_LIMIT = 20;
const LAST_SEEN_STORAGE_KEY = "growapp-last-seen-at";
const OFFLINE_NOTICE_THRESHOLD_MS = 60_000;

function createPotState() {
  return {
    unlocked: false,
    growStep: 0,
    selectedSeedId: null,
    growTime: DEFAULT_GROW_TIME,
    timeLeft: 0,
    nextGrowthAt: null,
    harvestAt: null,
    careApplied: [],
    wateredStages: [],
    potTypeId: "soil",
    growthTimingVersion: 2,
  };
}

function createInitialPotStates() {
  return pots.map(() => createPotState());
}

function createEmptyPotState(unlocked) {
  return {
    unlocked,
    growStep: 0,
    selectedSeedId: null,
    growTime: DEFAULT_GROW_TIME,
    timeLeft: 0,
    nextGrowthAt: null,
    harvestAt: null,
    careApplied: [],
    wateredStages: [],
    potTypeId: "soil",
    growthTimingVersion: 2,
  };
}

function normalizeCoins(value) {
  return Math.max(0, Math.floor(Number(value) || 0));
}

function formatGrowthTime(seconds) {
  const safe = Math.max(0, Math.ceil(Number(seconds) || 0));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;

  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function readLastSeenAt() {
  try {
    return Math.max(
      0,
      Number(localStorage.getItem(LAST_SEEN_STORAGE_KEY)) || 0,
    );
  } catch {
    return 0;
  }
}

function consumeSkipCloudRestoreOnce() {
  try {
    const shouldSkip = localStorage.getItem(SKIP_CLOUD_RESTORE_ONCE_KEY) === "1";
    if (shouldSkip) localStorage.removeItem(SKIP_CLOUD_RESTORE_ONCE_KEY);
    return shouldSkip;
  } catch {
    return false;
  }
}

function getTutorialScreen(step) {
  if (step === "district-finish" || step === "open-maria-house") {
    return "district";
  }

  if (
    step === "open-maria-board" ||
    step === "claim-first-quest" ||
    step === "onboarding-finish"
  ) {
    return "maria-house";
  }

  return "plantation";
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
    { nutrition: 0, mariaMix: 0, acidWater: 1 },
    { migrate: migrateCareInventory },
  );

  const [shopStock, setShopStock] = usePersistentState(
    "growapp-shop-stock",
    createShopStock,
    {
      migrate: (value) => ({
        ...createShopStock(),
        ...migrateShopStock(value),
      }),
    },
  );

  const [shopRefreshAt, setShopRefreshAt] = usePersistentState(
    "growapp-shop-refresh-at",
    () => Date.now() + SHOP_REFRESH_MS,
  );

  const [shopClock, setShopClock] = useState(() => Date.now());

  const [coins, setCoins] = usePersistentState("growapp-coins", INITIAL_COINS, {
    migrate: normalizeCoins,
  });

  const [premiumCoins, setPremiumCoins] = usePersistentState(
    PREMIUM_CURRENCY.storageKey,
    PREMIUM_CURRENCY.demoStartingBalance,
    { migrate: normalizePremiumBalance },
  );

  const [ownedProducts, setOwnedProducts] = usePersistentState(
    "growapp-owned-products-v1",
    [],
    { migrate: (value) => Array.isArray(value) ? [...new Set(value.map(String))] : [] },
  );

  const [ownedCosmetics, setOwnedCosmetics] = usePersistentState(
    "growapp-owned-cosmetics-v1",
    ["classic"],
    {
      migrate: (value) => {
        const items = Array.isArray(value) ? value.map(String) : [];
        return [...new Set(["classic", ...items])];
      },
    },
  );

  const [activeCosmetic, setActiveCosmetic] = usePersistentState(
    "growapp-active-cosmetic-v1",
    "classic",
    { migrate: (value) => String(value || "classic") },
  );

  const [monetizationMilestones, setMonetizationMilestones] = usePersistentState(
    "growapp-monetization-milestones-v1",
    { totalHarvests: 0, totalSales: 0, firstSaleOfferShown: false },
    {
      migrate: (value) => ({
        totalHarvests: Math.max(0, Number(value?.totalHarvests) || 0),
        totalSales: Math.max(0, Number(value?.totalSales) || 0),
        firstSaleOfferShown: Boolean(value?.firstSaleOfferShown),
      }),
    },
  );

  const [dailyLoginState, setDailyLoginState] = usePersistentState(
    "growapp-daily-login-v1",
    { streak: 0, lastClaimed: "" },
  );

  const [dailyOrder, setDailyOrder] = usePersistentState(
    "growapp-daily-order-v1",
    () => createDailyOrder({ unlockedCropIds: ["tabakko"] }),
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
  const [initialLastSeenAt] = useState(readLastSeenAt);
  const [skipCloudRestore] = useState(consumeSkipCloudRestoreOnce);
  const [offlineReadyCount, setOfflineReadyCount] = useState(0);

  useEffect(() => {
    potStatesRef.current = potStates;
  }, [potStates]);

  const [unlockQueue, setUnlockQueue] = useState([]);
  const previousMariaTrustRef = useRef(null);
  const previousClubReputationRef = useRef(null);

  const [activeScreen, setActiveScreen] = useState(() =>
    getTutorialScreen(tutorialStep),
  );
  const [bankReturnScreen, setBankReturnScreen] = useState("plantation");
  const [storeFocusProductId, setStoreFocusProductId] = useState(null);
  const [contextOffer, setContextOffer] = useState(null);
  const [dailyRewardPrepared, setDailyRewardPrepared] = useState(null);
  const [dailyRewardVisible, setDailyRewardVisible] = useState(false);
  const [cloudHydrated, setCloudHydrated] = useState(false);
  const {
    viewportRef,
    scale: stageScale,
    stageCenterY,
    cropX,
    cropY,
    visibleWidth,
    visibleHeight,
  } = useResponsiveStage(STAGE_WIDTH, STAGE_HEIGHT);

  const [isSeedModalOpen, setIsSeedModalOpen] = useState(
    () => tutorialStep === "choose-seed" || tutorialStep === "plant-seed",
  );
  const [selectedSeed, setSelectedSeed] = useState(() =>
    tutorialStep === "plant-seed"
      ? seeds.find((seed) => seed.id === "tabakko") || null
      : null,
  );

  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);

  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isCareModalOpen, setIsCareModalOpen] = useState(false);
  const [isInventoryFullModalOpen, setIsInventoryFullModalOpen] =
    useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isPotTypeModalOpen, setIsPotTypeModalOpen] = useState(false);
  const [harvestResult, setHarvestResult] = useState(null);

  const [flyingLootItems, setFlyingLootItems] = useState([]);
  const [harvestAnimation, setHarvestAnimation] = useState(null);
  const harvestAnimationTimersRef = useRef([]);

  useEffect(() => () => {
    harvestAnimationTimersRef.current.forEach((timerId) => {
      window.clearTimeout(timerId);
    });
    harvestAnimationTimersRef.current = [];
  }, []);

  const [pendingSlotIndex, setPendingSlotIndex] = useState(null);

  const [isUnavailableModalOpen, setIsUnavailableModalOpen] = useState(false);
  const [isResetProgressModalOpen, setIsResetProgressModalOpen] =
    useState(false);
  const [instantGrowRequest, setInstantGrowRequest] = useState(null);
  const [premiumSpendPending, setPremiumSpendPending] = useState(null);
  const [premiumSpendError, setPremiumSpendError] = useState("");

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
          2: ["Второй покупатель", "+5% к клубным ценам"],
          3: ["Коллекционеры качества", "+10% к клубным ценам"],
          4: ["Третий покупатель", "+15% к клубным ценам"],
          5: ["VIP-заказы", "+20% к клубным ценам"],
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

  const isTutorialActive = tutorialStep !== "completed";

  const unlockedCropIdsForDaily = useMemo(() => {
    const unlocked = CROP_IDS.filter((cropId) => {
      const record = plantCatalog?.[cropId];
      return Boolean(
        (Number(record?.totalHarvested) || 0) > 0 ||
        Object.keys(record?.qualities || {}).length > 0,
      );
    });
    return unlocked.length > 0 ? unlocked : ["tabakko"];
  }, [plantCatalog]);

  const dailyCropSignature = unlockedCropIdsForDaily.join("|");

  useEffect(() => {
    setDailyOrder((previous) =>
      normalizeDailyOrder(previous, {
        unlockedCropIds: unlockedCropIdsForDaily,
      }),
    );
  }, [dailyCropSignature, setDailyOrder]);

  useEffect(() => {
    trackGameEvent("app_open", {
      tutorialStep,
      premiumBalance: premiumCoins,
    });
    flushGameAnalytics();
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([
      pullProgressSnapshot(),
      fetchSecurePlayerProfile(),
    ]).then(([progressResult, profileResult]) => {
      if (cancelled) return;

      const saved = progressResult.status === "fulfilled"
        ? progressResult.value?.saved
        : null;
      const secureProfile = profileResult.status === "fulfilled"
        ? profileResult.value
        : null;
      const serverUpdatedAt = saved?.updatedAt
        ? Date.parse(saved.updatedAt)
        : 0;
      const shouldUseCloudSnapshot = Boolean(
        !skipCloudRestore &&
        saved?.snapshot &&
        (initialLastSeenAt <= 0 || serverUpdatedAt > initialLastSeenAt + 1000),
      );

      if (shouldUseCloudSnapshot) {
        const snapshot = saved.snapshot;
        if (snapshot.tutorialStep) setTutorialStep(String(snapshot.tutorialStep));
        if (snapshot.coins !== undefined) setCoins(normalizeCoins(snapshot.coins));
        if (snapshot.potStates) setPotStates(migratePotStates(snapshot.potStates));
        if (snapshot.inventory) setInventory(migrateCropInventory(snapshot.inventory));
        if (snapshot.seedInventory) setSeedInventory(migrateSeedInventory(snapshot.seedInventory));
        if (snapshot.careInventory) setCareInventory(migrateCareInventory(snapshot.careInventory));
        if (snapshot.qualityInventory) setQualityInventory(migrateQualityInventory(snapshot.qualityInventory));
        if (snapshot.plantCatalog) setPlantCatalog(migratePlantCatalog(snapshot.plantCatalog));
        if (snapshot.mariaQuestState) setMariaQuestState(migrateMariaQuestState(snapshot.mariaQuestState));
        if (snapshot.clubReputation !== undefined) {
          writeClubReputation(snapshot.clubReputation);
        }
        if (snapshot.shopStock) setShopStock((current) => ({
          ...current,
          ...migrateShopStock(snapshot.shopStock),
        }));
        if (snapshot.shopRefreshAt) setShopRefreshAt(Number(snapshot.shopRefreshAt) || Date.now() + SHOP_REFRESH_MS);
        if (snapshot.dailyOrder) setDailyOrder(normalizeDailyOrder(snapshot.dailyOrder, { unlockedCropIds: ["tabakko"] }));
        if (snapshot.dailyLoginState) setDailyLoginState(snapshot.dailyLoginState);
        if (snapshot.monetizationMilestones) setMonetizationMilestones(snapshot.monetizationMilestones);
      }

      if (secureProfile) {
        // Не затираем старые рабочие покупки нулём нового серверного кошелька.
        setPremiumCoins((current) => Math.max(
          Math.max(0, Math.floor(Number(current) || 0)),
          Math.max(0, Math.floor(Number(secureProfile.premiumBalance) || 0)),
        ));
        setOwnedProducts((current) => [...new Set([...(current || []), ...(secureProfile.ownedProducts || [])])]);
        const secureCosmetics = [...new Set(["classic", ...(ownedCosmetics || []), ...secureProfile.ownedCosmetics])];
        setOwnedCosmetics(secureCosmetics);
        const preferredCosmetic = shouldUseCloudSnapshot
          ? String(saved.snapshot.activeCosmetic || "classic")
          : activeCosmetic;
        setActiveCosmetic(secureCosmetics.includes(preferredCosmetic) ? preferredCosmetic : "classic");
      }
    }).finally(() => {
      if (!cancelled) setCloudHydrated(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const prepared = prepareDailyLogin(dailyLoginState);
    setDailyRewardPrepared(prepared);
    if (prepared.canClaim && !isTutorialActive) {
      setDailyRewardVisible(true);
    }
  }, [dailyLoginState?.lastClaimed, dailyLoginState?.streak, isTutorialActive]);

  useEffect(() => {
    if (!cloudHydrated) return undefined;

    const timeoutId = window.setTimeout(() => {
      pushProgressSnapshot({
        tutorialStep,
        coins,
        activeCosmetic,
        dailyLoginState,
        dailyOrder,
        monetizationMilestones,
        clubReputation,
        mariaQuestState,
        inventory,
        seedInventory,
        careInventory,
        qualityInventory,
        plantCatalog,
        potStates,
        shopStock,
        shopRefreshAt,
      }).catch(() => {});
    }, 1400);

    return () => window.clearTimeout(timeoutId);
  }, [
    cloudHydrated,
    tutorialStep,
    coins,
    activeCosmetic,
    dailyLoginState,
    dailyOrder,
    monetizationMilestones,
    clubReputation,
    mariaQuestState,
    inventory,
    seedInventory,
    careInventory,
    qualityInventory,
    plantCatalog,
    potStates,
    shopStock,
    shopRefreshAt,
  ]);

  const hasBlockingOverlay = Boolean(
    isSeedModalOpen ||
    isRemoveModalOpen ||
    isInventoryOpen ||
    isCareModalOpen ||
    isInventoryFullModalOpen ||
    isCatalogOpen ||
    isPotTypeModalOpen ||
    harvestResult ||
    offlineReadyCount > 0 ||
    instantGrowRequest ||
    isResetProgressModalOpen ||
    isUnavailableModalOpen ||
    unlockQueue.length > 0 ||
    contextOffer ||
    dailyRewardVisible,
  );

  const showBottomMenu =
    !hasBlockingOverlay && activeScreen === "district" && !isTutorialActive;

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
      const awayFor = Date.now() - initialLastSeenAt;
      if (initialLastSeenAt <= 0 || awayFor < OFFLINE_NOTICE_THRESHOLD_MS)
        return;

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
  }, [initialLastSeenAt]);

  useEffect(() => {
    setPotStates((previousStates) =>
      pots.map((_, index) => {
        const savedState = previousStates[index];

        if (!savedState) {
          return createPotState();
        }

        return {
          ...createPotState(),
          ...savedState,
          unlocked: Boolean(savedState.unlocked),
        };
      }),
    );
  }, [setPotStates]);

  useEffect(() => {
    document.body.dataset.tutorialLocked = isTutorialActive ? "true" : "false";

    return () => {
      delete document.body.dataset.tutorialLocked;
    };
  }, [isTutorialActive]);

  useEffect(() => {
    document.body.dataset.gameOverlayOpen = hasBlockingOverlay
      ? "true"
      : "false";

    return () => {
      delete document.body.dataset.gameOverlayOpen;
    };
  }, [hasBlockingOverlay]);

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

  const currentSlot = plantationSlots[currentPotIndex] || null;

  const currentPotState =
    potStates[currentPotIndex] || createPotState(currentPotIndex);

  const currentSlotState = getPlantationSlotState(
    currentSlot,
    mariaQuestState,
    Boolean(currentPotState.unlocked),
  );

  const currentPotType =
    POT_TYPES_BY_ID[currentPotState.potTypeId] || POT_TYPES_BY_ID.soil;
  const displayPot = {
    ...currentPot,
    name: currentPotType.name,
    image: currentPotType.image,
    icon: currentPotType.icon,
  };

  const growStep = currentPotState.growStep;
  const timeLeft = currentPotState.timeLeft;
  const plantedSeedId = currentPotState.selectedSeedId;

  const isCurrentPotUnlocked = currentPotState.unlocked;

  const currentPlantStages = plantsBySeed[plantedSeedId] || null;

  const currentPlant =
    growStep > 0 && currentPlantStages
      ? currentPlantStages[growStep - 1] || null
      : null;

  const instantGrowCost =
    growStep > 0 && growStep < 3
      ? getInstantGrowCost({
          growStep,
          timeLeft,
          growTime: currentPotState.growTime,
        })
      : null;

  useEffect(() => {
    if (
      tutorialStep === "growing" &&
      activeScreen === "plantation" &&
      growStep === 3
    ) {
      setTutorialStep("collect");
    }
  }, [activeScreen, growStep, setTutorialStep, tutorialStep]);

  const availableSeedsForCurrentPot = seeds.filter(
    (seed) =>
      (seed.seedType || "plant") === currentPotType.seedType &&
      (mariaQuestState.trust || 0) >= (seed.requiredTrust || 0),
  );

  const pendingSlot =
    pendingSlotIndex === null ? null : plantationSlots[pendingSlotIndex];

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

    const safeIndex = (nextIndex + pots.length) % pots.length;

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

    if (tutorialStep === "unlock-pot" && currentPotIndex === 0) {
      setPotStates((previousStates) =>
        previousStates.map((potState, index) =>
          index === 0 ? createEmptyPotState(true) : potState,
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
    setIsPotTypeModalOpen(true);
  };

  const choosePendingSlotType = (potTypeId) => {
    if (pendingSlotIndex === null) return;
    const slot = plantationSlots[pendingSlotIndex];
    const slotState = getPlantationSlotState(
      slot,
      mariaQuestState,
      Boolean(potStates[pendingSlotIndex]?.unlocked),
    );
    const type = POT_TYPES_BY_ID[potTypeId];
    if (
      !type ||
      (mariaQuestState.trust || 0) < type.requiredTrust ||
      !slotState.canBuy ||
      slot.unlockPrice === null ||
      coins < slot.unlockPrice
    )
      return;
    setCoins((value) => value - slot.unlockPrice);
    setPotStates((states) =>
      states.map((state, index) =>
        index === pendingSlotIndex
          ? { ...createEmptyPotState(true), potTypeId }
          : state,
      ),
    );
    setPendingSlotIndex(null);
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

    if (tutorialStep === "choose-seed" && seed?.id === "tabakko") {
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
      const currentAmount = seedInventory[seedId] || 0;

      if (currentAmount <= 0) {
        return;
      }

      setSeedInventory((previousInventory) => ({
        ...previousInventory,
        [seedId]: Math.max(0, (previousInventory[seedId] || 0) - 1),
      }));
    }

    const growTime =
      tutorialStep === "plant-seed"
        ? TUTORIAL_GROW_TIME
        : selectedSeed.growTime || DEFAULT_GROW_TIME;
    const now = Date.now();
    const totalGrowTime = Math.max(1, Math.ceil(growTime));
    const totalGrowDurationMs = totalGrowTime * 1000;
    const firstPhaseDurationMs = Math.max(
      1000,
      Math.round(totalGrowDurationMs / 2),
    );

    triggerTelegramHaptic("light");

    updateCurrentPotState({
      unlocked: true,
      growStep: 1,
      selectedSeedId: seedId,
      growTime: totalGrowTime,
      timeLeft: totalGrowTime,
      nextGrowthAt: Math.min(
        now + firstPhaseDurationMs,
        now + totalGrowDurationMs,
      ),
      harvestAt: now + totalGrowDurationMs,
      growthTimingVersion: 2,
      careApplied: [],
      wateredStages: [],
    });

    if (tutorialStep === "plant-seed") {
      setSelectedSeed(null);
      setIsSeedModalOpen(false);
      setTutorialStep("growing");
      return;
    }

    closeSeedModal();
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
      if (wateredStages.includes(growStep)) {
        return;
      }

      if (!currentPotState.nextGrowthAt) {
        return;
      }

      const now = Date.now();
      const totalGrowDurationMs = Math.max(
        1000,
        (Number(currentPotState.growTime) || DEFAULT_GROW_TIME) * 1000,
      );
      const phaseDurationMs = Math.max(1000, totalGrowDurationMs / 2);
      const reductionMs = Math.round(phaseDurationMs * 0.2);
      const currentNextGrowthAt = Number(currentPotState.nextGrowthAt);
      const fallbackHarvestAt =
        currentNextGrowthAt + (growStep === 1 ? phaseDurationMs : 0);
      const currentHarvestAt =
        Number(currentPotState.harvestAt) || fallbackHarvestAt;
      const nextGrowthAt = Math.max(now, currentNextGrowthAt - reductionMs);
      const harvestAt = Math.max(nextGrowthAt, currentHarvestAt - reductionMs);

      updateCurrentPotState({
        wateredStages: [...wateredStages, growStep],
        nextGrowthAt,
        harvestAt,
        timeLeft: Math.max(0, Math.ceil((harvestAt - now) / 1000)),
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

    if (growStep !== 3 || !plantedSeedId || harvestResult || harvestAnimation) {
      return;
    }

    const isTutorialHarvest =
      tutorialStep === "collect" && plantedSeedId === "tabakko";
    const quality = isTutorialHarvest
      ? getQualityById("normal")
      : rollHarvestQuality(
          currentPotState.careApplied || [],
          currentPotState.wateredStages || [],
        );
    const reward = isTutorialHarvest
      ? 3
      : getHarvestYield(
          currentPotState.careApplied || [],
          quality.id,
          plantedSeedId,
          currentPotState.wateredStages || [],
        );

    const seedData = seeds.find((seed) => seed.id === plantedSeedId);
    const harvestItemId = seedData?.harvestItemId || plantedSeedId || "tabakko";
    const itemName = seedData?.name || "Урожай";
    const itemIcon = seedData?.icon || "🌱";
    const existingQualityStack =
      getQualityAmount(qualityInventory, harvestItemId, quality.id) > 0;
    const occupiedInventorySlots = getOccupiedInventorySlots();

    if (
      !existingQualityStack &&
      occupiedInventorySlots >= INVENTORY_SLOT_LIMIT
    ) {
      setIsInventoryFullModalOpen(true);
      return;
    }

    // Пока открыто итоговое окно, урожай ещё остаётся в ведре и не начисляется.
    setHarvestResult({
      potIndex: currentPotIndex,
      potTypeId: currentPotState.potTypeId || "soil",
      itemId: harvestItemId,
      itemName,
      itemIcon,
      itemImage: currentPlantStages?.[2]?.image || currentPlant?.image || null,
      amount: reward,
      quality,
      careApplied: Array.isArray(currentPotState.careApplied)
        ? currentPotState.careApplied
        : [],
      wateredStages: Array.isArray(currentPotState.wateredStages)
        ? currentPotState.wateredStages
        : [],
    });
  };

  const advanceTutorialAfterHarvestResult = () => {
    if (tutorialStep === "collect") {
      setTutorialStep("go-district");
      setActiveScreen("plantation");
    }
  };

  const confirmHarvestResult = () => {
    const result = harvestResult;
    if (!result || harvestAnimation) return;

    // Итоговая карточка закрывается сразу. Дальше анимируется только
    // настоящее растение, которое всё ещё находится в ведре.
    setHarvestResult(null);
    setHarvestAnimation({
      potIndex: result.potIndex,
      itemId: result.itemId,
    });
    triggerTelegramHaptic("medium");

    const finishPlantAnimationTimer = window.setTimeout(() => {
      const visualLootCount = Math.max(3, Math.min(6, result.amount));
      const newLootItems = Array.from(
        { length: visualLootCount },
        (_, index) => ({
          id: `${Date.now()}-${index}`,
          // Все иконки рождаются в одной центральной точке на месте растения
          // и плавным потоком летят к рюкзаку.
          startX: 176,
          startY: 474,
          delay: index * 55,
          itemId: result.itemId,
          icon: result.itemIcon,
          image: result.itemImage,
        }),
      );

      // Маленькие изображения появляются ровно там, где только что исчезло
      // большое растение. В этот же момент урожай зачисляется, а ведро очищается.
      setFlyingLootItems(newLootItems);

      setInventory((previousInventory) => ({
        ...previousInventory,
        [result.itemId]:
          (previousInventory[result.itemId] || 0) + result.amount,
      }));

      setQualityInventory((previous) =>
        addQualityItems(
          previous,
          result.itemId,
          result.quality.id,
          result.amount,
        ),
      );

      setPlantCatalog((previousCatalog) => {
        const record = previousCatalog[result.itemId] || {
          totalHarvested: 0,
          qualities: {},
          bestQualityRank: -1,
          bestQualityName: null,
        };

        return {
          ...previousCatalog,
          [result.itemId]: {
            ...record,
            totalHarvested: (record.totalHarvested || 0) + result.amount,
            qualities: {
              ...(record.qualities || {}),
              [result.quality.id]:
                ((record.qualities || {})[result.quality.id] || 0) + 1,
            },
            bestQualityRank: Math.max(
              record.bestQualityRank ?? -1,
              result.quality.rank,
            ),
            bestQualityName:
              result.quality.rank >= (record.bestQualityRank ?? -1)
                ? result.quality.name
                : record.bestQualityName,
          },
        };
      });

      setMonetizationMilestones((previous) => ({
        ...previous,
        totalHarvests: (Number(previous?.totalHarvests) || 0) + 1,
      }));
      trackGameEvent("harvest_complete", {
        cropId: result.itemId,
        amount: result.amount,
        qualityId: result.quality.id,
        careCount: result.careApplied.length,
        wateredStages: result.wateredStages.length,
      });

      setPotStates((previousStates) =>
        previousStates.map((potState, index) =>
          index === result.potIndex
            ? {
                ...createEmptyPotState(true),
                potTypeId:
                  result.potTypeId || potState.potTypeId || "soil",
              }
            : potState,
        ),
      );

      triggerTelegramNotification("success");
      advanceTutorialAfterHarvestResult();
    }, 130);

    const finishLootAnimationTimer = window.setTimeout(() => {
      setFlyingLootItems([]);
      setHarvestAnimation(null);
      harvestAnimationTimersRef.current = [];
    }, 1600);

    harvestAnimationTimersRef.current = [
      finishPlantAnimationTimer,
      finishLootAnimationTimer,
    ];
  };

  const requestInstantGrow = () => {
    if (
      growStep <= 0 ||
      growStep >= 3
    ) {
      return;
    }

    setPremiumSpendError("");
    setInstantGrowRequest({
      potIndex: currentPotIndex,
      cost: Math.max(1, Number(instantGrowCost) || 1),
      cropName:
        seeds.find((seed) => seed.id === plantedSeedId)?.name || "Растение",
      cropImage:
        currentPlantStages?.[2]?.image || currentPlant?.image || null,
      cropId: plantedSeedId || "tabakko",
      appliedCare: Array.isArray(currentPotState.careApplied)
        ? currentPotState.careApplied
        : [],
      wateredStages: Array.isArray(currentPotState.wateredStages)
        ? currentPotState.wateredStages
        : [],
      growStep,
      timeLeft,
      formattedTime: formatGrowthTime(timeLeft),
    });
  };

  const confirmInstantGrow = async () => {
    const request = instantGrowRequest;
    if (!request || premiumSpendPending) return;

    const targetState = potStatesRef.current?.[request.potIndex];
    if (
      !targetState ||
      targetState.growStep <= 0 ||
      targetState.growStep >= 3
    ) {
      setInstantGrowRequest(null);
      return;
    }

    const currentCost = getInstantGrowCost({
      growStep: targetState.growStep,
      timeLeft: targetState.timeLeft,
      growTime: targetState.growTime,
    });
    const cost = Math.max(
      1,
      Math.min(Math.floor(Number(request.cost) || currentCost), currentCost),
    );

    if (premiumCoins < cost) return;

    setPremiumSpendPending("instant-grow");
    setPremiumSpendError("");
    try {
      const nextBalance = (await spendPremiumCurrency({
        amount: cost,
        reason: "instant-grow",
        idempotencyKey: [
          "pot",
          request.potIndex,
          targetState.selectedSeedId || "crop",
          targetState.nextGrowthAt || targetState.harvestAt || targetState.growStep,
        ].join(":"),
        metadata: {
          potIndex: request.potIndex,
          cropId: targetState.selectedSeedId || null,
          growStep: targetState.growStep,
          quotedCost: cost,
        },
        currentBalance: premiumCoins,
        allowLocalFallback: true,
      })).premiumBalance;

      setPremiumCoins(nextBalance);
      setPotStates((states) =>
        states.map((state, index) =>
          index === request.potIndex && state?.growStep > 0 && state.growStep < 3
            ? {
                ...state,
                growStep: 3,
                timeLeft: 0,
                nextGrowthAt: null,
                harvestAt: null,
              }
            : state,
        ),
      );

      trackGameEvent("premium_spend", {
        reason: "instant-grow",
        amount: cost,
        cropId: targetState.selectedSeedId || "unknown",
      });
      triggerTelegramNotification("success");
      setInstantGrowRequest(null);
    } catch (error) {
      if (Number.isFinite(error?.serverBalance)) {
        setPremiumCoins(error.serverBalance);
      }
      setPremiumSpendError(
        error?.code === "INSUFFICIENT_FUNDS"
          ? "На серверном балансе не хватает монет роста."
          : "Не удалось подтвердить списание. Проверь соединение и повтори.",
      );
      triggerTelegramNotification("error");
    } finally {
      setPremiumSpendPending(null);
    }
  };

  const refreshShopWithPremium = async () => {
    const cost = PREMIUM_PRICES.shopRefresh;
    if (premiumSpendPending) {
      return { success: false, message: "Предыдущее действие ещё подтверждается." };
    }
    if (premiumCoins < cost) {
      return { success: false, message: "Не хватает монет роста." };
    }

    setPremiumSpendPending("shop-refresh");
    try {
      const nextBalance = (await spendPremiumCurrency({
        amount: cost,
        reason: "shop-refresh",
        idempotencyKey: `supply:${shopRefreshAt}`,
        metadata: { previousRefreshAt: shopRefreshAt, quotedCost: cost },
        currentBalance: premiumCoins,
        allowLocalFallback: true,
      })).premiumBalance;
      setPremiumCoins(nextBalance);
      setShopStock(createShopStock());
      setShopRefreshAt(Date.now() + SHOP_REFRESH_MS);
      trackGameEvent("premium_spend", { reason: "shop-refresh", amount: cost });
      triggerTelegramHaptic("medium");
      return { success: true, message: "Зорик уже выставил новую поставку." };
    } catch (error) {
      if (Number.isFinite(error?.serverBalance)) {
        setPremiumCoins(error.serverBalance);
      }
      return {
        success: false,
        message: error?.code === "INSUFFICIENT_FUNDS"
          ? "На серверном балансе не хватает монет роста."
          : "Не удалось подтвердить списание. Попробуй ещё раз.",
      };
    } finally {
      setPremiumSpendPending(null);
    }
  };

  const removePlant = () => {
    if (!isCurrentPotUnlocked) {
      return;
    }

    if (growStep === 0) {
      return;
    }

    if ((careInventory.acidWater || 0) <= 0) {
      setIsRemoveModalOpen(false);
      return;
    }

    setCareInventory((previous) => ({
      ...previous,
      acidWater: Math.max(0, (previous.acidWater || 0) - 1),
    }));

    updateCurrentPotState({
      ...createEmptyPotState(true),
      potTypeId: currentPotState.potTypeId || "soil",
    });

    setIsRemoveModalOpen(false);
  };

  const deleteQualityItem = (itemId, qualityId, count) => {
    const safe = Math.max(0, Math.floor(Number(count) || 0));
    setQualityInventory((previous) =>
      removeQualityItems(previous, itemId, qualityId, safe),
    );
    setInventory((previous) => ({
      ...previous,
      [itemId]: Math.max(0, (previous[itemId] || 0) - safe),
    }));
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
    if (safe <= 0) return;

    setCareInventory((previous) => ({
      ...previous,
      [itemId]: Math.max(0, (previous[itemId] || 0) - safe),
    }));
  };

  const openPremiumBank = (focusProductId = null) => {
    if (isTutorialActive) {
      return;
    }

    if (activeScreen !== "support" && activeScreen !== "coin-bank") {
      setBankReturnScreen(activeScreen);
    }

    const safeFocusId = typeof focusProductId === "string" ? focusProductId : null;
    setStoreFocusProductId(safeFocusId);
    setContextOffer(null);
    triggerTelegramHaptic("light");
    trackGameEvent("store_navigation", {
      sourceScreen: activeScreen,
      focusProductId: safeFocusId,
    });
    setActiveScreen("support");
  };

  const openCoinBank = () => {
    if (isTutorialActive) {
      return;
    }

    if (activeScreen !== "support" && activeScreen !== "coin-bank") {
      setBankReturnScreen(activeScreen);
    }

    triggerTelegramHaptic("light");
    setActiveScreen("coin-bank");
  };

  const closeCurrencyBank = () => {
    setStoreFocusProductId(null);
    setActiveScreen(bankReturnScreen || "plantation");
  };

  const grantEntitlements = ({ product, entitlements, serverBalance }) => {
    const rewards = Array.isArray(entitlements) && entitlements.length > 0
      ? entitlements
      : (product?.contents || []);

    const growthReward = rewards
      .filter((item) => (item?.kind || item?.type) === "growth")
      .reduce((total, item) => total + Math.max(0, Math.floor(Number(item.amount) || 0)), 0);
    const hasServerBalance =
      serverBalance !== null &&
      serverBalance !== undefined &&
      Number.isFinite(Number(serverBalance));
    const confirmedPremiumBalance = hasServerBalance
      ? Math.max(0, Math.floor(Number(serverBalance)))
      : Math.max(0, Math.floor(Number(premiumCoins) || 0)) + growthReward;

    // Новый backend отдаёт точный баланс. Старый рабочий Stars endpoint
    // возвращал только paid — в таком случае начисляем валюту из состава товара.
    if (confirmedPremiumBalance !== premiumCoins) {
      setPremiumCoins(confirmedPremiumBalance);
    }

    const nextCareInventory = { ...careInventory };
    rewards
      .filter((item) => (item?.kind || item?.type) === "care")
      .forEach((item) => {
        const careId = String(item.id || "");
        const amount = Math.max(0, Math.floor(Number(item.amount) || 0));
        if (careId && amount > 0) {
          nextCareInventory[careId] = (nextCareInventory[careId] || 0) + amount;
        }
      });
    setCareInventory(nextCareInventory);

    const cosmeticRewards = rewards
      .filter((item) => (item?.kind || item?.type) === "cosmetic")
      .map((item) => String(item.id || ""))
      .filter(Boolean);
    const nextOwnedCosmetics = [
      ...new Set(["classic", ...(ownedCosmetics || []), ...cosmeticRewards]),
    ];
    if (cosmeticRewards.length > 0) {
      setOwnedCosmetics(nextOwnedCosmetics);
    }

    const shouldEquipPurchasedTheme =
      cosmeticRewards.length > 0 &&
      (product?.type === "cosmetic" || product?.id === "starter-kit");
    const nextActiveCosmetic = shouldEquipPurchasedTheme
      ? cosmeticRewards[0]
      : activeCosmetic;
    if (nextActiveCosmetic !== activeCosmetic) {
      setActiveCosmetic(nextActiveCosmetic);
    }

    const nextOwnedProducts = product && (product.oneTime || product.type === "cosmetic")
      ? [...new Set([...(ownedProducts || []), product.id])]
      : (ownedProducts || []);
    if (nextOwnedProducts !== ownedProducts) {
      setOwnedProducts(nextOwnedProducts);
    }

    // После подтверждённой покупки сохраняем расходники немедленно.
    // Это защищает награды, если Mini App закрыли сразу после оплаты.
    pushProgressSnapshot({
      tutorialStep,
      coins,
      activeCosmetic: nextActiveCosmetic,
      dailyLoginState,
      dailyOrder,
      monetizationMilestones,
      clubReputation,
      mariaQuestState,
      inventory,
      seedInventory,
      careInventory: nextCareInventory,
      qualityInventory,
      plantCatalog,
      potStates,
      shopStock,
      shopRefreshAt,
    }).catch(() => {});

    trackGameEvent("entitlements_granted", {
      productId: product?.id || null,
      rewardCount: rewards.length,
      premiumBalance: confirmedPremiumBalance,
    });
  };

  const equipCosmetic = (cosmeticId) => {
    const safeId = String(cosmeticId || "classic");
    if (safeId !== "classic" && !ownedCosmetics.includes(safeId)) return;
    setActiveCosmetic(safeId);
    triggerTelegramHaptic("light");
    trackGameEvent("cosmetic_equipped", { cosmeticId: safeId });
  };

  const claimDailyRewardNow = () => {
    const prepared = dailyRewardPrepared;
    const reward = prepared?.reward;
    if (!prepared?.canClaim || !reward) return;

    if (reward.coins) setCoins((value) => value + reward.coins);
    if (reward.care) {
      setCareInventory((previous) => ({
        ...previous,
        nutrition: (previous.nutrition || 0) + (reward.care.nutrition || 0),
        mariaMix: (previous.mariaMix || 0) + (reward.care.mariaMix || 0),
      }));
    }

    setDailyLoginState(claimDailyLogin(prepared));
    setDailyRewardVisible(false);
    triggerTelegramNotification("success");
    trackGameEvent("daily_reward_claimed", {
      day: reward.day,
      coins: reward.coins || 0,
      growth: reward.growth || 0,
    });
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

  const goToDistrictFromDoor = () => {
    if (!tutorialAllows("go-district")) {
      return;
    }

    triggerTelegramHaptic("light");
    setActiveScreen("district");

    if (tutorialStep === "go-district") {
      setTutorialStep("district-finish");
    }
  };

  const buyShopItem = (item, amount) => {
    if (!item) {
      return {
        success: false,
        message: "Товар не найден.",
      };
    }

    const requestedAmount =
      item.type === "tool" ? 1 : Math.floor(Number(amount));

    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
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

    const availableStock = shopStock[item.id] || 0;

    if (requestedAmount > availableStock) {
      return {
        success: false,
        message: "У Зорика нет столько товара.",
      };
    }

    const totalPrice = requestedAmount * item.pricePerSeed;

    if (coins < totalPrice) {
      return {
        success: false,
        message: "Недостаточно монет.",
      };
    }

    setCoins((previousCoins) => previousCoins - totalPrice);
    triggerTelegramHaptic("medium");

    setShopStock((previousStock) => ({
      ...previousStock,
      [item.id]: Math.max(0, (previousStock[item.id] || 0) - requestedAmount),
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
      message:
        item.type === "tool"
          ? `Куплено: ${item.name}. Инструмент останется у тебя навсегда.`
          : `Куплено: ${item.name} — ${requestedAmount} шт.`,
    };
  };

  const deliverMariaItems = ({ itemId, amount, items }) => {
    const deliveryItems =
      items && typeof items === "object"
        ? Object.entries(items)
            .map(([deliveryItemId, deliveryAmount]) => [
              deliveryItemId,
              Math.max(0, Math.floor(Number(deliveryAmount) || 0)),
            ])
            .filter(
              ([deliveryItemId, deliveryAmount]) =>
                deliveryItemId && deliveryAmount > 0,
            )
        : [[itemId, Math.max(0, Math.floor(Number(amount) || 0))]];

    if (
      deliveryItems.length === 0 ||
      deliveryItems.some(
        ([deliveryItemId, deliveryAmount]) =>
          !deliveryItemId ||
          deliveryAmount <= 0 ||
          (inventory[deliveryItemId] || 0) < deliveryAmount,
      )
    ) {
      return false;
    }

    setInventory((previousInventory) => {
      const nextInventory = { ...previousInventory };
      deliveryItems.forEach(([deliveryItemId, deliveryAmount]) => {
        nextInventory[deliveryItemId] = Math.max(
          0,
          (nextInventory[deliveryItemId] || 0) - deliveryAmount,
        );
      });
      return nextInventory;
    });

    setQualityInventory((previousInventory) => {
      let nextInventory = previousInventory;
      deliveryItems.forEach(([deliveryItemId, deliveryAmount]) => {
        nextInventory = removeAnyQuality(
          nextInventory,
          deliveryItemId,
          deliveryAmount,
        ).next;
      });
      return nextInventory;
    });

    return true;
  };

  const claimMariaReward = ({ coins: coinReward, seeds: seedReward, care: careReward }) => {
    const safeCoins = Math.max(0, Math.floor(Number(coinReward) || 0));
    if (safeCoins > 0) setCoins((previousCoins) => previousCoins + safeCoins);

    if (seedReward && typeof seedReward === "object") {
      setSeedInventory((previous) => {
        const next = { ...previous };
        Object.entries(seedReward).forEach(([seedId, amount]) => {
          next[seedId] = (next[seedId] || 0) + Math.max(0, Math.floor(Number(amount) || 0));
        });
        return next;
      });
    }

    if (careReward && typeof careReward === "object") {
      setCareInventory((previous) => {
        const next = { ...previous };
        Object.entries(careReward).forEach(([careId, amount]) => {
          next[careId] = (next[careId] || 0) + Math.max(0, Math.floor(Number(amount) || 0));
        });
        return next;
      });
    }
  };

  const handleClubSaleForMaria = (sale) => {
    const itemId = sale?.itemId;
    const safeAmount = Math.max(0, Math.floor(Number(sale?.amount) || 0));

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

    const dailyResult = applySaleToDailyOrder(dailyOrder, sale);
    if (dailyResult.matchedAmount > 0) {
      const nextOrder = dailyResult.completedNow
        ? { ...dailyResult.order, claimed: true }
        : dailyResult.order;
      setDailyOrder(nextOrder);

      if (dailyResult.completedNow) {
        const reward = dailyResult.order.reward || {};
        if (reward.coins) setCoins((value) => value + reward.coins);
            setUnlockQueue((queue) => [
          ...queue,
          {
            id: `daily-order-${dailyResult.order.id}-${Date.now()}`,
            source: "daily",
            sourceLabel: "Заказ дня",
            level: "Выполнено",
            icon: "✦",
            title: `${dailyResult.order.cropName} принята`,
            description: "Клуб закрыл специальный заказ. Награда уже в твоём кошельке.",
            unlocks: [
              `+${reward.coins || 0} монет`,
              ...(reward.growth ? [`+${reward.growth} монет роста`] : []),
            ],
          },
        ]);
        trackGameEvent("daily_order_complete", {
          orderId: dailyResult.order.id,
          cropId: itemId,
          qualityId: sale?.qualityId,
          rewardCoins: reward.coins || 0,
          rewardGrowth: reward.growth || 0,
        });
      }
    }

    const firstSaleOffer =
      !monetizationMilestones.firstSaleOfferShown &&
      !ownedProducts.includes("starter-kit");

    setMonetizationMilestones((previous) => ({
      ...previous,
      totalSales: (Number(previous?.totalSales) || 0) + 1,
      firstSaleOfferShown: Boolean(previous?.firstSaleOfferShown),
    }));

    trackGameEvent("club_sale", {
      cropId: itemId,
      amount: safeAmount,
      qualityId: sale?.qualityId || "normal",
      coins: sale?.coins || 0,
      reputation: sale?.reputation || 0,
    });

    if (firstSaleOffer) {
      window.setTimeout(() => {
        setMonetizationMilestones((previous) => ({
          ...previous,
          firstSaleOfferShown: true,
        }));
        setContextOffer({
          productId: "starter-kit",
          source: "first-sale",
          eyebrow: "ПЕРВАЯ СДЕЛКА ЗАКРЫТА",
          title: "Теперь ты реально в деле",
          description: "Стартовый набор ускорит следующие циклы и откроет оформление, но обычные монеты всё равно придётся заработать в клубе.",
        });
      }, 2100);
    }
  };

  return (
    <div className={`game-screen game-screen--${activeScreen} game-screen--cosmetic-${activeCosmetic}`}>
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
          {!isTutorialActive &&
            activeScreen === "plantation" && (
              <PremiumWallet
                balance={premiumCoins}
                disabled={isTutorialActive}
                onClick={openPremiumBank}
              />
            )}

          {activeScreen === "plantation" && (
            <>
              <div className="background" />

              <button
                type="button"
                className="plantation-door-hitbox"
                data-action="district"
                data-screen="district"
                onClick={goToDistrictFromDoor}
                disabled={!tutorialAllows("go-district")}
                aria-label="Выйти через дверь в район"
              />

              <button
                type="button"
                className="top-wallet"
                onClick={openCoinBank}
                aria-label={`Монеты: ${coins}. Открыть банк монет.`}
              >
                <span className="top-wallet__coin" aria-hidden="true" />
                <strong>{formatCompactNumber(coins)}</strong>
              </button>

              <button
                type="button"
                className="progress-reset-button"
                onClick={() => {
                  triggerTelegramHaptic("medium");
                  setIsResetProgressModalOpen(true);
                }}
                aria-label="Сбросить прогресс и начать игру заново"
              >
                <span
                  className="progress-reset-button__icon"
                  aria-hidden="true"
                >
                  ↻
                </span>
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
                aria-label="Открыть каталог культур"
              >
                <span aria-hidden="true">☘</span>
              </button>

              <FlyingLoot lootItems={flyingLootItems} />

              <div className="game-content">
                <div className="table-scene">
                  <PlantArea
                    pot={displayPot}
                    plant={currentPlant}
                    growStep={growStep}
                    timeLeft={timeLeft}
                    unlockPrice={
                      tutorialStep === "unlock-pot" && currentPotIndex === 0
                        ? 0
                        : currentSlot?.unlockPrice
                    }
                    isSlotAvailable={
                      tutorialStep === "unlock-pot" && currentPotIndex === 0
                        ? true
                        : currentSlotState.canBuy
                    }
                    lockedStatusText={currentSlotState.statusText}
                    isUnlocked={isCurrentPotUnlocked}
                    isEmpty={growStep === 0}
                    canCollect={growStep === 3}
                    onCollect={collectPlant}
                    onSeedClick={openSeedModal}
                    onUnlock={handleLockedSlotClick}
                    onOpenCare={() => setIsCareModalOpen(true)}
                    onWater={() => applyPlantCare("water")}
                    careApplied={currentPotState.careApplied}
                    wateredStages={currentPotState.wateredStages}
                    canWater={
                      !isTutorialActive &&
                      growStep > 0 &&
                      (mariaQuestState.trust || 0) >= 25
                    }
                    canCare={!isTutorialActive && growStep > 0}
                    onPreviousPot={showPreviousPot}
                    onNextPot={showNextPot}
                    navigationDisabled={isTutorialActive || Boolean(harvestAnimation)}
                    seedDisabled={!tutorialAllows("open-seeds")}
                    collectDisabled={!tutorialAllows("collect")}
                    unlockDisabled={!tutorialAllows("unlock-pot")}
                    onOpenGrowthInfo={requestInstantGrow}
                    growthInfoDisabled={false}
                    isHarvesting={
                      harvestAnimation?.potIndex === currentPotIndex
                    }
                  />
                </div>
              </div>

              <div className="plantation-pagination">
                {pots.map((pot, index) => (
                  <button
                    key={pot.id}
                    className={`plantation-pagination-dot${
                      index === currentPotIndex ? " active" : ""
                    }${potStates[index]?.unlocked ? " unlocked" : ""}`}
                    type="button"
                    aria-label={`Перейти к ведру ${index + 1}`}
                    disabled={isTutorialActive}
                    onClick={() => changePot(index)}
                  />
                ))}
              </div>

              <SeedModal
                isOpen={isSeedModalOpen && isCurrentPotUnlocked}
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
                isOpen={isRemoveModalOpen && isCurrentPotUnlocked}
                amount={careInventory.acidWater || 0}
                onConfirm={removePlant}
                onCancel={() => setIsRemoveModalOpen(false)}
              />

              <InventoryModal
                isOpen={isInventoryOpen}
                qualityInventory={qualityInventory}
                seedInventory={seedInventory}
                careInventory={careInventory}
                appliedCare={
                  Array.isArray(currentPotState.careApplied)
                    ? currentPotState.careApplied
                    : []
                }
                canPlantSeed={isCurrentPotUnlocked && growStep === 0}
                canUseCare={growStep > 0 && growStep < 3}
                canUseAcidWater={growStep > 0}
                onPlantSeed={(cropId) => {
                  const seed = seeds.find((item) => item.id === cropId);
                  if (!seed || !isCurrentPotUnlocked || growStep !== 0) return;
                  setSelectedSeed(seed);
                  setIsInventoryOpen(false);
                  setIsSeedModalOpen(true);
                }}
                onUseCare={(careType) => {
                  if (careType === "acidWater") {
                    if (growStep <= 0 || (careInventory.acidWater || 0) <= 0)
                      return;
                    setIsInventoryOpen(false);
                    setIsRemoveModalOpen(true);
                    return;
                  }

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
                cropId={plantedSeedId || "tabakko"}
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
                onContinue={confirmHarvestResult}
              />

              <PlantCatalogModal
                isOpen={isCatalogOpen}
                catalog={plantCatalog}
                onClose={() => setIsCatalogOpen(false)}
              />

              <PotTypeModal
                isOpen={isPotTypeModalOpen}
                trust={mariaQuestState.trust || 0}
                title="Купить место и установить ведро"
                description="На верхней плантации используются растительные гидропонные вёдра. Грибные ёмкости появятся позже в отдельном подвале."
                price={pendingSlot?.unlockPrice ?? null}
                coins={coins}
                onChoose={choosePendingSlotType}
                onClose={() => {
                  setIsPotTypeModalOpen(false);
                  setPendingSlotIndex(null);
                }}
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

              <ReadyHarvestModal
                isOpen={offlineReadyCount > 0}
                readyCount={offlineReadyCount}
                onContinue={() => {
                  const firstReadyIndex = (
                    potStatesRef.current || []
                  ).findIndex(
                    (potState) => potState?.unlocked && potState.growStep === 3,
                  );

                  if (firstReadyIndex >= 0) {
                    setCurrentPotIndex(firstReadyIndex);
                  }

                  setOfflineReadyCount(0);
                  setActiveScreen("plantation");
                }}
              />

              <InstantGrowModal
                request={instantGrowRequest}
                coins={premiumCoins}
                onConfirm={confirmInstantGrow}
                isProcessing={premiumSpendPending === "instant-grow"}
                error={premiumSpendError}
                onBuyCoins={() => {
                  setInstantGrowRequest(null);
                  setPremiumSpendError("");
                  openPremiumBank("growth-pocket");
                }}
                onCancel={() => {
                  if (premiumSpendPending === "instant-grow") return;
                  setInstantGrowRequest(null);
                  setPremiumSpendError("");
                }}
              />

              <ResetProgressModal
                isOpen={isResetProgressModalOpen}
                onConfirm={() => {
                  triggerTelegramNotification("warning");
                  requestGameProgressReset();
                }}
                onCancel={() => setIsResetProgressModalOpen(false)}
              />

              <LockedSlotModal
                isOpen={isUnavailableModalOpen}
                title={`Место ${currentSlot?.id || ""} закрыто`}
                statusText={currentSlotState.statusText}
                requirementText={currentSlotState.requirementText}
                onClose={() => setIsUnavailableModalOpen(false)}
              />
            </>
          )}

          {activeScreen === "district" && (
            <DistrictScreen
              onOpenClub={openClub}
              onOpenShop={openShop}
              onOpenMariaHouse={openMariaHouse}
              showMariaNotice={
                (mariaQuestState.completedQuestIds || []).length <
                MARIA_QUESTS.length
              }
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
              key={shopRefreshAt}
              onGoBack={goBackToDistrict}
              items={shopItems}
              stock={shopStock}
              coins={coins}
              seedInventory={seedInventory}
              careInventory={careInventory}
              clubReputation={clubReputation}
              mariaTrust={mariaQuestState.trust || 0}
              refreshAt={shopRefreshAt}
              currentTime={shopClock}
              premiumCoins={premiumCoins}
              premiumRefreshPrice={PREMIUM_PRICES.shopRefresh}
              onPremiumRefresh={refreshShopWithPremium}
              onOpenPremiumStore={openPremiumBank}
              onBuy={buyShopItem}
            />
          )}

          {activeScreen === "club" && (
            <ClubScreen
              setInventory={setInventory}
              qualityInventory={qualityInventory}
              setQualityInventory={setQualityInventory}
              plantCatalog={plantCatalog}
              coins={coins}
              setCoins={setCoins}
              premiumCoins={premiumCoins}
              onOpenCoinBank={openCoinBank}
              onOpenPremiumStore={openPremiumBank}
              onSaleCompleted={handleClubSaleForMaria}
              dailyOrder={dailyOrder}
              onGoBack={goBackToDistrict}
            />
          )}

          {activeScreen === "support" && (
            <SupportScreen
              premiumCoins={premiumCoins}
              ownedProducts={ownedProducts}
              ownedCosmetics={ownedCosmetics}
              activeCosmetic={activeCosmetic}
              initialProductId={storeFocusProductId}
              onProductGranted={grantEntitlements}
              onEquipCosmetic={equipCosmetic}
              onClose={closeCurrencyBank}
            />
          )}

          {activeScreen === "coin-bank" && (
            <CoinBankScreen
              coins={coins}
              dailyOrder={dailyOrder}
              onClose={closeCurrencyBank}
              onOpenPremiumStore={() => openPremiumBank("growth-pocket")}
            />
          )}

          {showBottomMenu && (
            <BottomMenu
              activeScreen={activeScreen}
              onGoPlantation={() => {
                setActiveScreen("plantation");
              }}
              readyPlants={readyPlantCount}
            />
          )}

          <UnlockCelebration
            notification={unlockQueue[0] || null}
            queuedCount={Math.max(0, unlockQueue.length - 1)}
            onClose={() => setUnlockQueue((queue) => queue.slice(1))}
          />

          <ContextOfferModal
            offer={contextOffer}
            onOpenStore={(productId) => openPremiumBank(productId)}
            onClose={() => {
              trackGameEvent("context_offer_dismissed", {
                productId: contextOffer?.productId || null,
              });
              setContextOffer(null);
            }}
          />

          {dailyRewardVisible && (
            <DailyRewardModal
              prepared={dailyRewardPrepared}
              onClaim={claimDailyRewardNow}
              onClose={() => setDailyRewardVisible(false)}
            />
          )}

          {!isResetProgressModalOpen && !harvestResult && !isCatalogOpen && !contextOffer && !dailyRewardVisible && (
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
                  setActiveScreen("district");
                  setTutorialStep("open-maria-house");
                  return;
                }

                if (tutorialStep === "onboarding-finish") {
                  setTutorialStep("completed");
                  setActiveScreen("maria-house");
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
