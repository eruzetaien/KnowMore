import * as signalR from "@microsoft/signalr";

let connection: signalR.HubConnection | null = null;

export const startGameHub = async () => {
  if (connection && connection.state === signalR.HubConnectionState.Connected) 
    return connection; 
  
  const hubUrl = `${import.meta.env.VITE_GAME_BASE_URL}/gamehub`;

  connection = new signalR.HubConnectionBuilder()
    .withUrl(hubUrl)
    .withAutomaticReconnect()
    .build();

  connection.on("ReceiveRoomUpdate", (data) => {
    console.log("Room update:", data);
  });

  await connection.start();
  console.log("GameHub connected");

  return connection;
};

export const stopGameHub = async () => {
  if (connection) {
    await connection.stop();
    connection = null;
  }
};

export const joinRoom = async (roomCode: string) => {
  const conn = await startGameHub(); // ensure connection is alive
  await conn.invoke("JoinRoom", roomCode);
};

