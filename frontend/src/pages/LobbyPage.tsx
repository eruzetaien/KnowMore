import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAllRoomsQuery, useCreateRoom } from "../hooks/useRoom";

function LobbyPage() {
  const navigate = useNavigate();

  const { data: rooms, isLoading, isError, error } = useAllRoomsQuery();
  const { mutate: createRoom, data: createdRoom, isPending, isError: isCreateError, error: createError } =
    useCreateRoom();

  const [roomName, setRoomName] = useState("");

  const handleCreate = () => {
    if (!roomName.trim()) return;
    createRoom({ name: roomName });
  };

  useEffect(() => {
    if (createdRoom) {
      navigate(`/room/${createdRoom.joinCode}`);
    }
  }, [createdRoom, navigate]);

  return (
    <div className="flex h-full w-full justify-center items-center">

        <div className='bg-noise bg-platinum p-12 border-4 border-pastel-grey rounded-3xl outline-4 outline-platinum'>
          {/* Create Room */}
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-bold">Create a Room</h2>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name"
              className="border rounded-md px-3 py-2"
            />
            <button
              onClick={handleCreate}
              disabled={isPending || !roomName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
            >
              {isPending ? "Creating..." : "Create Room"}
            </button>
            {isCreateError && (
              <p className="text-red-500">Error: {(createError as Error).message}</p>
            )}
          </div>

          <div>
            <h2 className="text-lg font-bold">Available Rooms</h2>
            {isLoading && <p>Loading rooms...</p>}
            {isError && <p className="text-red-500">Error: {(error as Error).message}</p>}
            {rooms && rooms.length > 0 ? (
              <ul className="border rounded-md divide-y">
                {rooms.map((room) => (
                  <li
                    key={room.joinCode}
                    className="p-2 flex justify-between items-center"
                  >
                    <span>{room.name}</span>
                    <button
                      onClick={() => navigate(`/room/${room.joinCode}`)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Join
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              !isLoading && <p>No rooms available</p>
            )}
          </div>
        </div>
        
      
      
    </div>
  );
}

export default LobbyPage;
