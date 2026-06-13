import { useState } from "react";

import ClubDealer from "../components/club/ClubDealer";
import ClubDealModal from "../components/club/ClubDealModal";

import { createClubOrder } from "../utils/createClubOrder";

import "./ClubScreen.css";

function ClubScreen({
  inventory,
  setInventory,
  coins,
  setCoins,
  onBack,
}) {
  const [isDealOpen, setIsDealOpen] = useState(false);

  const [currentOrder, setCurrentOrder] = useState(() =>
    createClubOrder()
  );

  function handleOpenDealer() {
    setIsDealOpen(true);
  }

  function handleCloseDealer() {
    setIsDealOpen(false);
  }

  function handleSell() {
    if (!currentOrder || currentOrder.completed) return;

    const playerAmount =
      inventory[currentOrder.plantId] || 0;

    if (playerAmount < currentOrder.amount) return;

    const reward =
      currentOrder.amount * currentOrder.pricePerItem +
      currentOrder.bonus;

    setInventory((previousInventory) => ({
      ...previousInventory,

      [currentOrder.plantId]:
        previousInventory[currentOrder.plantId] -
        currentOrder.amount,
    }));

    setCoins((previousCoins) => previousCoins + reward);

    setCurrentOrder((previousOrder) => ({
      ...previousOrder,
      completed: true,
    }));
  }

  function handleCreateNextOrder() {
    setCurrentOrder((previousOrder) =>
      createClubOrder(previousOrder?.id)
    );
  }

  return (
    <div className="club-screen">
      <div className="club-screen__coins">
        {coins} монет
      </div>

      <button
        className="club-screen__back"
        type="button"
        onClick={onBack}
      >
        Назад
      </button>

      <ClubDealer onClick={handleOpenDealer} />

      {isDealOpen && (
        <ClubDealModal
          order={currentOrder}
          inventory={inventory}
          onSell={handleSell}
          onClose={handleCloseDealer}
          onCreateNextOrder={handleCreateNextOrder}
        />
      )}
    </div>
  );
}

export default ClubScreen;