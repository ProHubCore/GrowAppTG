import { useEffect, useState } from "react";
import gameAssets from "../data/gameAssets";

const ASSET_TIMEOUT = 15000;

function preloadImage(source) {
  return new Promise((resolve) => {
    const image = new Image();
    let finished = false;

    const finish = (success) => {
      if (finished) {
        return;
      }

      finished = true;
      window.clearTimeout(timeoutId);

      image.onload = null;
      image.onerror = null;

      resolve({
        source,
        success,
      });
    };

    const timeoutId = window.setTimeout(() => {
      finish(false);
    }, ASSET_TIMEOUT);

    image.onload = async () => {
      try {
        if (typeof image.decode === "function") {
          await image.decode();
        }
      } catch {
        // Некоторые браузеры могут отклонить decode,
        // хотя само изображение уже нормально загружено.
      }

      finish(true);
    };

    image.onerror = () => {
      console.warn(`Не удалось загрузить изображение: ${source}`);
      finish(false);
    };

    image.src = source;

    if (image.complete && image.naturalWidth > 0) {
      image.onload();
    }
  });
}

function useGameAssets() {
  const [loadedCount, setLoadedCount] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [failedAssets, setFailedAssets] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const loadAssets = async () => {
      const failed = [];

      await Promise.all(
        gameAssets.map(async (source) => {
          const result = await preloadImage(source);

          if (cancelled) {
            return;
          }

          if (!result.success) {
            failed.push(result.source);
          }

          setLoadedCount((previousCount) => previousCount + 1);
        }),
      );

      if (cancelled) {
        return;
      }

      setFailedAssets(failed);

      // Даём браузеру один кадр, чтобы он спокойно применил
      // уже декодированные изображения.
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          if (!cancelled) {
            setIsReady(true);
          }
        });
      });
    };

    loadAssets();

    return () => {
      cancelled = true;
    };
  }, []);

  const totalCount = gameAssets.length;

  const progress =
    totalCount === 0
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