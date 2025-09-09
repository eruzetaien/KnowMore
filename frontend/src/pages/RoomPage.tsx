import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useGameHub } from "../context/GameHubContext";

function RoomPage() {
  const { roomCode } = useParams();
  const { room, allPlayerData, isLoading, joinRoom, setReadyStateToStartGame } = useGameHub();

  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (roomCode) {
      joinRoom(roomCode);
    }
  }, [roomCode]);

  const handleReadyClick = () => {
    const newState = !ready;
    setReady(newState);
    setReadyStateToStartGame(room.joinCode, newState); // if GameHub provides ready state update
  };

  const navigate = useNavigate();
  if (allPlayerData.isPlayer1Ready && allPlayerData.isPlayer2Ready) 
    navigate(`/game/${roomCode}`);

  if (isLoading) return <p>Connecting to game hub...</p>;

  return (
    <div className="flex flex-col items-center justify-center w-screen h-screen bg-gradient-to-br from-gray-800 to-gray-900 text-white p-6">
      <div className="bg-gray-700/60 backdrop-blur-md rounded-2xl shadow-lg p-8 w-full max-w-md">
        {/* Room Info */}
        <h1 className="text-2xl font-bold mb-2 text-center">
          Room: {room.name ?? "Unknown"}
        </h1>
        <p className="text-center text-gray-300 mb-6">
          Code: <span className="font-mono">{room.joinCode ?? roomCode}</span>
        </p>

        {/* Players */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="flex flex-col items-center p-4 bg-gray-800 rounded-xl">
            <h2 className="font-semibold">Master</h2>
            <p className="mt-2">{allPlayerData.player1 ?? "-"}</p>
            <span
              className={`text-xs mt-1 ${
                allPlayerData.isPlayer1Ready ? "text-green-400" : "text-red-400"
              }`}
            >
              {allPlayerData.isPlayer1Ready ? "Ready" : "Not Ready"}
            </span>

          </div>

          <div className="flex flex-col items-center p-4 bg-gray-800 rounded-xl">
            <h2 className="font-semibold">Player 2</h2>
            <p className="mt-2">{allPlayerData.player2 ?? "-"}</p>
            <span
              className={`text-xs mt-1 ${
                allPlayerData.isPlayer2Ready ? "text-green-400" : "text-red-400"
              }`}
            >
              {allPlayerData.isPlayer2Ready ? "Ready" : "Not Ready"}
            </span>
          </div>
        </div>

        {/* Ready Button */}
        <button
          onClick={handleReadyClick}
          className={`w-full py-3 rounded-xl font-semibold transition ${
            ready
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {ready ? "Cancel" : "Ready"}
        </button>
      </div>
    </div>
  );
}

export default RoomPage;
