export const PlayerSlot = {
  None: 0,
  Player1: 1,
  Player2: 2,
} as const;
export type PlayerSlot = (typeof PlayerSlot)[keyof typeof PlayerSlot];

export interface PlayerData {
  id: number;
  name: string;
  isReady: boolean;
}

export interface ClientPlayerData {
  slot: PlayerSlot;
}

export interface AllPlayerData {
  player1: PlayerData | null ;
  player2: PlayerData | null ;
  player1Score: number;
  player2Score: number;
}

// Hub DTO
export interface PlayerReadinessResponse{
  isPlayer1Ready: boolean;
  isPlayer2Ready: boolean; 
}