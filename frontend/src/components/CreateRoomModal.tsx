import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateRoom } from "../hooks/useRoom";

import createButton from "../assets/buttons/create-button.svg";
import modalTag from "../assets/create-room-tag.svg";
import inputContainer from "../assets/input-container.svg";
import { useGameHub } from "../context/GameHubContext";

type CreateRoomModalProps = {
  isOpen: boolean;
  onClose: () => void;
}; 

export default function CreateRoomModal({
  isOpen,
  onClose
}: CreateRoomModalProps) {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState("");
  const { mutate: createRoom, data: response, isPending, isError: isCreateError, error: createError } = useCreateRoom();
  const {connect} = useGameHub();

  const handleCreate = () => {
    const newRoomName = roomName.trim();
    if (!newRoomName) return;
    createRoom({ name: newRoomName });
  };

    useEffect(() => {
      let isMounted = true;

      const setup = async (roomCode : string) => {
        await connect();
        if (isMounted)
          navigate(`/room/${roomCode}`);
      };
        
      if (response?.data) 
        setup(response.data.roomCode);

      return () => { isMounted = false;};
    }, [response, navigate]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50  backdrop-blur-xs" onClick={onClose}>
      <div className=" card-rounded rounded-lg pt-7 pb-4 w-88 relative" onClick={(e) => e.stopPropagation()}>

        <img src={modalTag} className="absolute -top-8 left-1/2 transform -translate-x-1/2"/> 

        <div className="flex flex-col justify-center items-center">
          <div className={`relative mb-4 inline-block w-auto shrink-0 ${isPending ? 'opacity-50' : ''}`}>
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
            className={`${isPending ? 'opacity-50' : 'hover:scale-105 cursor-pointer'}`}
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
