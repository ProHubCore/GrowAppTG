export const plantationSlots = [
  { id: 1, unlockPrice: 0, requiredQuestId: null, requirementTitle: "Стартовое ведро", released: true },
  { id: 2, unlockPrice: 0, requiredQuestId: "maria-water-three", requirementTitle: "Заверши главу «Чужой двор»", released: true },
  { id: 3, unlockPrice: 420, requiredQuestId: "maria-club-rep-150", requirementTitle: "Заслужи разрешение Марии", released: true },
  { id: 4, unlockPrice: 900, requiredQuestId: "maria-club-rep-280", requirementTitle: "Докажи стабильное качество", released: true },
];

export function getPlantationSlotState(slot, mariaQuestState, isUnlocked = false) {
  if (!slot) return { canBuy:false, isQuestLocked:false, isReleased:false, statusText:"Пока недоступно", requirementText:"" };
  if (isUnlocked) return { canBuy:false, isQuestLocked:false, isReleased:true, statusText:"Открыто", requirementText:"" };
  if (!slot.released) return { canBuy:false, isQuestLocked:false, isReleased:false, statusText:"Пока недоступно", requirementText:"" };

  const completed = new Set(mariaQuestState?.completedQuestIds || []);
  const questLocked = Boolean(slot.requiredQuestId && !completed.has(slot.requiredQuestId));
  if (questLocked) {
    return {
      canBuy:false,
      isQuestLocked:true,
      isReleased:true,
      statusText: slot.requirementTitle || "Сначала выполни поручение Марии",
      requirementText:"Открой доску поручений в доме Марии Ивановны и заверши нужную главу.",
    };
  }

  const price = Math.max(0, Number(slot.unlockPrice) || 0);
  return {
    canBuy:true,
    isQuestLocked:false,
    isReleased:true,
    statusText: price > 0 ? `${price} монет` : "Мария отдаёт бесплатно",
    requirementText: price > 0 ? "Разрешение уже получено. Осталось оплатить установку обычными монетами." : "Награда уже заслужена — выбери тип ёмкости и установи её.",
  };
}
