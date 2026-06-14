import { useEffect, useRef, useState } from "react";

const DEFAULT_LAYOUT = {
  scale: 1,
  viewportWidth: 390,
  viewportHeight: 844,
  stageCenterY: 422,
  cropX: 0,
  cropY: 0,
  visibleWidth: 390,
  visibleHeight: 844,
};

/**
 * Профессиональная схема адаптации игровой сцены:
 * 1. Фон рисуется отдельно на весь viewport через background-size: cover.
 * 2. Мир масштабируется в cover-режиме, сохраняя дизайн-координаты 390x844.
 * 3. Хук вычисляет реально видимую область внутри дизайн-сцены. Эти значения
 *    используются HUD-элементами, чтобы они не попадали под обрезание экрана.
 */
function useResponsiveStage(stageWidth, stageHeight) {
  const viewportRef = useRef(null);
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);

  useEffect(() => {
    const isTelegram = Boolean(window.Telegram?.WebApp);
    document.documentElement.dataset.telegramApp = isTelegram ? "true" : "false";

    const viewport = viewportRef.current;
    if (!viewport) return undefined;

    let frameId = 0;

    const measure = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        const visualViewport = window.visualViewport;
        const rect = viewport.getBoundingClientRect();
        const width = Math.max(1, visualViewport?.width || rect.width);
        const height = Math.max(1, visualViewport?.height || rect.height);

        const scale = Math.max(
          width / stageWidth,
          height / stageHeight,
        );

        const renderedWidth = stageWidth * scale;
        const renderedHeight = stageHeight * scale;

        // Сколько дизайн-пикселей обрезано с каждой стороны сцены.
        const cropX = Math.max(0, (renderedWidth - width) / 2 / scale);
        const cropY = Math.max(0, (renderedHeight - height) / 2 / scale);
        const visibleWidth = Math.min(stageWidth, width / scale);
        const visibleHeight = Math.min(stageHeight, height / scale);
        const stageCenterY = height / 2 + (visualViewport?.offsetTop || 0);

        setLayout((previous) => {
          const next = {
            scale,
            viewportWidth: width,
            viewportHeight: height,
            stageCenterY,
            cropX,
            cropY,
            visibleWidth,
            visibleHeight,
          };

          const unchanged = Object.keys(next).every(
            (key) => Math.abs((previous[key] ?? 0) - next[key]) < 0.5,
          );

          return unchanged ? previous : next;
        });
      });
    };

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(viewport);

    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    window.visualViewport?.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("scroll", measure);

    measure();

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
      window.visualViewport?.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("scroll", measure);
    };
  }, [stageHeight, stageWidth]);

  return {
    viewportRef,
    ...layout,
  };
}

export default useResponsiveStage;
