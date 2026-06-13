import { useState } from "react";

import ClubDealModal from "./club/ClubDealModal";
import usePersistentState from "../hooks/usePersistentState";

import { createClubOrder } from "../utils/createClubOrder";

import "./ClubScreen.css";

function ClubScreen({
  inventory,
  setInventory,
  coins,
  setCoins,
  onGoBack,
}) {
  const [isDealOpen, setIsDealOpen] = useState(false);

  const [currentOrder, setCurrentOrder] =
    usePersistentState(
      "growapp-club-order",
      () => createClubOrder()
    );

  const handleSell = () => {
    if (!currentOrder) return;
    if (currentOrder.completed) return;

    const playerAmount =
      inventory[currentOrder.plantId] || 0;

    if (playerAmount < currentOrder.amount) return;

    const reward =
      currentOrder.amount *
        currentOrder.pricePerItem +
      currentOrder.bonus;

    setInventory((previousInventory) => ({
      ...previousInventory,

      [currentOrder.plantId]: Math.max(
        0,
        (previousInventory[currentOrder.plantId] || 0) -
          currentOrder.amount
      ),
    }));

    setCoins((previousCoins) => previousCoins + reward);

    setCurrentOrder((previousOrder) => ({
      ...previousOrder,
      completed: true,
    }));
  };

  const handleCreateNextOrder = () => {
    setCurrentOrder((previousOrder) =>
      createClubOrder(previousOrder?.id)
    );
  };

  return (
    <div className="club-screen">
      <img
        className="club-npc club-npc-smoker"
        src="/assets/club-characters/club-alien-smoker-01.png"
        alt="Типусиан"
      />

      <button
        className="club-back-hitbox"
        type="button"
        onClick={onGoBack}
        aria-label="Назад в район"
      />

      <div className="club-wallet">
        🪙 {coins}
      </div>

      <div className="club-dialog">
        <div className="club-speaker">
          Типусиан
        </div>

        <div className="club-text">
          Йо, земной фермер. Вайб ровный,
          музыка мягкая, народ ждёт свежачок.
          Принёс что-то интересное?
        </div>

        <div className="club-answers">
          <button
            className="club-answer-button"
            type="button"
            onClick={() => setIsDealOpen(true)}
          >
            Есть свежий урожай
          </button>

          <button
            className="club-answer-button secondary"
            type="button"
            onClick={onGoBack}
          >
            Я просто осмотреться
          </button>
        </div>
      </div>

      {isDealOpen && (
        <ClubDealModal
          order={currentOrder}
          inventory={inventory}
          onSell={handleSell}
          onClose={() => setIsDealOpen(false)}
          onCreateNextOrder={handleCreateNextOrder}
        />
      )}
    </div>
  );
}

export default ClubScreen;