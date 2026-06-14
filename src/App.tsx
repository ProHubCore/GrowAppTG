import GameScreen from "./components/GameScreen";
import PlayerProfile from "./components/PlayerProfile";
import GameLoadingScreen from "./components/GameLoadingScreen";
import useGameAssets from "./hooks/useGameAssets";

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
