export const Emoticon = {
  None: 0,
  Shocked: 1,
} as const;
export type Emoticon = (typeof Emoticon)[keyof typeof Emoticon];

export const GamePhase = {
  Preparation: 0,
  Playing: 1,
  Result: 2,
} as const;
export type GamePhase = (typeof GamePhase)[keyof typeof GamePhase];

export interface SendEmoticonResponse {
  sender: string;
  emoticon: Emoticon;
}

export interface PlayerReadiness {
  isPlayer1Ready: boolean;
  isPlayer2Ready: boolean;
}

export interface SendStatementsResponse extends PlayerReadiness {}

export interface PlayerStatement {
  idx : number,
  description: string
}

export interface InitPlayingPhaseResponse {
  opponentStatements: PlayerStatement[];
}

export interface SetGamePhaseResponse {
  phase: GamePhase;
}

export interface GameData {
  roomCode: string;
  phase: GamePhase;
}

export interface EmoticonData {
  player1Emot: Emoticon;
  player2Emot: Emoticon;
}

export interface PreparationPhaseData extends PlayerReadiness {}

export interface PlayingPhaseData extends PlayerReadiness {
  opponentStatements: PlayerStatement[];
  playerAnswer: number;
}
export interface ResultPhaseData {}