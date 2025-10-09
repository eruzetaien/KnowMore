import { useMutation, useQuery } from "@tanstack/react-query";
import type { CreateRoomRequest, PlayerRoomResponse, RoomResponse } from "../types/roomType";
import { createRoom, fetchAllRooms, fetchPlayerRoom } from "../api/roomApi";

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

export const usePlayerRoomQuery = () => {
  return useQuery<PlayerRoomResponse | null>({
    queryKey: ["playerRoom"],
    queryFn: fetchPlayerRoom,
  });
};