const DEFAULT_API_BASE = "https://growapp-stars-api.prohubmain.workers.dev";

function cleanUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function getWindowConfig() {
  if (typeof window === "undefined") return {};
  const config = window.__GROWAPP_CONFIG__;
  return config && typeof config === "object" ? config : {};
}

const windowConfig = getWindowConfig();
const apiBase = cleanUrl(
  import.meta.env.VITE_GROWAPP_API_BASE ||
  windowConfig.apiBase ||
  DEFAULT_API_BASE,
);

function endpoint(envValue, configKey, path) {
  const explicit = cleanUrl(envValue || windowConfig[configKey]);
  return explicit || `${apiBase}${path}`;
}

export const RUNTIME_CONFIG = Object.freeze({
  apiBase,
  starsInvoiceEndpoint: endpoint(
    import.meta.env.VITE_STARS_INVOICE_ENDPOINT,
    "starsInvoiceEndpoint",
    "/api/stars/invoice",
  ),
  starsVerifyEndpoint: endpoint(
    import.meta.env.VITE_STARS_VERIFY_ENDPOINT,
    "starsVerifyEndpoint",
    "/api/stars/verify",
  ),
  promoRedeemEndpoint: endpoint(
    import.meta.env.VITE_PROMO_REDEEM_ENDPOINT,
    "promoRedeemEndpoint",
    "/api/promo/redeem",
  ),
  playerProfileEndpoint: endpoint(
    import.meta.env.VITE_PLAYER_PROFILE_ENDPOINT,
    "playerProfileEndpoint",
    "/api/player/profile",
  ),
  premiumSpendEndpoint: endpoint(
    import.meta.env.VITE_PREMIUM_SPEND_ENDPOINT,
    "premiumSpendEndpoint",
    "/api/player/spend",
  ),
  playerProgressEndpoint: endpoint(
    import.meta.env.VITE_PLAYER_PROGRESS_ENDPOINT,
    "playerProgressEndpoint",
    "/api/player/progress",
  ),
  analyticsEndpoint: endpoint(
    import.meta.env.VITE_ANALYTICS_ENDPOINT,
    "analyticsEndpoint",
    "/api/analytics/events",
  ),
});

export function getRuntimeConfig() {
  return RUNTIME_CONFIG;
}
