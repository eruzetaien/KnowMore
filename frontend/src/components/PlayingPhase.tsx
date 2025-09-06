import { useGameHub } from "../context/GameHubContext";

export default function PlayingPhase() {
  const { playingPhaseData, isLoading: hubLoading } = useGameHub();

  if (hubLoading) return <p>Loading hub connection...</p>;
  if (!playingPhaseData) return <p>No playing phase data yet...</p>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Playing Phase</h2>

      <div className="mb-6">
        <h3 className="font-semibold">Player 1</h3>
        <ul className="list-disc list-inside">
          {playingPhaseData.opponentStatements.map((opt) => (
            <li
              key={opt.idx}
              className={
                playingPhaseData.playerAnswer === opt.idx
                  ? "text-green-400 font-bold"
                  : ""
              }
            >
              {opt.description}
            </li>
          ))}
        </ul>
        
      </div>
        <p>
          Ready: {playingPhaseData.isPlayer1Ready ? "✅" : "❌"}
        </p>
        <p>
          Ready: {playingPhaseData.isPlayer2Ready ? "✅" : "❌"}
        </p>
      <div/>
    </div>
  );
}
