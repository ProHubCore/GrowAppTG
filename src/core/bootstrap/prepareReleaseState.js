const RELEASE_STATE_STORAGE_KEY = "growapp-release-state-version";

// Меняй значение только тогда, когда всем игрокам действительно нужен новый старт.
const RELEASE_STATE_VERSION = "public-launch-onboarding-v2";

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

export function prepareReleaseState() {
  try {
    const savedVersion = window.localStorage.getItem(
      RELEASE_STATE_STORAGE_KEY,
    );

    if (savedVersion === RELEASE_STATE_VERSION) {
      return false;
    }

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
