import { useEffect, useState } from "react";
import gameAssets, { deferredAssets } from "../assets/gameAssets";

const ASSET_TIMEOUT = 15_000;

function preloadImage(source) {
  return new Promise((resolve) => {
    const image = new Image();
    let finished = false;

    const finish = (success) => {
      if (finished) return;

      finished = true;
      window.clearTimeout(timeoutId);
      image.onload = null;
      image.onerror = null;
      resolve({ source, success });
    };

    const timeoutId = window.setTimeout(() => finish(false), ASSET_TIMEOUT);

    image.onload = async () => {
      try {
        if (typeof image.decode === "function") await image.decode();
      } catch {
        // decode может отклониться даже для уже успешно загруженного файла.
      }
      finish(true);
    };

    image.onerror = () => finish(false);
    image.src = source;

    if (image.complete && image.naturalWidth > 0) image.onload();
  });
}

function scheduleDeferredPreload() {
  const preload = () => {
    for (const source of deferredAssets) {
      const image = new Image();
      image.decoding = "async";
      image.src = source;
    }
  };

  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(preload, { timeout: 2500 });
    return;
  }

  window.setTimeout(preload, 500);
}

function useGameAssets() {
  const [loadedCount, setLoadedCount] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [failedAssets, setFailedAssets] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const loadAssets = async () => {
      const results = await Promise.all(
        gameAssets.map(async (source) => {
          const result = await preloadImage(source);
          if (!cancelled) setLoadedCount((count) => count + 1);
          return result;
        }),
      );
      if (cancelled) return;

      const failed = results
        .filter((result) => !result.success)
        .map((result) => result.source);

      setFailedAssets(failed);

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          if (cancelled) return;
          setIsReady(true);
          scheduleDeferredPreload();
        });
      });
    };

    loadAssets();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalCount = gameAssets.length;
  const progress = totalCount === 0
    ? 100
    : Math.min(100, Math.round((loadedCount / totalCount) * 100));

  return {
    isReady,
    progress,
    loadedCount,
    totalCount,
    failedAssets,
  };
}

export default useGameAssets;
