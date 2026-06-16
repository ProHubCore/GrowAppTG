const RELEASE_STATE_STORAGE_KEY = "growapp-release-state-version";
const MANUAL_RESET_REQUEST_KEY = "growapp-manual-reset-request";

// Меняй значение только тогда, когда всем игрокам действительно нужен новый старт.
const RELEASE_STATE_VERSION = "public-launch-grow-street-v3";

const PRESERVED_GAME_KEYS = new Set([
  RELEASE_STATE_STORAGE_KEY,
  "growapp-support-stars-total",
  "growapp-supporter",
]);

function shouldPreserveKey(key) {
  return (
    PRESERVED_GAME_KEYS.has(key) ||
    key.startsWith("growapp-support-")
  );
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

export function prepareReleaseState() {
  try {
    const manualResetRequested =
      window.localStorage.getItem(MANUAL_RESET_REQUEST_KEY) === "1";
    const savedVersion = window.localStorage.getItem(
      RELEASE_STATE_STORAGE_KEY,
    );

    if (!manualResetRequested && savedVersion === RELEASE_STATE_VERSION) {
      return false;
    }

    clearGameplayStorage();

    window.localStorage.setItem(
      RELEASE_STATE_STORAGE_KEY,
      RELEASE_STATE_VERSION,
    );

    return true;
  } catch (error) {
    console.warn("Не удалось подготовить чистый старт игры:", error);
    return false;
  }
}

export function requestGameProgressReset() {
  try {
    // Сброс выполняется до следующего монтирования React, чтобы текущие
    // состояния не успели повторно записаться в localStorage при перезагрузке.
    window.localStorage.setItem(MANUAL_RESET_REQUEST_KEY, "1");
    window.location.reload();
    return true;
  } catch (error) {
    console.warn("Не удалось запросить сброс игрового прогресса:", error);
    return false;
  }
}
