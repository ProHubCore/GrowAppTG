import GameScreen from "./features/game/GameScreen";
import PlayerProfile from "./features/profile/PlayerProfile";
import GameLoadingScreen from "./shared/components/GameLoadingScreen/GameLoadingScreen";
import useGameAssets from "./core/hooks/useGameAssets";

function App() {
  const { isReady, progress, failedAssets } = useGameAssets();

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
