import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useGameHub } from "../context/GameHubContext";

import player2Idle from "../assets/players/player2-idle.png";
import yellowButton from "../assets/buttons/yellow-button.svg";
import cancelButton from "../assets/buttons/cancel-button.svg";
import PlayerCard from "../components/PlayerCard";

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
    <div className="flex flex-col items-center justify-between p-12">

      {/* Title*/}
      <div className="text-center mb-6">
        <h2 className="text-5xl text-black"> {room.name ?? "Unknown"} </h2>
        <p className=" text-[#0A6602] text-xl -mt-2">
            Join Code: <span className="font-bold">{room.joinCode ?? roomCode}</span>
        </p>
      </div>

      {/* Players Card */}
      <div className="flex justify-center w-full gap-32 mb-12">
        <PlayerCard
          name={allPlayerData.player1Name}
          isReady={allPlayerData.isPlayer1Ready}
          sprite={player2Idle}
        />
        <PlayerCard
          name={allPlayerData.player2Name}
          isReady={allPlayerData.isPlayer2Ready}
          sprite={player2Idle}
          isFlipped={true}
        />
      </div>
      
      {/* Ready Button */}
      <button className="hover:scale-105 cursor-pointer" onClick={handleReadyClick}>
        {ready ? (
          <img src={cancelButton} alt="cancel button" />
        ) : (
          <div className="relative h-fit flex justify-end items-center">
            <img src={yellowButton} alt="ready button" />
            <span className="absolute inset-0 flex items-center justify-center text-2xl">
              Ready
            </span>
          </div>
        )}
      </button>

    </div>
  );
}

export default RoomPage;
