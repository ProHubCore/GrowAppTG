import { clubOrders } from "../data/clubOrders";

export function createClubOrder(previousOrderId = null) {
  let availableOrders = clubOrders;

  if (clubOrders.length > 1 && previousOrderId) {
    availableOrders = clubOrders.filter(
      (order) => order.id !== previousOrderId
    );
  }

  const randomIndex = Math.floor(Math.random() * availableOrders.length);
  const selectedOrder = availableOrders[randomIndex];

  const randomPhraseIndex = Math.floor(
    Math.random() * selectedOrder.phrases.length
  );

  return {
    ...selectedOrder,
    phrase: selectedOrder.phrases[randomPhraseIndex],
    completed: false,
  };
}