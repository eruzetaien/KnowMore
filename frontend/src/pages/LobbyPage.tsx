import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CreateRoomModal from "../components/CreateRoomModal";
import { useAllRoomsQuery, usePlayerRoomQuery } from "../hooks/useRoom";

import addButton from "../assets/buttons/add-button.svg";
import codeButton from "../assets/buttons/code-button.svg";
import joinButton from "../assets/buttons/join-button.svg";
import refreshButton from "../assets/buttons/refresh-button.svg";

function LobbyPage() {
  const navigate = useNavigate();
  const { data: rooms, isLoading, isError, error, refetch } = useAllRoomsQuery();
  const { data: playerRoom } = usePlayerRoomQuery();

  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (playerRoom?.roomCode?.trim()) {
      navigate(`/room/${playerRoom.roomCode}`);
    }
  }, [playerRoom, navigate]);


  return (
    <div className="flex h-full w-full justify-center items-center">
      <CreateRoomModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
      />

      <div className='w-2/5 min-w-100 py-8 px-7 card-rounded'>
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
                  onClick={() => setShowCreate((prev) => !prev)}
                  className="hover:scale-105 cursor-pointer"
                >
                <img src={addButton}/>
              </button>

              <button
                  onClick={() => refetch()}
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
                  <span  className="text-lg">{room.roomMaster}</span>
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
