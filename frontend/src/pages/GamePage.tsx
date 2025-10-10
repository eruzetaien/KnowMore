// GamePage.tsx
import { useEffect } from "react";
import PlayingPhase from "../components/PlayingPhase";
import PreparationPhase from "../components/PreparationPhase";
import ResultPhase from "../components/ResultPhase";
import { useGameHub } from "../context/GameHubContext";
import { GamePhase } from "../types/gameType";
import { useNavigate } from "react-router-dom";

function GamePage() {
  const { connected, game, isLoading } = useGameHub();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!connected){
      navigate("/lobby");
    }
  }, []);

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
