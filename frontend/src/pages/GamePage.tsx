// GamePage.tsx
import PlayingPhase from "../components/PlayingPhase";
import PreparationPhase from "../components/PreparationPhase";
import ResultPhase from "../components/ResultPhase";
import { useGameHub } from "../context/GameHubContext";
import { GamePhase } from "../types/gameType";

function GamePage() {
  const { game, isLoading } = useGameHub();

  if (isLoading) return <p>Connecting...</p>;

  return (
    <div className="">
        {game.phase === GamePhase.Preparation && <PreparationPhase />}
        {game.phase === GamePhase.Playing && <PlayingPhase />}
        {game.phase === GamePhase.Result && <ResultPhase />}
    </div>
  );
}

export default GamePage;
