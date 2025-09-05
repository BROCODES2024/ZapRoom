import { WebSocketServer, WebSocket } from "ws";
import type { CustomWebSocket } from "./types/index.js";
import { addMessageToHistory, getHistoryForRoom } from "./state/roomState.js";
import { randomUUID } from "crypto";

const wss = new WebSocketServer({ port: 8080 });

/**
 * Finds a user within a specific room.
 */
function findUserInRoom(
  roomId: string,
  username: string
): CustomWebSocket | null {
  for (const client of wss.clients) {
    const customClient = client as CustomWebSocket;
    if (
      customClient.roomId === roomId &&
      customClient.username?.toLowerCase() === username.toLowerCase()
    ) {
      return customClient;
    }
  }
  return null;
}

/**
 * Check if a username is already taken in a room (case-insensitive)
 */
function isUsernameTaken(roomId: string, username: string): boolean {
  return !!findUserInRoom(roomId, username);
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
  customWs.isAlive = true;
  console.log("A new client connected!");

  customWs.on("pong", () => {
    customWs.isAlive = true;
  });

  // Handle incoming messages
  customWs.on("message", (message: Buffer) => {
    const messageString = message.toString();
    try {
      const messageData = JSON.parse(messageString);
      const { type, payload } = messageData;

      if (type === "join") {
        const { roomId, username } = payload;

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

        if (isUsernameTaken(roomId, username)) {
          customWs.close(1008, "Username is already taken in this room.");
          return;
        }

        customWs.roomId = roomId.trim();
        customWs.username = username.trim();

        console.log(`User ${customWs.username} joined room ${customWs.roomId}`);

        customWs.send(
          JSON.stringify({
            type: "system",
            message: `Welcome to room "${customWs.roomId}"!`,
          })
        );

        // --- NEW: Send message history on join ---
        const history = getHistoryForRoom(customWs.roomId);
        customWs.send(JSON.stringify({ type: "history", payload: history }));

        broadcastToRoom(
          customWs.roomId,
          {
            type: "system",
            message: `${customWs.username} has joined the room.`,
          },
          customWs
        );
      } else if (type === "chat") {
        if (!customWs.roomId || !customWs.username) return; // Must be in a room to chat

        const chatMsg = payload.message;
        if (
          typeof chatMsg !== "string" ||
          chatMsg.trim().length === 0 ||
          chatMsg.length > 200
        ) {
          console.warn("Received invalid chat message. Ignoring.");
          return;
        }

        // --- MODIFIED: Use history function to create and store message ---
        const newChatMessage = addMessageToHistory(customWs.roomId, {
          author: customWs.username,
          message: chatMsg.trim(),
        });
        broadcastToRoom(customWs.roomId, newChatMessage);
      } else if (type === "typing" || type === "stop_typing") {
        // --- NEW: Handle typing indicators ---
        if (!customWs.roomId || !customWs.username) return;

        broadcastToRoom(
          customWs.roomId,
          {
            type: type === "typing" ? "user_typing" : "user_stop_typing",
            payload: { username: customWs.username },
          },
          customWs
        );
      } else if (type === "dm") {
        // --- NEW: Handle private messages ---
        if (!customWs.roomId || !customWs.username) return;
        const { toUsername, message } = payload;

        const recipient = findUserInRoom(customWs.roomId, toUsername);

        if (recipient) {
          const dm = {
            id: randomUUID(),
            type: "private_message",
            from: customWs.username,
            to: toUsername,
            message,
            timestamp: new Date().toISOString(),
          };

          recipient.send(JSON.stringify(dm)); // Send to recipient
          customWs.send(JSON.stringify(dm)); // Send copy to sender
        } else {
          // Send error back to sender if user not found
          customWs.send(
            JSON.stringify({
              type: "error",
              message: `User "${toUsername}" not found in this room.`,
            })
          );
        }
      } else {
        console.warn(`Unknown message type: ${type}`);
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

  customWs.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

// Stats and Heartbeat intervals remain the same...
// (Your existing stats and heartbeat code goes here)

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
