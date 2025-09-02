import {useParams} from "react-router-dom";
import type { RoomResponse } from "../types/room";
import { useEffect } from "react";
import { joinRoom } from "../signalr/gameHub";

function RoomPage() {
  const { roomCode } = useParams();
  const saved = localStorage.getItem("currentRoom");
  const room = saved ? (JSON.parse(saved) as RoomResponse) : undefined;

  useEffect(() => {
    if (roomCode) {
      joinRoom(roomCode)
        .then(() => console.log(`Joined room ${roomCode}`))
        .catch((err) => console.error("Failed to join room:", err));
    }
  }, [roomCode]);

  return (
    <div>
      <h1>Room: {room?.name ?? "Unknown"}</h1>
      <p>Code: {roomCode}</p>
    </div>
  );
}

export default RoomPage;
