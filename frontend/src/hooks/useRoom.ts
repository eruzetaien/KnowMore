import { useMutation, useQuery } from "@tanstack/react-query";
import type { CreateRoomRequest, RoomResponse } from "../types/roomType";
import { createRoom, fetchAllRooms } from "../api/roomApi";

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
