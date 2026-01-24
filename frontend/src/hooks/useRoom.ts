import { useMutation, useQuery } from "@tanstack/react-query";
import type { CreateRoomRequest, RoomCodeResponse, RoomResponse } from "../types/roomType";
import { createRoom, fetchAllRooms, fetchPlayerRoom } from "../api/roomApi";
import type { ApiResponse } from "../types/apiType";

export const useCreateRoom = () => {
  return useMutation<ApiResponse<RoomCodeResponse>, Error, CreateRoomRequest>({
    mutationFn: createRoom,
  });
};

export const useAllRoomsQuery = () => {
  return useQuery<ApiResponse<RoomResponse[]>>({
    queryKey: ["allRooms"],
    queryFn: fetchAllRooms,
  });
}; 

export const usePlayerRoomQuery = () => {
  return useQuery<ApiResponse<RoomCodeResponse>>({
    queryKey: ["playerRoom"],
    queryFn: fetchPlayerRoom,
  });
};