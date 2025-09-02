import type { CreateRoomRequest, RoomResponse } from "../types/room";
import { apiRequest } from "./apiRequest";

export const createRoom = async (
  requestBody: CreateRoomRequest
): Promise<RoomResponse> => {
  const endpoint = `${import.meta.env.VITE_GAME_BASE_URL}/rooms`;

  return apiRequest<RoomResponse>(endpoint, "POST", requestBody);
};
