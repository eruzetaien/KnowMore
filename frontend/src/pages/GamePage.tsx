// GamePage.tsx
import { useEffect, useState } from "react";
import PlayingPhase from "../components/PlayingPhase";
import PreparationPhase from "../components/PreparationPhase";
import ResultPhase from "../components/ResultPhase";
import { useGameHub } from "../context/GameHubContext";
import { GamePhase } from "../types/gameType";
import { useNavigate, useParams } from "react-router-dom";

function GamePage() {
  const { roomCode } = useParams();
  const { game, isLoading, isConnected, reconnect} = useGameHub();
  const navigate = useNavigate();
  
  const [triedReconnect, setTriedReconnect] = useState(false);

  useEffect(() => {
    if (!isConnected() && roomCode && !triedReconnect) {
      (async () => {
        await reconnect(roomCode);
        setTriedReconnect(true);
        })();
        return;
      }

    if (!isConnected()) {
      navigate("/lobby");
    }
  }, [roomCode, triedReconnect, navigate, reconnect, isConnected]);

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
