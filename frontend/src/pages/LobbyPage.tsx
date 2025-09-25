import { useState} from "react";
import { useAllRoomsQuery} from "../hooks/useRoom";
import CreateRoomModal from "../components/CreateRoomModal";
import { useNavigate } from "react-router-dom";

const joinButton = "src/assets/buttons/join-button.svg";
const codeButton = "src/assets/buttons/code-button.svg";
const refreshButton = "src/assets/buttons/refresh-button.svg";
const addButton = "src/assets/buttons/add-button.svg";

function LobbyPage() {
  const navigate = useNavigate();
  const { data: rooms, isLoading, isError, error } = useAllRoomsQuery();

  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="flex h-full w-full justify-center items-center">
      <CreateRoomModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
      />

      <div className='w-2/5 py-8 px-7 card-rounded'>
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
