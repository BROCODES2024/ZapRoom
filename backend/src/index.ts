import { WebSocketServer, WebSocket } from "ws";
import http from "http"; // For metrics endpoint
import { randomUUID } from "crypto";
import type { CustomWebSocket } from "./types/index.js";
import {
  addMessageToHistory,
  getHistoryForRoom,
  setRoomHost,
  getRoomHost,
  isRoomLocked,
  isUserBanned,
  toggleRoomLock,
  banUser,
  countActiveRooms,
} from "./state/roomState.js";
import { escapeHTML } from "./utils/sanitization.js"; // For security

// --- CONFIGURATION ---
const PORT = process.env.PORT || 8080;
const RATE_LIMIT_MESSAGES = 5; // Max messages
const RATE_LIMIT_WINDOW_S = 5; // Per X seconds

// --- SERVER SETUP ---
const server = http.createServer();
const wss = new WebSocketServer({ server });

// --- HELPERS ---

/**
 * Finds a user within a specific room by their username.
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
 * Checks if a username is already taken in a room.
 */
function isUsernameTaken(roomId: string, username: string): boolean {
  return !!findUserInRoom(roomId, username);
}

/**
 * Sends a message to all clients in the same room.
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

// --- HTTP SERVER FOR METRICS ---
server.on("request", (req, res) => {
  if (req.url === "/metrics") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        totalConnections: wss.clients.size,
        activeRooms: countActiveRooms(),
      })
    );
  } else {
    res.writeHead(404);
    res.end();
  }
});

// --- MAIN WEBSOCKET LOGIC ---
wss.on("connection", (ws: WebSocket) => {
  const customWs = ws as CustomWebSocket;
  customWs.isAlive = true;
  console.log("A new client connected!");

  customWs.on("pong", () => {
    customWs.isAlive = true;
  });

  customWs.on("message", (message: Buffer) => {
    // Rate Limiting Logic
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW_S * 1000;
    customWs.lastMessageTimestamp =
      customWs.lastMessageTimestamp ?? windowStart;
    customWs.messageCount = customWs.messageCount ?? 0;

    if (customWs.lastMessageTimestamp < windowStart) {
      customWs.lastMessageTimestamp = now;
      customWs.messageCount = 1;
    } else {
      customWs.messageCount++;
    }

    if (customWs.messageCount > RATE_LIMIT_MESSAGES) {
      customWs.send(
        JSON.stringify({
          type: "error",
          message: "You are sending messages too quickly.",
        })
      );
      return;
    }

    // Message Processing
    try {
      const messageData = JSON.parse(message.toString());
      const { type, payload } = messageData;
      const { roomId: userRoomId, username: userUsername } = customWs;

      if (type === "join") {
        const sanitizedUsername = escapeHTML(payload.username);
        const sanitizedRoomId = escapeHTML(payload.roomId);

        if (
          !sanitizedRoomId ||
          sanitizedRoomId.length > 20 ||
          !sanitizedUsername ||
          sanitizedUsername.length > 20
        ) {
          return customWs.close(1008, "Invalid payload format.");
        }
        if (isRoomLocked(sanitizedRoomId))
          return customWs.close(1008, "This room is locked.");
        if (isUserBanned(sanitizedRoomId, sanitizedUsername))
          return customWs.close(1008, "You are banned from this room.");
        if (isUsernameTaken(sanitizedRoomId, sanitizedUsername))
          return customWs.close(1008, "Username is already taken.");

        customWs.roomId = sanitizedRoomId;
        customWs.username = sanitizedUsername;

        setRoomHost(customWs.roomId, customWs.username);
        console.log(`User ${customWs.username} joined room ${customWs.roomId}`);

        customWs.send(
          JSON.stringify({
            type: "system",
            message: `Welcome to room "${customWs.roomId}"!`,
          })
        );
        customWs.send(
          JSON.stringify({
            type: "history",
            payload: getHistoryForRoom(customWs.roomId),
          })
        );
        broadcastToRoom(
          customWs.roomId,
          {
            type: "system",
            message: `${customWs.username} has joined the room.`,
          },
          customWs
        );
      } else if (userRoomId && userUsername) {
        // User must be in a room for other actions
        if (type === "chat") {
          const sanitizedMessage = escapeHTML(payload.message.trim());
          if (sanitizedMessage.length > 0 && sanitizedMessage.length <= 200) {
            const newChatMessage = addMessageToHistory(userRoomId, {
              author: userUsername,
              message: sanitizedMessage,
            });
            broadcastToRoom(userRoomId, newChatMessage);
          }
        } else if (type === "typing" || type === "stop_typing") {
          broadcastToRoom(
            userRoomId,
            {
              type: type === "typing" ? "user_typing" : "user_stop_typing",
              payload: { username: userUsername },
            },
            customWs
          );
        } else if (type === "dm") {
          const recipient = findUserInRoom(userRoomId, payload.toUsername);
          const sanitizedDM = escapeHTML(payload.message.trim());
          if (recipient && sanitizedDM) {
            const dm = {
              id: randomUUID(),
              type: "private_message",
              from: userUsername,
              to: payload.toUsername,
              message: sanitizedDM,
              timestamp: new Date().toISOString(),
            };
            recipient.send(JSON.stringify(dm));
            customWs.send(JSON.stringify(dm));
          } else {
            customWs.send(
              JSON.stringify({
                type: "error",
                message: `User "${payload.toUsername}" not found.`,
              })
            );
          }
        } else if (type === "admin") {
          if (getRoomHost(userRoomId) !== userUsername) {
            return customWs.send(
              JSON.stringify({
                type: "error",
                message: "You are not the host.",
              })
            );
          }
          const { command, targetUser } = payload;
          console.log(
            `[AUDIT] Host '${userUsername}' used '${command}' on '${
              targetUser || "room"
            }'`
          );
          const targetSocket = findUserInRoom(userRoomId, targetUser);

          switch (command) {
            case "lock":
              const newStatus = toggleRoomLock(userRoomId);
              broadcastToRoom(userRoomId, {
                type: "system",
                message: `The room is now ${newStatus}.`,
              });
              break;
            case "kick":
              if (targetSocket) {
                targetSocket.send(
                  JSON.stringify({
                    type: "system",
                    message: "You have been kicked.",
                  })
                );
                targetSocket.close(4001, "Kicked by host");
                broadcastToRoom(userRoomId, {
                  type: "system",
                  message: `${targetUser} has been kicked.`,
                });
              }
              break;
            case "ban":
              if (targetUser) {
                banUser(userRoomId, targetUser);
                broadcastToRoom(userRoomId, {
                  type: "system",
                  message: `${targetUser} has been banned.`,
                });
                if (targetSocket) {
                  targetSocket.send(
                    JSON.stringify({
                      type: "system",
                      message: "You have been banned.",
                    })
                  );
                  targetSocket.close(4002, "Banned by host");
                }
              }
              break;
          }
        }
      }
    } catch (error) {
      console.error("Failed to process message:", error);
    }
  });

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

  customWs.on("error", (error) => console.error("WebSocket error:", error));
});

// --- PERIODIC TASKS ---

// Server Stats
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

// Heartbeat
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    const customWs = ws as CustomWebSocket;
    if (customWs.isAlive === false) {
      console.log(
        `Terminating dead connection for user: ${
          customWs.username || "unknown"
        }`
      );
      return customWs.terminate();
    }
    customWs.isAlive = false;
    customWs.ping();
  });
}, 60000);

// --- SERVER STARTUP & SHUTDOWN ---
server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
  console.log(`WebSocket running at ws://localhost:${PORT}`);
  console.log(`Metrics available at http://localhost:${PORT}/metrics`);
});

function handleShutdown() {
  console.log("\nShutting down gracefully...");
  clearInterval(statsInterval);
  clearInterval(heartbeatInterval);

  const shutdownMessage = JSON.stringify({
    type: "system",
    message: "Server is shutting down.",
  });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(shutdownMessage);
      client.close(1012, "Server restarting");
    }
  });

  wss.close((err) => {
    if (err) console.error("Error closing WebSocket server:", err);
    server.close(() => {
      console.log("Server shut down complete.");
      process.exit(0);
    });
  });
}

process.on("SIGINT", handleShutdown); // Ctrl+C
process.on("SIGTERM", handleShutdown); // kill command
