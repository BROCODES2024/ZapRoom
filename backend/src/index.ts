import { WebSocketServer, WebSocket } from "ws";

// Define a custom WebSocket type that includes room and user information.
interface CustomWebSocket extends WebSocket {
  roomId?: string;
  username?: string;
}

const wss = new WebSocketServer({ port: 8080 });

// Helper function to broadcast a message to all clients in a specific room.
function broadcastToRoom(
  roomId: string,
  message: object,
  excludeClient?: CustomWebSocket
) {
  const messageString = JSON.stringify(message);
  wss.clients.forEach((client) => {
    // Cast the generic client to our custom type.
    const customClient = client as CustomWebSocket;

    // Check if the client is in the correct room, is ready, and is not the excluded client.
    if (
      customClient.readyState === WebSocket.OPEN &&
      customClient.roomId === roomId &&
      customClient !== excludeClient
    ) {
      customClient.send(messageString);
    }
  });
}

wss.on("connection", (ws: WebSocket) => {
  // Cast the incoming WebSocket to our custom type.
  const customWs = ws as CustomWebSocket;
  console.log("A new client connected!");

  customWs.on("message", (message: Buffer) => {
    const messageString = message.toString();

    try {
      const messageData = JSON.parse(messageString);

      // Use a switch statement to handle different message types.
      switch (messageData.type) {
        case "join":
          const { roomId, username } = messageData.payload;

          // Store the room and username on the WebSocket object.
          customWs.roomId = roomId;
          customWs.username = username;

          console.log(`User ${username} joined room ${roomId}`);

          // Send a welcome message to the user who just joined.
          customWs.send(
            JSON.stringify({
              type: "system",
              message: `Welcome to room "${roomId}"!`,
            })
          );

          // Announce the new user to everyone else in the room.
          broadcastToRoom(
            roomId,
            {
              type: "system",
              message: `${username} has joined the room.`,
            },
            customWs // Exclude the sender from this broadcast
          );
          break;

        default:
          console.warn(`Unknown message type: ${messageData.type}`);
          break;
      }
    } catch (error) {
      console.error(
        "Failed to parse message or invalid message format:",
        messageString
      );
    }
  });

  customWs.on("close", () => {
    console.log("Client disconnected");
    // If the client had joined a room, notify the others.
    if (customWs.roomId && customWs.username) {
      broadcastToRoom(
        customWs.roomId,
        {
          type: "system",
          message: `${customWs.username} has left the room.`,
        },
        customWs
      );
    }
  });

  customWs.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

console.log("WebSocket server started on ws://localhost:8080");
