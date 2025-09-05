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

export interface SendOptionsResponse {
  isPlayer1Ready: boolean;
  isPlayer2Ready: boolean;
}

export interface PlayerOption {
  idx : number,
  description: string
}

export interface InitPlayingPhaseResponse {
  player1Options: PlayerOption[];
  player2Options: PlayerOption[];
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

export interface PreparationPhaseData {
  isPlayer1Ready: boolean;
  isPlayer2Ready: boolean;
}

export interface PlayingPhaseData {
  player1Options: PlayerOption[];
  player2Options: PlayerOption[];
  player1Answer: number;
  player2Answer: number;
  isPlayer1Ready: boolean;
  isPlayer2Ready: boolean;
}
export interface ResultPhaseData {}