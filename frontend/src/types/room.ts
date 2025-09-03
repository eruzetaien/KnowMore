export interface RoomResponse {
  name: string;
  joinCode: string;
  roomMaster: number;
  secondPlayer: number;
  isPlayer1Ready: boolean;
  isPlayer2Ready: boolean;
  hasGameStarted: boolean;
}

export interface CreateRoomRequest {
  name: string;
}