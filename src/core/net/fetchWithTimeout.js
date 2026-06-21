export async function fetchWithTimeout(input, init = {}, timeoutMs = 10_000) {
  const controller = new AbortController();
  const timerId = window.setTimeout(
    () => controller.abort(new DOMException("Request timed out", "TimeoutError")),
    Math.max(1_000, Number(timeoutMs) || 10_000),
  );

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timerId);
  }
}
