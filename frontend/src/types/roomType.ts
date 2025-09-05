export interface RoomResponse {
  name: string;
  joinCode: string;
  player1: number;
  player2: number;
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