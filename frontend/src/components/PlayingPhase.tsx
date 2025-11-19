import { useState } from "react";
import { useGameHub } from "../context/GameHubContext";

export default function PlayingPhase() {
  const { playingPhaseData, allPlayerData, isLoading: hubLoading, room, sendAnswer } = useGameHub();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  if (hubLoading) return <p>Loading hub connection...</p>;
  if (!playingPhaseData) return <p>No playing phase data yet...</p>;

  const playerRole = localStorage.getItem("player"); // "Player1" or "Player2"

  const handleSubmit = () => {
    if (selectedIdx !== null) {
      sendAnswer(room.joinCode, selectedIdx);
    }
  };

  // Determine if this player already submitted an answer
  const isAlreadyAnswered =
    (playerRole === "Player1" && allPlayerData.player1?.isReady) ||
    (playerRole === "Player2" && allPlayerData.player2?.isReady);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Playing Phase</h2>

      <div className="mb-6">
        <h3 className="font-semibold">Opponent’s Statements</h3>
        <ul className="space-y-2">
          {playingPhaseData.opponentStatements.map((opt) => (
            <li
              key={opt.idx}
              onClick={() => !isAlreadyAnswered && setSelectedIdx(opt.idx)}
              className={`p-2 rounded cursor-pointer transition
                ${
                  selectedIdx === opt.idx
                    ? "bg-blue-600 text-white font-bold"
                    : "bg-gray-700 hover:bg-gray-600"
                } ${
                  isAlreadyAnswered ? "opacity-50 cursor-not-allowed" : ""
                }`}
            >
              {opt.description}
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={handleSubmit}
        disabled={selectedIdx === null || isAlreadyAnswered}
        className={`px-4 py-2 rounded-lg transition ${
          selectedIdx === null || isAlreadyAnswered
            ? "bg-gray-500 cursor-not-allowed"
            : "bg-green-500 hover:bg-green-600"
        }`}
      >
        Submit Answer
      </button>

      <div className="mt-6">
        <p>Player 1 ready: {allPlayerData.player1?.isReady ? "✅" : "❌"}</p>
        <p>Player 2 ready: {allPlayerData.player2?.isReady ? "✅" : "❌"}</p>
      </div>
    </div>
  );
}
