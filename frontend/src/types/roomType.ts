import type { PlayerSlot } from "./playerType";

// Rest API DTO
export interface RoomResponse {
  code: string;
  name: string;
  roomMaster: string;
}

export interface CreateRoomRequest {
  name: string;
}

export interface JoinRoomResponse {
  slot: PlayerSlot;
}

export interface RoomCodeResponse {
  roomCode : string;
}