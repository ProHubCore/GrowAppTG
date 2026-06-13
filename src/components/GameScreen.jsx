import { useEffect, useRef, useState } from "react";

import BottomMenu from "./BottomMenu";
import GrowTimer from "./GrowTimer";
import SeedBasket from "./SeedBasket";
import SeedModal from "./SeedModal";
import ShovelTool from "./ShovelTool";
import RemovePlantModal from "./RemovePlantModal";
import BackpackTool from "./BackpackTool";
import InventoryModal from "./InventoryModal";
import FlyingLoot from "./FlyingLoot";
import DistrictScreen from "./DistrictScreen";
import ShopScreen from "./ShopScreen";
import ClubScreen from "./ClubScreen";
import PlantationSlider from "./PlantationSlider";
import AddPotModal from "./AddPotModal";

import usePersistentState from "../hooks/usePersistentState";

import { pots } from "../data/pots";
import { plants } from "../data/plants";
import { seeds } from "../data/seeds";

const GROW_TIME = 5;
const GROW_STAGE_DURATION = GROW_TIME * 1000;

const STAGE_WIDTH = 390;
const STAGE_HEIGHT = 844;

const INITIAL_PLANT_SLOTS = [
  {
    id: "plant-slot-1",
    unlocked: true,
    growStep: 0,
    plantedSeedId: null,
    stageEndsAt: null,
  },
  {
    id: "plant-slot-2",
    unlocked: false,
    growStep: 0,
    plantedSeedId: null,
    stageEndsAt: null,
  },
  {
    id: "plant-slot-3",
    unlocked: false,
    growStep: 0,
    plantedSeedId: null,
    stageEndsAt: null,
  },
];

function advancePlantSlot(slot, currentTime) {
  if (!slot.unlocked) return slot;
  if (slot.growStep !== 1 && slot.growStep !== 2) {
    return slot;
  }

  if (!slot.stageEndsAt || currentTime < slot.stageEndsAt) {
    return slot;
  }

  let nextStep = slot.growStep;
  let nextStageEndsAt = slot.stageEndsAt;

  while (
    (nextStep === 1 || nextStep === 2) &&
    currentTime >= nextStageEndsAt
  ) {
    if (nextStep === 1) {
      nextStep = 2;
      nextStageEndsAt += GROW_STAGE_DURATION;
      continue;
    }

    nextStep = 3;
    nextStageEndsAt = null;
  }

  return {
    ...slot,
    growStep: nextStep,
    stageEndsAt: nextStageEndsAt,
  };
}

function GameScreen() {
  const [plantSlots, setPlantSlots] = usePersistentState(
    "growapp-plant-slots",
    INITIAL_PLANT_SLOTS
  );

  const [activeSlotIndex, setActiveSlotIndex] =
    usePersistentState("growapp-active-slot", 0);

  const [inventory, setInventory] = usePersistentState(
    "growapp-inventory",
    {
      greenTomato: 0,
    }
  );

  const [coins, setCoins] = usePersistentState(
    "growapp-coins",
    0
  );

  const [isSeedModalOpen, setIsSeedModalOpen] =
    useState(false);

  const [selectedSeed, setSelectedSeed] =
    useState(null);

  const [isRemoveModalOpen, setIsRemoveModalOpen] =
    useState(false);

  const [isInventoryOpen, setIsInventoryOpen] =
    useState(false);

  const [lockedSlotIndex, setLockedSlotIndex] =
    useState(null);

  const [activeScreen, setActiveScreen] =
    useState("plantation");

  const [flyingLootItems, setFlyingLootItems] =
    useState([]);

  const [stageScale, setStageScale] = useState(1);
  const [currentTime, setCurrentTime] = useState(
    Date.now()
  );

  const touchStartX = useRef(null);

  const safeActiveSlotIndex = Math.min(
    Math.max(activeSlotIndex, 0),
    plantSlots.length - 1
  );

  const currentSlot =
    plantSlots[safeActiveSlotIndex];

  const currentPot = pots[0];

  let currentPlant = null;

  if (currentSlot?.growStep === 1) {
    currentPlant = plants[0];
  }

  if (currentSlot?.growStep === 2) {
    currentPlant = plants[1];
  }

  if (currentSlot?.growStep === 3) {
    currentPlant = plants[2];
  }

  let timeLeft = 0;

  if (
    currentSlot?.stageEndsAt &&
    (currentSlot.growStep === 1 ||
      currentSlot.growStep === 2)
  ) {
    timeLeft = Math.max(
      0,
      Math.ceil(
        (currentSlot.stageEndsAt - currentTime) / 1000
      )
    );
  }

  useEffect(() => {
    const updateScale = () => {
      const viewportWidth =
        window.visualViewport?.width ||
        window.innerWidth;

      const viewportHeight =
        window.visualViewport?.height ||
        window.innerHeight;

      const widthScale = viewportWidth / STAGE_WIDTH;
      const heightScale = viewportHeight / STAGE_HEIGHT;

      setStageScale(
        Math.min(widthScale, heightScale)
      );
    };

    updateScale();

    window.addEventListener("resize", updateScale);

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
    const timer = window.setInterval(() => {
      const now = Date.now();

      setCurrentTime(now);

      setPlantSlots((previousSlots) => {
        let hasChanges = false;

        const updatedSlots = previousSlots.map(
          (slot) => {
            const updatedSlot = advancePlantSlot(
              slot,
              now
            );

            if (updatedSlot !== slot) {
              hasChanges = true;
            }

            return updatedSlot;
          }
        );

        return hasChanges
          ? updatedSlots
          : previousSlots;
      });
    }, 250);

    return () => {
      window.clearInterval(timer);
    };
  }, [setPlantSlots]);

  const updateCurrentSlot = (updater) => {
    setPlantSlots((previousSlots) =>
      previousSlots.map((slot, index) => {
        if (index !== safeActiveSlotIndex) {
          return slot;
        }

        return updater(slot);
      })
    );
  };

  const selectPlantSlot = (index) => {
    const nextIndex = Math.min(
      Math.max(index, 0),
      plantSlots.length - 1
    );

    setActiveSlotIndex(nextIndex);
    setSelectedSeed(null);
    setIsSeedModalOpen(false);
    setIsRemoveModalOpen(false);
  };

  const handleTouchStart = (event) => {
    touchStartX.current =
      event.changedTouches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event) => {
    if (touchStartX.current === null) return;

    const touchEndX =
      event.changedTouches[0]?.clientX ??
      touchStartX.current;

    const distance =
      touchEndX - touchStartX.current;

    touchStartX.current = null;

    if (Math.abs(distance) < 45) return;

    if (distance < 0) {
      selectPlantSlot(safeActiveSlotIndex + 1);
      return;
    }

    selectPlantSlot(safeActiveSlotIndex - 1);
  };

  const openSeedModal = () => {
    if (!currentSlot?.unlocked) return;
    if (currentSlot.growStep !== 0) return;

    setSelectedSeed(null);
    setIsSeedModalOpen(true);
  };

  const closeSeedModal = () => {
    setSelectedSeed(null);
    setIsSeedModalOpen(false);
  };

  const plantSelectedSeed = () => {
    if (!selectedSeed) return;
    if (!currentSlot?.unlocked) return;
    if (currentSlot.growStep !== 0) return;

    const now = Date.now();

    updateCurrentSlot((slot) => ({
      ...slot,
      growStep: 1,
      plantedSeedId: selectedSeed.id,
      stageEndsAt: now + GROW_STAGE_DURATION,
    }));

    setCurrentTime(now);
    setSelectedSeed(null);
    setIsSeedModalOpen(false);
  };

  const collectPlant = () => {
    if (currentSlot?.growStep !== 3) return;

    const reward =
      Math.floor(Math.random() * 3) + 1;

    const newLootItems = Array.from(
      { length: reward },
      (_, index) => ({
        id: `${Date.now()}-${index}`,
        startX: 190 + index * 12,
        startY: 470 - index * 8,
        delay: index * 120,
      })
    );

    setFlyingLootItems(newLootItems);

    setInventory((previousInventory) => ({
      ...previousInventory,
      greenTomato:
        (previousInventory.greenTomato || 0) +
        reward,
    }));

    updateCurrentSlot((slot) => ({
      ...slot,
      growStep: 0,
      plantedSeedId: null,
      stageEndsAt: null,
    }));

    window.setTimeout(() => {
      setFlyingLootItems([]);
    }, 1100);
  };

  const openRemoveModal = () => {
    if (!currentSlot?.unlocked) return;
    if (currentSlot.growStep === 0) return;

    setIsRemoveModalOpen(true);
  };

  const removePlant = () => {
    updateCurrentSlot((slot) => ({
      ...slot,
      growStep: 0,
      plantedSeedId: null,
      stageEndsAt: null,
    }));

    setIsRemoveModalOpen(false);
  };

  const openLockedSlot = (slotIndex) => {
    setLockedSlotIndex(slotIndex);
  };

  const closeAddPotModal = () => {
    setLockedSlotIndex(null);
  };

  const addNewPot = () => {
    if (lockedSlotIndex === null) return;

    setPlantSlots((previousSlots) =>
      previousSlots.map((slot, index) => {
        if (index !== lockedSlotIndex) {
          return slot;
        }

        return {
          ...slot,
          unlocked: true,
          growStep: 0,
          plantedSeedId: null,
          stageEndsAt: null,
        };
      })
    );

    setActiveSlotIndex(lockedSlotIndex);
    setLockedSlotIndex(null);
  };

  const deleteInventoryItem = (itemId, count) => {
    if (itemId !== "greenTomato") return;

    setInventory((previousInventory) => ({
      ...previousInventory,
      greenTomato: Math.max(
        0,
        (previousInventory.greenTomato || 0) -
          count
      ),
    }));
  };

  const openClub = () => {
    setActiveScreen("club");
  };

  const openShop = () => {
    setActiveScreen("shop");
  };

  const goBackToDistrict = () => {
    setActiveScreen("district");
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

            {currentSlot?.unlocked && (
              <>
                <GrowTimer
                  growStep={currentSlot.growStep}
                  timeLeft={timeLeft}
                />

                <ShovelTool
                  disabled={
                    currentSlot.growStep === 0
                  }
                  onClick={openRemoveModal}
                />

                <SeedBasket
                  onClick={openSeedModal}
                  disabled={
                    currentSlot.growStep !== 0
                  }
                />
              </>
            )}

            <BackpackTool
              onClick={() => setIsInventoryOpen(true)}
            />

            <FlyingLoot
              lootItems={flyingLootItems}
            />

            <div className="game-content">
              <div className="table-scene">
                <PlantationSlider
                  slots={plantSlots}
                  activeSlotIndex={
                    safeActiveSlotIndex
                  }
                  pot={currentPot}
                  plant={currentPlant}
                  canCollect={
                    currentSlot?.growStep === 3
                  }
                  onCollect={collectPlant}
                  onSelectSlot={selectPlantSlot}
                  onOpenLockedSlot={openLockedSlot}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                />
              </div>
            </div>

            <SeedModal
              isOpen={isSeedModalOpen}
              seeds={seeds}
              selectedSeed={selectedSeed}
              onSelectSeed={setSelectedSeed}
              onPlantSeed={plantSelectedSeed}
              onClose={closeSeedModal}
            />

            <RemovePlantModal
              isOpen={isRemoveModalOpen}
              onConfirm={removePlant}
              onCancel={() =>
                setIsRemoveModalOpen(false)
              }
            />

            <InventoryModal
              isOpen={isInventoryOpen}
              inventory={inventory}
              onClose={() =>
                setIsInventoryOpen(false)
              }
              onDeleteItem={deleteInventoryItem}
            />

            <AddPotModal
              isOpen={lockedSlotIndex !== null}
              slotNumber={
                lockedSlotIndex === null
                  ? 0
                  : lockedSlotIndex + 1
              }
              onConfirm={addNewPot}
              onClose={closeAddPotModal}
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
          <ShopScreen
            onGoBack={goBackToDistrict}
          />
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
              onGoPlantation={() =>
                setActiveScreen("plantation")
              }
              onGoDistrict={() =>
                setActiveScreen("district")
              }
            />
          )}
      </div>
    </div>
  );
}

export default GameScreen;