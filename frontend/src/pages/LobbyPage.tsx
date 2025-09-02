import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateRoom } from "../hooks/useCreateRoom";

function LobbyPage() {
  const navigate = useNavigate();
  const { mutate: createRoom, data, isPending, isError, error } = useCreateRoom();

  const [roomName, setRoomName] = useState("");

  const handleClick = () => {
    if (!roomName.trim()) return; // prevent empty room names
    createRoom({ name:roomName });
  };

  // redirect when room created
  useEffect(() => {
    if (data) {
      localStorage.setItem("currentRoom", JSON.stringify(data));
      navigate(`/room/${data.joinCode}`);
    }
  }, [data, navigate]);

  return (
    <div className="flex flex-col gap-4 max-w-sm mx-auto mt-10">
      <input
        type="text"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
        placeholder="Enter room name"
        className="border rounded-md px-3 py-2"
      />

      <button
        onClick={handleClick}
        disabled={isPending || !roomName.trim()}
        className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
      >
        {isPending ? "Creating..." : "Create Room"}
      </button>

      {isError && <p className="text-red-500">Error: {(error as Error).message}</p>}
    </div>
  );
}

export default LobbyPage;
