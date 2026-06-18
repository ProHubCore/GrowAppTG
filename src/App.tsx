import { useEffect } from "react";

import GameScreen from "./features/game/GameScreen";
import PlayerProfile from "./features/profile/PlayerProfile";
import GameLoadingScreen from "./shared/components/GameLoadingScreen/GameLoadingScreen";
import useGameAssets from "./core/hooks/useGameAssets";

function App() {
  const { isReady, progress, failedAssets } = useGameAssets();

  useEffect(() => {
    const preventGestureZoom = (event: Event) => {
      event.preventDefault();
    };

    const preventMultiTouchZoom = (event: TouchEvent) => {
      if (event.touches?.length > 1) {
        event.preventDefault();
      }
    };

    const preventTrackpadZoom = (event: WheelEvent) => {
      if (event.ctrlKey) {
        event.preventDefault();
      }
    };

    document.addEventListener("gesturestart", preventGestureZoom, { passive: false });
    document.addEventListener("gesturechange", preventGestureZoom, { passive: false });
    document.addEventListener("gestureend", preventGestureZoom, { passive: false });
    document.addEventListener("touchstart", preventMultiTouchZoom, { passive: false });
    document.addEventListener("touchmove", preventMultiTouchZoom, { passive: false });
    document.addEventListener("wheel", preventTrackpadZoom, { passive: false });

    return () => {
      document.removeEventListener("gesturestart", preventGestureZoom);
      document.removeEventListener("gesturechange", preventGestureZoom);
      document.removeEventListener("gestureend", preventGestureZoom);
      document.removeEventListener("touchstart", preventMultiTouchZoom);
      document.removeEventListener("touchmove", preventMultiTouchZoom);
      document.removeEventListener("wheel", preventTrackpadZoom);
    };
  }, []);

  if (!isReady) {
    return <GameLoadingScreen progress={progress} />;
  }

  if (failedAssets.length > 0) {
    console.warn(
      "Некоторые игровые изображения не были загружены:",
      failedAssets,
    );
  }

  return (
    <>
      <GameScreen />
      <PlayerProfile />
    </>
  );
}

export default App;
