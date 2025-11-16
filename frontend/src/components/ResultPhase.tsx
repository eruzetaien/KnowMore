import { useState } from "react";
import { useGameHub } from "../context/GameHubContext";

export default function ResultPhase() {
  const { isLoading: hubLoading, allPlayerData, resultPhaseData, setReadyStateForNextGame, sendRewardChoice, room } = useGameHub();
  const [selectedRewardId, setSelectedRewardId] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const [ready, setReady] = useState(false);

  if (hubLoading) return <p>Loading hub connection...</p>;

  const handleChooseReward = () => {
    if (selectedRewardId !== null) {
      sendRewardChoice(selectedRewardId);
      setSubmitted(true);
    }
  };

  const handleNextGame = () => {
    const newState = !ready;
    setReady(newState);
    setReadyStateForNextGame(room.joinCode, newState)
  };

  const canChooseReward =
    resultPhaseData.isPlayerCorrect &&
    resultPhaseData.rewardStatements &&
    resultPhaseData.rewardStatements.length > 0;

  const canGoNextGame = !canChooseReward || submitted; 

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Result Phase</h2>
      <h3 className="text-xl font-bold mb-4">
        {resultPhaseData.isPlayerCorrect ? "You Are Correct!" : "You are Wrong~"}
      </h3>

      {/* Reward choice flow */}
      {canChooseReward && !submitted && (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="font-semibold">
              Choose one fact of your opponent that you want to save:
            </p>
            {resultPhaseData.rewardStatements!.map((reward) => (
              <label
                key={reward.id}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name="reward"
                  value={reward.id}
                  checked={selectedRewardId === reward.id}
                  onChange={() => setSelectedRewardId(reward.id)}
                />
                <span>{reward.description}</span>
              </label>
            ))}
          </div>

          <button
            onClick={handleChooseReward}
            disabled={selectedRewardId === null}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg shadow text-white font-semibold disabled:opacity-50"
          >
            {"Submit Reward Choice"}
          </button>
        </div>
      )}

      {/* Next Game Button */}
      {canGoNextGame && (
        <div className="mt-6 space-y-4">
          {submitted && (
            <p className="text-green-400 font-semibold">
              Reward submitted successfully 🎉
            </p>
          )}
          
          {/* Ready Button */}
          <button
            onClick={handleNextGame}
            className={`w-full py-3 rounded-xl font-semibold transition ${
              ready
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {ready ? "Cancel" : "Next Game"}
          </button>

          {/* Players */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="flex flex-col items-center p-4 bg-gray-800 rounded-xl">
              <h2 className="font-semibold">Master</h2>
              <p className="mt-2">{allPlayerData.player1.id ?? "-"}</p>
              <span
                className={`text-xs mt-1 ${
                  allPlayerData.player1.isReady ? "text-green-400" : "text-red-400"
                }`}
              >
                {allPlayerData.player1.isReady ? "Ready" : "Not Ready"}
              </span>

            </div>

            <div className="flex flex-col items-center p-4 bg-gray-800 rounded-xl">
              <h2 className="font-semibold">Player 2</h2>
              <p className="mt-2">{allPlayerData.player2?.id ?? "-"}</p>
              <span
                className={`text-xs mt-1 ${
                  allPlayerData.player2?.isReady ? "text-green-400" : "text-red-400"
                }`}
              >
                {allPlayerData.player2?.isReady ? "Ready" : "Not Ready"}
              </span>
            </div>
          </div>
        </div>        
      )}
    </div>
  );
}
