import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import type { RoomResponse } from "../types/room";

type GameHubData = {
  connected: boolean;
  room?: RoomResponse;
};

type GameHubContextType = GameHubData & {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  joinRoom: (roomCode: string) => Promise<void>;
};

const GameHubContext = createContext<GameHubContextType | undefined>(undefined);

let connection: signalR.HubConnection | null = null;

export const GameHubProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<GameHubData>({ connected: false });

  const connect = useCallback(async () => {
    if (connection && connection.state === signalR.HubConnectionState.Connected) return;

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
    setData(prev => ({ ...prev, connected: true }));
    console.log("GameHub Connected");
  }, []);

  const disconnect = useCallback(async () => {
    if (connection) {
      await connection.stop();
      connection = null;
      setData({ connected: false });
    }
  }, []);

  const joinRoom = useCallback(async (roomCode: string) => {
    if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
        await connect();
    }

    if (connection?.state === signalR.HubConnectionState.Connected) {
        await connection.invoke("JoinRoom", roomCode);
        console.log("Joined room", roomCode);
    } else {
        console.warn("Connection not ready yet");
    }
}, [connect]);


  // optional cleanup when provider unmounts
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return (
    <GameHubContext.Provider value={{ ...data, connect, disconnect, joinRoom }}>
      {children}
    </GameHubContext.Provider>
  );
};

export const useGameHub = () => {
  const ctx = useContext(GameHubContext);
  if (!ctx) throw new Error("useGameHub must be used within a GameHubProvider");
  return ctx;
};
