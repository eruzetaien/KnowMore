export const PlayerSlot = {
  None: 0,
  Player1: 1,
  Player2: 2,
} as const;
export type PlayerSlot = (typeof PlayerSlot)[keyof typeof PlayerSlot];

export const Emoticon = {
  None: 0,
  Shocked: 1,
} as const;
export type Emoticon = (typeof Emoticon)[keyof typeof Emoticon];

export interface PlayerData {
  id: number;
  name: string;
  isReady: boolean;
}

export interface ClientPlayerData {
  slot: PlayerSlot;
}

export interface AllPlayerData {
  player1: PlayerData;
  player2: PlayerData | null ;
  player1Emot: Emoticon;
  player2Emot: Emoticon;
  player1Score: number;
  player2Score: number;
}

// Hub DTO
export interface PlayerReadinessResponse{
  isPlayer1Ready: boolean;
  isPlayer2Ready: boolean; 
}

export interface SendEmoticonResponse {
  playerSlot: PlayerSlot;
  emoticon: Emoticon;
}