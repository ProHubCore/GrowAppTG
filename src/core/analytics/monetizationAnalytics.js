import { RUNTIME_CONFIG } from "../config/runtimeConfig";
import {
  getTelegramInitData,
  getTelegramUserId,
  hasTelegramSession,
} from "../telegram";
import { fetchWithTimeout } from "../net/fetchWithTimeout";

const analyticsEndpoint = RUNTIME_CONFIG.analyticsEndpoint;
const STORAGE_KEY = "growapp-analytics-buffer-v2";
const LEGACY_STORAGE_KEY = "growapp-analytics-buffer-v1";
const MAX_BUFFER = 80;

function getPlayerId() {
  try {
    return String(getTelegramUserId() || "browser-player");
  } catch {
    return "browser-player";
  }
}

function readBuffer() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY) || "[]";
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(-MAX_BUFFER) : [];
  } catch {
    return [];
  }
}

function writeBuffer(events) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-MAX_BUFFER)));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Analytics must never break the game.
  }
}

function canSendAnalytics() {
  return Boolean(analyticsEndpoint && hasTelegramSession());
}

async function sendEvents(events, keepalive = false) {
  if (!canSendAnalytics() || events.length === 0) return false;

  const response = await fetchWithTimeout(analyticsEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Telegram-Init-Data": getTelegramInitData(),
    },
    body: JSON.stringify({ events }),
    keepalive,
  }, 6_000);

  return response.ok;
}

export function trackGameEvent(name, payload = {}) {
  const event = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: String(name || "unknown"),
    playerId: getPlayerId(),
    createdAt: new Date().toISOString(),
    payload: payload && typeof payload === "object" ? payload : {},
  };

  writeBuffer([...readBuffer(), event]);

  // Отправка идёт через fetch, потому что сервер валидирует Telegram initData
  // в заголовке. sendBeacon не позволяет надёжно передать этот заголовок.
  if (canSendAnalytics()) {
    sendEvents([event], true).catch(() => {});
  }
}

export async function flushGameAnalytics() {
  const events = readBuffer();
  if (events.length === 0) return true;
  if (!canSendAnalytics()) return false;

  try {
    const success = await sendEvents(events, true);
    if (success) writeBuffer([]);
    return success;
  } catch {
    return false;
  }
}
