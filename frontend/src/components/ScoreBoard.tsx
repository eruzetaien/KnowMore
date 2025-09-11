import type { AllPlayerData } from "../types/playerType";

interface ScoreBoardProps {
  allPlayerData: AllPlayerData;
}

function ScoreBoard({ allPlayerData }: ScoreBoardProps) {
  return (
    <div className="flex justify-between items-center bg-gray-800 rounded-xl px-6 py-3 mb-6 shadow-md">
      <div className="flex flex-col items-center">
        <span className="text-lg font-semibold">Player 1</span>
        <span className="text-2xl font-bold text-green-400">{allPlayerData?.player1Score?? 0}</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-lg font-semibold">Player 2</span>
        <span className="text-2xl font-bold text-blue-400">{allPlayerData?.player2Score?? 0}</span>
      </div>
    </div>
  );
}

export default ScoreBoard;
