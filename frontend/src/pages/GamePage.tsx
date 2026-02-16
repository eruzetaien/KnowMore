// GamePage.tsx
import { useEffect } from "react";
import PlayingPhase from "../components/PlayingPhase";
import PreparationPhase from "../components/PreparationPhase";
import ResultPhase from "../components/ResultPhase";
import { useGameHub } from "../context/GameHubContext";
import { GamePhase } from "../types/gameType";
import { useNavigate, useParams } from "react-router-dom";

function GamePage() {
  const { roomCode } = useParams();
  const { game, isLoading, isConnected, reconnect, connect} = useGameHub();
  const navigate = useNavigate();
  
  useEffect(() => {
    let mounted = true; 

    const init = async () => {
      if (!isConnected()){
        await connect();
      }

      if (!mounted) return;

      if (isConnected() && roomCode) {
        await reconnect(roomCode);
      } else {
        navigate("/lobby");
      }
      
    };

    init();

    return () => {
      mounted = false;
    };
  }, [roomCode]);

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
