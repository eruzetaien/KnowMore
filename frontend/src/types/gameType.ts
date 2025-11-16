import type { FactGroupForGame } from "./factType";
import type { PlayerData } from "./playerType";

export const GamePhase = {
  None: 0,
  Preparation: 1,
  Playing: 2,
  Result: 3,
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
export interface InitPlayerResponse {
  player1:PlayerData;
  player2:PlayerData;
}

// Game Phase Initial Data
export interface InitPreparationPhaseResponse {
  playerFacts : FactGroupForGame[];
}
export interface InitPlayingPhaseResponse {
  opponentStatements: PlayerStatement[];
}
export interface InitResultPhaseResponse extends ResultPhaseData {
  player1Score : number;
  player2Score : number;
}


export interface SetGamePhaseResponse {
  phase: GamePhase;
}

export interface GameData {
  roomCode: string;
  phase: GamePhase;
}

export interface PreparationPhaseData extends InitPreparationPhaseResponse {}

export interface PlayingPhaseData {
  opponentStatements: PlayerStatement[];
  playerAnswer: number;
}

export interface ResultPhaseData {
  isPlayerCorrect: boolean;
  rewardStatements?: RewardStatement[];
}