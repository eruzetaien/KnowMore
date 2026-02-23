import type { FactGroupForGame } from "./factType";
import type { AllPlayerData, ClientPlayerData, PlayerData } from "./playerType";

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
  id : string,
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
  playerRemainingTime: number;
}
export interface InitPlayingPhaseResponse {
  opponentStatements: PlayerStatement[];
  playerRemainingTime: number;
}
export interface InitResultPhaseResponse {
  player1Score : number;
  player2Score : number;
  isPlayer1Correct: boolean;
  isPlayer2Correct: boolean;
  rewardStatements?: RewardStatement[];
}


export interface SetGamePhaseResponse {
  phase: GamePhase;
}

export interface GameData {
  roomCode: string;
  phase: GamePhase;
}

export interface PreparationPhaseData extends InitPreparationPhaseResponse {
  fact1Id?: string;
  fact2Id?: string;
  lie?: string;
}

export interface PlayingPhaseData extends InitPlayingPhaseResponse {
  playerAnswer?: number;
}

export interface ResultPhaseData {
  isPlayer1Correct: boolean;
  isPlayer2Correct: boolean;
  rewardStatements?: RewardStatement[];
  playerReward?: string;
}

export interface GameDataResponse {
  roomCode: string;
  clientPlayerData: ClientPlayerData;
  allPlayerData: AllPlayerData;
  phase: GamePhase;
  preparationPhaseData: PreparationPhaseData;
  playingPhaseData: PlayingPhaseData;
  resultPhaseData: ResultPhaseData;
}