import type { CreateRoomRequest, PlayerRoomResponse, RoomResponse } from "../types/roomType";
import { apiRequest } from "./apiRequest";

export const createRoom = async (
  requestBody: CreateRoomRequest
): Promise<RoomResponse> => {
  const endpoint = `${import.meta.env.VITE_GAME_BASE_URL}/rooms`;

  return apiRequest<RoomResponse>(endpoint, "POST", requestBody);
};

export const fetchAllRooms = async (): Promise<RoomResponse[]> => {
  const endpoint = `${import.meta.env.VITE_GAME_BASE_URL}/rooms`;

  return apiRequest<RoomResponse[]>(endpoint, "GET");
};

export const fetchPlayerRoom = async (): Promise<PlayerRoomResponse | null> => {
  const endpoint = `${import.meta.env.VITE_GAME_BASE_URL}/rooms/user`;
  try {
    const result = await apiRequest<PlayerRoomResponse>(endpoint, "GET");
    return result;

  } catch (error:any) {
    if (error.message.includes("HTTP 404")) {
      return null;
    }
    throw error;
  }
  
};
