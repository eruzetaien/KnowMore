import { useMutation, useQuery } from "@tanstack/react-query";
import type { CreateRoomRequest, RoomResponse } from "../types/room";
import { createRoom, fetchAllRooms } from "../api/room";

export const useCreateRoom = () => {
  return useMutation<RoomResponse, Error, CreateRoomRequest>({
    mutationFn: createRoom,
  });
};

export const useAllRoomsQuery = () => {
  return useQuery<RoomResponse[]>({
    queryKey: ["allRooms"],
    queryFn: fetchAllRooms,
  });
};
