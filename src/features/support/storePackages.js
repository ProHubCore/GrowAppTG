export function formatCompactNumber(value) {
  const safe = Math.max(0, Math.floor(Number(value) || 0));

  if (safe >= 1_000_000) {
    return `${Math.floor(safe / 1_000_000)}M`;
  }

  if (safe >= 1_000) {
    return `${Math.floor(safe / 1_000)}K`;
  }

  return String(safe);
}

export function formatStoreNumber(value) {
  return formatCompactNumber(value);
}
