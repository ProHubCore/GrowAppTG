const RELEASE_STATE_STORAGE_KEY = "growapp-release-state-version";
const MANUAL_RESET_REQUEST_KEY = "growapp-manual-reset-request";
export const SKIP_CLOUD_RESTORE_ONCE_KEY = "growapp-skip-cloud-restore-once";
const RELEASE_STATE_VERSION = "public-launch-1.0.0";

// Покупки и постоянная косметика принадлежат аккаунту и не должны исчезать
// даже после ручного сброса игрового прохождения.
const PRESERVED_GAME_KEYS = new Set([
  RELEASE_STATE_STORAGE_KEY,
  "growapp-support-stars-total",
  "growapp-supporter",
  "growapp-premium-coins",
  "growapp-premium-stars-total",
  "growapp-owned-products-v1",
  "growapp-owned-cosmetics-v1",
  "growapp-active-cosmetic-v1",
  "growapp-payment-profile-v1",
]);

function shouldPreserveKey(key) {
  return (
    PRESERVED_GAME_KEYS.has(key) ||
    key.startsWith("growapp-support-") ||
    key.startsWith("growapp-payment-")
  );
}

function migrateLegacyDemoCurrency() {
  try {
    const savedBalance = Number(window.localStorage.getItem("growapp-premium-coins"));
    const ownedProducts = JSON.parse(
      window.localStorage.getItem("growapp-owned-products-v1") || "[]",
    );
    const hasPaidEntitlements =
      (Array.isArray(ownedProducts) && ownedProducts.length > 0) ||
      Boolean(window.localStorage.getItem("growapp-payment-profile-v1"));

    // Очень старые сборки выдавали каждому игроку 1000 платных монет.
    // Убираем только этот демонстрационный баланс и не трогаем покупки.
    if (savedBalance === 1000 && !hasPaidEntitlements) {
      window.localStorage.setItem("growapp-premium-coins", "0");
    }
  } catch {
    // Миграция не должна мешать запуску игры.
  }
}

function clearGameplayStorage() {
  const keys = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key) keys.push(key);
  }

  for (const key of keys) {
    const isGameplayState =
      key.startsWith("growapp-") ||
      key === "grow-shop-seen-stock-v1";

    if (isGameplayState && !shouldPreserveKey(key)) {
      window.localStorage.removeItem(key);
    }
  }
}

function removeObsoleteTodoKeys() {
  try {
    const keys = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key) keys.push(key);
    }

    keys
      .filter((key) => /^(rezhim|todo|task-manager)-/i.test(key))
      .forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Старые ключи не влияют на игру, если storage недоступен.
  }
}

export function prepareReleaseState() {
  try {
    const manualResetRequested =
      window.localStorage.getItem(MANUAL_RESET_REQUEST_KEY) === "1";

    migrateLegacyDemoCurrency();
    removeObsoleteTodoKeys();

    if (manualResetRequested) {
      clearGameplayStorage();
      window.localStorage.removeItem(MANUAL_RESET_REQUEST_KEY);
      window.localStorage.setItem(SKIP_CLOUD_RESTORE_ONCE_KEY, "1");
    }

    // Обновление версии больше не стирает прохождение автоматически.
    window.localStorage.setItem(
      RELEASE_STATE_STORAGE_KEY,
      RELEASE_STATE_VERSION,
    );

    return manualResetRequested;
  } catch (error) {
    console.warn("Не удалось подготовить состояние игры:", error);
    return false;
  }
}

export function requestGameProgressReset() {
  try {
    window.localStorage.setItem(MANUAL_RESET_REQUEST_KEY, "1");
    window.location.reload();
    return true;
  } catch (error) {
    console.warn("Не удалось запросить сброс игрового прогресса:", error);
    return false;
  }
}
