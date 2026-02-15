import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import type { JoinRoomResponse, RoomResponse } from "../types/roomType";
import type { GameData, GameDataResponse, InitPlayerResponse, InitPlayingPhaseResponse, InitPreparationPhaseResponse, InitResultPhaseResponse, PlayingPhaseData, PreparationPhaseData, ResultPhaseData, SetGamePhaseResponse } from "../types/gameType";
import { GamePhase } from "../types/gameType";
import { type AllPlayerData, type ClientPlayerData, type PlayerReadinessResponse} from "../types/playerType";
import { redirectIfNotOn } from "../utils/redirect";

type GameHubData = {
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
  reconnect: (roomCode: string) => Promise<void>;
  isConnected: () => boolean;
};

const gameHubDataInit = {
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

export const GameHubProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const [data, setData] = useState<GameHubData>(gameHubDataInit);

  const connect = useCallback(async () => {
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected || data.isLoading) return;

    if (connectionRef.current){
      connectionRef.current.stop();
    }
    setData(prev => ({ ...prev, isLoading: true })); // start loading

    const hubUrl = `${import.meta.env.VITE_GAME_BASE_URL}/gamehub`;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection; 
      
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

    connection.on("LoadGameData", (response: GameDataResponse) => {
      setData(prev => {
        const updatedData = {
          ...prev,
          room: { ...prev.room, code: response.roomCode },
          game: { ...prev.game, phase: response.phase },
          clientPlayerData: { ...prev.clientPlayerData, slot: response.slot },
          allPlayerData: response.allPlayerData,
          preparationPhaseData: prev.preparationPhaseData,
          playingPhaseData: prev.playingPhaseData,
          resultPhaseData: prev.resultPhaseData,
        };

        // set the correct phaseData based on response.phase
        switch (response.phase) {
          case GamePhase.Preparation:
            updatedData.preparationPhaseData = response.preparationPhaseData;
            break;
          case GamePhase.Playing:
            updatedData.playingPhaseData = response.playingPhaseData;
            break;
          case GamePhase.Result:
            updatedData.resultPhaseData = response.resultPhaseData;
            break;
        }
        
        return updatedData;
      });

    });

    connection.on("Disconnect", async () => {
      clientDisconnect();
      redirectIfNotOn("/lobby");
    });

    await connection.start();
    setData(prev => ({ ...prev, isLoading: false })); // stop loading

  }, []);

  const invokeWithConnection = useCallback(
    async (method: string, ...args: any[]) => {
      const connection = connectionRef.current;
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

  const reconnect = useCallback(
    async (roomCode: string) => {
      await connect();
      await connect();
      await invokeWithConnection("Reconnect", {roomCode} );
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
    if (connectionRef.current) {
      setData(prev => ({ ...prev, isLoading: true })); // start loading
      await connectionRef.current.stop();
      connectionRef.current = null;
      setData(gameHubDataInit); // stop loading
    }
  }, []);

  const isConnected = useCallback(() => {
    return connectionRef.current?.state === signalR.HubConnectionState.Connected;
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
        kickPlayer,
        reconnect,
        isConnected}}
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
    player1: prev.player1
      ? { ...prev.player1, isReady: false }
      : null,
    player2: prev.player2
      ? { ...prev.player2, isReady: false }
      : null,
  };
}