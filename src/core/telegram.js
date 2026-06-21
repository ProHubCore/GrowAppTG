const BROWSER_USER = {
  id: "browser-player",
  first_name: "Садовод",
  last_name: "",
  username: "",
  language_code: "ru",
  is_premium: false,
  photo_url: null,
};

function getTelegramWebApp() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.Telegram?.WebApp || null;
}

function normalizeTelegramUser(user) {
  if (!user) {
    return BROWSER_USER;
  }

  return {
    id: String(user.id),
    first_name: user.first_name || "Садовод",
    last_name: user.last_name || "",
    username: user.username || "",
    language_code: user.language_code || "ru",
    is_premium: Boolean(user.is_premium),
    photo_url: user.photo_url || null,
    allows_write_to_pm: Boolean(user.allows_write_to_pm),
  };
}

export function initializeTelegram() {
  const webApp = getTelegramWebApp();

  if (!webApp) {
    return {
      isTelegram: false,
      webApp: null,
      user: BROWSER_USER,
      initData: "",
      initDataUnsafe: {},
      startParam: "",
      platform: "browser",
      version: "browser",
      colorScheme: "dark",
    };
  }

  try {
    webApp.ready();
    webApp.expand();

    if (typeof webApp.disableVerticalSwipes === "function") {
      webApp.disableVerticalSwipes();
    }

    webApp.setHeaderColor?.("#16100c");
    webApp.setBackgroundColor?.("#16100c");
    webApp.setBottomBarColor?.("#16100c");
  } catch (error) {
    console.warn("Не удалось полностью инициализировать Telegram:", error);
  }

  const unsafeData = webApp.initDataUnsafe || {};
  const telegramUser = normalizeTelegramUser(unsafeData.user);

  return {
    isTelegram: true,
    webApp,
    user: telegramUser,
    initData: webApp.initData || "",
    initDataUnsafe: unsafeData,
    startParam:
      unsafeData.start_param ||
      new URLSearchParams(window.location.search).get("tgWebAppStartParam") ||
      "",
    platform: webApp.platform || "unknown",
    version: webApp.version || "unknown",
    colorScheme: webApp.colorScheme || "dark",
  };
}

export function getTelegramPlayer() {
  return initializeTelegram();
}

export function getTelegramUserId() {
  return getTelegramPlayer().user.id;
}

export function getTelegramInitData() {
  return getTelegramPlayer().initData;
}

export function hasTelegramSession() {
  const player = getTelegramPlayer();
  return Boolean(
    player.isTelegram &&
    player.initData &&
    player.user?.id &&
    player.user.id !== BROWSER_USER.id,
  );
}

export function canOpenTelegramInvoice() {
  const player = getTelegramPlayer();
  // openInvoice — главный признак, что окно Telegram Stars доступно.
  // Старые рабочие Mini App-запуски могли не отдавать initData клиенту,
  // поэтому не блокируем само окно оплаты из-за отсутствия initData.
  return Boolean(player.isTelegram && player.webApp?.openInvoice);
}

export function triggerTelegramHaptic(style = "light") {
  const webApp = getTelegramWebApp();

  try {
    webApp?.HapticFeedback?.impactOccurred(style);
  } catch {
    // В обычном браузере вибрации Telegram нет.
  }
}

export function triggerTelegramNotification(type = "success") {
  const webApp = getTelegramWebApp();

  try {
    webApp?.HapticFeedback?.notificationOccurred(type);
  } catch {
    // В обычном браузере ничего не делаем.
  }
}