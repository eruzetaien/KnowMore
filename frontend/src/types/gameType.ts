export const GamePhase = {
  Preparation: 0,
  Playing: 1,
  Result: 2,
} as const;
export type GamePhase = (typeof GamePhase)[keyof typeof GamePhase];

export interface PlayerStatement {
  idx : number,
  description: string
}

export interface RewardStatement {
  id : number,
  description: string
}

// Room Initial Data
export interface InitRoomResponse {
  player1:number;
  player2:number;
}

// Game Phase Initial Data
export interface InitPreparationPhaseResponse {}
export interface InitPlayingPhaseResponse {
  opponentStatements: PlayerStatement[];
}
export interface InitResultPhaseResponse {
  isPlayerCorrect: boolean;
  rewardStatements?: RewardStatement[];
}


export interface SetGamePhaseResponse {
  phase: GamePhase;
}

export interface GameData {
  roomCode: string;
  phase: GamePhase;
}

export interface PreparationPhaseData {}

export interface PlayingPhaseData {
  opponentStatements: PlayerStatement[];
  playerAnswer: number;
}

export interface ResultPhaseData extends InitResultPhaseResponse {}