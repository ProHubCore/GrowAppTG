import { useEffect, useState } from "react";

function useStageScale(stageWidth, stageHeight) {
  const [stageScale, setStageScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const viewportWidth =
        window.visualViewport?.width || window.innerWidth;

      const viewportHeight =
        window.visualViewport?.height || window.innerHeight;

      const widthScale = viewportWidth / stageWidth;
      const heightScale = viewportHeight / stageHeight;

      setStageScale(Math.min(widthScale, heightScale));
    };

    updateScale();

    window.addEventListener("resize", updateScale);
    window.visualViewport?.addEventListener("resize", updateScale);

    return () => {
      window.removeEventListener("resize", updateScale);
      window.visualViewport?.removeEventListener(
        "resize",
        updateScale
      );
    };
  }, [stageWidth, stageHeight]);

  return stageScale;
}

export default useStageScale;