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

export interface JoinRoomResponse {
  role: string;
}

export interface ReceivePlayerReadyStateResponse {
  sender: string;
  isReady: boolean; 
}