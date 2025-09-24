import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAllRoomsQuery, useCreateRoom } from "../hooks/useRoom";

const joinButton = "src/assets/buttons/join-button.svg";
const codeButton = "src/assets/buttons/code-button.svg";
const refreshButton = "src/assets/buttons/refresh-button.svg";
const addButton = "src/assets/buttons/add-button.svg";

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
      <div className='w-2/5 bg-noise bg-platinum py-8 px-7 border-4 border-pastel-grey rounded-3xl outline-4 outline-platinum'>
        <div>
          <div className="flex justify-between mb-1">
            <h2 className="text-3xl text-black-cow">Room List</h2>
            <div className="flex gap-x-0.5">
              <button
                  onClick={() => console.log("Join with code")}
                  className="hover:scale-105 cursor-pointer"
                >
                <img src={codeButton}/>
              </button>
              <button
                  onClick={() => console.log("Toggle Create")}
                  className="hover:scale-105 cursor-pointer"
                >
                <img src={addButton}/>
              </button>

              <button
                  onClick={() => console.log("Refresh")}
                  className="hover:scale-105 cursor-pointer"
                >
                <img src={refreshButton}/>
              </button>
            </div>
          </div>
          {isLoading && <p>Loading rooms...</p>}
          {isError && <p className="text-red-500">Error: {(error as Error).message}</p>}
          {rooms && rooms.length > 0 ? (
            <ul className="divide-y-2 divide-pastel-grey mb-4">
              {rooms.map((room) => (
                <li
                  key={room.joinCode}
                  className="grid grid-cols-[1fr_1fr_auto] items-center py-2"
                >
                  <span className="text-lg" >{room.name}</span>
                  <span  className="text-lg">{"RoomMaster"}</span>
                  <button
                    onClick={() => navigate(`/room/${room.joinCode}`)}
                    className="hover:scale-105 cursor-pointer"
                  >
                  <img
                    className=""
                    src={joinButton}
                  />
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
