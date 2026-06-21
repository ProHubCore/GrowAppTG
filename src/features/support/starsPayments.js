import { RUNTIME_CONFIG } from "../../core/config/runtimeConfig";
import { fetchWithTimeout } from "../../core/net/fetchWithTimeout";
import {
  canOpenTelegramInvoice,
  getTelegramInitData,
  getTelegramPlayer,
  hasTelegramSession,
  triggerTelegramNotification,
} from "../../core/telegram";

const invoiceEndpoint = RUNTIME_CONFIG.starsInvoiceEndpoint;
const verifyEndpoint = RUNTIME_CONFIG.starsVerifyEndpoint;
const promoEndpoint = RUNTIME_CONFIG.promoRedeemEndpoint;
const profileEndpoint = RUNTIME_CONFIG.playerProfileEndpoint;
const premiumSpendEndpoint = RUNTIME_CONFIG.premiumSpendEndpoint;

const LOCAL_SPEND_LEDGER_KEY = "growapp-local-premium-spend-ledger-v1";

function getWebApp() {
  return getTelegramPlayer().webApp;
}

function requestHeaders() {
  return {
    "Content-Type": "application/json",
    "X-Telegram-Init-Data": getTelegramInitData(),
  };
}

function getGrowthAmount(product) {
  return (product?.contents || []).reduce(
    (total, item) => total + ((item?.kind || item?.type) === "growth" ? Math.max(0, Math.floor(Number(item.amount) || 0)) : 0),
    0,
  );
}

function readLocalSpendLedger() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LOCAL_SPEND_LEDGER_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeLocalSpendLedger(ledger) {
  try {
    const entries = Object.entries(ledger || {}).slice(-250);
    window.localStorage.setItem(LOCAL_SPEND_LEDGER_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch {
    // Игра продолжает работать даже при недоступном localStorage.
  }
}

function localSpend({ amount, idempotencyKey, currentBalance }) {
  const safeBalance = Math.max(0, Math.floor(Number(currentBalance) || 0));
  const safeAmount = Math.max(1, Math.floor(Number(amount) || 0));
  const ledger = readLocalSpendLedger();

  if (ledger[idempotencyKey]) {
    return {
      premiumBalance: Math.max(0, Math.floor(Number(ledger[idempotencyKey].premiumBalance) || 0)),
      repeated: true,
      localFallback: true,
    };
  }

  if (safeBalance < safeAmount) {
    const error = new Error("INSUFFICIENT_FUNDS");
    error.code = "INSUFFICIENT_FUNDS";
    error.serverBalance = safeBalance;
    throw error;
  }

  const premiumBalance = safeBalance - safeAmount;
  ledger[idempotencyKey] = { premiumBalance, amount: safeAmount, createdAt: Date.now() };
  writeLocalSpendLedger(ledger);
  return { premiumBalance, repeated: false, localFallback: true };
}

export function getStarsConfiguration() {
  const telegramSession = hasTelegramSession();
  const invoiceUi = canOpenTelegramInvoice();
  const telegram = Boolean(getTelegramPlayer().isTelegram);

  // Для открытия оплаты нужен Telegram openInvoice и endpoint создания invoice.
  // initData обязателен для нового backend, но старый рабочий endpoint мог
  // создавать invoice без него, поэтому не блокируем кнопку заранее.
  const ready = Boolean(invoiceEndpoint && invoiceUi);

  return {
    invoice: Boolean(invoiceEndpoint),
    verify: Boolean(verifyEndpoint),
    promo: Boolean(promoEndpoint && telegramSession),
    profile: Boolean(profileEndpoint && telegramSession),
    spend: Boolean(premiumSpendEndpoint && telegramSession),
    telegram,
    telegramSession,
    invoiceUi,
    endpointsReady: Boolean(invoiceEndpoint),
    ready,
    reason: !telegram || !invoiceUi
      ? "OPEN_IN_TELEGRAM"
      : !invoiceEndpoint
        ? "BACKEND_UNAVAILABLE"
        : null,
  };
}

export function isStarsPaymentConfigured() {
  return getStarsConfiguration().ready;
}

async function postInvoice(body) {
  const response = await fetchWithTimeout(invoiceEndpoint, {
    method: "POST",
    headers: requestHeaders(),
    body: JSON.stringify(body),
  }, 15_000);

  const data = await response.json().catch(() => ({}));
  return { response, data };
}

export async function createStarsInvoice(input) {
  if (!canOpenTelegramInvoice()) throw new Error("TELEGRAM_OPEN_INVOICE_UNAVAILABLE");
  if (!invoiceEndpoint) throw new Error("STARS_INVOICE_ENDPOINT_MISSING");

  const product = input?.product || input;
  const productId = String(product?.id || input?.productId || "").trim();
  const stars = Math.max(1, Math.floor(Number(product?.stars ?? input?.stars) || 1));
  const premiumCoins = Math.max(0, Math.floor(Number(input?.premiumCoins ?? getGrowthAmount(product)) || 0));

  if (!productId) throw new Error("STARS_PRODUCT_ID_MISSING");

  // Новая безопасная схема.
  let modern;
  try {
    modern = await postInvoice({
      productId,
      amount: stars,
      clientVersion: "monetization-v2-compatible",
    });
  } catch (error) {
    modern = { response: null, data: {}, error };
  }

  if (modern.response?.ok) {
    const invoiceUrl = modern.data.invoiceUrl || modern.data.invoice_url || modern.data.url;
    if (invoiceUrl) {
      return {
        invoiceUrl,
        purchaseId: modern.data.purchaseId || modern.data.purchase_id || modern.data.orderId || null,
        mode: modern.data.purchaseId || modern.data.purchase_id || modern.data.orderId ? "secure" : "legacy",
      };
    }
  }

  // Совместимость с тем endpoint, на котором покупки работали раньше.
  // Он принимал growapp-premium-coins + packageId и мог не возвращать purchaseId.
  const legacyPayload = `growapp-premium-${productId}-${stars}-${premiumCoins}-${Date.now()}`;
  let legacy;
  try {
    legacy = await postInvoice({
      amount: stars,
      stars,
      productId: "growapp-premium-coins",
      packageId: productId,
      premiumCoins,
      payload: legacyPayload,
      title: String(product?.title || productId).slice(0, 32),
      description: String(product?.cardLine || product?.subtitle || "Покупка в Grow App").slice(0, 255),
    });
  } catch (error) {
    const original = modern.error || error;
    throw original instanceof Error ? original : new Error("STARS_INVOICE_NETWORK_FAILED");
  }

  if (!legacy.response.ok) {
    const reason = legacy.data.error || modern.data?.error || `STARS_INVOICE_FAILED_${legacy.response.status}`;
    throw new Error(reason);
  }

  const invoiceUrl = legacy.data.invoiceUrl || legacy.data.invoice_url || legacy.data.url;
  if (!invoiceUrl) throw new Error("STARS_INVOICE_URL_MISSING");

  return {
    invoiceUrl,
    purchaseId: legacy.data.purchaseId || legacy.data.purchase_id || legacy.data.orderId || null,
    mode: "legacy",
  };
}

export function openStarsInvoice(invoiceUrl) {
  return new Promise((resolve, reject) => {
    const webApp = getWebApp();

    if (!webApp?.openInvoice) {
      reject(new Error("TELEGRAM_OPEN_INVOICE_UNAVAILABLE"));
      return;
    }

    try {
      webApp.openInvoice(invoiceUrl, (status) => {
        if (status === "paid") triggerTelegramNotification("success");
        resolve(status);
      });
    } catch (error) {
      reject(error);
    }
  });
}

const wait = (milliseconds) => new Promise((resolve) => {
  window.setTimeout(resolve, milliseconds);
});

export async function verifyStarsPurchase({ purchaseId, productId }) {
  if (!hasTelegramSession()) throw new Error("TELEGRAM_SESSION_REQUIRED");
  if (!verifyEndpoint || !purchaseId) throw new Error("STARS_VERIFY_ENDPOINT_MISSING");

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const response = await fetchWithTimeout(verifyEndpoint, {
      method: "POST",
      headers: requestHeaders(),
      body: JSON.stringify({ purchaseId, productId }),
    }, 12_000);
    const data = await response.json().catch(() => ({}));

    if (response.ok && (data.status === "paid" || data.paid === true)) {
      return {
        purchaseId,
        productId,
        entitlements: Array.isArray(data.entitlements) ? data.entitlements : [],
        serverBalance: Number.isFinite(Number(data.premiumBalance))
          ? Math.max(0, Math.floor(Number(data.premiumBalance)))
          : null,
      };
    }

    const stillPending = response.status === 409 || data.status === "pending";
    if (!stillPending) {
      throw new Error(data.error || `STARS_VERIFY_FAILED_${response.status}`);
    }

    if (attempt < 7) await wait(450 + attempt * 180);
  }

  throw new Error("STARS_PAYMENT_NOT_CONFIRMED");
}

export async function purchaseStarsProduct(product) {
  if (!product?.id || !product?.stars) throw new Error("INVALID_STORE_PRODUCT");

  const invoice = await createStarsInvoice({
    product,
    productId: product.id,
    stars: product.stars,
    premiumCoins: getGrowthAmount(product),
  });
  const invoiceStatus = await openStarsInvoice(invoice.invoiceUrl);

  if (invoiceStatus !== "paid") {
    return { status: invoiceStatus || "closed", verified: false };
  }

  // Если новый backend доступен — используем его подтверждённый баланс.
  if (invoice.purchaseId && verifyEndpoint) {
    try {
      const verified = await verifyStarsPurchase({
        purchaseId: invoice.purchaseId,
        productId: product.id,
      });
      return { status: "paid", verified: true, mode: "secure", ...verified };
    } catch (error) {
      console.warn("Grow App secure verify unavailable, using Telegram paid callback compatibility:", error);
    }
  }

  // Старый рабочий backend не имел /verify. Telegram уже вернул paid,
  // поэтому восстанавливаем прежнее начисление клиента.
  return {
    status: "paid",
    verified: true,
    mode: "telegram-paid-compat",
    purchaseId: invoice.purchaseId || `telegram-paid-${product.id}-${Date.now()}`,
    productId: product.id,
    entitlements: Array.isArray(product.contents) ? product.contents : [],
    serverBalance: null,
  };
}

export async function redeemServerPromo(code) {
  if (!hasTelegramSession()) throw new Error("TELEGRAM_SESSION_REQUIRED");
  if (!promoEndpoint) throw new Error("PROMO_ENDPOINT_MISSING");

  const normalizedCode = String(code || "").trim().toUpperCase();
  if (!normalizedCode) throw new Error("PROMO_CODE_EMPTY");

  const response = await fetchWithTimeout(promoEndpoint, {
    method: "POST",
    headers: requestHeaders(),
    body: JSON.stringify({ code: normalizedCode }),
  }, 12_000);

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `PROMO_REDEEM_FAILED_${response.status}`);
  }

  return {
    entitlements: Array.isArray(data.entitlements) ? data.entitlements : [],
    serverBalance: Number.isFinite(Number(data.premiumBalance))
      ? Math.max(0, Math.floor(Number(data.premiumBalance)))
      : null,
    message: data.message || "Ключ применён.",
  };
}

export async function fetchSecurePlayerProfile() {
  if (!profileEndpoint || !hasTelegramSession()) return null;

  try {
    const response = await fetchWithTimeout(profileEndpoint, {
      method: "GET",
      headers: requestHeaders(),
    }, 8_000);

    if (!response.ok) return null;
    const data = await response.json();
    return {
      premiumBalance: Math.max(0, Math.floor(Number(data.premiumBalance) || 0)),
      ownedProducts: Array.isArray(data.ownedProducts) ? data.ownedProducts.map(String) : [],
      ownedCosmetics: Array.isArray(data.ownedCosmetics) ? data.ownedCosmetics.map(String) : ["classic"],
    };
  } catch {
    return null;
  }
}

export async function spendPremiumCurrency({
  amount,
  reason,
  idempotencyKey,
  metadata = {},
  currentBalance = 0,
  allowLocalFallback = true,
}) {
  const safeAmount = Math.max(1, Math.floor(Number(amount) || 0));
  const safeReason = String(reason || "").trim();
  const safeKey = String(idempotencyKey || "").trim();
  if (!safeReason || !safeKey) throw new Error("PREMIUM_SPEND_INPUT_INVALID");

  if (premiumSpendEndpoint && hasTelegramSession()) {
    try {
      const response = await fetchWithTimeout(premiumSpendEndpoint, {
        method: "POST",
        headers: requestHeaders(),
        body: JSON.stringify({
          amount: safeAmount,
          reason: safeReason,
          idempotencyKey: safeKey,
          metadata,
        }),
      }, 12_000);
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        return {
          premiumBalance: Math.max(0, Math.floor(Number(data.premiumBalance) || 0)),
          repeated: Boolean(data.repeated),
          localFallback: false,
        };
      }

      // Старые покупки могли быть начислены локально и отсутствовать в новом D1.
      // Не блокируем игру, если локальный кошелёк действительно содержит валюту.
      if (!allowLocalFallback || Math.max(0, Math.floor(Number(currentBalance) || 0)) < safeAmount) {
        const error = new Error(data.error || `PREMIUM_SPEND_FAILED_${response.status}`);
        error.code = data.error || "PREMIUM_SPEND_FAILED";
        error.serverBalance = Number.isFinite(Number(data.premiumBalance))
          ? Math.max(0, Math.floor(Number(data.premiumBalance)))
          : null;
        throw error;
      }
    } catch (error) {
      if (!allowLocalFallback) throw error;
    }
  }

  return localSpend({
    amount: safeAmount,
    idempotencyKey: safeKey,
    currentBalance,
  });
}
