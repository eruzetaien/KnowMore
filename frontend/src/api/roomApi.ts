import type { ApiResponse } from "../types/apiType";
import type { CreateRoomRequest, RoomCodeResponse, RoomResponse } from "../types/roomType";
import { apiRequest } from "./apiRequest";

export const createRoom = async (
  requestBody: CreateRoomRequest
): Promise<ApiResponse<RoomCodeResponse>> => {
  const endpoint = `${import.meta.env.VITE_GAME_BASE_URL}/rooms`;

  return await apiRequest<RoomCodeResponse>(endpoint, "POST", requestBody);
};

export const fetchAllRooms = async (): Promise<ApiResponse<RoomResponse[]>> => {
  const endpoint = `${import.meta.env.VITE_GAME_BASE_URL}/rooms`;

  return await apiRequest<RoomResponse[]>(endpoint, "GET");
};

export const fetchPlayerRoom = async (): Promise<ApiResponse<RoomCodeResponse>> => {
  const endpoint = `${import.meta.env.VITE_GAME_BASE_URL}/rooms/user`;
    
  return await apiRequest<RoomCodeResponse>(endpoint, "GET");
  
};
