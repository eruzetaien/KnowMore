import type { PlayerSlot } from "./playerType";

// Rest API DTO
export interface RoomResponse {
  joinCode: string;
  name: string;
}

export interface CreateRoomRequest {
  name: string;
}

export interface JoinRoomResponse {
  playerSlot: PlayerSlot;
}