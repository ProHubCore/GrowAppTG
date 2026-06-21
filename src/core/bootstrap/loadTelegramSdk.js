const TELEGRAM_SDK_URL = "https://telegram.org/js/telegram-web-app.js";
const SCRIPT_ID = "telegram-web-app-sdk";

export function ensureTelegramWebAppSdk(timeoutMs = 3_000) {
  if (typeof window === "undefined" || window.Telegram?.WebApp) {
    return Promise.resolve(Boolean(typeof window !== "undefined" && window.Telegram?.WebApp));
  }

  const search = new URLSearchParams(window.location.search);
  const looksLikeTelegram =
    search.has("tgWebAppData") ||
    search.has("tgWebAppVersion") ||
    search.has("tgWebAppPlatform") ||
    Boolean(window.location.hash.includes("tgWebAppData"));

  // В обычном браузере не задерживаем старт игры ожиданием внешнего SDK.
  if (!looksLikeTelegram) return Promise.resolve(false);

  return new Promise((resolve) => {
    let settled = false;
    let timeoutId = 0;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      resolve(Boolean(window.Telegram?.WebApp));
    };

    const existing = document.getElementById(SCRIPT_ID) ||
      document.querySelector(`script[src="${TELEGRAM_SDK_URL}"]`);

    const script = existing || document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = TELEGRAM_SDK_URL;
    script.async = true;
    script.onload = finish;
    script.onerror = finish;

    if (!existing) document.head.appendChild(script);

    timeoutId = window.setTimeout(finish, Math.max(1_000, timeoutMs));
  });
}
