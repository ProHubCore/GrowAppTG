import { useEffect, useState } from "react";
import PlantArea from "./PlantArea";
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

import { pots } from "../data/pots";
import { plants } from "../data/plants";
import { seeds } from "../data/seeds";

const GROW_TIME = 5;

const STAGE_WIDTH = 390;
const STAGE_HEIGHT = 844;

function GameScreen() {
  const [currentPotIndex, setCurrentPotIndex] = useState(0);

  const [growStep, setGrowStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GROW_TIME);

  const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);
  const [selectedSeed, setSelectedSeed] = useState(null);

  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);

  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
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

  const [activeScreen, setActiveScreen] = useState("plantation");
  const [flyingLootItems, setFlyingLootItems] = useState([]);
  const [stageScale, setStageScale] = useState(1);

  const currentPot = pots[currentPotIndex];

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
      const viewportWidth = window.visualViewport?.width || window.innerWidth;
      const scale = viewportWidth / STAGE_WIDTH;

      setStageScale(scale);
    };

    updateScale();

    window.addEventListener("resize", updateScale);
    window.visualViewport?.addEventListener("resize", updateScale);

    const resetGameProgress = () => {
  localStorage.removeItem("growapp-inventory");
  localStorage.removeItem("growapp-coins");
  localStorage.removeItem("growapp-club-order");

  window.location.reload();
};

    return () => {
      window.removeEventListener("resize", updateScale);
      window.visualViewport?.removeEventListener("resize", updateScale);
    };
  }, []);

  useEffect(() => {
    if (growStep !== 1 && growStep !== 2) return;

    setTimeLeft(GROW_TIME);

    const countdown = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    const growTimeout = setTimeout(() => {
      setGrowStep((prevStep) => {
        if (prevStep === 1) {
          return 2;
        }

        if (prevStep === 2) {
          return 3;
        }

        return prevStep;
      });
    }, GROW_TIME * 1000);

    return () => {
      clearInterval(countdown);
      clearTimeout(growTimeout);
    };
  }, [growStep]);

  const changePot = () => {
    setCurrentPotIndex((prev) => (prev + 1) % pots.length);
  };

  const openSeedModal = () => {
    if (growStep !== 0) return;

    setSelectedSeed(null);
    setIsSeedModalOpen(true);
  };

  const closeSeedModal = () => {
    setSelectedSeed(null);
    setIsSeedModalOpen(false);
  };

  const plantSelectedSeed = () => {
    if (!selectedSeed) return;

    setGrowStep(1);
    setTimeLeft(GROW_TIME);
    setIsSeedModalOpen(false);
    setSelectedSeed(null);
  };

  const collectPlant = () => {
    if (growStep !== 3) return;

    const reward = Math.floor(Math.random() * 3) + 1;

    const newLootItems = Array.from({ length: reward }, (_, index) => ({
      id: `${Date.now()}-${index}`,
      startX: 190 + index * 12,
      startY: 470 - index * 8,
      delay: index * 120,
    }));

    setFlyingLootItems(newLootItems);

    setInventory((prev) => ({
      ...prev,
      greenTomato: prev.greenTomato + reward,
    }));

    setGrowStep(0);
    setTimeLeft(GROW_TIME);

    setTimeout(() => {
      setFlyingLootItems([]);
    }, 1100);
  };

  const openRemoveModal = () => {
    if (growStep === 0) return;

    setIsRemoveModalOpen(true);
  };

  const closeRemoveModal = () => {
    setIsRemoveModalOpen(false);
  };

  const removePlant = () => {
    setGrowStep(0);
    setTimeLeft(GROW_TIME);
    setIsRemoveModalOpen(false);
  };

  const openInventory = () => {
    setIsInventoryOpen(true);
  };

  const closeInventory = () => {
    setIsInventoryOpen(false);
  };

  const deleteInventoryItem = (itemId, count) => {
    if (itemId !== "greenTomato") return;

    setInventory((prev) => ({
      ...prev,
      greenTomato: Math.max(0, prev.greenTomato - count),
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

            <div className="top-wallet">🪙 {coins}</div>

            <GrowTimer growStep={growStep} timeLeft={timeLeft} />

            <ShovelTool disabled={growStep === 0} onClick={openRemoveModal} />

            <BackpackTool onClick={openInventory} />

            <FlyingLoot lootItems={flyingLootItems} />

            <div className="game-content">
              <div className="table-scene">
                <SeedBasket onClick={openSeedModal} disabled={growStep !== 0} />

                <PlantArea
                  pot={currentPot}
                  plant={currentPlant}
                  canCollect={growStep === 3}
                  onCollect={collectPlant}
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
              onCancel={closeRemoveModal}
            />

            <InventoryModal
              isOpen={isInventoryOpen}
              inventory={inventory}
              onClose={closeInventory}
              onDeleteItem={deleteInventoryItem}
            />
          </>
        )}

        {activeScreen === "district" && (
          <DistrictScreen onOpenClub={openClub} onOpenShop={openShop} />
        )}

        {activeScreen === "shop" && (
          <ShopScreen onGoBack={goBackToDistrict} />
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

        {activeScreen !== "shop" && activeScreen !== "club" && (
          <BottomMenu
            activeScreen={activeScreen}
            onGoPlantation={() => setActiveScreen("plantation")}
            onGoDistrict={() => setActiveScreen("district")}
            onChangePot={changePot}
          />
        )}
      </div>
    </div>
  );
}

export default GameScreen;