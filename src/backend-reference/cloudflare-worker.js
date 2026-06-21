/**
 * Grow App monetization backend reference for Cloudflare Workers.
 *
 * Bindings:
 * - TELEGRAM_BOT_TOKEN (secret)
 * - TELEGRAM_WEBHOOK_SECRET (secret)
 * - GROWAPP_KV (KV namespace)
 * - GROWAPP_DB (D1 database; authoritative premium wallet)
 * - ALLOWED_ORIGIN (optional, e.g. https://growapptelegram.web.app)
 *
 * Deploy this file as a separate Worker. Never import it into the Vite client.
 */

const PRODUCTS = Object.freeze({
  "starter-kit": {
    title: "Стартовый набор",
    description: "80 монет роста, 3 раствора и тема Янтарная лаборатория",
    stars: 49,
    oneTime: true,
    entitlements: [
      { kind: "growth", amount: 80 },
      { kind: "care", id: "nutrition", amount: 3 },
      { kind: "cosmetic", id: "amber-lab", amount: 1 },
    ],
  },
  "grower-kit": {
    title: "Набор садовода",
    description: "108 ускорителей, 6 растворов, 2 смеси Марии и Фиолетовая тема",
    stars: 99,
    oneTime: true,
    entitlements: [
      { kind: "growth", amount: 108 },
      { kind: "care", id: "nutrition", amount: 6 },
      { kind: "care", id: "mariaMix", amount: 2 },
      { kind: "cosmetic", id: "violet-haze", amount: 1 },
    ],
  },
  "district-kit": {
    title: "Большой набор района",
    description: "320 ускорителей, 12 растворов, 6 смесей Марии и две темы",
    stars: 229,
    oneTime: true,
    entitlements: [
      { kind: "growth", amount: 320 },
      { kind: "care", id: "nutrition", amount: 12 },
      { kind: "care", id: "mariaMix", amount: 6 },
      { kind: "cosmetic", id: "amber-lab", amount: 1 },
      { kind: "cosmetic", id: "violet-haze", amount: 1 },
    ],
  },
  "growth-pocket": {
    title: "Карман ускорений",
    description: "30 монет роста",
    stars: 29,
    entitlements: [{ kind: "growth", amount: 30 }],
  },
  "growth-stash": {
    title: "Запас на неделю",
    description: "130 монет роста",
    stars: 99,
    entitlements: [{ kind: "growth", amount: 130 }],
  },
  "growth-vault": {
    title: "Большой запас",
    description: "380 монет роста",
    stars: 249,
    entitlements: [{ kind: "growth", amount: 380 }],
  },
  "amber-lab": {
    title: "Янтарная лаборатория",
    description: "Постоянная тема оформления Grow App",
    stars: 79,
    oneTime: true,
    entitlements: [{ kind: "cosmetic", id: "amber-lab", amount: 1 }],
  },
  "violet-haze": {
    title: "Фиолетовый туман",
    description: "Редкая постоянная тема оформления Grow App",
    stars: 129,
    oneTime: true,
    entitlements: [{ kind: "cosmetic", id: "violet-haze", amount: 1 }],
  },
});

const textEncoder = new TextEncoder();

function json(data, status = 200, request = null, env = null) {
  const origin = request?.headers.get("Origin") || "";
  const allowed = env?.ALLOWED_ORIGIN || "*";
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": allowed === "*" || origin === allowed ? (allowed === "*" ? "*" : origin) : allowed,
      "Access-Control-Allow-Headers": "Content-Type, X-Telegram-Init-Data, X-Telegram-Bot-Api-Secret-Token",
      "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    },
  });
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) mismatch |= a[index] ^ b[index];
  return mismatch === 0;
}

function hexToBytes(hex) {
  const clean = String(hex || "").trim();
  if (!/^[a-f0-9]{64}$/i.test(clean)) return new Uint8Array();
  return new Uint8Array(clean.match(/.{2}/g).map((value) => Number.parseInt(value, 16)));
}

async function hmac(key, data) {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    typeof key === "string" ? textEncoder.encode(key) : key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, textEncoder.encode(data)));
}

async function validateInitData(rawInitData, botToken, maxAgeSeconds = 3600) {
  if (!rawInitData || !botToken) throw new Error("INIT_DATA_MISSING");
  const params = new URLSearchParams(rawInitData);
  const receivedHash = hexToBytes(params.get("hash"));
  if (receivedHash.length !== 32) throw new Error("INIT_DATA_HASH_MISSING");

  params.delete("hash");
  params.delete("signature");
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  // Telegram: HMAC_SHA256(bot_token, key="WebAppData"), then HMAC over data-check-string.
  const secretKey = await hmac("WebAppData", botToken);
  const calculatedHash = await hmac(secretKey, dataCheckString);
  if (!timingSafeEqual(receivedHash, calculatedHash)) throw new Error("INIT_DATA_INVALID");

  const authDate = Number(params.get("auth_date"));
  if (!Number.isFinite(authDate) || (Date.now() / 1000) - authDate > maxAgeSeconds) {
    throw new Error("INIT_DATA_EXPIRED");
  }

  const user = JSON.parse(params.get("user") || "null");
  if (!user?.id) throw new Error("TELEGRAM_USER_MISSING");
  return { user, params };
}

async function telegramApi(env, method, payload) {
  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(`TELEGRAM_${method}_${data.description || response.status}`);
  return data.result;
}

async function readJson(request) {
  try { return await request.json(); } catch { return {}; }
}

async function getProfile(env, userId) {
  const saved = await env.GROWAPP_KV.get(`player:${userId}`, "json");
  return {
    premiumBalance: Math.max(0, Number(saved?.premiumBalance) || 0),
    ownedProducts: Array.isArray(saved?.ownedProducts) ? saved.ownedProducts : [],
    ownedCosmetics: Array.isArray(saved?.ownedCosmetics) ? saved.ownedCosmetics : ["classic"],
    careInventory: saved?.careInventory && typeof saved.careInventory === "object" ? saved.careInventory : {},
    fulfilledPurchases: Array.isArray(saved?.fulfilledPurchases) ? saved.fulfilledPurchases : [],
    ...saved,
  };
}

async function saveProfile(env, userId, profile) {
  await env.GROWAPP_KV.put(`player:${userId}`, JSON.stringify({ ...profile, updatedAt: new Date().toISOString() }));
}

async function mergePurchasedCareIntoProgress(env, userId, purchaseId, entitlements = []) {
  const careRewards = entitlements.filter((item) => item?.kind === "care" && item?.id);
  if (careRewards.length === 0) return;

  const grantKey = `progress-purchase-grant:${purchaseId}`;
  if (await env.GROWAPP_KV.get(grantKey)) return;

  const progressKey = `progress:${userId}`;
  const saved = await env.GROWAPP_KV.get(progressKey, "json");
  const snapshot = saved?.snapshot && typeof saved.snapshot === "object"
    ? saved.snapshot
    : {};
  const careInventory = snapshot.careInventory && typeof snapshot.careInventory === "object"
    ? { ...snapshot.careInventory }
    : {};

  for (const reward of careRewards) {
    const careId = String(reward.id || "");
    const amount = Math.max(0, Math.floor(Number(reward.amount) || 0));
    if (careId && amount > 0) {
      careInventory[careId] = (Number(careInventory[careId]) || 0) + amount;
    }
  }

  await env.GROWAPP_KV.put(progressKey, JSON.stringify({
    version: Math.max(2, Number(saved?.version) || 1),
    updatedAt: new Date().toISOString(),
    snapshot: { ...snapshot, careInventory },
  }));
  await env.GROWAPP_KV.put(grantKey, "1", { expirationTtl: 60 * 60 * 24 * 365 });
}

async function getWalletBalance(env, userId) {
  if (!env.GROWAPP_DB) throw new Error("GROWAPP_DB_MISSING");
  const row = await env.GROWAPP_DB.prepare(
    "SELECT premium_balance AS premiumBalance FROM wallets WHERE user_id = ?1",
  ).bind(String(userId)).first();
  return Math.max(0, Math.floor(Number(row?.premiumBalance) || 0));
}

async function applyWalletDeltaOnce(env, { ledgerId, userId, delta, reason, metadata = {} }) {
  if (!env.GROWAPP_DB) throw new Error("GROWAPP_DB_MISSING");
  const safeDelta = Math.trunc(Number(delta) || 0);
  if (!ledgerId || !userId || safeDelta === 0) return getWalletBalance(env, userId);

  try {
    await env.GROWAPP_DB.prepare(`
      INSERT INTO wallet_ledger
        (id, user_id, delta, reason, metadata_json, created_at)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6)
      ON CONFLICT(id) DO NOTHING
    `).bind(
      String(ledgerId),
      String(userId),
      safeDelta,
      String(reason || "unknown").slice(0, 80),
      JSON.stringify(metadata || {}).slice(0, 2000),
      new Date().toISOString(),
    ).run();
  } catch (error) {
    if (String(error?.message || error).includes("INSUFFICIENT_FUNDS")) {
      const insufficient = new Error("INSUFFICIENT_FUNDS");
      insufficient.premiumBalance = await getWalletBalance(env, userId);
      throw insufficient;
    }
    throw error;
  }

  return getWalletBalance(env, userId);
}

function getGrowthCredit(product) {
  return (product?.entitlements || []).reduce(
    (sum, item) => item?.kind === "growth" ? sum + Math.max(0, Math.floor(Number(item.amount) || 0)) : sum,
    0,
  );
}

function applyEntitlements(profile, product, purchaseId) {
  if (profile.fulfilledPurchases.includes(purchaseId)) return profile;
  const next = {
    ...profile,
    ownedProducts: [...new Set(profile.ownedProducts || [])],
    ownedCosmetics: [...new Set(["classic", ...(profile.ownedCosmetics || [])])],
    careInventory: { ...(profile.careInventory || {}) },
    fulfilledPurchases: [...(profile.fulfilledPurchases || []), purchaseId].slice(-300),
  };

  for (const item of product.entitlements) {
    // Premium currency is stored only in D1 and never trusted from KV/client snapshots.
    if (item.kind === "care" && item.id) next.careInventory[item.id] = (next.careInventory[item.id] || 0) + Math.max(0, Number(item.amount) || 0);
    if (item.kind === "cosmetic" && item.id) next.ownedCosmetics = [...new Set([...next.ownedCosmetics, item.id])];
  }
  if (product.oneTime) next.ownedProducts = [...new Set([...next.ownedProducts, product.id])];
  return next;
}

function parsePayload(payload) {
  const [prefix, purchaseId] = String(payload || "").split(":");
  return prefix === "growapp" && purchaseId ? purchaseId : null;
}

async function requirePlayer(request, env) {
  const initData = request.headers.get("X-Telegram-Init-Data") || "";
  return validateInitData(initData, env.TELEGRAM_BOT_TOKEN);
}

async function handleInvoice(request, env) {
  const { user } = await requirePlayer(request, env);
  const input = await readJson(request);
  const productData = PRODUCTS[String(input.productId || "")];
  if (!productData) return json({ error: "PRODUCT_NOT_FOUND" }, 404, request, env);
  const product = { ...productData, id: String(input.productId) };

  const profile = await getProfile(env, user.id);
  if (product.oneTime && profile.ownedProducts.includes(product.id)) {
    return json({ error: "PRODUCT_ALREADY_OWNED" }, 409, request, env);
  }

  const purchaseId = crypto.randomUUID();
  const payload = `growapp:${purchaseId}`;
  const invoiceUrl = await telegramApi(env, "createInvoiceLink", {
    title: product.title.slice(0, 32),
    description: product.description.slice(0, 255),
    payload,
    currency: "XTR",
    prices: [{ label: product.title.slice(0, 32), amount: product.stars }],
  });

  await env.GROWAPP_KV.put(`purchase:${purchaseId}`, JSON.stringify({
    purchaseId,
    userId: String(user.id),
    productId: product.id,
    stars: product.stars,
    status: "pending",
    createdAt: new Date().toISOString(),
  }), { expirationTtl: 60 * 60 * 24 * 14 });

  return json({ invoiceUrl, purchaseId }, 200, request, env);
}

async function handleVerify(request, env) {
  const { user } = await requirePlayer(request, env);
  const input = await readJson(request);
  const purchase = await env.GROWAPP_KV.get(`purchase:${input.purchaseId}`, "json");
  if (!purchase || purchase.userId !== String(user.id) || purchase.productId !== input.productId) {
    return json({ error: "PURCHASE_NOT_FOUND" }, 404, request, env);
  }
  if (purchase.status !== "paid") return json({ status: purchase.status }, 409, request, env);

  const profile = await getProfile(env, user.id);
  const product = PRODUCTS[purchase.productId];
  const premiumBalance = await getWalletBalance(env, user.id);
  return json({
    status: "paid",
    purchaseId: purchase.purchaseId,
    entitlements: product?.entitlements || [],
    premiumBalance,
    ownedProducts: profile.ownedProducts,
    ownedCosmetics: profile.ownedCosmetics,
  }, 200, request, env);
}

async function handleTelegramWebhook(request, env) {
  const secret = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
  if (env.TELEGRAM_WEBHOOK_SECRET && secret !== env.TELEGRAM_WEBHOOK_SECRET) {
    return json({ error: "WEBHOOK_FORBIDDEN" }, 403, request, env);
  }
  const update = await readJson(request);

  const commandText = String(update.message?.text || "").trim().split(/\s+/)[0].toLowerCase();
  const chatId = update.message?.chat?.id;
  if (chatId && ["/terms", "/terms@growappbot"].includes(commandText)) {
    const termsUrl = String(env.TERMS_URL || "").trim();
    const text = [
      "Условия покупок Grow App",
      "• цифровой товар выдаётся только после подтверждения Telegram Stars;",
      "• покупка привязана к Telegram-аккаунту;",
      "• при проблеме с оплатой используй /paysupport;",
      "• возврат рассматривается по идентификатору платежа.",
      termsUrl ? `Полные условия: ${termsUrl}` : "",
    ].filter(Boolean).join("\n");
    await telegramApi(env, "sendMessage", { chat_id: chatId, text });
    return json({ ok: true }, 200, request, env);
  }

  if (chatId && ["/support", "/paysupport", "/support@growappbot", "/paysupport@growappbot"].includes(commandText)) {
    const contact = String(env.SUPPORT_CONTACT || "@YOUR_SUPPORT").trim();
    await telegramApi(env, "sendMessage", {
      chat_id: chatId,
      text: `Поддержка покупок Grow App: ${contact}\nОпиши проблему и приложи дату покупки. Не отправляй никому код входа Telegram.`,
    });
    return json({ ok: true }, 200, request, env);
  }

  if (update.pre_checkout_query) {
    const query = update.pre_checkout_query;
    const purchaseId = parsePayload(query.invoice_payload);
    const purchase = purchaseId ? await env.GROWAPP_KV.get(`purchase:${purchaseId}`, "json") : null;
    const valid = Boolean(
      purchase &&
      purchase.status === "pending" &&
      purchase.userId === String(query.from?.id) &&
      query.currency === "XTR" &&
      Number(query.total_amount) === Number(purchase.stars),
    );

    await telegramApi(env, "answerPreCheckoutQuery", {
      pre_checkout_query_id: query.id,
      ok: valid,
      ...(valid ? {} : { error_message: "Заказ устарел или уже обработан. Открой магазин заново." }),
    });
    return json({ ok: true }, 200, request, env);
  }

  const payment = update.message?.successful_payment;
  if (payment) {
    const purchaseId = parsePayload(payment.invoice_payload);
    const purchase = purchaseId ? await env.GROWAPP_KV.get(`purchase:${purchaseId}`, "json") : null;
    if (!purchase) return json({ ok: true }, 200, request, env);

    const valid =
      purchase.userId === String(update.message.from?.id) &&
      payment.currency === "XTR" &&
      Number(payment.total_amount) === Number(purchase.stars);
    if (!valid) return json({ ok: true }, 200, request, env);

    if (purchase.status !== "paid") {
      const productData = PRODUCTS[purchase.productId];
      if (!productData) return json({ ok: true }, 200, request, env);
      const product = { ...productData, id: purchase.productId };
      const profile = await getProfile(env, purchase.userId);
      const nextProfile = applyEntitlements(profile, product, purchase.purchaseId);
      await saveProfile(env, purchase.userId, nextProfile);
      await mergePurchasedCareIntoProgress(
        env,
        purchase.userId,
        purchase.purchaseId,
        product.entitlements || [],
      );

      const growthCredit = getGrowthCredit(product);
      if (growthCredit > 0) {
        await applyWalletDeltaOnce(env, {
          ledgerId: `purchase:${purchase.purchaseId}`,
          userId: purchase.userId,
          delta: growthCredit,
          reason: "stars-purchase",
          metadata: { productId: purchase.productId, stars: purchase.stars },
        });
      }

      await env.GROWAPP_KV.put(`purchase:${purchase.purchaseId}`, JSON.stringify({
        ...purchase,
        status: "paid",
        paidAt: new Date().toISOString(),
        telegramPaymentChargeId: payment.telegram_payment_charge_id,
      }), { expirationTtl: 60 * 60 * 24 * 365 });
    }
  }

  return json({ ok: true }, 200, request, env);
}

async function handlePromo(request, env) {
  const { user } = await requirePlayer(request, env);
  const input = await readJson(request);
  const rawCode = String(input.code || "").trim();
  const code = rawCode.toUpperCase();

  const developerCode = String(env.DEVELOPER_ACCESS_CODE || "").trim();
  const ownerTelegramId = String(env.OWNER_TELEGRAM_ID || "").trim();
  if (developerCode && rawCode === developerCode) {
    if (!ownerTelegramId || String(user.id) !== ownerTelegramId) {
      return json({ error: "DEVELOPER_ONLY" }, 403, request, env);
    }

    const grantId = `developer-grant:${user.id}:${crypto.randomUUID()}`;
    const developerEntitlements = [
      { kind: "growth", amount: 100000 },
      { kind: "care", id: "nutrition", amount: 25 },
      { kind: "care", id: "mariaMix", amount: 25 },
      { kind: "cosmetic", id: "amber-lab", amount: 1 },
      { kind: "cosmetic", id: "violet-haze", amount: 1 },
    ];
    const profile = await getProfile(env, user.id);
    const nextProfile = applyEntitlements(
      profile,
      { id: grantId, oneTime: false, entitlements: developerEntitlements },
      grantId,
    );
    await saveProfile(env, user.id, nextProfile);
    await mergePurchasedCareIntoProgress(
      env,
      user.id,
      grantId,
      developerEntitlements,
    );

    const premiumBalance = await applyWalletDeltaOnce(env, {
      ledgerId: grantId,
      userId: user.id,
      delta: 100000,
      reason: "owner-developer-grant",
      metadata: { source: "owner-code" },
    });

    return json({
      ok: true,
      message: "Режим разработчика: тестовый запас выдан.",
      entitlements: developerEntitlements,
      premiumBalance,
    }, 200, request, env);
  }

  const campaign = code ? await env.GROWAPP_KV.get(`promo:${code}`, "json") : null;
  if (!campaign?.active) return json({ error: "PROMO_NOT_FOUND" }, 404, request, env);

  const redemptionKey = `promo-redemption:${code}:${user.id}`;
  if (await env.GROWAPP_KV.get(redemptionKey)) return json({ error: "PROMO_ALREADY_USED" }, 409, request, env);

  const profile = await getProfile(env, user.id);
  const fakeProduct = { id: `promo-${code}`, oneTime: false, entitlements: campaign.entitlements || [] };
  const purchaseId = `promo:${code}:${user.id}`;
  const nextProfile = applyEntitlements(profile, fakeProduct, purchaseId);
  await saveProfile(env, user.id, nextProfile);

  const growthCredit = getGrowthCredit(fakeProduct);
  const premiumBalance = growthCredit > 0
    ? await applyWalletDeltaOnce(env, {
        ledgerId: purchaseId,
        userId: user.id,
        delta: growthCredit,
        reason: "promo",
        metadata: { code },
      })
    : await getWalletBalance(env, user.id);

  await env.GROWAPP_KV.put(redemptionKey, "1");

  return json({
    ok: true,
    message: campaign.message || "Ключ применён.",
    entitlements: fakeProduct.entitlements,
    premiumBalance,
  }, 200, request, env);
}


async function handlePlayerProfile(request, env) {
  const { user } = await requirePlayer(request, env);
  const profile = await getProfile(env, user.id);
  const premiumBalance = await getWalletBalance(env, user.id);
  return json({
    premiumBalance,
    ownedProducts: profile.ownedProducts,
    ownedCosmetics: profile.ownedCosmetics,
  }, 200, request, env);
}

async function handlePremiumSpend(request, env) {
  const { user } = await requirePlayer(request, env);
  const input = await readJson(request);
  const reason = String(input.reason || "").trim();
  const amount = Math.max(1, Math.floor(Number(input.amount) || 0));
  const idempotencyKey = String(input.idempotencyKey || "").trim().slice(0, 180);

  const limits = {
    "instant-grow": { min: 1, max: 50 },
    "shop-refresh": { min: 8, max: 8 },
  };
  const rule = limits[reason];
  if (!rule || amount < rule.min || amount > rule.max || !idempotencyKey) {
    return json({ error: "PREMIUM_SPEND_INVALID" }, 400, request, env);
  }

  const ledgerId = `spend:${user.id}:${reason}:${idempotencyKey}`;
  try {
    const before = await env.GROWAPP_DB.prepare(
      "SELECT id FROM wallet_ledger WHERE id = ?1",
    ).bind(ledgerId).first();
    const premiumBalance = await applyWalletDeltaOnce(env, {
      ledgerId,
      userId: user.id,
      delta: -amount,
      reason,
      metadata: input.metadata && typeof input.metadata === "object" ? input.metadata : {},
    });
    return json({ ok: true, premiumBalance, repeated: Boolean(before) }, 200, request, env);
  } catch (error) {
    if (String(error?.message || error) === "INSUFFICIENT_FUNDS") {
      return json({
        error: "INSUFFICIENT_FUNDS",
        premiumBalance: Number.isFinite(error.premiumBalance)
          ? error.premiumBalance
          : await getWalletBalance(env, user.id),
      }, 409, request, env);
    }
    throw error;
  }
}

async function handleProgress(request, env) {
  const { user } = await requirePlayer(request, env);
  if (request.method === "GET") {
    const snapshot = await env.GROWAPP_KV.get(`progress:${user.id}`, "json");
    return json({ snapshot: snapshot || null }, 200, request, env);
  }

  const input = await readJson(request);
  const source = input.snapshot && typeof input.snapshot === "object" ? input.snapshot : {};
  // Never trust premium balance, purchases or entitlements from the client.
  const { premiumCoins, ownedProducts, ownedCosmetics, ...safeGameplay } = source;
  await env.GROWAPP_KV.put(`progress:${user.id}`, JSON.stringify({
    version: input.version || 1,
    updatedAt: new Date().toISOString(),
    snapshot: safeGameplay,
  }));
  return json({ ok: true }, 200, request, env);
}

async function handleAnalytics(request, env) {
  const { user } = await requirePlayer(request, env);
  const input = await readJson(request);
  const events = Array.isArray(input.events) ? input.events.slice(0, 30) : [];
  const day = new Date().toISOString().slice(0, 10);
  const key = `analytics:${day}:${user.id}:${crypto.randomUUID()}`;
  await env.GROWAPP_KV.put(key, JSON.stringify(events), { expirationTtl: 60 * 60 * 24 * 30 });
  return json({ ok: true }, 200, request, env);
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return json({ ok: true }, 200, request, env);
    const url = new URL(request.url);

    try {
      if (url.pathname === "/api/stars/invoice" && request.method === "POST") return handleInvoice(request, env);
      if (url.pathname === "/api/stars/verify" && request.method === "POST") return handleVerify(request, env);
      if (url.pathname === "/api/promo/redeem" && request.method === "POST") return handlePromo(request, env);
      if (url.pathname === "/api/player/profile" && request.method === "GET") return handlePlayerProfile(request, env);
      if (url.pathname === "/api/player/spend" && request.method === "POST") return handlePremiumSpend(request, env);
      if (url.pathname === "/api/player/progress" && ["GET", "PUT"].includes(request.method)) return handleProgress(request, env);
      if (url.pathname === "/api/analytics/events" && request.method === "POST") return handleAnalytics(request, env);
      if (url.pathname === "/telegram/webhook" && request.method === "POST") return handleTelegramWebhook(request, env);
      return json({ error: "NOT_FOUND" }, 404, request, env);
    } catch (error) {
      console.error(error);
      const message = String(error?.message || "SERVER_ERROR");
      const authError = message.startsWith("INIT_DATA") || message === "TELEGRAM_USER_MISSING";
      return json({ error: message }, authError ? 401 : 500, request, env);
    }
  },
};
