import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import type { JoinRoomResponse, RoomResponse } from "../types/roomType";
import type { EmoticonData, GameData, InitPlayingPhaseResponse, InitResultPhaseResponse, PlayingPhaseData, PreparationPhaseData, ResultPhaseData, SendEmoticonResponse, SendStatementsResponse, SetGamePhaseResponse } from "../types/gameType";
import { Emoticon, GamePhase} from "../types/gameType";

type GameHubData = {
  connected: boolean;
  room: RoomResponse;
  isLoading: boolean;
  emoticon: EmoticonData;
  game: GameData;
  preparationPhaseData: PreparationPhaseData;
  playingPhaseData: PlayingPhaseData;
  resultPhaseData: ResultPhaseData;
};

type GameHubContextType = GameHubData & {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  joinRoom: (roomCode: string) => Promise<void>;
  setReadyState: (roomCode: string, isReady: boolean) => Promise<void>;
  sendEmoticon: (roomCode: string, emoticon: Emoticon) => Promise<void>;
  sendStatements: (roomCode: string, lie: string, factId1: number, factId2: number) => Promise<void>;
  sendAnswer:  (roomCode: string, answerIdx: number) => Promise<void>;
};

const gameHubDataInit = {
  connected: false,
  room: {} as RoomResponse,
  isLoading: false,   
  emoticon: {} as EmoticonData,
  game: {phase: GamePhase.Preparation} as GameData,
  preparationPhaseData: {isPlayer1Ready:false, isPlayer2Ready:false} as PreparationPhaseData,
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

    connection.on("ReceiveEmoticon", (emotionResponse: SendEmoticonResponse) => {
      if (emotionResponse.sender === "Player1") {
        setData(prev => ({
          ...prev,
          emoticon: { ...prev.emoticon, player1Emot: emotionResponse.emoticon }
        }));

        setTimeout(() => {
          setData(prev => ({
            ...prev,
            emoticon: { ...prev.emoticon, player1Emot: Emoticon.None }
          }));
        }, 1200);
      } else if (emotionResponse.sender === "Player2") {
        setData(prev => ({
          ...prev,
          emoticon: { ...prev.emoticon, player2Emot: emotionResponse.emoticon }
        }));

        setTimeout(() => {
          setData(prev => ({
            ...prev,
            emoticon: { ...prev.emoticon, player2Emot: Emoticon.None }
          }));
        }, 1200);
      }
    });

    connection.on("ReceiveStatements", (respose: SendStatementsResponse) => {
      setData(prev => ({
          ...prev,
          preparationPhaseData: { 
            isPlayer1Ready: respose.isPlayer1Ready, 
            isPlayer2Ready: respose.isPlayer2Ready
          }
        }));
    });

    connection.on("ReceiveAnswer", (respose: SendStatementsResponse) => {
      setData(prev => ({
          ...prev,
          playingPhaseData: { ...prev.playingPhaseData,
            isPlayer1Ready: respose.isPlayer1Ready, 
            isPlayer2Ready: respose.isPlayer2Ready
          }
        }));
    });

    connection.on("InitPlayingPhase", (respose: InitPlayingPhaseResponse) => {
      setData(prev => ({
          ...prev,
          playingPhaseData: {
            opponentStatements: respose.opponentStatements, 
            isPlayer1Ready: false,
            isPlayer2Ready: false,
            playerAnswer:-1
          }
        }));
    });

    connection.on("InitResultPhase", (respose: InitResultPhaseResponse) => {
      setData(prev => ({
          ...prev,
          resultPhaseData: {
            isPlayer1Ready: false,
            isPlayer2Ready: false
          }
        }));
    });

    connection.on("SetGamePhase", (respose: SetGamePhaseResponse) => {
      console.log("Game Phase: ", respose.phase)
      setData(prev => ({...prev,
          game: {...prev.game, phase:respose.phase}
        }));
    });

    connection.on("PlayerJoined", (respose: JoinRoomResponse) => {
      localStorage.setItem("player", respose.role); // P1ayer1 or Player2
    });

    await connection.start();
    setData(prev => ({ ...prev, connected: true, isLoading: false })); // stop loading
    console.log("GameHub Connected");
  }, [data.isLoading]);

  const disconnect = useCallback(async () => {
    if (connection) {
      setData(prev => ({ ...prev, isLoading: true })); // start loading
      await connection.stop();
      connection = null;
      setData(gameHubDataInit); // stop loading
    }
  }, []);

  const invokeWithConnection = useCallback(
    async (method: string, ...args: any[]) => {
      if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
        await connect();
      }

      if (connection?.state === signalR.HubConnectionState.Connected) {
        await connection.invoke(method, ...args);
        console.log(`Invoked ${method}`, ...args);
      } else {
        console.warn(`Connection not ready for ${method}`);
      }
    },
    [connect]
  );

  const joinRoom = useCallback(
    async (roomCode: string) => {
      await invokeWithConnection("JoinRoom", {roomCode});
    },
    [invokeWithConnection]
  );

  const setReadyState = useCallback(
    async (roomCode: string, isReady: boolean) => {
      await invokeWithConnection("SetPlayerReadyState", {roomCode, isReady} );
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

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return (
    <GameHubContext.Provider
      value={{ ...data, connect, disconnect, joinRoom, setReadyState, sendEmoticon, sendStatements, sendAnswer }}
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
