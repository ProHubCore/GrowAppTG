import { RUNTIME_CONFIG } from "../config/runtimeConfig";
import { getTelegramInitData, hasTelegramSession } from "../telegram";
import { fetchWithTimeout } from "../net/fetchWithTimeout";

const progressEndpoint = RUNTIME_CONFIG.playerProgressEndpoint;

export function isCloudProgressConfigured() {
  return Boolean(progressEndpoint && hasTelegramSession());
}

function headers() {
  return {
    "Content-Type": "application/json",
    "X-Telegram-Init-Data": getTelegramInitData(),
  };
}

export async function pullProgressSnapshot() {
  if (!isCloudProgressConfigured()) return { skipped: true, saved: null };

  const response = await fetchWithTimeout(progressEndpoint, {
    method: "GET",
    headers: headers(),
    cache: "no-store",
  }, 8_000);

  if (!response.ok) throw new Error(`PROGRESS_LOAD_FAILED_${response.status}`);
  const data = await response.json();
  return { skipped: false, saved: data.snapshot || null };
}

export async function pushProgressSnapshot(snapshot) {
  if (!isCloudProgressConfigured()) return { skipped: true };

  const response = await fetchWithTimeout(progressEndpoint, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify({
      version: 2,
      updatedAt: new Date().toISOString(),
      snapshot,
    }),
    keepalive: true,
  }, 8_000);

  if (!response.ok) {
    throw new Error(`PROGRESS_SYNC_FAILED_${response.status}`);
  }

  return response.json().catch(() => ({ ok: true }));
}
