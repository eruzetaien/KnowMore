// GamePage.tsx
import EmoticonsOverlay from "../components/EmoticonOverlay";
import PlayingPhase from "../components/PlayingPhase";
import PreparationPhase from "../components/PreparationPhase";
import ResultPhase from "../components/ResultPhase";
import { useGameHub } from "../context/GameHubContext";
import { GamePhase } from "../types/gameType";

function GamePage() {
  const { game, isLoading } = useGameHub();

  if (isLoading) return <p>Connecting...</p>;

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 text-white">
      <div className="bg-gray-700/60 backdrop-blur-md rounded-2xl shadow-lg p-8 w-full max-w-2xl">
        {game.phase === GamePhase.Preparation && <PreparationPhase data={game.preparationPhaseData} />}
        {game.phase === GamePhase.Playing && <PlayingPhase data={game.playingPhaseData} />}
        {game.phase === GamePhase.Result && <ResultPhase data={game.resultPhaseData} />}
      </div>

      <EmoticonsOverlay />
    </div>
  );
}

export default GamePage;
