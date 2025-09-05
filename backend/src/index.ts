import { WebSocketServer, WebSocket } from "ws";

// Extend WebSocket to store room, username, and heartbeat status
interface CustomWebSocket extends WebSocket {
  roomId?: string;
  username?: string;
  isAlive: boolean;
}

const wss = new WebSocketServer({ port: 8080 }); // Create WebSocket server

/**
 * Check if a username is already taken in a room (case-insensitive)
 */
function isUsernameTaken(roomId: string, username: string): boolean {
  for (const client of wss.clients) {
    const customClient = client as CustomWebSocket;
    if (
      customClient.roomId === roomId &&
      customClient.username?.toLowerCase() === username.toLowerCase()
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Send a message to all clients in the same room
 */
function broadcastToRoom(
  roomId: string,
  message: object,
  excludeClient?: CustomWebSocket
) {
  const messageString = JSON.stringify(message);
  wss.clients.forEach((client) => {
    const customClient = client as CustomWebSocket;
    // Only send if connection is open, in same room, and not excluded
    if (
      customClient.readyState === WebSocket.OPEN &&
      customClient.roomId === roomId &&
      customClient !== excludeClient
    ) {
      customClient.send(messageString);
    }
  });
}

// Handle new client connections
wss.on("connection", (ws: WebSocket) => {
  const customWs = ws as CustomWebSocket;
  customWs.isAlive = true; // Mark as alive initially
  console.log("A new client connected!");

  // Pong response means connection is alive
  customWs.on("pong", () => {
    customWs.isAlive = true;
  });

  // Handle incoming messages
  customWs.on("message", (message: Buffer) => {
    const messageString = message.toString();
    try {
      const messageData = JSON.parse(messageString);

      if (messageData.type === "join") {
        const { roomId, username } = messageData.payload;

        // Validate roomId and username
        if (
          typeof roomId !== "string" ||
          roomId.trim().length === 0 ||
          roomId.length > 20 ||
          typeof username !== "string" ||
          username.trim().length === 0 ||
          username.length > 20
        ) {
          customWs.close(1008, "Invalid roomId or username format/length.");
          return;
        }

        // Prevent duplicate usernames in the same room
        if (isUsernameTaken(roomId, username)) {
          customWs.close(1008, "Username is already taken in this room.");
          return;
        }

        // Assign room and username
        customWs.roomId = roomId.trim();
        customWs.username = username.trim();

        console.log(`User ${customWs.username} joined room ${customWs.roomId}`);

        // Welcome message to the new user
        customWs.send(
          JSON.stringify({
            type: "system",
            message: `Welcome to room "${customWs.roomId}"!`,
          })
        );

        // Notify other users in the room
        broadcastToRoom(
          customWs.roomId,
          {
            type: "system",
            message: `${customWs.username} has joined the room.`,
          },
          customWs
        );
      } else if (messageData.type === "chat") {
        const chatMsg = messageData.payload.message;

        // Validate chat message
        if (
          typeof chatMsg !== "string" ||
          chatMsg.trim().length === 0 ||
          chatMsg.length > 200
        ) {
          console.warn("Received invalid chat message. Ignoring.");
          return;
        }

        // Broadcast chat if user is in a room
        if (customWs.roomId && customWs.username) {
          const chatMessage = {
            type: "chat",
            author: customWs.username,
            message: chatMsg.trim(),
            timestamp: new Date().toISOString(),
          };
          broadcastToRoom(customWs.roomId, chatMessage);
        }
      } else {
        console.warn(`Unknown message type: ${messageData.type}`);
      }
    } catch (error) {
      console.error(
        "Failed to parse message or invalid format:",
        messageString
      );
    }
  });

  // Handle client disconnection
  customWs.on("close", () => {
    console.log("Client disconnected");
    if (customWs.roomId && customWs.username) {
      broadcastToRoom(
        customWs.roomId,
        { type: "system", message: `${customWs.username} has left the room.` },
        customWs
      );
    }
  });

  // Handle WebSocket errors
  customWs.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

// Log server stats every 30s
const statsInterval = setInterval(() => {
  const roomStats: { [roomId: string]: number } = {};
  wss.clients.forEach((client) => {
    const customClient = client as CustomWebSocket;
    if (customClient.roomId) {
      roomStats[customClient.roomId] =
        (roomStats[customClient.roomId] || 0) + 1;
    }
  });
  console.log(`\n--- Server Stats ---`);
  console.log(`Total connected users: ${wss.clients.size}`);
  console.log(`Users per room:`, roomStats);
  console.log(`--------------------\n`);
}, 30000);

// Heartbeat check every 60s to terminate dead connections
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((client) => {
    const customClient = client as CustomWebSocket;
    if (customClient.isAlive === false) {
      console.log(
        `Terminating dead connection for user: ${
          customClient.username || "unknown"
        }`
      );
      return customClient.terminate();
    }
    customClient.isAlive = false;
    customClient.ping(); // Expect a pong back
  });
}, 60000);

// Cleanup intervals when server closes
wss.on("close", () => {
  clearInterval(statsInterval);
  clearInterval(heartbeatInterval);
});

console.log("WebSocket server started on ws://localhost:8080");
