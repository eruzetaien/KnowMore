import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import type { RoomResponse } from "../types/room";
import type { EmoticonResponse } from "../types/game";


export const Emoticon = {
  None: 0,
  Shocked: 1,
} as const;
export type Emoticon = (typeof Emoticon)[keyof typeof Emoticon];

type GameHubData = {
  connected: boolean;
  room: RoomResponse;
  isLoading: boolean;       // added loading state
  emoticonPlayer1: Emoticon;
  emoticonPlayer2: Emoticon;
};

type GameHubContextType = GameHubData & {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  joinRoom: (roomCode: string) => Promise<void>;
  setReadyState: (roomCode: string, isReady: boolean) => Promise<void>;
  sendEmoticon: (roomCode: string, emoticon: Emoticon) => Promise<void>;
};

const gameHubDataInit = {
  connected: false,
  room: {} as RoomResponse,
  isLoading: false,   
  emoticonPlayer1: Emoticon.None,
  emoticonPlayer2: Emoticon.None
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

    connection.on("ReceiveEmoticon", (emotionResponse: EmoticonResponse) => {
      if (emotionResponse.sender == "Player1"){
        setData(prev => ({ ...prev, emoticonPlayer1:emotionResponse.emoticon }));
        
        setTimeout(() => {
          setData(prev => ({...prev,emoticonPlayer1: Emoticon.None }));
        }, 1200);
      } else if (emotionResponse.sender == "Player2"){
        setData(prev => ({ ...prev, emoticonPlayer2:emotionResponse.emoticon }));

        setTimeout(() => {
          setData(prev => ({...prev,emoticonPlayer2: Emoticon.None }));
        }, 1200);
      }
    });

    connection.on("PlayerJoined", (player: string) => {
      localStorage.setItem("player", player); // P1ayer1 or Player2
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
      await invokeWithConnection("JoinRoom", roomCode);
    },
    [invokeWithConnection]
  );

  const setReadyState = useCallback(
    async (roomCode: string, isReady: boolean) => {
      await invokeWithConnection("SetPlayerReadyStatus", roomCode, isReady);
    },
    [invokeWithConnection]
  );

  const sendEmoticon = useCallback(
    async (roomCode: string, emoticon: Emoticon) => {
      await invokeWithConnection("SendEmoticon", roomCode, emoticon);
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
      value={{ ...data, connect, disconnect, joinRoom, setReadyState, sendEmoticon }}
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
