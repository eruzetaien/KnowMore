import { useGameHub } from "../context/GameHubContext";

function GamePage() {
  const { room, isLoading } = useGameHub();

  if (isLoading) return <p>Connecting to game hub...</p>;
  return (
    <div className="flex flex-col items-center justify-center w-screen h-screen bg-gradient-to-br from-gray-800 to-gray-900 text-white p-6">
      <div className="bg-gray-700/60 backdrop-blur-md rounded-2xl shadow-lg p-8 w-full max-w-md">
        {/* Room Info */}
        <h1 className="text-2xl font-bold mb-2 text-center">
          Room: {room?.name ?? "Unknown"}
        </h1>
        <p className="text-center text-gray-300 mb-6">
          <span className="font-mono">Game Started</span>
        </p>

        {/* Players */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="flex flex-col items-center p-4 bg-gray-800 rounded-xl">
            <h2 className="font-semibold">Master</h2>
            <p className="mt-2">{room?.roomMaster ?? "-"}</p>
          </div>

          <div className="flex flex-col items-center p-4 bg-gray-800 rounded-xl">
            <h2 className="font-semibold">Player 2</h2>
            <p className="mt-2">{room?.secondPlayer ?? "-"}</p>
            
          </div>
        </div>

      
      </div>
    </div>
  );
}

export default GamePage;
