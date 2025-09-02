import { useParams } from "react-router-dom";
import { useEffect } from "react";
import { useGameHub } from "../context/GameHubContext";

function RoomPage() {
  const { roomCode } = useParams();
  const { room, connected, joinRoom } = useGameHub();

  useEffect(() => {
    if (roomCode) {
      joinRoom(roomCode);
    }
  }, [roomCode, connected, joinRoom]);

  return (
    <div>
      <h1>Room: {room?.name ?? "Unknown"}</h1>
      <p>Code: {room?.joinCode ?? roomCode}</p>
      <p>Room Master: {room?.roomMaster ?? "-"}</p>
      <p>Second Player: {room?.secondPlayer ?? "-"}</p>
    </div>
  );
}

export default RoomPage;
