import * as signalR from "@microsoft/signalr";

let connection: signalR.HubConnection | null = null;

export const startGameHub = async () => {
  if (connection) return connection;

  connection = new signalR.HubConnectionBuilder()
    .withUrl("/gamehub")
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
  if (!connection) throw new Error("Not connected");
  await connection.invoke("JoinRoom", roomCode);
};
