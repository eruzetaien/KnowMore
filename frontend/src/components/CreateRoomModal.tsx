import { useEffect, useState } from "react";
import { useCreateRoom } from "../hooks/useRoom";
import { useNavigate } from "react-router-dom";

type CreateRoomModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const createButton = "src/assets/buttons/create-button.svg";
const modalTag = "src/assets/create-room-tag.svg"; 
const inputContainer = "src/assets/input-container.svg"; 

export default function CreateRoomModal({
  isOpen,
  onClose
}: CreateRoomModalProps) {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState("");
  const { mutate: createRoom, data: createdRoom, isPending, isError: isCreateError, error: createError } = useCreateRoom();

  const handleCreate = () => {
    if (!roomName.trim()) return;
    createRoom({ name: roomName });
  };

  useEffect(() => {
    if (createdRoom) {
      navigate(`/room/${createdRoom.joinCode}`);
    }
  }, [createdRoom, navigate]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50  backdrop-blur-xs" onClick={onClose}>
      <div className=" card-rounded rounded-lg pt-7 pb-4 w-full max-w-1/5 relative" onClick={(e) => e.stopPropagation()}>

        <img src={modalTag} className="absolute -top-8 left-1/2 transform -translate-x-1/2"/> 

        <div className="flex flex-col justify-center items-center">
          <div className="relative mb-4 inline-block w-auto shrink-0">
            <img src={inputContainer} alt="input background" className="w-auto h-9" />
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name"
              className="absolute inset-0 text-center w-full h-full bg-transparent px-3 focus:outline-none"
            />
          </div>

          <button
            onClick={handleCreate}
            disabled={isPending || !roomName.trim()}
            className="hover:scale-105 cursor-pointer"
          >
            <img src={createButton}/>
          </button>
          {isCreateError && (
            <p className="text-red-500 mt-2">Error: {createError.message}</p>
          )}
        </div>
        
        
      </div>
    </div>
  );
}
