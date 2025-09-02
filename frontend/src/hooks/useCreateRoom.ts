import { useMutation } from "@tanstack/react-query";
import type { CreateRoomRequest, RoomResponse } from "../types/room";
import { createRoom } from "../api/room";

export const useCreateRoom = () => {
  return useMutation<RoomResponse, Error, CreateRoomRequest>({
    mutationFn: createRoom,
  });
};
