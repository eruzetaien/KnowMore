import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import type { JoinRoomResponse, RoomResponse } from "../types/roomType";
import type { GameData, InitPlayerResponse, InitPlayingPhaseResponse, InitPreparationPhaseResponse, InitResultPhaseResponse, PlayingPhaseData, PreparationPhaseData, ResultPhaseData, SetGamePhaseResponse } from "../types/gameType";
import { GamePhase } from "../types/gameType";
import { type AllPlayerData, type ClientPlayerData, type PlayerReadinessResponse} from "../types/playerType";
import { redirectIfNotOn } from "../utils/redirect";

type GameHubData = {
  connected: boolean;
  room: RoomResponse;
  isLoading: boolean;
  clientPlayerData: ClientPlayerData;
  allPlayerData: AllPlayerData;
  game: GameData;
  preparationPhaseData: PreparationPhaseData;
  playingPhaseData: PlayingPhaseData;
  resultPhaseData: ResultPhaseData;
};

type GameHubContextType = GameHubData & {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  joinRoom: (roomCode: string) => Promise<void>;
  setReadyStateToStartGame: (roomCode: string, isReady: boolean) => Promise<void>;
  sendStatements: (roomCode: string, lie: string, factId1: string, factId2: string) => Promise<void>;
  sendAnswer:  (roomCode: string, answerIdx: number) => Promise<void>;
  sendRewardChoice: (factId: string) => Promise<void>;
  setReadyStateForNextGame: (roomCode: string, isReady: boolean) => Promise<void>;
  kickPlayer: (roomCode: string) => Promise<void>;
};

const gameHubDataInit = {
  connected: false,
  room: {} as RoomResponse,
  isLoading: false,   
  clientPlayerData: {} as ClientPlayerData,
  allPlayerData: {} as AllPlayerData,
  game: {phase: GamePhase.None} as GameData,
  preparationPhaseData: {} as PreparationPhaseData,
  playingPhaseData: {} as PlayingPhaseData,
  resultPhaseData: {} as ResultPhaseData,
}

const GameHubContext = createContext<GameHubContextType | undefined>(undefined);

let connection: signalR.HubConnection | null = null;

export const GameHubProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<GameHubData>(gameHubDataInit);

  const connect = useCallback(async () => {
    if ((connection && connection.state === signalR.HubConnectionState.Connected) || data.isLoading) return;

    setData(prev => ({ ...prev, isLoading: true })); // start loading

    const hubUrl = `${import.meta.env.VITE_GAME_BASE_URL}/gamehub`;

    connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveRoomUpdate", (room: RoomResponse) => {
      setData(prev => ({ ...prev, room }));
    });

    connection.on("ReceivePlayerReadiness", (response: PlayerReadinessResponse) => {
      setData(prev => ({
        ...prev,
        allPlayerData: {
          ...prev.allPlayerData,
          player1: prev.allPlayerData.player1
            ? { ...prev.allPlayerData.player1, isReady: response.isPlayer1Ready }
            : null,
          player2: prev.allPlayerData.player2
            ? { ...prev.allPlayerData.player2, isReady: response.isPlayer2Ready }
            : null,
        }
      }));
    });

    connection.on("InitPlayer", (response: InitPlayerResponse) => {
      setData(prev => ({ ...prev,
        allPlayerData: { ...prev.allPlayerData,
          player1 : response.player1,
          player2 : response.player2,
        }
      }))
    });

    connection.on("InitPreparationPhase", (response: InitPreparationPhaseResponse) => {
      setData(prev => ({...prev,
        preparationPhaseData : response
      }));
    });

    connection.on("InitPlayingPhase", (response: InitPlayingPhaseResponse) => {
      setData(prev => ({...prev, 
        playingPhaseData: {
          opponentStatements: response.opponentStatements,
          playerAnswer: -1,
        }
      }));
    });

    connection.on("InitResultPhase", (response: InitResultPhaseResponse) => {
      setData(prev => ({ ...prev,
        resultPhaseData: { 
          isPlayer1Correct : response.isPlayer1Correct,
          isPlayer2Correct : response.isPlayer2Correct,
          rewardStatements : response.rewardStatements
        },
        allPlayerData: {...prev.allPlayerData, 
          player1Score : response.player1Score, player2Score: response.player2Score
        }
      }))
    });

    connection.on("SetGamePhase", (response: SetGamePhaseResponse) => {
      setData(prev => ({...prev,
          game: {...prev.game, phase:response.phase},
          allPlayerData : resetPlayerReadiness(prev.allPlayerData)
        }));
    });

    connection.on("PlayerJoined", (response: JoinRoomResponse) => {
      setData(prev => ({ ...prev,
        clientPlayerData: {slot:response.slot}
      }))
    });

    connection.on("Player2LeaveRoom", () => {
      setData(prev => ({ ...prev,
        allPlayerData: {...prev.allPlayerData,
          player2 : null
        }
      }))
    });

    connection.on("Disconnect", async () => {
      clientDisconnect();
      redirectIfNotOn("/lobby");
    });

    await connection.start();
    setData(prev => ({ ...prev, connected: true, isLoading: false })); // stop loading
  }, [data.isLoading]);

  const invokeWithConnection = useCallback(
    async (method: string, ...args: any[]) => {
      if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
        return;
      }

      await connection.invoke(method, ...args);
      },
      
    [connect]
  );

  const joinRoom = useCallback(
    async (roomCode: string) => {
      await invokeWithConnection("JoinRoom", {roomCode});
    },
    [invokeWithConnection]
  );

  const setReadyStateToStartGame = useCallback(
    async (roomCode: string, isReady: boolean) => {
      await invokeWithConnection("SetReadyStateToStartGame", {roomCode, isReady} );
    },
    [invokeWithConnection]
  );

  const sendStatements = useCallback(
    async (roomCode: string, lie: string, factId1: string, factId2: string) => {
      await invokeWithConnection("SendStatements", {roomCode, lie, factId1, factId2});
    },
    [invokeWithConnection]
  );

  const sendAnswer = useCallback(
    async (roomCode: string, answerIdx: number) => {
      await invokeWithConnection("SendAnswer", {roomCode, answerIdx});
    },
    [invokeWithConnection]
  );

  const sendRewardChoice = useCallback(
    async (factId: string) => {
      await invokeWithConnection("SendRewardChoice", {factId});
    },
    [invokeWithConnection]
  );

  const setReadyStateForNextGame = useCallback(
    async (roomCode: string, isReady: boolean) => {
      await invokeWithConnection("SendReadyStateForNextGame", {roomCode, isReady} );
    },
    [invokeWithConnection]
  );

  const kickPlayer = useCallback(
    async (roomCode: string) => {
      await invokeWithConnection("KickPlayer", {roomCode});
    },
    [invokeWithConnection]
  );

  const disconnect = useCallback(
    async () => {
      await invokeWithConnection("Disconnect" );
    },
    [invokeWithConnection]
  );

  const clientDisconnect = useCallback(async () => {
    if (connection) {
      setData(prev => ({ ...prev, isLoading: true })); // start loading
      await connection.stop();
      connection = null;
      setData(gameHubDataInit); // stop loading
    }
  }, []);

  useEffect(() => {
    return () => {
      clientDisconnect();
    };
  }, [clientDisconnect]);

  return (
    <GameHubContext.Provider
      value={{ ...data, connect, disconnect, joinRoom, 
        setReadyStateToStartGame, 
        sendStatements, 
        sendAnswer, 
        sendRewardChoice, 
        setReadyStateForNextGame,
        kickPlayer }}
    >
      {children}
    </GameHubContext.Provider>
  );
};

export const useGameHub = () => {
  const ctx = useContext(GameHubContext);
  if (!ctx) throw new Error("useGameHub must be used within a GameHubProvider");
  return ctx;
};


function resetPlayerReadiness(prev: AllPlayerData) : AllPlayerData{
  return {
    ...prev,
    player1: prev.player2
      ? { ...prev.player2, isReady: false }
      : null,
    player2: prev.player2
      ? { ...prev.player2, isReady: false }
      : null,
  };
}