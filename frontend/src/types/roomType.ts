export interface RoomResponse {
  name: string;
  joinCode: string;
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