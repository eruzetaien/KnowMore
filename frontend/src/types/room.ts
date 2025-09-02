export interface RoomResponse {
  name: string;
  joinCode: string;
  roomMaster: number;
  secondPlayer: number;
}

export interface CreateRoomRequest {
  name: string;
}