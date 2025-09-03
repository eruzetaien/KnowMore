import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import type { RoomResponse } from "../types/room";

type GameHubData = {
  connected: boolean;
  room: RoomResponse;
  isLoading: boolean;       // added loading state
};

type GameHubContextType = GameHubData & {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  joinRoom: (roomCode: string) => Promise<void>;
  setReadyState: (roomCode: string, isReady: boolean) => Promise<void>;
};

const GameHubContext = createContext<GameHubContextType | undefined>(undefined);

let connection: signalR.HubConnection | null = null;

export const GameHubProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<GameHubData>({
    connected: false,
    room: {} as RoomResponse,
    isLoading: false,   // initial loading false
  });

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
      localStorage.setItem("currentRoom", JSON.stringify(room));
    });

    connection.on("PlayerJoined", (player: string) => {
      setData(prev => ({ ...prev }));
      console.log("Player joined:", player);
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
      setData({ connected: false, room: {} as RoomResponse, isLoading: false }); // stop loading
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

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return (
    <GameHubContext.Provider
      value={{ ...data, connect, disconnect, joinRoom, setReadyState }}
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
