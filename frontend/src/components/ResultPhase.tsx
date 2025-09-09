import { useGameHub } from "../context/GameHubContext";

export default function ResultPhase() {
  const {  isLoading: hubLoading,  resultPhaseData} = useGameHub();

  if (hubLoading) return <p>Loading hub connection...</p>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Result Phase</h2>
      <h3 className="text-xl font-bold mb-4">
        { resultPhaseData.isPlayerCorrect? "You Are Correct!" :  "You are Wrong~"}
      </h3>
    </div>
  );
}
