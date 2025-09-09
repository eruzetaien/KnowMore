import { useState } from "react";
import { useGameHub } from "../context/GameHubContext";
import { useCreateSharedFact } from "../hooks/useFact";

export default function ResultPhase() {
  const { isLoading: hubLoading, resultPhaseData } = useGameHub();
  const [selectedRewardId, setSelectedRewardId] = useState<number | null>(null);
  const { mutate: createSharedFact, isPending, isError: isCreateError, error: createError } = useCreateSharedFact();

  if (hubLoading) return <p>Loading hub connection...</p>;

  const handleChooseReward = () => {
    if (selectedRewardId !== null) {
      createSharedFact(selectedRewardId);
    }
  };

  const canChooseReward =
    resultPhaseData.isPlayerCorrect &&
    resultPhaseData.rewardStatements &&
    resultPhaseData.rewardStatements.length > 0;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Result Phase</h2>
      <h3 className="text-xl font-bold mb-4">
        {resultPhaseData.isPlayerCorrect ? "You Are Correct!" : "You are Wrong~"}
      </h3>

      {canChooseReward && (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="font-semibold">Choose one fact of your opponent that you want to save:</p>
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
                <span>
                  {reward.description}
                </span>
              </label>
            ))}
          </div>

          <button
            onClick={handleChooseReward}
            disabled={selectedRewardId === null || isPending}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg shadow text-white font-semibold disabled:opacity-50"
          >
              {isPending ? "Submitting..." : "Submit Reward Choice"}
          </button>

          {isCreateError && <p className="text-red-500">{createError.message}.</p>}
        </div>
      )}
    </div>
  );
}
