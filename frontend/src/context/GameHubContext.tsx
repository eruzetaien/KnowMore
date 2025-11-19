import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import type { JoinRoomResponse, RoomResponse } from "../types/roomType";
import type { GameData, InitPlayerResponse, InitPlayingPhaseResponse, InitPreparationPhaseResponse, InitResultPhaseResponse, PlayingPhaseData, PreparationPhaseData, ResultPhaseData, SetGamePhaseResponse } from "../types/gameType";
import { GamePhase } from "../types/gameType";
import { Emoticon, PlayerSlot, type AllPlayerData, type ClientPlayerData, type PlayerReadinessResponse, type SendEmoticonResponse } from "../types/playerType";

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
  sendEmoticon: (roomCode: string, emoticon: Emoticon) => Promise<void>;
  sendStatements: (roomCode: string, lie: string, factId1: number, factId2: number) => Promise<void>;
  sendAnswer:  (roomCode: string, answerIdx: number) => Promise<void>;
  sendRewardChoice: (factId: number) => Promise<void>;
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

    connection.on("ReceiveEmoticon", (response: SendEmoticonResponse) => {
      if (response.playerSlot == PlayerSlot.Player1) {
        setData(prev => ({
          ...prev,
          playerData: { ...prev.clientPlayerData, player1Emot: response.emoticon }
        }));

        setTimeout(() => {
          setData(prev => ({
            ...prev,
            emoticon: { ...prev.clientPlayerData, player1Emot: Emoticon.None }
          }));
        }, 1200);
      } else if (response.playerSlot == PlayerSlot.Player2) {
        setData(prev => ({
          ...prev,
          emoticon: { ...prev.clientPlayerData, player2Emot: response.emoticon }
        }));

        setTimeout(() => {
          setData(prev => ({
            ...prev,
            emoticon: { ...prev.clientPlayerData, player2Emot: Emoticon.None }
          }));
        }, 1200);
      }
    });

    connection.on("ReceivePlayerReadiness", (response: PlayerReadinessResponse) => {
      setData(prev =>({ ...prev,
        allPlayerData : {...prev.allPlayerData, 
          isPlayer1Ready : response.isPlayer1Ready,
          isPlayer2Ready : response.isPlayer2Ready
        }
      }))
    });

    connection.on("InitPlayer", (response: InitPlayerResponse) => {
      setData(prev => ({ ...prev,
        allPlayerData: { ...prev.allPlayerData,
          player1 : response.player1,
          player2 : response.player2,
        }
      }))
      console.log(response)
      console.log(data.allPlayerData)
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
          isPlayerCorrect : response.isPlayerCorrect,
          rewardStatements : response.rewardStatements
        },
        allPlayerData: {...prev.allPlayerData, 
          player1Score : response.player1Score, player2Score: response.player2Score
        }
      }))
    });

    connection.on("SetGamePhase", (response: SetGamePhaseResponse) => {
      console.log("Game Phase: ", response.phase)
      setData(prev => ({...prev,
          game: {...prev.game, phase:response.phase},
          allPlayerData : resetPlayerReadiness(prev.allPlayerData)
        }));
    });

    connection.on("PlayerJoined", (response: JoinRoomResponse) => {
      setData(prev => ({ ...prev,
        playerData: {slot:response.slot}
      }))
    });

    connection.on("Player2LeaveRoom", () => {
      setData(prev => ({ ...prev,
        allPlayerData: {...prev.allPlayerData,
          player2 : null
        }
      }))
    });

    connection.on("Player2Kicked", async () => {
      if (data.clientPlayerData.slot != PlayerSlot.Player2)
        return;
      
      if (connection) {
        setData(prev => ({ ...prev, isLoading: true })); // start loading
        await connection.stop();
        connection = null;
        setData(gameHubDataInit); // stop loading
      }
    });

    connection.on("Disconnect", async () => {
      clientDisconnect();
    });

    await connection.start();
    setData(prev => ({ ...prev, connected: true, isLoading: false })); // stop loading
    console.log("GameHub Connected");
  }, [data.isLoading]);

  const invokeWithConnection = useCallback(
    async (method: string, ...args: any[]) => {
      if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
        console.warn(`Connection not ready for ${method}`);
        return;
      }

      await connection.invoke(method, ...args);
        console.log(`Invoked ${method}`, ...args);
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

  const sendEmoticon = useCallback(
    async (roomCode: string, emoticon: Emoticon) => {
      await invokeWithConnection("SendEmoticon", {roomCode, emoticon});
    },
    [invokeWithConnection]
  );

  const sendStatements = useCallback(
    async (roomCode: string, lie: string, factId1: number, factId2: number) => {
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
    async (factId: number) => {
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
        sendEmoticon, 
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