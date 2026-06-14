import { useState } from "react";
import { marketCustomers } from "../data/marketCustomers";

function getRandomCustomer() {
  const randomIndex = Math.floor(Math.random() * marketCustomers.length);
  return marketCustomers[randomIndex];
}

function MarketScreen({
  inventory,
  coins,
  onSellToCustomer,
  onGoHome,
}) {
  const [customer, setCustomer] = useState(() => getRandomCustomer());

  const playerAmount = inventory[customer.itemId] || 0;
  const canSell = playerAmount >= customer.amount;

  const changeCustomer = () => {
    setCustomer(getRandomCustomer());
  };

  const sell = () => {
    if (!canSell) return;

    onSellToCustomer(customer);
    setCustomer(getRandomCustomer());
  };

  return (
    <div className="market-screen">
      <div className="market-background" />

      <div className="top-wallet">
        🪙 {coins}
      </div>

      <button className="back-home-button" onClick={onGoHome}>
        ← Дом
      </button>

      <div className="market-title">
        Рынок
      </div>

      <div className="market-stall">
        <div className="market-counter" />

        <div className="customer-card">
          <div className="customer-avatar">
            {customer.avatar}
          </div>

          <div className="customer-name">
            {customer.name}
          </div>

          <div className="customer-text">
            “{customer.text}”
          </div>

          <div className="customer-order">
            <div className="order-item">
              Нужно: {customer.itemIcon} x{customer.amount}
            </div>

            <div className="order-have">
              У тебя: {playerAmount} / {customer.amount}
            </div>

            <div className="order-reward">
              Награда: 🪙 {customer.rewardCoins}
            </div>
          </div>

          <div className="market-actions">
            <button
              className="market-sell-button"
              onClick={sell}
              disabled={!canSell}
            >
              Продать
            </button>

            <button
              className="market-next-button"
              onClick={changeCustomer}
            >
              Следующий
            </button>
          </div>

          {!canSell && (
            <div className="market-warning">
              Не хватает помидоров
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MarketScreen;